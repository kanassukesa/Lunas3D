import { BALANCE } from "../data/balance";
import { BOSSES } from "../data/bosses";
import type { Battle } from "./Battle";
import type { Enemy } from "./types";

/** Cria o chefe no topo da tela. */
export function spawnBoss(b: Battle, id: string, hpMult = 1): Enemy {
  const def = BOSSES[id];
  const e = b.spawnEnemy("tanque", b.planet.x, b.vis.top - def.raio - 40);
  const mult = b.spawner.multCheio() * (b.cfg.dificil ? BALANCE.dificil.hpMult : 1) * (b.cfg.daily?.hpInimigoMult ?? 1) * hpMult;
  e.hpMax = e.hp = Math.round(def.hp * mult);
  e.r = def.raio;
  e.vel = 70;
  e.dano = def.dano;
  e.xp = 40;
  e.boss = {
    def, fase: 1, t1: 2, t2: 3, t3: 0, ang: 0, invisivel: 0, campo: 0, chegou: false,
    alvoY: Math.max(b.vis.top + 280, 360),
  };
  b.boss = e;
  b.fx.push({ t: "tremor", força: 12 });
  b.fx.push({ t: "som", id: "chefe" });
  return e;
}

function danoTiro(b: Battle, e: Enemy): number {
  return e.boss!.def.danoTiro * Math.sqrt(b.multDificuldade()) * (b.cfg.dificil ? BALANCE.dificil.danoMult : 1);
}

function leque(b: Battle, e: Enemy, n: number, abertura: number, vel: number, cor: number): void {
  const base = Math.atan2(b.planet.y - e.y, b.planet.x - e.x);
  for (let i = 0; i < n; i++) {
    const a = base + (n === 1 ? 0 : (i / (n - 1) - 0.5) * abertura);
    b.spawnShot(e.x + Math.cos(a) * e.r * 0.8, e.y + Math.sin(a) * e.r * 0.8, a, vel, danoTiro(b, e), cor, 16);
  }
}

export function updateBoss(b: Battle, e: Enemy, dt: number): void {
  const s = e.boss!;
  if (b.ult.congelado > 0) return;
  // entrada
  if (!s.chegou) {
    e.y += e.vel * 1.6 * dt;
    e.alvoavel = e.y > b.vis.top + 40;
    if (e.y >= s.alvoY) {
      e.y = s.alvoY;
      s.chegou = true;
    }
    return;
  }
  const slow = e.slowT > 0 ? Math.min(0.5, e.slowAmt) : 0; // chefes resistem a lentidão
  const ritmo = 1 - slow;
  s.t1 -= dt * ritmo;
  s.t2 -= dt * ritmo;
  e.rot += dt * (s.fase === 2 ? 1.5 : 0.3);
  // leve oscilação horizontal
  s.t3 += dt;
  const id = s.def.id;
  if (id !== "eclipse") e.x = b.planet.x + Math.sin(s.t3 * 0.4) * 160;

  switch (id) {
    case "colosso_igneo": {
      if (s.fase === 1 && e.hp < e.hpMax * 0.5) {
        s.fase = 2;
        b.fx.push({ t: "tremor", força: 18 });
        b.fx.push({ t: "som", id: "chefe" });
      }
      if (s.t1 <= 0) {
        s.t1 = s.fase === 1 ? 2.6 : 3.4;
        leque(b, e, 7, 0.9, 300, 0xff7a2c);
      }
      if (s.fase === 2 && s.t2 <= 0) {
        s.t2 = 0.11;
        s.ang += 0.37;
        for (let k = 0; k < 2; k++) {
          const a = s.ang + k * Math.PI;
          b.spawnShot(e.x, e.y, a, 240, danoTiro(b, e) * 0.5, 0xffb03c, 11);
        }
      }
      break;
    }
    case "rainha_colmeia": {
      if (s.t1 <= 0) {
        s.t1 = e.hp < e.hpMax * 0.5 ? 2.6 : 3.6;
        for (let i = 0; i < 12; i++) {
          b.spawnEnemy("enxame", e.x + b.rng.range(-80, 80), e.y + b.rng.range(40, 120));
        }
      }
      if (s.t2 <= 0) {
        s.t2 = 4.5;
        for (let i = 0; i < 3; i++) b.spawnEnemy("batedor", e.x + (i - 1) * 90, e.y + 80);
        leque(b, e, 5, 0.7, 280, 0xffd04a);
      }
      break;
    }
    case "construtor_muros": {
      if (s.t1 <= 0) {
        s.t1 = 7;
        let muros = 0;
        for (const o of b.enemies) if (o.alive && o.def.comportamento === "muro") muros++;
        if (muros < 5) {
          const y = e.y + 360;
          for (let i = -1; i <= 1; i++) {
            const w = b.spawnEnemy("muro", e.x + i * 260 + b.rng.range(-40, 40), y + b.rng.range(-30, 30));
            w.rot = b.rng.range(-0.3, 0.3);
          }
          b.fx.push({ t: "som", id: "muro" });
        }
      }
      if (s.t2 <= 0) {
        s.t2 = 2.4;
        leque(b, e, 3, 0.35, 320, 0xc8d6ef);
      }
      break;
    }
    case "eclipse": {
      if (s.invisivel > 0) {
        s.invisivel -= dt;
        e.alvoavel = false;
        if (s.invisivel <= 0) {
          e.alvoavel = true;
          e.x = b.rng.range(b.vis.left + 200, b.vis.right - 200);
          e.y = s.alvoY + b.rng.range(-60, 180);
          s.t1 = 4.5;
          s.t2 = 0.6;
          b.fx.push({ t: "explosao", x: e.x, y: e.y, r: 160, cor: 0xc28bff });
        }
        break;
      }
      if (s.t2 <= 0) {
        s.t2 = 1.1;
        leque(b, e, 3, 0.25, 360, 0xc28bff);
      }
      if (s.t1 <= 0) {
        s.invisivel = e.hp < e.hpMax * 0.5 ? 1.6 : 2.2;
        e.alvoavel = false;
        b.fx.push({ t: "explosao", x: e.x, y: e.y, r: 160, cor: 0x3a2266 });
      }
      break;
    }
    case "singularidade": {
      if (s.campo > 0) {
        s.campo -= dt;
        if (s.campo <= 0) s.t1 = 3;
      } else if (s.t1 <= 0) {
        s.campo = 3;
        b.fx.push({ t: "som", id: "muro" });
      }
      if (s.t2 <= 0) {
        s.t2 = 3.8;
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2 + s.t3;
          b.spawnShot(e.x, e.y, a, 230, danoTiro(b, e) * 0.7, 0x9a7cff, 13);
        }
        leque(b, e, 3, 0.3, 330, 0xd0c0ff);
      }
      break;
    }
  }
}
