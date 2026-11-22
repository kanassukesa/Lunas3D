/**
 * Áudio com Web Audio API. Efeitos: arquivos MP3 de `assets/sons/<id>.mp3` (gerados no Voice Studio)
 * tocados pelo buffer com pitch aleatório; sem o arquivo (ou antes de carregar), cai para a síntese.
 * Limite de 8 sons iguais simultâneos. Música ambiente espacial + faixa de chefe procedurais.
 */
type SfxDef = { tipo: OscillatorType | "ruido"; f0: number; f1: number; dur: number; vol: number; filtro?: number };

/** Arquivos de som do jogo, por id (nome do arquivo sem extensão). */
const ARQUIVOS: Record<string, string> = {};
for (const [caminho, url] of Object.entries(
  import.meta.glob("../assets/sons/*.mp3", { eager: true, query: "?url", import: "default" }) as Record<string, string>,
)) {
  ARQUIVOS[caminho.replace(/^.*\/(.+)\.mp3$/, "$1")] = url;
}

/**
 * Volume de cada arquivo (eles vêm normalizados). Sons que repetem muito (tiros, mortes) ficam baixos
 * para não cansar; eventos raros (chefe, vitória, ultimate) ficam fortes.
 */
const VOL_ARQUIVO: Record<string, number> = {
  tiro: 0.22, gelo: 0.3, trilho: 0.45, raio: 0.3, missil: 0.35, gravidade: 0.5, pulso: 0.55,
  explosao: 0.35, explosaoGrande: 0.8, morte: 0.25, escudo: 0.35, dano: 0.6, nivel: 0.7, carta: 0.55,
  clique: 0.5, ultimate: 0.85, alerta: 0.6, chefe: 0.85, muro: 0.6, vitoria: 0.8, derrota: 0.8,
  moeda: 0.6, bau: 0.75,
};

/** Variação de pitch por som: tiros variam mais, sons musicais (fanfarras) quase nada. */
const VARIA_PITCH: Record<string, number> = { nivel: 0.02, vitoria: 0, derrota: 0, chefe: 0.02, alerta: 0, ultimate: 0.02, bau: 0.02 };

const SFX: Record<string, SfxDef> = {
  tiro: { tipo: "square", f0: 880, f1: 420, dur: 0.06, vol: 0.05, filtro: 3000 },
  gelo: { tipo: "triangle", f0: 1400, f1: 900, dur: 0.08, vol: 0.06 },
  trilho: { tipo: "sawtooth", f0: 220, f1: 1800, dur: 0.22, vol: 0.08, filtro: 4000 },
  raio: { tipo: "ruido", f0: 3000, f1: 800, dur: 0.12, vol: 0.06 },
  missil: { tipo: "ruido", f0: 600, f1: 200, dur: 0.2, vol: 0.05 },
  gravidade: { tipo: "sine", f0: 160, f1: 60, dur: 0.5, vol: 0.12 },
  pulso: { tipo: "sine", f0: 300, f1: 90, dur: 0.3, vol: 0.12 },
  explosao: { tipo: "ruido", f0: 900, f1: 100, dur: 0.3, vol: 0.09 },
  explosaoGrande: { tipo: "ruido", f0: 500, f1: 40, dur: 1.4, vol: 0.3 },
  morte: { tipo: "ruido", f0: 1500, f1: 300, dur: 0.1, vol: 0.04 },
  escudo: { tipo: "triangle", f0: 520, f1: 260, dur: 0.12, vol: 0.06 },
  dano: { tipo: "sawtooth", f0: 140, f1: 60, dur: 0.2, vol: 0.12, filtro: 900 },
  nivel: { tipo: "triangle", f0: 660, f1: 1320, dur: 0.25, vol: 0.12 },
  carta: { tipo: "triangle", f0: 990, f1: 1480, dur: 0.12, vol: 0.1 },
  clique: { tipo: "sine", f0: 700, f1: 600, dur: 0.05, vol: 0.08 },
  ultimate: { tipo: "sawtooth", f0: 80, f1: 600, dur: 0.9, vol: 0.18, filtro: 2000 },
  alerta: { tipo: "square", f0: 440, f1: 440, dur: 0.6, vol: 0.1, filtro: 1200 },
  chefe: { tipo: "sawtooth", f0: 60, f1: 40, dur: 1.2, vol: 0.2, filtro: 500 },
  muro: { tipo: "square", f0: 120, f1: 220, dur: 0.3, vol: 0.08, filtro: 800 },
  vitoria: { tipo: "triangle", f0: 523, f1: 1046, dur: 0.8, vol: 0.15 },
  derrota: { tipo: "sawtooth", f0: 300, f1: 70, dur: 1.2, vol: 0.15, filtro: 1000 },
  moeda: { tipo: "triangle", f0: 1200, f1: 1900, dur: 0.1, vol: 0.08 },
  bau: { tipo: "ruido", f0: 500, f1: 40, dur: 1.4, vol: 0.3 },
};

export class AudioSys {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private ruido!: AudioBuffer;
  /** Arquivos de som já decodificados. */
  private buffers: Record<string, AudioBuffer> = {};
  private ativos: Record<string, number> = {};
  private ultimo: Record<string, number> = {};
  private musica: { stop: () => void } | null = null;
  private faixa: "" | "ambiente" | "chefe" = "";
  volSom = 0.7;
  volMusica = 0.5;

  /** App minimizado / aba escondida: congela todo o áudio (música e efeitos). */
  private emSegundoPlano = false;

  segundoPlano(sim: boolean): void {
    this.emSegundoPlano = sim;
    const ctx = this.ctx;
    if (!ctx) return;
    if (sim) void ctx.suspend().catch(() => {});
    else if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  }

  /** Precisa ser chamado num gesto do usuário (iOS). */
  desbloquear(): void {
    if (this.emSegundoPlano) return;
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.connect(ctx.destination);
    this.sfxBus = ctx.createGain();
    this.sfxBus.connect(this.master);
    this.musicBus = ctx.createGain();
    this.musicBus.connect(this.master);
    this.ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = this.ruido.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.aplicarVolumes();
    this.carregarArquivos(ctx);
    if (this.faixa) {
      const f = this.faixa;
      this.faixa = "";
      this.tocarMusica(f);
    }
  }

  aplicarVolumes(): void {
    if (!this.ctx) return;
    this.sfxBus.gain.value = this.volSom;
    this.musicBus.gain.value = this.volMusica * 0.5;
  }

  /** Baixa e decodifica os MP3 em segundo plano; cada som passa a usar o arquivo assim que fica pronto. */
  private carregarArquivos(ctx: AudioContext): void {
    for (const [id, url] of Object.entries(ARQUIVOS)) {
      fetch(url)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
        .then((dados) => new Promise<AudioBuffer>((ok, falha) => ctx.decodeAudioData(dados, ok, falha)))
        .then((buf) => { this.buffers[id] = buf; })
        .catch(() => { /* fica com a síntese */ });
    }
  }

  sfx(id: string): void {
    const ctx = this.ctx;
    const def = SFX[id];
    const buf = this.buffers[id];
    if (!ctx || (!def && !buf) || this.volSom <= 0 || ctx.state !== "running") return;
    if ((this.ativos[id] ?? 0) >= 8) return;
    const agora = ctx.currentTime;
    if (agora - (this.ultimo[id] ?? 0) < 0.03) return;
    this.ultimo[id] = agora;
    this.ativos[id] = (this.ativos[id] ?? 0) + 1;
    if (buf) {
      const varia = VARIA_PITCH[id] ?? 0.06;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = 1 - varia + Math.random() * varia * 2;
      const g = ctx.createGain();
      g.gain.value = VOL_ARQUIVO[id] ?? 0.5;
      src.connect(g);
      g.connect(this.sfxBus);
      src.start(agora);
      src.onended = () => {
        this.ativos[id]--;
        g.disconnect();
      };
      return;
    }
    if (!def) return; // inalcançável: sem buffer, `def` existe (checado acima)
    const pitch = 0.9 + Math.random() * 0.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(def.vol, agora);
    g.gain.exponentialRampToValueAtTime(0.0001, agora + def.dur);
    let fonte: AudioScheduledSourceNode;
    let saida: AudioNode = g;
    if (def.tipo === "ruido") {
      const src = ctx.createBufferSource();
      src.buffer = this.ruido;
      const bp = ctx.createBiquadFilter();
      bp.type = "lowpass";
      bp.frequency.setValueAtTime(def.f0 * pitch, agora);
      bp.frequency.exponentialRampToValueAtTime(Math.max(30, def.f1 * pitch), agora + def.dur);
      src.connect(bp);
      bp.connect(g);
      fonte = src;
    } else {
      const o = ctx.createOscillator();
      o.type = def.tipo;
      o.frequency.setValueAtTime(def.f0 * pitch, agora);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, def.f1 * pitch), agora + def.dur);
      if (def.filtro) {
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = def.filtro;
        o.connect(lp);
        lp.connect(g);
      } else o.connect(g);
      fonte = o;
    }
    saida.connect(this.sfxBus);
    fonte.start(agora);
    fonte.stop(agora + def.dur + 0.02);
    fonte.onended = () => {
      this.ativos[id]--;
      saida.disconnect();
      saida = null as unknown as AudioNode;
    };
  }

  tocarMusica(faixa: "ambiente" | "chefe" | ""): void {
    if (faixa === this.faixa) return;
    this.faixa = faixa;
    this.musica?.stop();
    this.musica = null;
    const ctx = this.ctx;
    if (!ctx || !faixa) return;
    this.musica = faixa === "chefe" ? this.faixaChefe(ctx) : this.faixaAmbiente(ctx);
  }

  /** Sequenciador simples: chama `agendar(passo, tempo)` à frente do relógio do áudio. */
  private sequenciador(ctx: AudioContext, passoSeg: number, agendar: (passo: number, t: number) => void): { parar: () => void } {
    let passo = 0;
    let prox = ctx.currentTime + 0.1;
    let vivo = true;
    const tick = () => {
      if (!vivo) return;
      while (prox < ctx.currentTime + 0.35) {
        agendar(passo++, prox);
        prox += passoSeg;
      }
    };
    const id = setInterval(tick, 90);
    tick();
    return { parar: () => { vivo = false; clearInterval(id); } };
  }

  private nota(ctx: AudioContext, destino: AudioNode, freq: number, t: number, dur: number, vol: number, tipo: OscillatorType, ataque = 0.01): void {
    const o = ctx.createOscillator();
    o.type = tipo;
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(destino);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private fim(ctx: AudioContext, out: GainNode, seq: { parar: () => void }, extra?: () => void): { stop: () => void } {
    return {
      stop: () => {
        seq.parar();
        out.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
        setTimeout(() => { extra?.(); out.disconnect(); }, 2500);
      },
    };
  }

  /** Reverb longo (resposta ao impulso gerada): o "espaço" da música ambiente. */
  private reverb(ctx: AudioContext, seg: number): ConvolverNode {
    const n = Math.floor(ctx.sampleRate * seg);
    const ir = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2);
    }
    const cv = ctx.createConvolver();
    cv.buffer = ir;
    return cv;
  }

  /**
   * Ambiente espacial: pads suaves e largos (Cmaj7 – Am9 – Fmaj7(#11) – G6) que respiram com um
   * filtro lento, um grave profundo, sinos cristalinos esparsos e brilhos agudos, tudo afogado num
   * reverb longo. Só senoides/triângulos: nada de serra áspera. ~66 BPM, cada acorde dura 2 compassos.
   */
  private faixaAmbiente(ctx: AudioContext): { stop: () => void } {
    const out = ctx.createGain();
    out.gain.value = 0;
    out.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 4);
    out.connect(this.musicBus);

    const sala = this.reverb(ctx, 5);
    const molhado = ctx.createGain();
    molhado.gain.value = 0.9;
    sala.connect(molhado);
    molhado.connect(out);

    // pads passam por um filtro que abre e fecha devagar (a "respiração" da nave)
    const padLp = ctx.createBiquadFilter();
    padLp.type = "lowpass";
    padLp.frequency.value = 1100;
    padLp.Q.value = 0.7;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 600;
    lfo.connect(lfoG);
    lfoG.connect(padLp.frequency);
    lfo.start();
    padLp.connect(out);
    padLp.connect(sala);

    const sinos = ctx.createGain();
    sinos.gain.value = 0.55;
    sinos.connect(out);
    const sinosEnvio = ctx.createGain();
    sinosEnvio.gain.value = 1.4;
    sinos.connect(sinosEnvio);
    sinosEnvio.connect(sala);

    const C = 261.63;
    const semi = (n: number) => C * Math.pow(2, n / 12);
    // acordes (semitons a partir de C4) e as notas que os sinos podem tocar em cada um
    const acordes = [
      { pad: [-12, -5, 4, 11], baixo: -24, mel: [12, 16, 19, 23, 26] }, // Cmaj7
      { pad: [-15, -8, 0, 7, 11], baixo: -27, mel: [12, 14, 16, 19, 21] }, // Am9
      { pad: [-19, -12, -3, 4, 6], baixo: -31, mel: [9, 12, 16, 18, 21] }, // Fmaj7(#11)
      { pad: [-17, -10, -1, 4, 9], baixo: -29, mel: [11, 14, 16, 19, 23] }, // G6
    ];
    // pseudoaleatório fixo por passo: a melodia varia, mas sem ficar caótica
    const sorte = (p: number, k: number) => {
      const x = Math.sin(p * 12.9898 + k * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    const passoSeg = 60 / 66 / 2; // colcheias
    const porAcorde = 16;
    const seq = this.sequenciador(ctx, passoSeg, (p, t) => {
      const ac = acordes[Math.floor(p / porAcorde) % acordes.length];
      const durAc = passoSeg * porAcorde;
      if (p % porAcorde === 0) {
        for (const n of ac.pad) {
          const f = semi(n);
          this.nota(ctx, padLp, f, t, durAc + 2.5, 0.03, "sine", 2.2);
          this.nota(ctx, padLp, f * 1.003, t, durAc + 2.5, 0.022, "triangle", 2.6);
        }
        this.nota(ctx, out, semi(ac.baixo), t, durAc + 1.5, 0.12, "sine", 1.5);
      }
      // sinos: notas esparsas nos tempos pares, com pan aleatório
      if (p % 2 === 0 && sorte(p, 1) < 0.32) {
        const f = semi(ac.mel[Math.floor(sorte(p, 2) * ac.mel.length)]);
        const pan = ctx.createStereoPanner();
        pan.pan.value = sorte(p, 3) * 1.2 - 0.6;
        pan.connect(sinos);
        this.nota(ctx, pan, f, t, 2.8, 0.05, "sine", 0.005);
        this.nota(ctx, pan, f * 2.76, t, 0.9, 0.012, "sine", 0.003); // parcial inarmônico: timbre de sino/vidro
      }
      // brilho agudo bem raro, como uma estrela piscando
      if (sorte(p, 4) < 0.06) {
        const f = semi(ac.mel[Math.floor(sorte(p, 5) * ac.mel.length)] + 24);
        this.nota(ctx, sinos, f, t + passoSeg * 0.5, 1.6, 0.012, "sine", 0.01);
      }
    });
    return this.fim(ctx, out, seq, () => lfo.stop());
  }

  /** Chefe: baixo pulsante + bumbo + chimbal + stabs, 140 BPM. */
  private faixaChefe(ctx: AudioContext): { stop: () => void } {
    const out = ctx.createGain();
    out.gain.value = 0.5;
    out.connect(this.musicBus);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1100;
    lp.Q.value = 7;
    lp.connect(out);
    const baixo = [55, 55, 65.4, 55, 73.4, 55, 82.4, 77.8];
    const lead = [440, 0, 523.3, 0, 493.9, 440, 0, 392];
    const passoSeg = 60 / 140 / 2;
    const seq = this.sequenciador(ctx, passoSeg, (p, t) => {
      const sobe = p % 32 >= 16 ? 1.335 : 1;
      this.nota(ctx, lp, baixo[p % 8] * sobe, t, 0.18, 0.22, "sawtooth");
      // varredura do filtro a cada compasso
      if (p % 8 === 0) {
        lp.frequency.setValueAtTime(500, t);
        lp.frequency.linearRampToValueAtTime(1800, t + passoSeg * 7);
      }
      if (p % 4 === 0) {
        const k = ctx.createOscillator();
        const kg = ctx.createGain();
        k.frequency.setValueAtTime(150, t);
        k.frequency.exponentialRampToValueAtTime(40, t + 0.15);
        kg.gain.setValueAtTime(0.7, t);
        kg.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        k.connect(kg);
        kg.connect(out);
        k.start(t);
        k.stop(t + 0.25);
      }
      if (p % 2 === 1 && this.ruido) {
        const n = ctx.createBufferSource();
        n.buffer = this.ruido;
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 7000;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.06, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        n.connect(hp);
        hp.connect(g);
        g.connect(out);
        n.start(t);
        n.stop(t + 0.06);
      }
      if (p % 64 >= 32) {
        const f = lead[p % 8];
        if (f) this.nota(ctx, out, f * (sobe > 1 ? 1.122 : 1), t, 0.2, 0.05, "square");
      }
    });
    return this.fim(ctx, out, seq);
  }
}

export const audio = new AudioSys();

// pausa o som quando o app vai para segundo plano: navegador (visibilitychange/pagehide)
// e APK do Capacitor (eventos nativos "pause"/"resume" disparados no document)
if (typeof document !== "undefined") {
  const conferir = () => audio.segundoPlano(document.hidden);
  document.addEventListener("visibilitychange", conferir);
  document.addEventListener("pause", () => audio.segundoPlano(true));
  document.addEventListener("resume", () => audio.segundoPlano(false));
  window.addEventListener("pagehide", () => audio.segundoPlano(true));
  window.addEventListener("pageshow", conferir);
}
