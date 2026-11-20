import { BitmapFont, BitmapText, Container } from "pixi.js";

interface Num {
  t: BitmapText;
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
  BitmapFont.install({
    name: "dmgFont",
    style: {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: 64,
      fontWeight: "900",
      fill: "#ffffff",
      stroke: { color: "#000000", width: 8, join: "round" },
    },
    chars: [["0", "9"], "-", "+", ".", "k", "M"],
    resolution: 1,
    padding: 6,
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
    let n = this.livres.pop();
    if (!n) {
      const t = new BitmapText({ text: "", style: { fontFamily: "dmgFont", fontSize: 64 } });
      t.anchor.set(0.5);
      this.layer.addChild(t);
      n = { t, vy: 0, life: 0, max: 0, crit: false, base: 1 };
    }
    n.t.visible = true;
    n.t.text = (tipo === "planeta" ? "-" : "") + formatNum(v);
    n.t.tint = tipo === "crit" ? 0xffd23c : tipo === "planeta" ? 0xff4040 : 0xffffff;
    n.base = tipo === "crit" ? 0.7 : tipo === "planeta" ? 0.75 : 0.45;
    n.crit = tipo === "crit";
    n.t.scale.set(n.base);
    n.t.x = x + (Math.random() - 0.5) * 30;
    n.t.y = y;
    n.vy = tipo === "crit" ? -260 : -150;
    n.max = n.life = tipo === "planeta" ? 0.9 : 0.7;
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
      n.vy += 380 * dt;
      n.t.y += n.vy * dt;
      if (n.crit) n.t.scale.set(n.base * (k < 0.15 ? 1 + k * 4 : 1.6 - Math.min(0.6, (k - 0.15) * 2)));
      n.t.alpha = k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1;
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
