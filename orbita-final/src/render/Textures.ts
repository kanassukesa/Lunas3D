import { Texture } from "pixi.js";
import { BOSSES } from "../data/bosses";
import { ENEMIES } from "../data/enemies";
import { SENTINEL_IDS } from "../data/sentinels";
import { spritesReais } from "./Sprites";

/**
 * Arte inicial: tudo desenhado em Canvas2D (formas geométricas + brilho) e convertido em textura.
 * Formas brancas/cinza são coloridas por `tint`, o que permite hit flash branco trocando o tint.
 * Para trocar pela arte final basta registrar sprites com os mesmos IDs.
 */
const cache = new Map<string, Texture>();

function canvas(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void): Texture {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const c = cv.getContext("2d")!;
  draw(c);
  return Texture.from(cv);
}

export function tex(id: string): Texture {
  const t = cache.get(id);
  if (!t) throw new Error(`Textura não registrada: ${id}`);
  return t;
}

function reg(id: string, t: Texture): void {
  cache.set(id, t);
}

function poly(c: CanvasRenderingContext2D, pts: [number, number][]): void {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
}

function regular(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, n: number, rot = 0): void {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  poly(c, pts);
}

/** Preenche a forma atual com gradiente branco→cinza, contorno claro e brilho externo. */
function shade(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, glow = 14): void {
  const g = c.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r * 1.1);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.6, "#c9c9c9");
  g.addColorStop(1, "#6e6e6e");
  c.save();
  c.shadowColor = "rgba(255,255,255,0.9)";
  c.shadowBlur = glow;
  c.fillStyle = g;
  c.fill();
  c.restore();
  c.lineWidth = Math.max(2, r * 0.08);
  c.strokeStyle = "rgba(255,255,255,0.95)";
  c.stroke();
}

function glowDot(size: number, hard = 0.15): Texture {
  return canvas(size, size, (c) => {
    const r = size / 2;
    const g = c.createRadialGradient(r, r, 0, r, r, r);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(hard, "rgba(255,255,255,0.9)");
    g.addColorStop(0.45, "rgba(255,255,255,0.25)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, size, size);
  });
}

function enemyShape(forma: string, R: number): Texture {
  const pad = 20;
  const S = R * 2 + pad * 2;
  return canvas(S, S, (c) => {
    const cx = S / 2;
    const cy = S / 2;
    const r = R;
    switch (forma) {
      case "tri":
        poly(c, [[cx + r, cy], [cx - r * 0.8, cy - r * 0.8], [cx - r * 0.4, cy], [cx - r * 0.8, cy + r * 0.8]]);
        break;
      case "hex":
        regular(c, cx, cy, r, 6, Math.PI / 6);
        break;
      case "diamante":
        poly(c, [[cx + r, cy], [cx, cy - r * 0.7], [cx - r, cy], [cx, cy + r * 0.7]]);
        break;
      case "quadrado":
        poly(c, [[cx + r, cy], [cx + r * 0.2, cy - r * 0.8], [cx - r * 0.8, cy - r * 0.8], [cx - r * 0.8, cy + r * 0.8], [cx + r * 0.2, cy + r * 0.8]]);
        break;
      case "seta":
        poly(c, [[cx + r * 1.1, cy], [cx - r * 0.9, cy - r * 0.6], [cx - r * 0.5, cy], [cx - r * 0.9, cy + r * 0.6]]);
        break;
      case "celula":
        c.beginPath();
        c.arc(cx, cy, r, 0, Math.PI * 2);
        break;
      case "penta":
        regular(c, cx, cy, r, 5, -Math.PI / 2);
        break;
      case "rocha": {
        const pts: [number, number][] = [];
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI * 2;
          const rr = r * (0.75 + ((i * 37) % 10) / 40);
          pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
        }
        poly(c, pts);
        break;
      }
      case "muro":
        poly(c, [[cx - r, cy - r * 0.3], [cx + r, cy - r * 0.3], [cx + r, cy + r * 0.3], [cx - r, cy + r * 0.3]]);
        break;
      default:
        c.beginPath();
        c.arc(cx, cy, r, 0, Math.PI * 2);
    }
    shade(c, cx, cy, r);
    // detalhes internos
    c.globalCompositeOperation = "source-atop";
    if (forma === "celula") {
      c.fillStyle = "rgba(60,60,60,0.45)";
      for (const [dx, dy, rr] of [[-0.3, -0.2, 0.3], [0.35, 0.1, 0.22], [-0.05, 0.4, 0.18]]) {
        c.beginPath();
        c.arc(cx + dx * r, cy + dy * r, rr * r, 0, Math.PI * 2);
        c.fill();
      }
    } else if (forma === "hex" || forma === "penta") {
      c.strokeStyle = "rgba(40,40,40,0.5)";
      c.lineWidth = 3;
      regular(c, cx, cy, r * 0.55, forma === "hex" ? 6 : 5, forma === "hex" ? Math.PI / 6 : -Math.PI / 2);
      c.stroke();
    } else if (forma === "muro") {
      c.strokeStyle = "rgba(40,40,40,0.45)";
      c.lineWidth = 3;
      for (let i = -2; i <= 2; i++) {
        c.beginPath();
        c.moveTo(cx + i * r * 0.4, cy - r * 0.3);
        c.lineTo(cx + i * r * 0.4 + r * 0.15, cy + r * 0.3);
        c.stroke();
      }
    } else if (forma === "rocha") {
      c.fillStyle = "rgba(60,60,60,0.4)";
      c.beginPath();
      c.arc(cx + r * 0.2, cy - r * 0.15, r * 0.22, 0, Math.PI * 2);
      c.arc(cx - r * 0.3, cy + r * 0.25, r * 0.15, 0, Math.PI * 2);
      c.fill();
    } else {
      // "cockpit" brilhante
      c.fillStyle = "rgba(255,255,255,0.95)";
      c.beginPath();
      c.arc(cx + r * 0.2, cy, r * 0.18, 0, Math.PI * 2);
      c.fill();
    }
    c.globalCompositeOperation = "source-over";
  });
}

function bossTex(forma: string, R: number, cor: string): Texture {
  const pad = 60;
  const S = R * 2 + pad * 2;
  return canvas(S, S, (c) => {
    const cx = S / 2;
    const cy = S / 2;
    c.save();
    c.shadowColor = cor;
    c.shadowBlur = 50;
    switch (forma) {
      case "planetaFogo": {
        const g = c.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
        g.addColorStop(0, "#fff3c0");
        g.addColorStop(0.35, "#ffaa3c");
        g.addColorStop(0.75, "#d1401a");
        g.addColorStop(1, "#5a1206");
        c.fillStyle = g;
        c.beginPath();
        c.arc(cx, cy, R, 0, Math.PI * 2);
        c.fill();
        c.restore();
        c.globalCompositeOperation = "source-atop";
        c.strokeStyle = "rgba(255,240,170,0.75)";
        c.lineWidth = 5;
        for (let i = 0; i < 7; i++) {
          c.beginPath();
          const a = i * 0.9;
          c.moveTo(cx + Math.cos(a) * R * 0.2, cy + Math.sin(a) * R * 0.2);
          c.quadraticCurveTo(cx + Math.cos(a + 0.6) * R * 0.7, cy + Math.sin(a + 0.6) * R * 0.5, cx + Math.cos(a + 1) * R, cy + Math.sin(a + 1) * R);
          c.stroke();
        }
        c.globalCompositeOperation = "source-over";
        return;
      }
      case "rainha": {
        regular(c, cx, cy, R, 6, 0);
        const g = c.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
        g.addColorStop(0, "#fff6c8");
        g.addColorStop(0.5, "#ffc93c");
        g.addColorStop(1, "#7a4a00");
        c.fillStyle = g;
        c.fill();
        c.restore();
        c.strokeStyle = "rgba(60,30,0,0.6)";
        c.lineWidth = 4;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
          regular(c, cx + Math.cos(a) * R * 0.5, cy + Math.sin(a) * R * 0.5, R * 0.26, 6, 0);
          c.stroke();
        }
        regular(c, cx, cy, R * 0.26, 6, 0);
        c.stroke();
        return;
      }
      case "construtor": {
        poly(c, [[cx - R, cy - R * 0.5], [cx - R * 0.5, cy - R], [cx + R * 0.5, cy - R], [cx + R, cy - R * 0.5], [cx + R, cy + R * 0.5], [cx + R * 0.5, cy + R], [cx - R * 0.5, cy + R], [cx - R, cy + R * 0.5]]);
        const g = c.createLinearGradient(cx, cy - R, cx, cy + R);
        g.addColorStop(0, "#e8f0ff");
        g.addColorStop(1, "#4a5a78");
        c.fillStyle = g;
        c.fill();
        c.restore();
        c.strokeStyle = "rgba(20,30,50,0.6)";
        c.lineWidth = 5;
        c.strokeRect(cx - R * 0.55, cy - R * 0.55, R * 1.1, R * 1.1);
        c.fillStyle = "#7df9ff";
        c.beginPath();
        c.arc(cx, cy, R * 0.22, 0, Math.PI * 2);
        c.fill();
        return;
      }
      case "eclipse": {
        c.fillStyle = "#c28bff";
        c.beginPath();
        c.arc(cx, cy, R, 0, Math.PI * 2);
        c.fill();
        c.restore();
        c.fillStyle = "#0a0614";
        c.beginPath();
        c.arc(cx + R * 0.12, cy - R * 0.05, R * 0.9, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = "rgba(240,220,255,0.9)";
        c.lineWidth = 4;
        c.beginPath();
        c.arc(cx, cy, R, 0, Math.PI * 2);
        c.stroke();
        return;
      }
      case "singularidade": {
        const g = c.createRadialGradient(cx, cy, 0, cx, cy, R);
        g.addColorStop(0, "#000000");
        g.addColorStop(0.55, "#05010f");
        g.addColorStop(0.8, "#7a5cff");
        g.addColorStop(1, "rgba(122,92,255,0)");
        c.fillStyle = g;
        c.beginPath();
        c.arc(cx, cy, R, 0, Math.PI * 2);
        c.fill();
        c.restore();
        c.strokeStyle = "rgba(210,190,255,0.8)";
        c.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
          c.beginPath();
          c.ellipse(cx, cy, R * 1.1, R * 0.35, i * 1.05, 0, Math.PI * 2);
          c.stroke();
        }
        return;
      }
    }
    c.restore();
  });
}

function sentinelTex(id: string): Texture {
  const S = 96;
  return canvas(S, S, (c) => {
    const cx = S / 2;
    const cy = S / 2;
    // base hexagonal
    regular(c, cx, cy, 26, 6, Math.PI / 6);
    c.fillStyle = "#1a2236";
    c.fill();
    c.lineWidth = 3;
    c.strokeStyle = "#ffffff";
    c.stroke();
    // cano / forma por tipo (apontando para +x)
    c.fillStyle = "#ffffff";
    c.shadowColor = "#ffffff";
    c.shadowBlur = 10;
    switch (id) {
      case "canhao":
        c.fillRect(cx, cy - 5, 34, 10);
        break;
      case "laser":
        poly(c, [[cx + 40, cy], [cx + 4, cy - 9], [cx + 4, cy + 9]]);
        c.fill();
        break;
      case "trilho":
        c.fillRect(cx, cy - 10, 40, 5);
        c.fillRect(cx, cy + 5, 40, 5);
        break;
      case "feixe":
        regular(c, cx + 14, cy, 14, 3, 0);
        c.fill();
        break;
      case "missil":
        for (const dy of [-10, 0, 10]) c.fillRect(cx + 2, cy + dy - 3, 24, 6);
        break;
      case "gravidade":
        c.beginPath();
        c.arc(cx, cy, 14, 0, Math.PI * 2);
        c.lineWidth = 5;
        c.strokeStyle = "#ffffff";
        c.stroke();
        break;
      case "campo":
        c.beginPath();
        c.moveTo(cx - 6, cy - 16);
        c.lineTo(cx + 6, cy - 2);
        c.lineTo(cx - 2, cy + 2);
        c.lineTo(cx + 8, cy + 18);
        c.lineWidth = 4;
        c.strokeStyle = "#ffffff";
        c.stroke();
        break;
      case "drone":
        for (const [dx, dy] of [[10, -10], [10, 10], [-8, 0]]) {
          c.beginPath();
          c.arc(cx + dx, cy + dy, 6, 0, Math.PI * 2);
          c.fill();
        }
        break;
      case "gelo":
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          c.save();
          c.translate(cx, cy);
          c.rotate(a);
          c.fillRect(0, -2, 20, 4);
          c.restore();
        }
        c.fillRect(cx, cy - 4, 30, 8);
        break;
    }
  });
}

function planetTex(R: number): { base: Texture; terra: Texture; sombra: Texture; atmosfera: Texture } {
  const S = R * 2;
  const base = canvas(S, S, (c) => {
    const g = c.createRadialGradient(R * 0.7, R * 0.6, R * 0.1, R, R, R);
    g.addColorStop(0, "#5fd0ff");
    g.addColorStop(0.5, "#1f6fc8");
    g.addColorStop(1, "#0a2350");
    c.fillStyle = g;
    c.beginPath();
    c.arc(R, R, R, 0, Math.PI * 2);
    c.fill();
  });
  // continentes (textura larga que desliza para simular rotação)
  const terra = canvas(S * 2, S, (c) => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 2; k++) {
      for (let i = 0; i < 9; i++) {
        const x = rnd() * S + k * S;
        const y = R * 0.3 + rnd() * R * 1.4;
        const r = R * (0.15 + rnd() * 0.3);
        c.fillStyle = i % 3 === 0 ? "#d9c27a" : "#3fbf6a";
        c.beginPath();
        for (let j = 0; j < 10; j++) {
          const a = (j / 10) * Math.PI * 2;
          const rr = r * (0.7 + rnd() * 0.5);
          const px = x + Math.cos(a) * rr;
          const py = y + Math.sin(a) * rr * 0.7;
          if (j) c.lineTo(px, py);
          else c.moveTo(px, py);
        }
        c.closePath();
        c.fill();
      }
      seed = 7; // repete o padrão para emendar sem costura
    }
    c.fillStyle = "rgba(255,255,255,0.55)";
    for (let i = 0; i < 14; i++) {
      c.beginPath();
      c.ellipse(rnd() * S * 2, rnd() * S, R * 0.25, R * 0.05, 0, 0, Math.PI * 2);
      c.fill();
    }
  });
  const sombra = canvas(S, S, (c) => {
    const g = c.createRadialGradient(R * 0.6, R * 0.55, R * 0.3, R * 0.9, R * 0.9, R * 1.15);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.65, "rgba(0,0,20,0.25)");
    g.addColorStop(1, "rgba(0,0,20,0.85)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(R, R, R, 0, Math.PI * 2);
    c.fill();
  });
  const A = R * 1.5;
  const atmosfera = canvas(A * 2, A * 2, (c) => {
    const g = c.createRadialGradient(A, A, R * 0.9, A, A, A);
    g.addColorStop(0, "rgba(120,210,255,0.7)");
    g.addColorStop(0.3, "rgba(80,170,255,0.25)");
    g.addColorStop(1, "rgba(80,170,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, A * 2, A * 2);
  });
  return { base, terra, sombra, atmosfera };
}

function shieldTex(R: number): Texture {
  const S = R * 2 + 8;
  return canvas(S, S, (c) => {
    const cx = S / 2;
    c.save();
    c.beginPath();
    c.arc(cx, cx, R, 0, Math.PI * 2);
    c.clip();
    const g = c.createRadialGradient(cx, cx, R * 0.6, cx, cx, R);
    g.addColorStop(0, "rgba(80,190,255,0)");
    g.addColorStop(1, "rgba(80,190,255,0.35)");
    c.fillStyle = g;
    c.fillRect(0, 0, S, S);
    c.strokeStyle = "rgba(140,220,255,0.55)";
    c.lineWidth = 1.5;
    const h = 16;
    const w = Math.sqrt(3) * h;
    for (let row = -1; row < S / (h * 1.5) + 1; row++) {
      for (let col = -1; col < S / w + 1; col++) {
        const x = col * w + (row % 2 ? w / 2 : 0);
        const y = row * h * 1.5;
        regular(c, x, y, h, 6, Math.PI / 6);
        c.stroke();
      }
    }
    c.restore();
    c.strokeStyle = "rgba(160,230,255,0.9)";
    c.lineWidth = 3;
    c.beginPath();
    c.arc(cx, cx, R - 1.5, 0, Math.PI * 2);
    c.stroke();
  });
}

function starsTex(w: number, h: number, n: number, maxR: number, seed: number): Texture {
  return canvas(w, h, (c) => {
    let s = seed;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const r = 0.4 + rnd() * maxR;
      const a = 0.3 + rnd() * 0.7;
      const tint = rnd();
      c.fillStyle = tint < 0.15 ? `rgba(255,210,170,${a})` : tint < 0.3 ? `rgba(170,210,255,${a})` : `rgba(255,255,255,${a})`;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    }
  });
}

function nebulaTex(w: number, h: number): Texture {
  return canvas(w, h, (c) => {
    const bg = c.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#05070f");
    bg.addColorStop(1, "#0b1630");
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);
    const blobs: [number, number, number, string][] = [
      [0.2, 0.25, 0.55, "rgba(40,180,170,0.16)"],
      [0.8, 0.15, 0.5, "rgba(140,70,220,0.16)"],
      [0.65, 0.55, 0.6, "rgba(60,90,220,0.12)"],
      [0.15, 0.75, 0.5, "rgba(160,60,200,0.1)"],
      [0.9, 0.85, 0.45, "rgba(40,160,200,0.1)"],
    ];
    for (const [x, y, r, col] of blobs) {
      const g = c.createRadialGradient(x * w, y * h, 0, x * w, y * h, r * w);
      g.addColorStop(0, col);
      g.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
    }
  });
}

export function initTextures(): void {
  if (cache.size) return;
  reg("glow", glowDot(64));
  reg("glowSoft", glowDot(128, 0.02));
  reg("spark", canvas(32, 8, (c) => {
    const g = c.createLinearGradient(0, 0, 32, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(1, "rgba(255,255,255,1)");
    c.fillStyle = g;
    c.fillRect(0, 2, 32, 4);
  }));
  reg("bolt", canvas(64, 20, (c) => {
    const g = c.createLinearGradient(0, 0, 64, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.7, "rgba(255,255,255,0.7)");
    g.addColorStop(1, "rgba(255,255,255,1)");
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(32, 10, 32, 7, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#fff";
    c.beginPath();
    c.arc(54, 10, 6, 0, Math.PI * 2);
    c.fill();
  }));
  // míssil de verdade (apontando para +x): ogiva, corpo, faixa, aletas e bocal
  reg("missil", canvas(72, 28, (c) => {
    const cy = 14;
    // aletas traseiras
    c.fillStyle = "#4a5568";
    poly(c, [[14, cy - 3], [4, cy - 12], [9, cy - 12], [22, cy - 3]]);
    c.fill();
    poly(c, [[14, cy + 3], [4, cy + 12], [9, cy + 12], [22, cy + 3]]);
    c.fill();
    // corpo
    const g = c.createLinearGradient(0, cy - 5, 0, cy + 5);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.45, "#d7dde8");
    g.addColorStop(1, "#7d8799");
    c.fillStyle = g;
    c.fillRect(10, cy - 4.5, 40, 9);
    // ogiva
    poly(c, [[50, cy - 4.5], [66, cy], [50, cy + 4.5]]);
    c.fill();
    c.fillStyle = "#ff6a3c";
    poly(c, [[58, cy - 2.4], [66, cy], [58, cy + 2.4]]);
    c.fill();
    // faixas
    c.fillStyle = "#ff6a3c";
    c.fillRect(42, cy - 4.5, 3, 9);
    c.fillStyle = "#2d3748";
    c.fillRect(24, cy - 4.5, 2, 9);
    // aletas do meio
    c.fillStyle = "#64748b";
    poly(c, [[30, cy - 4], [36, cy - 8], [40, cy - 4]]);
    c.fill();
    poly(c, [[30, cy + 4], [36, cy + 8], [40, cy + 4]]);
    c.fill();
    // bocal
    c.fillStyle = "#1f2937";
    c.fillRect(7, cy - 3.5, 4, 7);
  }));
  // chama do motor
  reg("chama", canvas(48, 24, (c) => {
    const g = c.createRadialGradient(40, 12, 1, 34, 12, 30);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.2, "rgba(255,230,150,0.95)");
    g.addColorStop(0.55, "rgba(255,140,40,0.5)");
    g.addColorStop(1, "rgba(255,80,20,0)");
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(28, 12, 22, 8, 0, 0, Math.PI * 2);
    c.fill();
  }));
  reg("anel", canvas(128, 128, (c) => {
    c.strokeStyle = "rgba(255,255,255,1)";
    c.lineWidth = 6;
    c.shadowColor = "#fff";
    c.shadowBlur = 10;
    c.beginPath();
    c.arc(64, 64, 54, 0, Math.PI * 2);
    c.stroke();
  }));
  reg("anelFino", canvas(256, 256, (c) => {
    c.strokeStyle = "rgba(255,255,255,0.9)";
    c.lineWidth = 3;
    c.beginPath();
    c.arc(128, 128, 124, 0, Math.PI * 2);
    c.stroke();
  }));
  reg("vortice", canvas(256, 256, (c) => {
    const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(10,0,30,0.95)");
    g.addColorStop(0.35, "rgba(120,80,255,0.45)");
    g.addColorStop(1, "rgba(120,80,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 256);
    c.strokeStyle = "rgba(210,190,255,0.6)";
    c.lineWidth = 3;
    for (let k = 0; k < 4; k++) {
      c.beginPath();
      for (let i = 0; i < 60; i++) {
        const t = i / 60;
        const a = k * (Math.PI / 2) + t * 5;
        const r = 120 * (1 - t);
        const x = 128 + Math.cos(a) * r;
        const y = 128 + Math.sin(a) * r;
        if (i) c.lineTo(x, y);
        else c.moveTo(x, y);
      }
      c.stroke();
    }
  }));
  reg("escudoHit", canvas(128, 64, (c) => {
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.4, "rgba(150,230,255,0.6)");
    g.addColorStop(1, "rgba(80,190,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 64);
  }));
  reg("drone", canvas(40, 40, (c) => {
    poly(c, [[36, 20], [8, 6], [14, 20], [8, 34]]);
    c.fillStyle = "#fff";
    c.shadowColor = "#fff";
    c.shadowBlur = 8;
    c.fill();
  }));
  reg("pixel", canvas(4, 4, (c) => {
    c.fillStyle = "#fff";
    c.fillRect(0, 0, 4, 4);
  }));

  for (const def of Object.values(ENEMIES)) {
    const key = `inimigo_${def.forma}_${def.raio}`;
    if (!cache.has(key)) reg(key, enemyShape(def.forma, def.raio));
  }
  for (const b of Object.values(BOSSES)) reg(`chefe_${b.id}`, bossTex(b.forma, b.raio, "#" + b.cor.toString(16).padStart(6, "0")));
  for (const id of SENTINEL_IDS) reg(`sentinela_${id}`, sentinelTex(id));
  const p = planetTex(110);
  reg("planeta", p.base);
  reg("planetaTerra", p.terra);
  reg("planetaSombra", p.sombra);
  reg("atmosfera", p.atmosfera);
  reg("escudo", shieldTex(150));
  reg("estrelas1", starsTex(540, 960, 260, 0.9, 11));
  reg("estrelas2", starsTex(540, 960, 90, 1.6, 23));
  reg("estrelas3", starsTex(540, 960, 30, 2.4, 37));
  reg("nebulosa", nebulaTex(540, 960));
  // arte final substitui a procedural com o mesmo ID
  for (const [id, t] of spritesReais) reg(id, t);
}

export function enemyTexKey(forma: string, raio: number): string {
  return `inimigo_${forma}_${raio}`;
}
