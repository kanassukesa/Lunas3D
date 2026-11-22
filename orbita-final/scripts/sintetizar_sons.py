"""
Todos os efeitos sonoros do jogo, sintetizados limpos (sem chiado de fundo).

  python scripts/sintetizar_sons.py            (todos)
  python scripts/sintetizar_sons.py tiro dano  (só esses)

-> src/assets/sons/<id>.mp3   (o Audio.ts acha sozinho)

Os sons gerados por IA (scripts/gerar_sons.py, Voice Studio) tinham um chiado de fundo em todos;
aqui cada som é montado com senoides e envelopes. Ruído só entra onde ele É o som (explosões,
impactos, whoosh) e sempre filtrado para grave, nunca como chiado agudo.
"""
import os, shutil, subprocess, sys, wave
import numpy as np

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, "src", "assets", "sons")
ORIG = os.path.join(RAIZ, "arte", "sons_original")
SR = 44100
rng = np.random.default_rng(7)


# ---------- blocos básicos ----------

def tempo(dur):
    return np.arange(int(SR * dur)) / SR


def osc(freq, dur, fase0=0.0):
    """Senoide com frequência variável (array ou número)."""
    f = np.broadcast_to(np.asarray(freq, dtype=float), (int(SR * dur),))
    return np.sin(2 * np.pi * np.cumsum(f) / SR + fase0)


def aditivo(freq, dur, harm):
    """Soma de harmônicos {n: amplitude} sobre a mesma frequência (timbre de metal/sintetizador sem aliasing)."""
    f = np.broadcast_to(np.asarray(freq, dtype=float), (int(SR * dur),))
    fase = 2 * np.pi * np.cumsum(f) / SR
    return sum(a * np.sin(n * fase) for n, a in harm.items())


def env(dur, ataque=0.003, queda=0.1, fim=0.02):
    """Ataque linear + queda exponencial + fade final para não estalar."""
    t = tempo(dur)
    e = np.minimum(1, t / max(ataque, 1e-4)) * np.exp(-t / queda)
    n = int(SR * fim)
    if n:
        e[-n:] *= np.linspace(1, 0, n)
    return e


def janela(dur, ataque, solta):
    """Envelope trapezoidal (sobe, segura, desce)."""
    t = tempo(dur)
    return np.minimum(1, t / ataque) * np.minimum(1, (dur - t) / solta)


def passa_baixa(x, corte):
    """Filtro passa-baixa de um polo com corte variável (array em Hz) — deixa o ruído grave e redondo."""
    corte = np.broadcast_to(np.asarray(corte, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * corte / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def ruido_grave(dur, corte, passes=2):
    """Ruído filtrado duas vezes: estrondo/whoosh, sem o agudo que vira chiado."""
    x = rng.standard_normal(int(SR * dur))
    for _ in range(passes):
        x = passa_baixa(x, corte)
    return x / (np.max(np.abs(x)) + 1e-9)


def em(total, x, inicio):
    """Coloca x dentro de um buffer de `total` segundos a partir de `inicio` s."""
    out = np.zeros(int(SR * total))
    i = int(SR * inicio)
    n = min(len(x), len(out) - i)
    out[i:i + n] += x[:n]
    return out


def sino(f, dur, vol=1.0, queda=0.5):
    """Sino/cristal: parcial base + parciais inarmônicos que somem mais rápido."""
    t = tempo(dur)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / queda)
    s += 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / (queda * 0.35))
    s += 0.15 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / (queda * 0.15))
    return vol * s * env(dur, 0.002, 99, 0.02)


def nota_metal(f, dur, vol=1.0, ataque=0.02, solta=0.1, brilho=1.0):
    """Nota de 'metal' (fanfarra/sintetizador): harmônicos decrescentes, sem serra crua."""
    harm = {1: 1, 2: 0.5 * brilho, 3: 0.33 * brilho, 4: 0.2 * brilho, 5: 0.12 * brilho, 6: 0.06 * brilho}
    vib = f * (1 + 0.004 * np.sin(2 * np.pi * 5.5 * tempo(dur)))
    return vol * aditivo(vib, dur, harm) * janela(dur, ataque, solta)


def queda_tom(f0, f1, dur, tau):
    t = tempo(dur)
    return f1 + (f0 - f1) * np.exp(-t / tau)


def baque(dur, f0=150, f1=40, tau=0.05, queda=0.15):
    """Bumbo/baque grave: senoide que despenca."""
    return osc(queda_tom(f0, f1, dur, tau), dur) * env(dur, 0.002, queda, 0.02)


# ---------- receitas ----------

def tiro():
    d = 0.32
    t = tempo(d)
    f = 170 + 2030 * np.exp(-t / 0.055)
    f = f * (1 + 0.035 * np.sin(2 * np.pi * 38 * t) * np.exp(-t / 0.12))
    fase = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(fase) + 0.45 * np.sin(2.01 * fase) + 0.22 * np.sin(3.98 * fase + 0.7) + 0.30 * np.sin(0.5 * fase)
    return s * env(d, 0.002, 0.085, 0.03)


def gelo():
    d = 0.4
    # disparo cristalino: "pew" agudo e curto + dois sininhos de vidro
    pew = osc(queda_tom(3200, 1400, d, 0.04), d) * env(d, 0.002, 0.05, 0.02)
    return 0.6 * pew + em(d, sino(2637, d, 0.6, 0.12), 0.01) + em(d, sino(3951, d - 0.04, 0.35, 0.08), 0.04)


def trilho():
    d = 0.75
    # carga subindo (0,22 s) e disparo pesado descendo, com grave por baixo
    carga_d = 0.22
    t = tempo(carga_d)
    carga = osc(300 + 1500 * (t / carga_d) ** 2, carga_d) * (t / carga_d) ** 1.5 * 0.35
    disp_d = d - carga_d
    tt = tempo(disp_d)
    f = 90 + 1700 * np.exp(-tt / 0.07)
    fase = 2 * np.pi * np.cumsum(f) / SR
    disp = (np.sin(fase) + 0.5 * np.sin(2.005 * fase) + 0.25 * np.sin(3.01 * fase)) * env(disp_d, 0.002, 0.16, 0.04)
    return em(d, carga, 0) + em(d, disp + 0.9 * baque(disp_d, 120, 38, 0.06, 0.18), carga_d)


def raio():
    d = 0.45
    t = tempo(d)
    # zumbido elétrico: harmônicos ímpares num tom que treme rápido + picotado
    tremor = 1 + 0.08 * np.sin(2 * np.pi * 61 * t) + 0.05 * np.sin(2 * np.pi * 133 * t)
    zumbido = aditivo(110 * tremor, d, {1: 1, 3: 0.55, 5: 0.35, 7: 0.22, 9: 0.12})
    picote = 0.55 + 0.45 * np.sign(np.sin(2 * np.pi * 24 * t + 3 * np.sin(2 * np.pi * 7 * t)))
    estalo = osc(queda_tom(2400, 600, d, 0.03), d) * env(d, 0.001, 0.03, 0.01)
    return (0.8 * zumbido * picote + 0.5 * estalo) * env(d, 0.004, 0.2, 0.04)


def missil():
    d = 0.75
    t = tempo(d)
    # whoosh grave que sobe + chiado de foguete filtrado (sem agudo) + tom subindo
    corte = 300 + 1200 * np.sin(np.pi * np.minimum(1, t / d)) ** 2
    sopro = ruido_grave(d, corte) * janela(d, 0.05, 0.25)
    tom = osc(220 + 500 * (t / d), d) * janela(d, 0.03, 0.3) * 0.25
    return sopro + tom + 0.6 * baque(d, 160, 50, 0.04, 0.08)


def gravidade():
    d = 1.0
    t = tempo(d)
    # grave que "entorta": vibrato lento e profundo, + oitava acima ondulando
    f = 55 * (1 + 0.18 * np.sin(2 * np.pi * 4.5 * t)) * (1 - 0.25 * t / d)
    s = osc(f, d) + 0.4 * osc(2 * f * (1 + 0.01 * np.sin(2 * np.pi * 7 * t)), d) + 0.15 * osc(3.02 * f, d)
    return s * janela(d, 0.06, 0.35)


def pulso():
    d = 0.8
    t = tempo(d)
    boom = baque(d, 140, 38, 0.08, 0.3)
    # anel de energia: tom com tremolo que se espalha
    anel = osc(queda_tom(900, 300, d, 0.15), d) * (0.6 + 0.4 * np.sin(2 * np.pi * 30 * t)) * env(d, 0.004, 0.18, 0.05)
    onda = ruido_grave(d, queda_tom(2000, 200, d, 0.12)) * env(d, 0.003, 0.12, 0.05)
    return boom + 0.45 * anel + 0.4 * onda


def explosao():
    d = 0.65
    estrondo = ruido_grave(d, queda_tom(2600, 250, d, 0.09)) * env(d, 0.002, 0.16, 0.05)
    return estrondo + 0.9 * baque(d, 120, 40, 0.05, 0.16)


def explosao_grande():
    d = 2.0
    t = tempo(d)
    estrondo = ruido_grave(d, queda_tom(2200, 120, d, 0.25)) * env(d, 0.003, 0.55, 0.15)
    ronco = ruido_grave(d, 90, 3) * env(d, 0.05, 0.9, 0.2) * 0.8
    sub = osc(queda_tom(80, 28, d, 0.4), d) * env(d, 0.004, 0.7, 0.15)
    return estrondo + ronco + 1.1 * sub + baque(d, 150, 40, 0.06, 0.25)


def morte():
    d = 0.3
    pop = osc(queda_tom(1100, 140, d, 0.03), d) * env(d, 0.001, 0.05, 0.02)
    estalo = ruido_grave(d, queda_tom(3000, 400, d, 0.02)) * env(d, 0.001, 0.035, 0.02)
    return pop + 0.6 * estalo


def escudo():
    d = 0.4
    t = tempo(d)
    # ping metálico com leve chorus (dois anéis quase iguais)
    parciais = [(1250, 1.0, 0.12), (1810, 0.6, 0.08), (2710, 0.35, 0.05), (3990, 0.2, 0.03)]
    s = sum(a * (np.sin(2 * np.pi * f * t) + np.sin(2 * np.pi * f * 1.004 * t)) * np.exp(-t / q) for f, a, q in parciais)
    return s * env(d, 0.001, 99, 0.03) + 0.3 * baque(d, 400, 150, 0.02, 0.04)


def dano():
    d = 0.55
    s = baque(d, 110, 32, 0.07, 0.2) * 1.3
    s = np.tanh(1.8 * s)  # saturação leve: peso sem chiado
    corpo = ruido_grave(d, queda_tom(900, 120, d, 0.05)) * env(d, 0.002, 0.08, 0.04)
    return s + 0.5 * corpo


def nivel():
    d = 1.0
    s = np.zeros(int(SR * d))
    for i, f in enumerate([523.25, 659.25, 783.99, 1046.5]):  # dó-mi-sol-dó
        s += em(d, sino(f, d - i * 0.09, 0.8, 0.35), i * 0.09)
        s += em(d, nota_metal(f, 0.25, 0.25, 0.005, 0.2, 0.4), i * 0.09)
    s += em(d, sino(2093, 0.6, 0.3, 0.2), 0.36)
    return s


def carta():
    d = 0.35
    t = tempo(d)
    whoosh = ruido_grave(d, 400 + 1400 * np.sin(np.pi * t / d)) * np.sin(np.pi * t / d) ** 2 * 0.5
    return whoosh + em(d, sino(1568, 0.25, 0.5, 0.08), 0.08) + em(d, sino(2349, 0.2, 0.3, 0.06), 0.12)


def clique():
    d = 0.1
    return osc(queda_tom(1900, 1200, d, 0.01), d) * env(d, 0.001, 0.018, 0.01) + 0.3 * osc(3800, d) * env(d, 0.0005, 0.006, 0.01)


def ultimate():
    d = 1.6
    carga_d = 0.9
    t = tempo(carga_d)
    x = t / carga_d
    f = 150 + 1400 * x ** 2
    trem = 0.6 + 0.4 * np.sin(2 * np.pi * np.cumsum(6 + 40 * x) / SR)
    carga = (osc(f, carga_d) + 0.4 * osc(1.5 * f, carga_d) + 0.2 * osc(2 * f, carga_d)) * trem * x ** 1.3 * 0.5
    exp_d = d - carga_d
    estouro = ruido_grave(exp_d, queda_tom(3000, 150, exp_d, 0.15)) * env(exp_d, 0.002, 0.3, 0.1)
    estouro += 1.2 * baque(exp_d, 160, 35, 0.08, 0.35)
    estouro += 0.5 * osc(queda_tom(1600, 120, exp_d, 0.1), exp_d) * env(exp_d, 0.002, 0.15, 0.05)
    return em(d, carga, 0) + em(d, estouro, carga_d)


def alerta():
    d = 1.2
    t = tempo(d)
    alto = (np.floor(t / 0.3) % 2) == 0
    f = np.where(alto, 880.0, 660.0)
    # suaviza a troca de nota
    f = passa_baixa(f, 60)
    s = aditivo(f, d, {1: 1, 3: 0.3, 5: 0.12})
    pulsos = np.minimum(1, (t % 0.3) / 0.01) * np.minimum(1, (0.3 - t % 0.3) / 0.03)
    return s * pulsos * janela(d, 0.01, 0.05)


def chefe():
    d = 2.0
    s = nota_metal(55, d, 1.0, 0.4, 0.6, 1.2) + nota_metal(82.41, d, 0.7, 0.5, 0.6, 1.0) + nota_metal(58.27, d, 0.35, 0.8, 0.6, 0.8)
    s = passa_baixa(s, 900)
    return 1.3 * s + 1.4 * baque(d, 120, 30, 0.1, 0.6) + 0.6 * ruido_grave(d, 120, 3) * env(d, 0.01, 0.8, 0.2)


def muro():
    d = 0.5
    t = tempo(d)
    metal = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / q) for f, a, q in [(220, 1, 0.15), (347, 0.6, 0.1), (561, 0.4, 0.07), (893, 0.25, 0.05)])
    return 1.2 * baque(d, 130, 45, 0.04, 0.12) + 0.5 * metal * env(d, 0.001, 99, 0.03) + 0.4 * ruido_grave(d, 700) * env(d, 0.001, 0.04, 0.02)


def vitoria():
    d = 2.0
    s = np.zeros(int(SR * d))
    # fanfarra: sol-dó-mi-sol, depois acorde de dó sustentado
    for f, ini, du in [(392.0, 0.0, 0.16), (523.25, 0.16, 0.16), (659.25, 0.32, 0.16), (783.99, 0.48, 0.3)]:
        s += em(d, nota_metal(f, du, 0.7, 0.01, 0.06), ini)
    for f in [523.25, 659.25, 783.99, 1046.5]:
        s += em(d, nota_metal(f, 1.2, 0.45, 0.03, 0.8), 0.8)
    s += em(d, sino(2093, 1.0, 0.3, 0.4), 0.8)
    return s


def derrota():
    d = 2.0
    s = np.zeros(int(SR * d))
    # descendo em menor, timbre escuro
    for f, ini, du in [(392.0, 0.0, 0.4), (311.13, 0.4, 0.4), (261.63, 0.8, 0.4), (196.0, 1.2, 0.8)]:
        s += em(d, nota_metal(f * (1 - 0.0 * ini), du, 0.6, 0.03, 0.25, 0.5), ini)
    s += em(d, osc(98.0, 0.8) * janela(0.8, 0.1, 0.5) * 0.4, 1.2)
    return passa_baixa(s, 1500)


def moeda():
    d = 0.4
    return em(d, nota_metal(987.77, 0.08, 0.7, 0.002, 0.02, 0.5), 0) + em(d, sino(1318.5, 0.32, 0.9, 0.12), 0.07)


def bau():
    d = 1.5
    t = tempo(d)
    whoosh = ruido_grave(d, 300 + 1500 * np.minimum(1, t / 0.5)) * janela(d, 0.3, 0.9) * 0.45
    s = whoosh + 0.7 * baque(d, 200, 60, 0.05, 0.15)
    for i, f in enumerate([1046.5, 1318.5, 1568.0, 2093.0, 2637.0, 3136.0]):
        s += em(d, sino(f, 0.8, 0.5, 0.25), 0.15 + i * 0.07)
    return s


SONS = {
    "tiro": tiro, "gelo": gelo, "trilho": trilho, "raio": raio, "missil": missil, "gravidade": gravidade,
    "pulso": pulso, "explosao": explosao, "explosaoGrande": explosao_grande, "morte": morte, "escudo": escudo,
    "dano": dano, "nivel": nivel, "carta": carta, "clique": clique, "ultimate": ultimate, "alerta": alerta,
    "chefe": chefe, "muro": muro, "vitoria": vitoria, "derrota": derrota, "moeda": moeda, "bau": bau,
}

FFMPEG = shutil.which("ffmpeg") or "ffmpeg"


def salvar(id_, x):
    x = x - np.mean(x)  # sem DC
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.89  # pico -1 dB
    wav = os.path.join(ORIG, id_ + "_sintetizado.wav")
    with wave.open(wav, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())
    mp3 = os.path.join(SAIDA, id_ + ".mp3")
    subprocess.run([FFMPEG, "-y", "-v", "error", "-i", wav, "-ac", "1", "-ar", str(SR), "-b:a", "128k", mp3], check=True)
    print(f"{id_}.mp3  {len(x) / SR:.2f}s  {os.path.getsize(mp3) // 1024} KB", flush=True)


if __name__ == "__main__":
    os.makedirs(ORIG, exist_ok=True)
    os.makedirs(SAIDA, exist_ok=True)
    for id_ in sys.argv[1:] or list(SONS):
        salvar(id_, SONS[id_]())
