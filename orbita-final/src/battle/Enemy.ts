import { BALANCE } from "../data/balance";
import type { Battle } from "./Battle";


const P = BALANCE.planeta;

/** Movimento, efeitos de status e contato com o planeta. */
export function updateEnemies(b: Battle, dt: number): void {
  const pl = b.planet;
  const v = b.vis;
  for (const e of b.enemies) {
    if (!e.alive) continue;
    e.idade += dt;
    if (e.flash > 0) e.flash -= dt;

    // dano contínuo (queimadura / veneno)
    if (e.burnT > 0 || e.poisonT > 0) {
      e.dotTick += dt;
      if (e.dotTick >= 0.25) {
        e.dotTick -= 0.25;
        let d = 0;
        if (e.burnT > 0) d += e.burnDps * 0.25;
        if (e.poisonT > 0) d += e.poisonDps * 0.25;
        if (d > 0) b.hitEnemy(e, d, null, { dot: true });
        if (!e.alive) continue;
      }
      e.burnT -= dt;
      e.poisonT -= dt;
      if (e.poisonT <= 0) e.poisonDps = 0;
      if (e.burnT <= 0) e.burnDps = 0;
    }

    if (e.slowT > 0) e.slowT -= dt;
    const slow = Math.min(0.95, Math.max(e.slowT > 0 ? e.slowAmt : 0, e.gravSlow));
    e.gravSlow = 0;
    if (b.ult.congelado > 0 && !e.boss) continue;

    if (e.boss) continue; // chefe tem movimento próprio

    const dx = pl.x - e.x;
    const dy = pl.y - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;
    let vel = e.vel * (1 - slow);

    switch (e.def.comportamento) {
      case "atirador": {
        const alvoDist = Number(e.def.params!.distancia);
        if (dist > alvoDist) {
          e.vx = nx * vel;
          e.vy = ny * vel;
        } else {
          e.vx = e.vy = 0;
          e.fireT -= dt * (1 - slow * 0.5);
          if (e.fireT <= 0) {
            e.fireT = Number(e.def.params!.recarga);
            const dano = Number(e.def.params!.danoTiro) * (e.dano / e.def.dano);
            b.spawnShot(e.x, e.y, Math.atan2(dy, dx), Number(e.def.params!.velTiro), dano, 0xff4fa3, 10);
          }
        }
        e.rot = Math.atan2(dy, dx);
        break;
      }
      case "kamikaze": {
        const lim = Number(e.def.params!.distancia);
        if (dist < lim) {
          const f = 1 - dist / lim;
          vel = (e.vel + (Number(e.def.params!.velMax) - e.vel) * f) * (1 - slow);
        }
        e.vx = nx * vel;
        e.vy = ny * vel;
        e.rot = Math.atan2(dy, dx);
        break;
      }
      case "meteoro": {
        if (e.idade < dt * 1.5) {
          // define trajetória diagonal na primeira atualização
          const tx = pl.x + b.rng.range(-380, 380);
          const a = Math.atan2(pl.y - e.y, tx - e.x);
          e.vx = Math.cos(a);
          e.vy = Math.sin(a);
        }
        const len = Math.hypot(e.vx, e.vy) || 1;
        e.vx = (e.vx / len) * vel;
        e.vy = (e.vy / len) * vel;
        e.rot += dt * 2;
        if (e.y > v.bottom + 100 || e.x < v.left - 300 || e.x > v.right + 300) {
          e.alive = false;
          continue;
        }
        break;
      }
      case "muro":
        e.vx = e.vy = 0;
        break;
      case "escudeiro": {
        e.fireT -= dt;
        if (e.fireT <= 0) {
          e.fireT = Number(e.def.params!.recarga);
          const raio = Number(e.def.params!.raioAura);
          const add = Number(e.def.params!.escudo) * (e.hpMax / e.def.hp);
          const max = Number(e.def.params!.escudoMax) * (e.hpMax / e.def.hp);
          for (const o of b.enemies) {
            if (!o.alive || o === e || o.boss) continue;
            if (Math.hypot(o.x - e.x, o.y - e.y) < raio) o.escudo = Math.min(max, o.escudo + add);
          }
        }
        e.vx = nx * vel;
        e.vy = ny * vel;
        e.rot += dt * 0.8;
        break;
      }
      default:
        e.vx = nx * vel;
        e.vy = ny * vel;
        e.rot = Math.atan2(dy, dx);
    }

    e.x += e.vx * dt;
    e.y += e.vy * dt;

    // contato com escudo/planeta
    const rr = (pl.escudo > 0 ? P.raioEscudo : P.raio) + e.r * 0.7;
    const ddx = e.x - pl.x;
    const ddy = e.y - pl.y;
    if (ddx * ddx + ddy * ddy < rr * rr) {
      b.danoPlaneta(e.dano, e.x, e.y);
      b.killEnemy(e, false);
    }
  }
}

/** Ponto de spawn fora da tela, num ângulo entre -160° e -20° a partir do planeta. */
export function pontoSpawn(b: Battle, angGraus?: number): { x: number; y: number } {
  const a = ((angGraus ?? b.rng.range(-150, -30)) * Math.PI) / 180;
  const v = b.vis;
  const m = 60;
  const cx = Math.cos(a);
  const cy = Math.sin(a);
  const px = b.planet.x;
  const py = b.planet.y;
  let t = Infinity;
  if (cx > 0) t = Math.min(t, (v.right + m - px) / cx);
  if (cx < 0) t = Math.min(t, (v.left - m - px) / cx);
  if (cy < 0) t = Math.min(t, (v.top - m - py) / cy);
  return { x: px + cx * t, y: py + cy * t };
}

