import { SENTINELS } from "../data/sentinels";
import type { CardDef, SentinelId } from "../data/types";

/**
 * Ilustrações das cartas, desenhadas em Canvas2D (originais, sem assets externos).
 * Cada carta mapeia para um "motivo"; o resultado é cacheado como dataURL.
 */
const W = 300;
const H = 240;
const cache = new Map<string, string>();

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const css = (n: number, a = 1) => `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;

function rnd(seed: number): () => number {
  let s = seed || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

function fundo(c: Ctx, cor: number, seed: number, planeta = true): void {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#060a18");
  g.addColorStop(1, "#0d1a36");
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  const n = c.createRadialGradient(W * 0.6, H * 0.35, 0, W * 0.6, H * 0.35, W * 0.7);
  n.addColorStop(0, css(cor, 0.28));
  n.addColorStop(1, css(cor, 0));
  c.fillStyle = n;
  c.fillRect(0, 0, W, H);
  const r = rnd(seed);
  for (let i = 0; i < 60; i++) {
    c.fillStyle = `rgba(255,255,255,${0.2 + r() * 0.7})`;
    c.beginPath();
    c.arc(r() * W, r() * H, r() * 1.4 + 0.3, 0, TAU);
    c.fill();
  }
  if (planeta) {
    // curvatura de planeta no canto inferior
    const px = W * 0.15;
    const py = H * 1.55;
    const R = H * 0.95;
    const pg = c.createRadialGradient(px + 60, py - R + 40, 10, px, py, R);
    pg.addColorStop(0, "#6fd2ff");
    pg.addColorStop(0.25, "#2a7fd0");
    pg.addColorStop(0.7, "#0d2f66");
    pg.addColorStop(1, "#061633");
    c.fillStyle = pg;
    c.beginPath();
    c.arc(px, py, R, 0, TAU);
    c.fill();
    c.strokeStyle = "rgba(120,210,255,0.8)";
    c.lineWidth = 3;
    c.shadowColor = "#5fd0ff";
    c.shadowBlur = 18;
    c.beginPath();
    c.arc(px, py, R, Math.PI * 1.25, Math.PI * 1.95);
    c.stroke();
    c.shadowBlur = 0;
  }
}

function brilho(c: Ctx, x: number, y: number, r: number, cor: number, a = 1): void {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,${a})`);
  g.addColorStop(0.25, css(cor, 0.8 * a));
  g.addColorStop(1, css(cor, 0));
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fill();
}

function linhaBrilho(c: Ctx, pts: [number, number][], cor: number, w: number): void {
  c.lineCap = "round";
  c.lineJoin = "round";
  for (const [lw, col] of [[w * 3, css(cor, 0.25)], [w * 1.6, css(cor, 0.7)], [w * 0.6, "#ffffff"]] as const) {
    c.strokeStyle = col;
    c.lineWidth = lw;
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
  }
}

function torre(c: Ctx, x: number, y: number, ang: number, cor: number, s = 1): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  brilho(c, 0, 0, 46, cor, 0.5);
  c.fillStyle = "#1a2440";
  c.strokeStyle = "#dfe8ff";
  c.lineWidth = 3;
  c.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + Math.PI / 6;
    c[i ? "lineTo" : "moveTo"](Math.cos(a) * 24, Math.sin(a) * 24);
  }
  c.closePath();
  c.fill();
  c.stroke();
  c.rotate(ang);
  const g = c.createLinearGradient(0, -6, 0, 6);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(1, css(cor));
  c.fillStyle = g;
  c.fillRect(4, -6, 36, 12);
  c.fillStyle = css(cor);
  c.beginPath();
  c.arc(0, 0, 10, 0, TAU);
  c.fill();
  c.restore();
}

function inimigo(c: Ctx, x: number, y: number, r: number, ang: number, cor = 0xff6b4a): void {
  c.save();
  c.translate(x, y);
  c.rotate(ang);
  c.shadowColor = css(cor);
  c.shadowBlur = 12;
  c.fillStyle = css(cor);
  c.beginPath();
  c.moveTo(r, 0);
  c.lineTo(-r * 0.8, -r * 0.8);
  c.lineTo(-r * 0.4, 0);
  c.lineTo(-r * 0.8, r * 0.8);
  c.closePath();
  c.fill();
  c.restore();
}

export function desenharMissil(c: Ctx, x: number, y: number, ang: number, s: number, rastro: number): void {
  c.save();
  c.translate(x, y);
  c.rotate(ang);
  // rastro
  const tg = c.createLinearGradient(-rastro, 0, -8 * s, 0);
  tg.addColorStop(0, "rgba(255,200,120,0)");
  tg.addColorStop(1, "rgba(255,240,200,0.95)");
  c.strokeStyle = tg;
  c.lineWidth = 3 * s;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(-rastro, 0);
  c.lineTo(-8 * s, 0);
  c.stroke();
  brilho(c, -10 * s, 0, 14 * s, 0xff9a3c, 0.9);
  c.scale(s, s);
  c.fillStyle = "#52607a";
  c.beginPath();
  c.moveTo(-2, -3); c.lineTo(-10, -10); c.lineTo(-5, -10); c.lineTo(6, -3);
  c.moveTo(-2, 3); c.lineTo(-10, 10); c.lineTo(-5, 10); c.lineTo(6, 3);
  c.fill();
  const g = c.createLinearGradient(0, -5, 0, 5);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(1, "#8691a6");
  c.fillStyle = g;
  c.fillRect(-6, -4.5, 34, 9);
  c.beginPath();
  c.moveTo(28, -4.5); c.lineTo(42, 0); c.lineTo(28, 4.5);
  c.fill();
  c.fillStyle = "#ff6a3c";
  c.fillRect(22, -4.5, 3, 9);
  c.restore();
}

// ---------------------------------------------------------------- cenas das sentinelas

const CENAS: Record<SentinelId, (c: Ctx, cor: number) => void> = {
  canhao: (c, cor) => {
    torre(c, 80, 170, -0.75, cor);
    for (let i = 0; i < 4; i++) {
      const x = 120 + i * 38;
      const y = 130 - i * 34;
      linhaBrilho(c, [[x - 18, y + 16], [x, y]], cor, 3);
      brilho(c, x, y, 14, cor);
    }
    inimigo(c, 260, 30, 16, 2.4);
    brilho(c, 252, 36, 30, 0xffb050, 0.8);
  },
  laser: (c, cor) => {
    torre(c, 70, 175, -0.6, cor);
    linhaBrilho(c, [[100, 152], [235, 55]], cor, 7);
    inimigo(c, 245, 48, 20, 2.5, 0x9b7bff);
    brilho(c, 238, 54, 40, 0xff4d6d, 1);
  },
  trilho: (c, cor) => {
    torre(c, 60, 180, -0.55, cor);
    linhaBrilho(c, [[85, 165], [300, 30]], cor, 6);
    for (let i = 0; i < 3; i++) {
      c.strokeStyle = css(cor, 0.6 - i * 0.15);
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(140 + i * 55, 131 - i * 34, 16, 26, -0.55 + Math.PI / 2, 0, TAU);
      c.stroke();
    }
    inimigo(c, 170, 112, 14, 2.6);
    inimigo(c, 230, 75, 14, 2.6);
  },
  feixe: (c, cor) => {
    c.save();
    c.translate(70, 170);
    brilho(c, 0, 0, 50, cor, 0.6);
    c.fillStyle = "rgba(200,250,255,0.85)";
    c.strokeStyle = "#ffffff";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(0, -30); c.lineTo(26, 18); c.lineTo(-26, 18);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
    const alvos: [number, number][] = [[150, 120], [215, 150], [250, 70], [180, 40]];
    let px = 80;
    let py = 150;
    const r = rnd(9);
    for (const [x, y] of alvos) {
      const pts: [number, number][] = [[px, py]];
      for (let k = 1; k < 5; k++) pts.push([px + ((x - px) * k) / 5 + (r() - 0.5) * 18, py + ((y - py) * k) / 5 + (r() - 0.5) * 18]);
      pts.push([x, y]);
      linhaBrilho(c, pts, cor, 2.5);
      inimigo(c, x, y, 12, 2.4, 0xffd04a);
      brilho(c, x, y, 18, cor, 0.7);
      px = x;
      py = y;
    }
  },
  missil: (c) => {
    desenharMissil(c, 120, 120, -1.05, 1.6, 130);
    desenharMissil(c, 175, 95, -1.0, 1.4, 120);
    desenharMissil(c, 210, 150, -1.1, 1.3, 110);
    desenharMissil(c, 80, 70, -0.95, 1.1, 90);
  },
  gravidade: (c, cor) => {
    const cx = 175;
    const cy = 100;
    brilho(c, cx, cy, 110, cor, 0.5);
    c.lineWidth = 3;
    for (let k = 0; k < 5; k++) {
      c.strokeStyle = css(0xd8c8ff, 0.7 - k * 0.1);
      c.beginPath();
      for (let i = 0; i < 70; i++) {
        const t = i / 70;
        const a = k * (TAU / 5) + t * 6;
        const rr = 95 * (1 - t);
        c[i ? "lineTo" : "moveTo"](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.75);
      }
      c.stroke();
    }
    c.fillStyle = "#05010f";
    c.beginPath();
    c.arc(cx, cy, 20, 0, TAU);
    c.fill();
    inimigo(c, cx + 70, cy - 30, 10, 3.6, 0xffd04a);
    inimigo(c, cx - 60, cy + 40, 10, 0.4, 0xff6b4a);
  },
  campo: (c, cor) => {
    c.strokeStyle = css(cor, 0.9);
    c.lineWidth = 4;
    c.shadowColor = css(cor);
    c.shadowBlur = 20;
    for (const rr of [120, 160]) {
      c.beginPath();
      c.arc(W * 0.15, H * 1.55, H * 0.95 + rr - 90, Math.PI * 1.2, Math.PI * 1.95);
      c.stroke();
    }
    c.shadowBlur = 0;
    const r = rnd(4);
    for (let i = 0; i < 4; i++) {
      let x = 90 + i * 55;
      let y = 20 + r() * 20;
      const pts: [number, number][] = [[x, y]];
      for (let k = 0; k < 5; k++) {
        x += (r() - 0.5) * 30;
        y += 22;
        pts.push([x, y]);
      }
      linhaBrilho(c, pts, cor, 2);
    }
  },
  drone: (c, cor) => {
    const ds: [number, number, number][] = [[120, 140, 1.3], [190, 90, 1.1], [235, 160, 1], [90, 60, 0.9]];
    for (const [x, y, s] of ds) {
      c.save();
      c.translate(x, y);
      c.rotate(-0.6);
      c.scale(s, s);
      brilho(c, -22, 0, 20, cor, 0.9);
      c.fillStyle = "#dfe8ff";
      c.beginPath();
      c.moveTo(26, 0); c.lineTo(-14, -16); c.lineTo(-6, 0); c.lineTo(-14, 16);
      c.closePath();
      c.fill();
      c.fillStyle = css(cor);
      c.beginPath();
      c.arc(6, 0, 5, 0, TAU);
      c.fill();
      c.restore();
    }
    linhaBrilho(c, [[200, 80], [250, 40]], cor, 2);
    inimigo(c, 262, 32, 12, 2.3);
  },
  gelo: (c, cor) => {
    const cx = 170;
    const cy = 100;
    brilho(c, cx, cy, 100, cor, 0.6);
    c.strokeStyle = "#ffffff";
    c.lineCap = "round";
    c.shadowColor = css(cor);
    c.shadowBlur = 14;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      c.lineWidth = 6;
      c.beginPath();
      c.moveTo(cx, cy);
      c.lineTo(cx + Math.cos(a) * 70, cy + Math.sin(a) * 70);
      c.stroke();
      c.lineWidth = 4;
      for (const d of [30, 50]) {
        const bx = cx + Math.cos(a) * d;
        const by = cy + Math.sin(a) * d;
        for (const s of [-0.7, 0.7]) {
          c.beginPath();
          c.moveTo(bx, by);
          c.lineTo(bx + Math.cos(a + s) * 18, by + Math.sin(a + s) * 18);
          c.stroke();
        }
      }
    }
    c.shadowBlur = 0;
  },
};

// ---------------------------------------------------------------- motivos de efeito

const MOTIVOS: Record<string, [number, (c: Ctx, cor: number) => void]> = {
  dano: [0xff7a3c, (c, cor) => {
    brilho(c, 160, 100, 100, cor, 0.9);
    c.fillStyle = "#fff3d0";
    c.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      const r = i % 2 ? 26 : 80;
      c.lineTo(160 + Math.cos(a) * r, 100 + Math.sin(a) * r);
    }
    c.closePath();
    c.fill();
  }],
  cadencia: [0xffd25e, (c, cor) => {
    for (let i = 0; i < 6; i++) linhaBrilho(c, [[40 + i * 18, 200 - i * 6], [140 + i * 28, 40 + i * 10]], cor, 3);
  }],
  crit: [0xff4d6d, (c, cor) => {
    const x = 160;
    const y = 100;
    c.strokeStyle = css(cor);
    c.lineWidth = 6;
    c.shadowColor = css(cor);
    c.shadowBlur = 16;
    c.beginPath();
    c.arc(x, y, 60, 0, TAU);
    c.stroke();
    c.beginPath();
    c.arc(x, y, 30, 0, TAU);
    c.stroke();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU;
      c.beginPath();
      c.moveTo(x + Math.cos(a) * 40, y + Math.sin(a) * 40);
      c.lineTo(x + Math.cos(a) * 85, y + Math.sin(a) * 85);
      c.stroke();
    }
    c.shadowBlur = 0;
    inimigo(c, x, y, 16, 0.5, 0xffd04a);
  }],
  radar: [0x4fd6ff, (c, cor) => {
    for (let i = 1; i <= 4; i++) {
      c.strokeStyle = css(cor, 1 - i * 0.2);
      c.lineWidth = 3;
      c.beginPath();
      c.arc(90, 190, i * 45, Math.PI * 1.3, Math.PI * 2);
      c.stroke();
    }
    linhaBrilho(c, [[90, 190], [250, 60]], cor, 2);
    inimigo(c, 230, 75, 10, 2.4);
  }],
  velocidade: [0x7df9ff, (c, cor) => {
    for (let i = 0; i < 7; i++) linhaBrilho(c, [[20 + i * 10, 40 + i * 24], [200 + i * 12, 30 + i * 24]], cor, 2 + (i % 3));
  }],
  area: [0xffa040, (c, cor) => {
    brilho(c, 170, 100, 110, cor, 1);
    for (let i = 1; i <= 3; i++) {
      c.strokeStyle = css(0xffffff, 0.7 / i);
      c.lineWidth = 4;
      c.beginPath();
      c.arc(170, 100, 30 * i + 20, 0, TAU);
      c.stroke();
    }
  }],
  dados: [0xa46bff, (c, cor) => {
    c.save();
    c.translate(160, 100);
    c.rotate(-0.2);
    brilho(c, 0, 0, 90, cor, 0.7);
    c.fillStyle = "#1b1440";
    c.strokeStyle = css(cor);
    c.lineWidth = 4;
    c.fillRect(-50, -40, 100, 80);
    c.strokeRect(-50, -40, 100, 80);
    c.fillStyle = css(cor);
    for (let i = -3; i <= 3; i++) {
      c.fillRect(i * 13 - 3, -54, 6, 12);
      c.fillRect(i * 13 - 3, 42, 6, 12);
    }
    c.fillStyle = "#ffffff";
    c.font = "bold 34px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("XP", 0, 2);
    c.restore();
  }],
  vidro: [0x9fe8ff, (c, cor) => {
    brilho(c, 160, 100, 90, cor, 0.6);
    c.strokeStyle = "#ffffff";
    c.lineWidth = 3;
    const r = rnd(3);
    for (let i = 0; i < 10; i++) {
      const a = r() * TAU;
      c.beginPath();
      c.moveTo(160, 100);
      c.lineTo(160 + Math.cos(a) * (40 + r() * 70), 100 + Math.sin(a) * (40 + r() * 60));
      c.stroke();
    }
  }],
  planetaHp: [0x49e07a, (c, cor) => {
    brilho(c, 160, 110, 100, cor, 0.6);
    coracao(c, 160, 110, 60, cor);
  }],
  cura: [0x49e07a, (c, cor) => {
    brilho(c, 160, 100, 100, cor, 0.8);
    c.fillStyle = "#ffffff";
    c.fillRect(145, 50, 30, 100);
    c.fillRect(110, 85, 100, 30);
  }],
  escudo: [0x4fd6ff, (c, cor) => {
    c.save();
    c.translate(160, 100);
    brilho(c, 0, 0, 100, cor, 0.6);
    c.strokeStyle = css(cor);
    c.lineWidth = 2;
    for (let row = -3; row <= 3; row++) {
      for (let col = -3; col <= 3; col++) {
        const x = col * 26 + (row % 2 ? 13 : 0);
        const y = row * 22;
        if (x * x + y * y > 72 * 72) continue;
        c.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU + Math.PI / 6;
          c.lineTo(x + Math.cos(a) * 13, y + Math.sin(a) * 13);
        }
        c.closePath();
        c.stroke();
      }
    }
    c.lineWidth = 5;
    c.strokeStyle = "#ffffff";
    c.beginPath();
    c.arc(0, 0, 78, 0, TAU);
    c.stroke();
    c.restore();
  }],
  armadura: [0x9aa4b8, (c) => {
    c.save();
    c.translate(160, 100);
    const g = c.createLinearGradient(0, -70, 0, 70);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(1, "#5d6880");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(0, -75); c.lineTo(60, -50); c.lineTo(52, 30); c.lineTo(0, 75); c.lineTo(-52, 30); c.lineTo(-60, -50);
    c.closePath();
    c.fill();
    c.strokeStyle = "#2a3346";
    c.lineWidth = 5;
    c.stroke();
    c.restore();
  }],
  espinhos: [0x5ec8ff, (c, cor) => {
    brilho(c, 160, 110, 70, cor, 0.8);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      linhaBrilho(c, [[160 + Math.cos(a) * 40, 110 + Math.sin(a) * 40], [160 + Math.cos(a) * 95, 110 + Math.sin(a) * 85]], cor, 2.5);
    }
  }],
  estilhaco: [0xffd25e, (c, cor) => {
    linhaBrilho(c, [[30, 200], [150, 110]], cor, 4);
    brilho(c, 150, 110, 30, cor);
    for (const a of [-0.9, -0.45, 0, 0.45]) linhaBrilho(c, [[150, 110], [150 + Math.cos(a - 0.5) * 120, 110 + Math.sin(a - 0.5) * 120]], cor, 2);
  }],
  ricochete: [0x7df9ff, (c, cor) => {
    linhaBrilho(c, [[30, 200], [120, 60], [210, 170], [280, 40]], cor, 3);
    inimigo(c, 120, 60, 12, 0, 0xff6b4a);
    inimigo(c, 210, 170, 12, 0, 0xff6b4a);
  }],
  queima: [0xff7a2c, (c) => {
    for (let i = 0; i < 5; i++) {
      const x = 90 + i * 32;
      const h = 70 + (i % 2) * 40;
      const g = c.createLinearGradient(x, 190, x, 190 - h);
      g.addColorStop(0, "rgba(255,90,20,0.9)");
      g.addColorStop(0.6, "rgba(255,190,60,0.8)");
      g.addColorStop(1, "rgba(255,255,200,0)");
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(x - 24, 190);
      c.quadraticCurveTo(x - 10, 190 - h * 0.6, x, 190 - h);
      c.quadraticCurveTo(x + 10, 190 - h * 0.6, x + 24, 190);
      c.fill();
    }
  }],
  veneno: [0x7dff6b, (c, cor) => {
    const r = rnd(5);
    for (let i = 0; i < 14; i++) {
      const x = 60 + r() * 200;
      const y = 30 + r() * 170;
      const rr = 6 + r() * 20;
      brilho(c, x, y, rr * 1.8, cor, 0.5);
      c.strokeStyle = css(cor);
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, y, rr, 0, TAU);
      c.stroke();
    }
  }],
  explosao: [0xffa040, (c, cor) => {
    brilho(c, 150, 110, 120, cor, 1);
    const r = rnd(8);
    for (let i = 0; i < 18; i++) {
      const a = r() * TAU;
      linhaBrilho(c, [[150 + Math.cos(a) * 30, 110 + Math.sin(a) * 30], [150 + Math.cos(a) * (70 + r() * 60), 110 + Math.sin(a) * (60 + r() * 50)]], cor, 1.5);
    }
  }],
  perfurante: [0xb8f2ff, (c, cor) => {
    for (const x of [130, 190]) {
      c.fillStyle = "#6c7a96";
      c.fillRect(x, 50, 18, 120);
    }
    linhaBrilho(c, [[30, 110], [290, 110]], cor, 5);
  }],
  executor: [0xff4d5e, (c, cor) => {
    brilho(c, 160, 100, 90, cor, 0.7);
    c.strokeStyle = "#ffffff";
    c.lineWidth = 10;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(110, 50); c.lineTo(210, 150);
    c.moveTo(210, 50); c.lineTo(110, 150);
    c.stroke();
  }],
  ultimate: [0xffc23d, (c, cor) => {
    brilho(c, 160, 100, 110, cor, 1);
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.moveTo(175, 20); c.lineTo(115, 115); c.lineTo(155, 115); c.lineTo(140, 185); c.lineTo(210, 85); c.lineTo(168, 85);
    c.closePath();
    c.fill();
  }],
};

function coracao(c: Ctx, x: number, y: number, s: number, cor: number): void {
  c.save();
  c.translate(x, y);
  c.fillStyle = "#ffffff";
  c.shadowColor = css(cor);
  c.shadowBlur = 20;
  c.beginPath();
  c.moveTo(0, s * 0.8);
  c.bezierCurveTo(-s * 1.4, -s * 0.2, -s * 0.6, -s * 1.1, 0, -s * 0.4);
  c.bezierCurveTo(s * 0.6, -s * 1.1, s * 1.4, -s * 0.2, 0, s * 0.8);
  c.fill();
  c.restore();
}

const POR_ID: Record<string, string> = {
  dano_global_1: "dano", dano_global_2: "dano", dano_global_3: "dano",
  cadencia_1: "cadencia", cadencia_2: "cadencia",
  crit_1: "crit", crit_2: "crit", crit_3: "crit",
  alcance_1: "radar", velproj_1: "velocidade", area_1: "area", xp_1: "dados", vidro: "vidro",
  hp_1: "planetaHp", bastiao: "planetaHp", cura_1: "cura", regen_1: "cura",
  escudo_1: "escudo", escudo_2: "escudo", armadura_1: "armadura", espinhos_1: "espinhos",
  estilhaco: "estilhaco", ricochete: "ricochete", queima: "queima", veneno: "veneno",
  explosao: "explosao", perfurante: "perfurante", executor: "executor",
  ult_1: "ultimate", ult_2: "ultimate", ult_3: "ultimate",
};

function gerar(key: string, draw: (c: Ctx) => void): string {
  const hit = cache.get(key);
  if (hit) return hit;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const c = cv.getContext("2d")!;
  draw(c);
  const url = cv.toDataURL("image/jpeg", 0.85);
  cache.set(key, url);
  return url;
}

export function arteSentinela(id: SentinelId, evoluida = false): string {
  return gerar(`s_${id}_${evoluida}`, (c) => {
    const cor = SENTINELS[id].cor;
    fundo(c, evoluida ? 0xffc23d : cor, id.length * 31 + 7, true);
    CENAS[id](c, cor);
    if (evoluida) {
      c.strokeStyle = "rgba(255,210,90,0.9)";
      c.lineWidth = 8;
      c.strokeRect(4, 4, W - 8, H - 8);
    }
  });
}

export function arteCarta(card: CardDef): string {
  if (card.alvo) return arteSentinela(card.alvo, card.tipo === "evolucao");
  if (card.tipo === "passiva") {
    const sid = card.requisitos?.sentinela;
    const cor = sid ? SENTINELS[sid].cor : 0xb36bff;
    return gerar(`p_${card.id}`, (c) => {
      fundo(c, cor, 77, false);
      // cristal
      c.save();
      c.translate(160, 110);
      brilho(c, 0, 0, 100, cor, 0.8);
      const g = c.createLinearGradient(-40, -70, 40, 70);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(1, css(cor));
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(0, -80); c.lineTo(45, -20); c.lineTo(0, 80); c.lineTo(-45, -20);
      c.closePath();
      c.fill();
      c.strokeStyle = "rgba(255,255,255,0.7)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-45, -20); c.lineTo(45, -20); c.moveTo(0, -80); c.lineTo(0, 80);
      c.stroke();
      c.restore();
    });
  }
  const motivo = POR_ID[card.id] ?? "dano";
  const [cor, draw] = MOTIVOS[motivo];
  return gerar(`m_${motivo}`, (c) => {
    fundo(c, cor, motivo.length * 13 + 3, ["planetaHp", "escudo", "espinhos", "cura"].includes(motivo) === false);
    draw(c, cor);
  });
}
