/**
 * Áudio sintetizado com Web Audio API (sem arquivos): efeitos com pitch aleatório ±10%,
 * limite de 8 sons iguais simultâneos, música ambiente + faixa de chefe procedurais.
 */
type SfxDef = { tipo: OscillatorType | "ruido"; f0: number; f1: number; dur: number; vol: number; filtro?: number };

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
};

export class AudioSys {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private ruido!: AudioBuffer;
  private ativos: Record<string, number> = {};
  private ultimo: Record<string, number> = {};
  private musica: { stop: () => void } | null = null;
  private faixa: "" | "ambiente" | "chefe" = "";
  volSom = 0.7;
  volMusica = 0.5;

  /** Precisa ser chamado num gesto do usuário (iOS). */
  desbloquear(): void {
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

  sfx(id: string): void {
    const ctx = this.ctx;
    const def = SFX[id];
    if (!ctx || !def || this.volSom <= 0 || ctx.state !== "running") return;
    if ((this.ativos[id] ?? 0) >= 8) return;
    const agora = ctx.currentTime;
    if (agora - (this.ultimo[id] ?? 0) < 0.03) return;
    this.ultimo[id] = agora;
    this.ativos[id] = (this.ativos[id] ?? 0) + 1;
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

  /** Ambiente: pad em progressão menor (i–VI–III–VII) + arpejo suave, 84 BPM. */
  private faixaAmbiente(ctx: AudioContext): { stop: () => void } {
    const out = ctx.createGain();
    out.gain.value = 0;
    out.gain.linearRampToValueAtTime(0.45, ctx.currentTime + 3);
    out.connect(this.musicBus);
    // eco para dar profundidade espacial
    const eco = ctx.createDelay(1);
    eco.delayTime.value = 0.36;
    const fb = ctx.createGain();
    fb.gain.value = 0.35;
    const ecoLp = ctx.createBiquadFilter();
    ecoLp.type = "lowpass";
    ecoLp.frequency.value = 1800;
    eco.connect(ecoLp);
    ecoLp.connect(fb);
    fb.connect(eco);
    ecoLp.connect(out);
    const padLp = ctx.createBiquadFilter();
    padLp.type = "lowpass";
    padLp.frequency.value = 900;
    padLp.connect(out);
    const arpBus = ctx.createGain();
    arpBus.gain.value = 1;
    arpBus.connect(out);
    arpBus.connect(eco);

    const A = 220;
    const semi = (n: number) => A * Math.pow(2, n / 12);
    // acordes em semitons a partir de A3: Am, F, C, G
    const acordes = [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]];
    const passoSeg = 60 / 84 / 2; // colcheias
    const seq = this.sequenciador(ctx, passoSeg, (p, t) => {
      const compasso = Math.floor(p / 16) % acordes.length;
      const ac = acordes[compasso];
      if (p % 16 === 0) {
        for (const n of ac) {
          this.nota(ctx, padLp, semi(n - 12), t, passoSeg * 17, 0.045, "sawtooth", 1.2);
          this.nota(ctx, padLp, semi(n - 12) * 1.004, t, passoSeg * 17, 0.035, "sawtooth", 1.2);
        }
        this.nota(ctx, padLp, semi(ac[0] - 24), t, passoSeg * 16, 0.09, "triangle", 0.4);
      }
      // arpejo: sobe e desce pelas notas do acorde, com pausas
      const padrao = [0, 1, 2, 1, 0, 2, 1, -1];
      const i = padrao[p % padrao.length];
      if (i >= 0 && (p >> 3) % 2 === 0) this.nota(ctx, arpBus, semi(ac[i] + 12), t, 0.5, 0.05, "triangle");
    });
    return this.fim(ctx, out, seq);
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
