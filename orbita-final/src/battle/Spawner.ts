import { BALANCE } from "../data/balance";
import { ENEMIES } from "../data/enemies";
import { SOBREVIVENCIA } from "../data/stages";
import type { Onda } from "../data/types";
import type { Battle } from "./Battle";
import { spawnBoss } from "./Boss";
import { pontoSpawn } from "./Enemy";

interface OndaAtiva {
  onda: Onda;
  prox: number;
  restam: number;
}

/** Lê as ondas da fase (ou gera ondas na Sobrevivência) e cria os inimigos no tempo certo. */
export class Spawner {
  private ativas: OndaAtiva[];
  private chefeLiberado = false;
  private proxChefe = SOBREVIVENCIA.chefeACada;
  private idxChefe = 0;
  private acumulado = 0;
  private spawnMult: number;

  constructor(private b: Battle) {
    this.spawnMult = b.cfg.daily?.spawnMult ?? 1;
    this.ativas = b.cfg.stage.ondas.map((o) => ({ onda: o, prox: o.t, restam: o.qtd }));
  }

  multAtual(): number {
    if (this.b.cfg.modo === "sobrevivencia") return SOBREVIVENCIA.multBase + this.b.t * SOBREVIVENCIA.multPorSegundo;
    // a dificuldade da fase entra aos poucos: 45% no início, 100% aos 4 min (o chefe usa o valor cheio)
    const m = this.b.cfg.stage.mult;
    const f = Math.min(1, 0.45 + 0.55 * (this.b.t / 240));
    return m >= 1 ? 1 + (m - 1) * f : m;
  }

  multCheio(): number {
    return this.b.cfg.modo === "sobrevivencia" ? this.multAtual() : this.b.cfg.stage.mult;
  }

  step(dt: number): void {
    const b = this.b;
    if (b.cfg.modo === "sobrevivencia") return this.stepInfinito(dt);
    const t = b.t;
    for (const a of this.ativas) {
      while (a.restam > 0 && t >= a.prox) {
        this.spawnTipo(a.onda.tipo);
        a.restam--;
        a.prox += a.onda.intervalo / this.spawnMult;
      }
    }
    if (!b.avisoChefe && t >= BALANCE.avisoChefe) {
      b.avisoChefe = true;
      b.fx.push({ t: "som", id: "alerta" });
    }
    if (!this.chefeLiberado && t >= BALANCE.entradaChefe) {
      this.chefeLiberado = true;
      spawnBoss(b, b.cfg.stage.chefe);
    }
  }

  private stepInfinito(dt: number): void {
    const b = this.b;
    const t = b.t;
    // taxa de spawn cresce com o tempo
    const taxa = (1.1 + t / 45) * this.spawnMult;
    this.acumulado += taxa * dt;
    const pool: [string, number][] = [
      ["batedor", 10],
      ["meteoro", 1.5],
      ["enxame", t > 30 ? 0.8 : 0],
      ["tanque", t > 45 ? 1.2 : 0],
      ["atirador", t > 75 ? 1 : 0],
      ["kamikaze", t > 100 ? 1.3 : 0],
      ["divisor", t > 130 ? 1 : 0],
      ["escudeiro", t > 160 ? 0.8 : 0],
    ];
    while (this.acumulado >= 1) {
      this.acumulado -= 1;
      const i = b.rng.weighted(pool.map((p) => p[1]));
      this.spawnTipo(pool[i][0]);
    }
    // picos
    if (Math.floor(t / 60) !== Math.floor((t - dt) / 60) && t > 1) {
      const n = Math.round(10 + t / 12);
      for (let i = 0; i < n; i++) this.spawnTipo(b.rng.pick(["batedor", "batedor", "kamikaze", "enxame"]));
    }
    if (!b.boss && t >= this.proxChefe) {
      if (!b.avisoChefe) {
        b.avisoChefe = true;
        b.fx.push({ t: "som", id: "alerta" });
      }
      if (t >= this.proxChefe + 8) {
        b.avisoChefe = false;
        spawnBoss(b, SOBREVIVENCIA.chefes[this.idxChefe++ % SOBREVIVENCIA.chefes.length], 0.6);
        this.proxChefe = Infinity;
      }
    }
  }

  chefeMorto(): void {
    this.proxChefe = this.b.t + SOBREVIVENCIA.chefeACada;
  }

  private spawnTipo(tipo: string): void {
    const b = this.b;
    const def = ENEMIES[tipo];
    if (!def) return;
    if (tipo === "meteoro") {
      const lado = b.rng.chance(0.5) ? -1 : 1;
      const x = b.planet.x + lado * b.rng.range(250, 650);
      b.spawnEnemy(tipo, x, b.vis.top - 60);
      return;
    }
    const pos = pontoSpawn(b);
    const n = def.grupo ?? 1;
    for (let i = 0; i < n; i++) {
      const j = n > 1 ? 55 : 0;
      b.spawnEnemy(tipo, pos.x + b.rng.range(-j, j), pos.y + b.rng.range(-j, j));
    }
  }
}
