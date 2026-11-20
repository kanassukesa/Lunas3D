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

  private faixaAmbiente(ctx: AudioContext): { stop: () => void } {
    const out = ctx.createGain();
    out.gain.value = 0;
    out.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 3);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 700;
    lp.connect(out);
    out.connect(this.musicBus);
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoG.gain.value = 350;
    lfo.connect(lfoG);
    lfoG.connect(lp.frequency);
    lfo.start();
    const notas = [55, 82.4, 110, 164.8, 130.8];
    const oscs = notas.map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i % 2 ? "triangle" : "sawtooth";
      o.frequency.value = f;
      o.detune.value = (i - 2) * 6;
      const g = ctx.createGain();
      g.gain.value = 0.12 / (i + 1);
      o.connect(g);
      g.connect(lp);
      o.start();
      return o;
    });
    return {
      stop: () => {
        const t = ctx.currentTime;
        out.gain.cancelScheduledValues(t);
        out.gain.setValueAtTime(out.gain.value, t);
        out.gain.linearRampToValueAtTime(0, t + 1);
        setTimeout(() => {
          oscs.forEach((o) => o.stop());
          lfo.stop();
          out.disconnect();
        }, 1200);
      },
    };
  }

  private faixaChefe(ctx: AudioContext): { stop: () => void } {
    const out = ctx.createGain();
    out.gain.value = 0.4;
    out.connect(this.musicBus);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    lp.Q.value = 6;
    lp.connect(out);
    const seq = [55, 55, 65.4, 55, 73.4, 55, 82.4, 77.8];
    let passo = 0;
    let proximo = ctx.currentTime + 0.05;
    let vivo = true;
    const tick = () => {
      if (!vivo) return;
      while (proximo < ctx.currentTime + 0.3) {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = seq[passo % seq.length] * (passo % 16 >= 8 ? 1.5 : 1);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.25, proximo);
        g.gain.exponentialRampToValueAtTime(0.001, proximo + 0.16);
        o.connect(g);
        g.connect(lp);
        o.start(proximo);
        o.stop(proximo + 0.18);
        if (passo % 4 === 0) {
          const k = ctx.createOscillator();
          const kg = ctx.createGain();
          k.frequency.setValueAtTime(140, proximo);
          k.frequency.exponentialRampToValueAtTime(40, proximo + 0.15);
          kg.gain.setValueAtTime(0.6, proximo);
          kg.gain.exponentialRampToValueAtTime(0.001, proximo + 0.2);
          k.connect(kg);
          kg.connect(out);
          k.start(proximo);
          k.stop(proximo + 0.22);
        }
        passo++;
        proximo += 0.15;
      }
    };
    const id = setInterval(tick, 100);
    tick();
    return {
      stop: () => {
        vivo = false;
        clearInterval(id);
        out.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
        setTimeout(() => out.disconnect(), 1500);
      },
    };
  }
}

export const audio = new AudioSys();
