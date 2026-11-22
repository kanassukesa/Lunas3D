import type { UltId } from "../data/comandante";

/**
 * Prévia animada da ultimate (canvas 2D leve, em loop de ~3,4 s): um planetinha embaixo,
 * inimigos descendo e, no meio do ciclo, o efeito da ultimate acertando todos eles.
 * Para sozinha quando o canvas sai da tela.
 */
const W = 320;
const H = 180;
const CICLO = 3.4;
const INICIO = 0.7;
const FIM = 2.7;
const PL = { x: W / 2, y: H + 34, r: 62 };

interface Inim { x: number; y: number; v: number; morto: number; ang: number }

export function criarPreviaUlt(ult: UltId, cor: string): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = W * dpr;
  cv.height = H * dpr;
  cv.className = "previa-ult";
  const c = cv.getContext("2d")!;
  c.scale(dpr, dpr);
  const estrelas = Array.from({ length: 40 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.2 + 0.3 }));
  let inim: Inim[] = [];
  const novos = () => {
    // duas fileiras já dentro da tela, descendo devagar em direção ao planeta
    inim = Array.from({ length: 10 }, (_, i) => ({ x: 28 + (i % 5) * 66 + Math.random() * 14, y: 14 + Math.floor(i / 5) * 40 + Math.random() * 14, v: 9 + Math.random() * 7, morto: 0, ang: 0 }));
  };
  novos();
  let ultimoCiclo = -1;
  const t0 = performance.now();

  const quadro = (agora: number) => {
    if (!cv.isConnected && agora - t0 > 500) return;
    const tt = (agora - t0) / 1000;
    const ciclo = Math.floor(tt / CICLO);
    const t = tt % CICLO;
    if (ciclo !== ultimoCiclo) { ultimoCiclo = ciclo; novos(); }
    const ativo = t >= INICIO && t <= FIM;
    const p = ativo ? (t - INICIO) / (FIM - INICIO) : t > FIM ? 1 : 0;

    // fundo
    c.fillStyle = "#050a18";
    c.fillRect(0, 0, W, H);
    for (const s of estrelas) { c.fillStyle = "rgba(200,220,255,0.6)"; c.fillRect(s.x, s.y, s.r, s.r); }

    // efeito antes dos inimigos (fundo do efeito)
    if (ativo) efeito(c, ult, p, inim, t, true);

    // inimigos
    const congelado = ult === "gelo" && ativo;
    for (const e of inim) {
      if (e.morto >= 1) continue;
      if (!congelado && !e.morto) {
        e.y += e.v * (1 / 60);
        if (ult === "gravidade" && ativo) puxar(e, W / 2, 70, 1.6);
        if (ult === "vazio" && ativo) puxar(e, W / 2, 64, 2.4);
      }
      if (e.morto) e.morto = Math.min(1, e.morto + 1 / 25);
      desenharInimigo(c, e, congelado);
    }

    // planeta + escudo
    const g = c.createRadialGradient(PL.x - 18, PL.y - 22, 8, PL.x, PL.y, PL.r);
    g.addColorStop(0, "#5fb4ff");
    g.addColorStop(0.6, "#1d5fb0");
    g.addColorStop(1, "#0a2350");
    c.fillStyle = g;
    c.beginPath(); c.arc(PL.x, PL.y, PL.r, 0, Math.PI * 2); c.fill();
    const escudoForte = (ult === "cristal" || ult === "campo") && ativo;
    c.strokeStyle = escudoForte ? "rgba(255,180,240,0.95)" : "rgba(110,210,255,0.55)";
    c.lineWidth = escudoForte ? 3 : 1.5;
    c.beginPath(); c.arc(PL.x, PL.y, PL.r + 14, 0, Math.PI * 2); c.stroke();

    // efeito por cima
    if (ativo) efeito(c, ult, p, inim, t, false);

    // aviso de ativação
    if (t >= INICIO - 0.05 && t < INICIO + 0.35) {
      const a = 1 - (t - INICIO + 0.05) / 0.4;
      c.fillStyle = `rgba(255,255,255,${0.35 * a})`;
      c.fillRect(0, 0, W, H);
      c.fillStyle = cor;
      c.font = "900 15px system-ui, sans-serif";
      c.textAlign = "center";
      c.globalAlpha = Math.max(0, a);
      c.fillText("ULTIMATE!", W / 2, 22);
      c.globalAlpha = 1;
    }
    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
  return cv;
}

function puxar(e: Inim, x: number, y: number, k: number): void {
  e.x += (x - e.x) * 0.02 * k;
  e.y += (y - e.y) * 0.02 * k;
  e.ang += 0.15 * k;
}

function desenharInimigo(c: CanvasRenderingContext2D, e: Inim, gelo: boolean): void {
  c.save();
  c.translate(e.x, e.y);
  c.rotate(Math.PI / 2 + e.ang);
  c.globalAlpha = 1 - e.morto;
  c.scale(1 + e.morto, 1 + e.morto);
  c.fillStyle = gelo ? "#a8e8ff" : "#ff5a4a";
  c.beginPath(); c.moveTo(9, 0); c.lineTo(-7, -6); c.lineTo(-4, 0); c.lineTo(-7, 6); c.closePath(); c.fill();
  c.restore();
}

/** Marca o inimigo como atingido (some em fade). */
function matar(e: Inim): void {
  if (!e.morto) e.morto = 0.01;
}

function brilho(c: CanvasRenderingContext2D, x: number, y: number, r: number, cor: string, a = 1): void {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,${a})`);
  g.addColorStop(0.35, cor);
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g;
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
}

function linha(c: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, cor: string, w: number): void {
  c.strokeStyle = cor;
  c.lineWidth = w;
  c.shadowColor = cor;
  c.shadowBlur = 10;
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  c.shadowBlur = 0;
}

function efeito(c: CanvasRenderingContext2D, ult: UltId, p: number, inim: Inim[], t: number, fundo: boolean): void {
  const vivos = inim.filter((e) => !e.morto && e.y > -5);
  switch (ult) {
    case "canhao": {
      if (fundo) return;
      // explosões em sequência sobre os inimigos, com o rastro saindo das sentinelas
      const i = Math.floor(p * 12);
      const e = inim[i % inim.length];
      if (e && e.y > -5) {
        linha(c, PL.x + (i % 2 ? -40 : 40), PL.y - PL.r, e.x, e.y, "rgba(255,210,150,0.8)", 2);
        brilho(c, e.x, e.y, 26, "rgba(255,140,40,0.8)");
        matar(e);
      }
      break;
    }
    case "laser": {
      if (fundo) return;
      const y = 4 + p * (H - 80);
      linha(c, 0, y, W, y, "rgba(255,77,109,0.95)", 9);
      for (const e of vivos) if (Math.abs(e.y - y) < 14) matar(e);
      break;
    }
    case "trilho": {
      if (fundo) return;
      const n = Math.floor(p * 8);
      for (let k = 0; k <= n; k++) {
        const y = 15 + ((k * 37) % 110);
        const a = Math.max(0, 1 - (p * 8 - k));
        if (a <= 0) continue;
        linha(c, k % 2 ? W : 0, y, k % 2 ? 0 : W, y + 8, `rgba(184,242,255,${a})`, 5);
        for (const e of vivos) if (Math.abs(e.y - y) < 16) matar(e);
      }
      break;
    }
    case "feixe": {
      if (fundo) return;
      if (Math.floor(t * 10) % 2) for (const e of vivos.slice(0, 3)) {
        c.strokeStyle = "#7df9ff"; c.lineWidth = 2; c.shadowColor = "#7df9ff"; c.shadowBlur = 10;
        c.beginPath(); c.moveTo(e.x + 10, 0);
        for (let k = 1; k <= 5; k++) c.lineTo(e.x + (Math.random() - 0.5) * 18, (e.y * k) / 5);
        c.stroke(); c.shadowBlur = 0;
        matar(e);
      }
      break;
    }
    case "missil": {
      if (fundo) return;
      for (let k = 0; k < 8; k++) {
        const e = inim[k % inim.length];
        const q = Math.min(1, Math.max(0, p * 2 - k * 0.1));
        if (q <= 0 || q >= 1) { if (q >= 1 && e) { brilho(c, e.x, e.y, 18, "rgba(255,200,80,0.7)"); matar(e); } continue; }
        const ox = PL.x + (k % 2 ? -50 : 50);
        const oy = PL.y - PL.r;
        const x = ox + (e.x - ox) * q + Math.sin(q * Math.PI) * (k % 2 ? -40 : 40);
        const y = oy + (e.y - oy) * q;
        brilho(c, x, y, 7, "rgba(255,210,94,0.9)");
      }
      break;
    }
    case "gravidade":
    case "vazio": {
      const vz = ult === "vazio";
      const x = W / 2;
      const y = vz ? 64 : 70;
      const r = (vz ? 70 : 52) * Math.min(1, p * 3);
      if (fundo) {
        const g = c.createRadialGradient(x, y, 0, x, y, r * 1.6);
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(0.45, vz ? "rgba(120,40,200,0.85)" : "rgba(166,107,255,0.6)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = g;
        c.beginPath(); c.arc(x, y, r * 1.6, 0, Math.PI * 2); c.fill();
        return;
      }
      c.strokeStyle = vz ? "#d28bff" : "#a66bff";
      c.lineWidth = 2;
      for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(x, y, r * (0.4 + k * 0.25), t * 4 + k, t * 4 + k + 4); c.stroke(); }
      for (const e of vivos) if (Math.hypot(e.x - x, e.y - y) < 18) matar(e);
      if (vz && p > 0.9) { c.fillStyle = `rgba(230,200,255,${(p - 0.9) * 8})`; c.fillRect(0, 0, W, H); for (const e of vivos) matar(e); }
      break;
    }
    case "campo": {
      if (fundo) return;
      const r = p * 260;
      c.strokeStyle = `rgba(94,255,168,${1 - p})`;
      c.lineWidth = 8 * (1 - p) + 2;
      c.shadowColor = "#5effa8"; c.shadowBlur = 16;
      c.beginPath(); c.arc(PL.x, PL.y, r, 0, Math.PI * 2); c.stroke();
      c.shadowBlur = 0;
      for (const e of vivos) if (Math.hypot(e.x - PL.x, e.y - PL.y) < r) matar(e);
      break;
    }
    case "drone": {
      if (fundo) return;
      for (let k = 0; k < 8; k++) {
        const a = t * 3 + (k / 8) * Math.PI * 2;
        const x = W / 2 + Math.cos(a) * 110;
        const y = 75 + Math.sin(a) * 45;
        brilho(c, x, y, 6, "rgba(157,255,94,0.9)");
        const e = vivos[k % Math.max(1, vivos.length)];
        if (e && Math.floor(t * 6 + k) % 3 === 0) { linha(c, x, y, e.x, e.y, "rgba(157,255,94,0.8)", 1.5); if (Math.random() < 0.08) matar(e); }
      }
      break;
    }
    case "gelo": {
      if (fundo) { c.fillStyle = `rgba(150,220,255,${0.25 * Math.min(1, p * 4)})`; c.fillRect(0, 0, W, H); return; }
      if (p > 0.75) for (const e of vivos) { brilho(c, e.x, e.y, 14, "rgba(160,230,255,0.7)"); matar(e); }
      break;
    }
    case "supernova": {
      if (fundo) return;
      for (let k = 0; k < 3; k++) {
        const q = p * 3 - k;
        if (q <= 0 || q >= 1) continue;
        const r = q * 340;
        c.strokeStyle = `rgba(255,194,61,${1 - q})`;
        c.lineWidth = 16 * (1 - q) + 3;
        c.shadowColor = "#ffc23d"; c.shadowBlur = 20;
        c.beginPath(); c.arc(PL.x, PL.y, r, 0, Math.PI * 2); c.stroke();
        c.shadowBlur = 0;
        for (const e of vivos) if (Math.hypot(e.x - PL.x, e.y - PL.y) < r) matar(e);
      }
      break;
    }
    case "cristal": {
      if (fundo) return;
      for (let k = 0; k < 14; k++) {
        const q = (p * 3 + k * 0.13) % 1;
        const e = inim[k % inim.length];
        const ox = PL.x + Math.cos(k) * PL.r;
        const oy = PL.y - Math.abs(Math.sin(k)) * PL.r;
        const x = ox + (e.x - ox) * q;
        const y = oy + (e.y - oy) * q;
        c.fillStyle = "rgba(255,158,232,0.95)";
        c.save(); c.translate(x, y); c.rotate(Math.atan2(e.y - oy, e.x - ox));
        c.beginPath(); c.moveTo(7, 0); c.lineTo(0, -3); c.lineTo(-7, 0); c.lineTo(0, 3); c.closePath(); c.fill();
        c.restore();
        if (q > 0.92) matar(e);
      }
      break;
    }
  }
}
