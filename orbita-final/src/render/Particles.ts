import { Container, Rectangle, Sprite, Texture } from "pixi.js";
import { temArte } from "./Sprites";
import { tex } from "./Textures";

interface Part {
  sp: Sprite;
  vx: number;
  vy: number;
  life: number;
  max: number;
  s0: number;
  s1: number;
  drag: number;
  a0: number;
  stretch: boolean;
}

/** Partículas com pool de sprites e blend aditivo. */
export class Particles {
  readonly layer = new Container();
  private vivas: Part[] = [];
  private livres: Part[] = [];
  max = 900;
  /** Explosões animadas (folha 4×2 da arte final). */
  private quadros: Texture[] | null = null;
  private anims: { sp: Sprite; t: number; dur: number }[] = [];
  private animLivres: Sprite[] = [];

  private obterQuadros(): Texture[] | null {
    if (this.quadros === null && temArte("explosao_sheet")) {
      const base = tex("explosao_sheet");
      const fw = base.width / 4;
      const fh = base.height / 2;
      this.quadros = [];
      for (let i = 0; i < 8; i++) {
        this.quadros.push(new Texture({ source: base.source, frame: new Rectangle((i % 4) * fw, Math.floor(i / 4) * fh, fw, fh) }));
      }
    }
    return this.quadros;
  }

  /** Explosão animada (arte final); retorna false se não houver folha. */
  animar(x: number, y: number, diametro: number, dur = 0.45): boolean {
    const q = this.obterQuadros();
    if (!q || this.anims.length > 60) return false;
    let sp = this.animLivres.pop();
    if (!sp) {
      sp = new Sprite(q[0]);
      sp.anchor.set(0.5);
      sp.blendMode = "add";
      this.layer.addChild(sp);
    }
    sp.visible = true;
    sp.texture = q[0];
    sp.x = x;
    sp.y = y;
    sp.rotation = Math.random() * Math.PI * 2;
    sp.alpha = 1;
    sp.scale.set(diametro / q[0].width);
    this.anims.push({ sp, t: 0, dur });
    return true;
  }

  private obter(texId: string): Part | null {
    if (this.vivas.length >= this.max) return null;
    let p = this.livres.pop();
    if (!p) {
      const sp = new Sprite(tex(texId));
      sp.anchor.set(0.5);
      sp.blendMode = "add";
      this.layer.addChild(sp);
      p = { sp, vx: 0, vy: 0, life: 0, max: 1, s0: 1, s1: 0, drag: 0, a0: 1, stretch: false };
    } else {
      p.sp.texture = tex(texId);
    }
    p.sp.visible = true;
    this.vivas.push(p);
    return p;
  }

  emitir(x: number, y: number, o: {
    tex?: string; cor: number; vel?: number; ang?: number; spread?: number; vida?: number; s0?: number; s1?: number; drag?: number; alpha?: number; stretch?: boolean;
  }): void {
    const p = this.obter(o.tex ?? "glow");
    if (!p) return;
    const a = (o.ang ?? Math.random() * Math.PI * 2) + (o.spread ? (Math.random() - 0.5) * o.spread : 0);
    const v = (o.vel ?? 200) * (0.4 + Math.random() * 0.6);
    p.vx = Math.cos(a) * v;
    p.vy = Math.sin(a) * v;
    p.max = p.life = (o.vida ?? 0.5) * (0.7 + Math.random() * 0.6);
    p.s0 = o.s0 ?? 0.4;
    p.s1 = o.s1 ?? 0;
    p.drag = o.drag ?? 3;
    p.a0 = o.alpha ?? 1;
    p.stretch = o.stretch ?? false;
    p.sp.x = x;
    p.sp.y = y;
    p.sp.tint = o.cor;
    p.sp.alpha = p.a0;
    p.sp.rotation = p.stretch ? a : 0;
    p.sp.scale.set(p.s0);
  }

  explosao(x: number, y: number, r: number, cor: number, leve: boolean): void {
    if (this.animar(x, y, r * 2.6)) {
      const n = leve ? 2 : Math.min(10, 3 + Math.round(r / 20));
      for (let i = 0; i < n; i++) this.emitir(x, y, { tex: "spark", cor, vel: r * 5, vida: 0.4, s0: 1.1, s1: 0.2, stretch: true, drag: 4 });
      return;
    }
    this.emitir(x, y, { tex: "glowSoft", cor, vel: 0, vida: 0.35, s0: r / 40, s1: r / 30, alpha: 0.8 });
    this.emitir(x, y, { tex: "anel", cor: 0xffffff, vel: 0, vida: 0.3, s0: r / 200, s1: r / 55, alpha: 0.7 });
    const n = leve ? 4 : Math.min(18, 6 + Math.round(r / 12));
    for (let i = 0; i < n; i++) this.emitir(x, y, { tex: "spark", cor, vel: r * 5, vida: 0.45, s0: 1.2, s1: 0.2, stretch: true, drag: 4 });
  }

  morte(x: number, y: number, cor: number, r: number, leve: boolean): void {
    if (!leve) this.animar(x, y, r * 3.2, 0.38);
    this.emitir(x, y, { tex: "glowSoft", cor, vel: 0, vida: 0.25, s0: r / 30, s1: r / 18, alpha: 0.9 });
    const n = leve ? 3 : Math.min(14, 5 + Math.round(r / 4));
    for (let i = 0; i < n; i++) this.emitir(x, y, { tex: "spark", cor, vel: 260 + r * 6, vida: 0.4, s0: 1, s1: 0.1, stretch: true, drag: 5 });
  }

  update(dt: number): void {
    if (this.anims.length) {
      const q = this.quadros!;
      let k = 0;
      for (const a of this.anims) {
        a.t += dt;
        const f = a.t / a.dur;
        if (f >= 1) {
          a.sp.visible = false;
          this.animLivres.push(a.sp);
          continue;
        }
        a.sp.texture = q[Math.min(7, Math.floor(f * 8))];
        a.sp.alpha = f > 0.7 ? 1 - (f - 0.7) / 0.3 : 1;
        this.anims[k++] = a;
      }
      this.anims.length = k;
    }
    let j = 0;
    for (const p of this.vivas) {
      p.life -= dt;
      if (p.life <= 0) {
        p.sp.visible = false;
        this.livres.push(p);
        continue;
      }
      const k = 1 - p.life / p.max;
      const damp = Math.max(0, 1 - p.drag * dt);
      p.vx *= damp;
      p.vy *= damp;
      p.sp.x += p.vx * dt;
      p.sp.y += p.vy * dt;
      const s = p.s0 + (p.s1 - p.s0) * k;
      if (p.stretch) p.sp.scale.set(s * (0.6 + Math.hypot(p.vx, p.vy) / 300), s);
      else p.sp.scale.set(s);
      p.sp.alpha = p.a0 * (1 - k * k);
      this.vivas[j++] = p;
    }
    this.vivas.length = j;
  }

  limpar(): void {
    for (const p of this.vivas) {
      p.sp.visible = false;
      this.livres.push(p);
    }
    this.vivas.length = 0;
  }
}
