import { BitmapFont, BitmapText, Container } from "pixi.js";

interface Num {
  t: BitmapText;
  fonte: string;
  vx: number;
  vy: number;
  life: number;
  max: number;
  crit: boolean;
  base: number;
}

let instalada = false;
function instalarFonte(): void {
  if (instalada) return;
  instalada = true;
  // normal: branco com contorno azul-escuro grosso e sombra (lê bem sobre qualquer fundo)
  BitmapFont.install({
    name: "dmgFont",
    style: {
      fontFamily: "Arial Black, Arial, sans-serif", fontSize: 64, fontWeight: "900", fontStyle: "italic",
      fill: "#ffffff",
      stroke: { color: "#0a1a3a", width: 10, join: "round" },
      dropShadow: { color: "#000000", alpha: 0.6, blur: 2, distance: 4, angle: Math.PI / 2 },
    },
    chars: [["0", "9"], "-", "+", ".", "k", "M", "!"],
    resolution: 1,
    padding: 10,
  });
  // crítico: dourado com contorno vermelho-escuro e brilho
  BitmapFont.install({
    name: "dmgCrit",
    style: {
      fontFamily: "Arial Black, Arial, sans-serif", fontSize: 72, fontWeight: "900", fontStyle: "italic",
      fill: "#ffe14a",
      stroke: { color: "#7a1200", width: 12, join: "round" },
      dropShadow: { color: "#ff6a00", alpha: 0.8, blur: 8, distance: 0 },
    },
    chars: [["0", "9"], "-", "+", ".", "k", "M", "!"],
    resolution: 1,
    padding: 14,
  });
}

export function formatNum(v: number): string {
  if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
  if (v >= 1e4) return Math.round(v / 1e3) + "k";
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "k";
  return String(Math.max(1, Math.round(v)));
}

/** Números de dano: branco normal, amarelo crítico (maior + pulo), vermelho no planeta. */
export class DamageNumbers {
  readonly layer = new Container();
  private vivos: Num[] = [];
  private livres: Num[] = [];
  max = 70;
  ativo = true;

  constructor() {
    instalarFonte();
  }

  add(x: number, y: number, v: number, tipo: "normal" | "crit" | "planeta"): void {
    if (!this.ativo) return;
    if (this.vivos.length >= this.max) {
      if (tipo === "normal") return;
      // críticos e dano no planeta substituem o número mais antigo
      const velho = this.vivos.shift()!;
      velho.t.visible = false;
      this.livres.push(velho);
    }
    const fonte = tipo === "crit" ? "dmgCrit" : "dmgFont";
    const i = this.livres.findIndex((x) => x.fonte === fonte);
    let n = i >= 0 ? this.livres.splice(i, 1)[0] : undefined;
    if (!n) {
      const t = new BitmapText({ text: "", style: { fontFamily: fonte, fontSize: 64 } });
      t.anchor.set(0.5);
      this.layer.addChild(t);
      n = { t, vy: 0, vx: 0, life: 0, max: 0, crit: false, base: 1, fonte };
    }
    n.t.visible = true;
    n.t.text = (tipo === "planeta" ? "-" : "") + formatNum(v) + (tipo === "crit" ? "!" : "");
    n.t.tint = tipo === "planeta" ? 0xff4a4a : 0xffffff;
    n.base = tipo === "crit" ? 0.62 : tipo === "planeta" ? 0.62 : 0.36 + Math.min(0.14, Math.log10(Math.max(1, v)) * 0.04);
    n.crit = tipo === "crit";
    n.t.rotation = tipo === "crit" ? (Math.random() - 0.5) * 0.25 : 0;
    n.t.scale.set(n.base * 1.6);
    n.t.x = x + (Math.random() - 0.5) * 34;
    n.t.y = y - 10;
    n.vx = (Math.random() - 0.5) * 60;
    n.vy = tipo === "crit" ? -230 : -170;
    n.max = n.life = tipo === "crit" ? 0.85 : tipo === "planeta" ? 0.9 : 0.65;
    n.t.alpha = 1;
    this.vivos.push(n);
  }

  update(dt: number): void {
    let j = 0;
    for (const n of this.vivos) {
      n.life -= dt;
      if (n.life <= 0) {
        n.t.visible = false;
        this.livres.push(n);
        continue;
      }
      const k = 1 - n.life / n.max;
      n.vy += 420 * dt;
      n.t.y += n.vy * dt;
      n.t.x += n.vx * dt;
      // "pop": nasce grande, encolhe rápido para o tamanho base; o crítico dá um segundo pulo
      const pop = k < 0.12 ? 1.6 - (k / 0.12) * 0.6 : 1;
      const extra = n.crit && k > 0.12 && k < 0.3 ? 1 + Math.sin(((k - 0.12) / 0.18) * Math.PI) * 0.25 : 1;
      n.t.scale.set(n.base * pop * extra);
      n.t.alpha = k > 0.65 ? 1 - (k - 0.65) / 0.35 : 1;
      this.vivos[j++] = n;
    }
    this.vivos.length = j;
  }

  limpar(): void {
    for (const n of this.vivos) {
      n.t.visible = false;
      this.livres.push(n);
    }
    this.vivos.length = 0;
  }
}
