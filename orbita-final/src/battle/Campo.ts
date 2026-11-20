import type { Battle } from "./Battle";

export interface Radiacao {
  y: number;
  h: number;
}
export interface Mina {
  alive: boolean;
  x: number;
  y: number;
  r: number;
  t: number;
  view?: unknown;
}

/** Efeitos de campo da Jornada que precisam de lógica por passo. */
export class Campo {
  readonly ativos: Set<string>;
  radiacao: Radiacao[] = [];
  minas: Mina[] = [];
  private solarT = 20;
  /** Segundos restantes sem regeneração do escudo (erupção solar). */
  semRegen = 0;
  /** Para o render: flash de erupção. */
  erupcao = 0;
  private minaT = 3;

  constructor(private b: Battle, ids: string[]) {
    this.ativos = new Set(ids);
    if (this.ativos.has("radiacao")) {
      this.radiacao = [
        { y: 520, h: 90 },
        { y: 980, h: 80 },
      ];
    }
  }

  tem(id: string): boolean {
    return this.ativos.has(id);
  }

  step(dt: number): void {
    const b = this.b;
    if (this.semRegen > 0) this.semRegen -= dt;
    if (this.erupcao > 0) this.erupcao -= dt;

    if (this.radiacao.length) {
      for (const e of b.enemies) {
        if (!e.alive || e.boss) continue;
        for (const z of this.radiacao) {
          if (Math.abs(e.y - z.y) < z.h / 2) {
            e.radT = (e.radT ?? 0) + dt;
            if (e.radT >= 0.25) {
              e.radT -= 0.25;
              b.hitEnemy(e, e.hpMax * 0.06 * 0.25, null, { dot: true });
            }
            break;
          }
        }
      }
    }

    if (this.tem("tempestade_solar")) {
      this.solarT -= dt;
      if (this.solarT <= 0) {
        this.solarT = 20;
        this.semRegen = 5;
        this.erupcao = 0.6;
        b.fx.push({ t: "flash", força: 0.5 });
        b.fx.push({ t: "tremor", força: 10 });
        b.fx.push({ t: "som", id: "explosaoGrande" });
        for (const e of b.enemies) if (e.alive && e.alvoavel) b.hitEnemy(e, e.hpMax * (e.boss ? 0.03 : 0.12), null, { semMods: true });
      }
    }

    if (this.tem("campo_minado")) {
      this.minaT -= dt;
      const vivas = this.minas.filter((m) => m.alive).length;
      if (this.minaT <= 0 && vivas < 6) {
        this.minaT = 4;
        this.minas.push({ alive: true, x: b.rng.range(120, 960), y: b.rng.range(b.vis.top + 250, b.planet.y - 380), r: 34, t: 0 });
      }
      for (const m of this.minas) {
        if (!m.alive) continue;
        m.t += dt;
        const alvo = b.maisProximo(m.x, m.y, m.r + 20);
        if (alvo && m.t > 0.5) {
          m.alive = false;
          const dano = 140 * b.ult.poder();
          b.explodir(m.x, m.y, 170, dano, null, 0xff5a3c, true);
          b.fx.push({ t: "tremor", força: 6 });
        }
      }
      // limpa as que explodiram (liberando sprite)
      if (this.minas.length > 12) {
        this.minas = this.minas.filter((m) => {
          if (!m.alive && m.view !== undefined) b.onRemove(m);
          return m.alive;
        });
      }
    }
  }

  /** Velocidade tangencial (espiral) para gravidade invertida. */
  espiral(): boolean {
    return this.tem("gravidade_invertida");
  }
}
