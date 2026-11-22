"""
Gera os efeitos sonoros do jogo com o modelo de efeitos do Voice Studio (MOSS-SoundEffect v2.0)
e prepara os MP3.

Roda com o Python do próprio modelo (instalado pelo Voice Studio em Ferramentas > Efeitos sonoros):
  D:\\VoiceStudioData\\engines\\moss-soundeffect\\MOSS-TTS\\.venv\\Scripts\\python.exe scripts/gerar_sons.py
      (todos)   ... gerar_sons.py tiro dano  (só esses)   SEMENTE=7 ... (outra versão)

Por que não pela API do Voice Studio: ela sempre calcula 30 s de áudio (e corta depois), o que estoura
os 12 GB da placa e leva >15 min por som. Aqui o modelo calcula só a duração necessária.

- Original gerado:    arte/sons_original/<id>.wav
- Pronto para o jogo: src/assets/sons/<id>.mp3   (o Audio.ts acha sozinho)

Tratamento (ffmpeg): corta o silêncio do começo, encurta para a duração do jogo com fade no fim,
normaliza pelo pico e grava em MP3 mono 96 kbps (leve para o celular).
"""
import math, os, shutil, subprocess, sys, time, wave

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIG = os.path.join(RAIZ, "arte", "sons_original")
SAIDA = os.path.join(RAIZ, "src", "assets", "sons")
MODELO = os.environ.get("MOSS_SFX_DIR", r"D:\VoiceStudioData\engines\moss-soundeffect\MOSS-TTS")
SEMENTE = int(os.environ.get("SEMENTE", "1"))
PASSOS = int(os.environ.get("PASSOS", "100"))

ESTILO = "clean high quality sound effect for a sci-fi mobile game, single isolated sound, no music, no voice, no background noise"

# id -> (duração no jogo em segundos, descrição)
SONS = {
    # "tiro" não sai daqui: é sintetizado limpo em scripts/sintetizar_tiro.py (a IA deixava chiado)
    "gelo": (0.35, "crystalline ice shard shot, glassy chime, short"),
    "trilho": (0.7, "railgun shot, electric charge then powerful zap with bass thump"),
    "raio": (0.45, "electric arc lightning zap, crackling, short"),
    "missil": (0.7, "small missile launch whoosh, rocket hiss"),
    "gravidade": (1.0, "deep gravity well wobble, warping sub bass"),
    "pulso": (0.8, "electric shockwave pulse, low boom with electric crackle, force field"),
    "explosao": (0.6, "small spaceship explosion, crunchy, punchy, short tail"),
    "explosaoGrande": (2.0, "huge cinematic space explosion, deep boom, long rumble tail"),
    "morte": (0.3, "tiny alien drone popping, small crunchy pop"),
    "escudo": (0.35, "energy shield hit, metallic shimmer ping"),
    "dano": (0.5, "heavy impact on a planet, deep thud, slight distortion"),
    "nivel": (0.9, "level up chime, bright rising arpeggio, magical"),
    "carta": (0.35, "card select, soft whoosh with sparkle"),
    "clique": (0.12, "soft futuristic ui button click"),
    "ultimate": (1.6, "ultimate power activation, rising energy charge then massive blast"),
    "alerta": (1.2, "alarm siren, two tone warning, boss incoming"),
    "chefe": (2.0, "boss arrival, deep ominous brass drone with heavy boom"),
    "muro": (0.45, "heavy metal barrier slam, thunk"),
    "vitoria": (2.0, "victory fanfare, short heroic orchestral sting"),
    "derrota": (2.0, "defeat sting, descending dark synth, sad"),
    "moeda": (0.4, "coins collected, bright sparkly reward sound"),
    "bau": (1.5, "treasure chest opening, magical whoosh and sparkle burst"),
}


_pipe = None


def pipeline():
    global _pipe
    if _pipe is None:
        sys.path.insert(0, MODELO)
        os.environ.setdefault("TORCHDYNAMO_DISABLE", "1")
        import torch
        from moss_soundeffect_v2 import MossSoundEffectPipeline
        t0 = time.time()
        _pipe = MossSoundEffectPipeline.from_pretrained(os.path.join(MODELO, "checkpoints"), torch_dtype=torch.bfloat16, device="cuda")
        # só um modelo por vez na placa (texto -> difusão -> VAE); sem isso os 12 GB enchem e vira horas por som
        _pipe.engine.enable_cpu_offload()
        print(f"modelo carregado em {time.time() - t0:.0f}s", flush=True)
    return _pipe


def gerar(id_, dur, desc):
    import numpy as np
    pedido = round(max(1.0, dur + 0.6), 1)  # sobra para cortar o silêncio do começo
    janela = max(2, math.ceil(pedido))  # o modelo calcula só esta janela (o padrão seria 30 s)
    t0 = time.time()
    audio = pipeline()(prompt=f"{desc}. {ESTILO}", seconds=pedido, num_inference_steps=PASSOS,
                       seed=SEMENTE, max_inference_seconds=janela, progress_bar_cmd=lambda x, **k: x)
    pcm = np.clip(audio[0, 0].float().cpu().numpy(), -1, 1)
    wav = os.path.join(ORIG, id_ + ".wav")
    with wave.open(wav, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(pipeline().sample_rate)
        w.writeframes((pcm * 32767).astype("<i2").tobytes())
    print(f"{id_}: gerado em {time.time() - t0:.1f}s", flush=True)
    return wav


FFMPEG = shutil.which("ffmpeg") or "ffmpeg"


def preparar(id_, dur, wav):
    """Corta e normaliza pelo pico (-1 dB): para efeitos curtos é mais estável que loudnorm."""
    mp3 = os.path.join(SAIDA, id_ + ".mp3")
    fade = min(0.25, dur * 0.35)
    corte = (
        "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.005,"
        f"atrim=0:{dur},afade=t=out:st={dur - fade:.3f}:d={fade:.3f}"
    )
    medida = subprocess.run([FFMPEG, "-v", "info", "-i", wav, "-af", corte + ",volumedetect", "-f", "null", "-"],
                            capture_output=True, text=True).stderr
    pico = next((float(l.split("max_volume:")[1].split("dB")[0]) for l in medida.splitlines() if "max_volume:" in l), -1.0)
    ganho = -1.0 - pico
    subprocess.run([FFMPEG, "-y", "-v", "error", "-i", wav, "-af", f"{corte},volume={ganho:.2f}dB",
                    "-ac", "1", "-ar", "44100", "-b:a", "96k", mp3], check=True)
    print(f"{id_}.mp3  {dur}s  pico {pico:+.1f} dB -> -1 dB  {os.path.getsize(mp3) // 1024} KB", flush=True)


if __name__ == "__main__":
    os.makedirs(ORIG, exist_ok=True)
    os.makedirs(SAIDA, exist_ok=True)
    if not os.path.isdir(os.path.join(MODELO, "checkpoints")):
        sys.exit(f"Modelo de efeitos do Voice Studio não encontrado em {MODELO}")
    alvos = sys.argv[1:] or list(SONS)
    for id_ in alvos:
        dur, desc = SONS[id_]
        preparar(id_, dur, gerar(id_, dur, desc))
