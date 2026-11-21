import { BALANCE } from "../data/balance";
import type { SentinelId } from "../data/types";
import type { Battle } from "./Battle";
import { novoDrone } from "./Sentinel";

/** Energia do ultimate (carrega com tempo + abates) e o efeito de cada sentinela base. */
export class Ultimate {
  energia = 0;
  ativo = 0;
  congelado = 0;
  usos = 0;
  private timer = 0;
  private conta = 0;
  readonly base: SentinelId;

  constructor(private b: Battle) {
    this.base = b.cfg.base;
    this.energia = Math.min(100, b.gAdd("ultInicio"));
  }

  /** Dano já causado em chefes nesta ativação (para o limite por ativação). */
  danoChefe = 0;

  private cargaMult(): number {
    return 1 + Math.min(BALANCE.ultimate.cargaMax, this.b.globais.pct.ultCarga ?? 0);
  }

  aoAbater(): void {
    if (this.ativo > 0) return;
    this.energia = Math.min(100, this.energia + BALANCE.ultimate.porAbate * this.cargaMult());
  }

  pronto(): boolean {
    return this.energia >= 100 && this.ativo <= 0;
  }

  /** Dano do ultimate acompanha a escala dos inimigos e o progresso da build. */
  poder(): number {
    const b = this.b;
    const onda = Math.floor(b.t / BALANCE.duracaoOnda);
    const escala = (1 + BALANCE.escalaOnda * onda) * b.multDificuldade() * (b.cfg.dificil ? BALANCE.dificil.hpMult : 1);
    return (1 + (b.globais.pct.ultDano ?? 0)) * (1 + (b.globais.pct.dano ?? 0)) * (1 + 0.05 * (b.nivel - 1)) * escala;
  }

  private dur(base: number): number {
    return base * (1 + (this.b.globais.pct.ultDuracao ?? 0));
  }

  ativar(): boolean {
    if (!this.pronto()) return false;
    const b = this.b;
    this.energia = 0;
    this.usos++;
    this.danoChefe = 0;
    this.timer = 0;
    this.conta = 0;
    b.fx.push({ t: "flash", força: 0.8 });
    b.fx.push({ t: "tremor", força: 16 });
    b.fx.push({ t: "som", id: "ultimate" });
    const pw = this.poder();
    const pl = b.planet;
    switch (this.base) {
      case "canhao":
        this.ativo = this.dur(3);
        break;
      case "laser":
        this.ativo = this.dur(2.5);
        break;
      case "trilho":
        this.ativo = this.dur(1.8);
        break;
      case "feixe":
        this.ativo = this.dur(3);
        break;
      case "missil":
        this.ativo = this.dur(2);
        break;
      case "gravidade": {
        const d = this.dur(4);
        b.zones.push({
          alive: true, x: pl.x, y: (b.vis.top + pl.y) / 2 - 100, r: 950, life: d, maxLife: d, dano: 12 * pw,
          tick: 0, lentidao: 0.7, puxao: 260, buracoNegro: false, src: null,
        });
        this.ativo = d;
        break;
      }
      case "campo": {
        b.beam("pulso", pl.x, pl.y, 2400, 0, 0x5effa8, 0.8, 30);
        for (const e of b.enemies) if (e.alive && e.alvoavel) b.hitEnemy(e, 150 * pw, null, { semMods: true, ult: true });
        pl.escudo = Math.min(pl.escudoMax, pl.escudo + pl.escudoMax * 0.5);
        b.curar(pl.hpMax * 0.06);
        this.ativo = 0.8;
        break;
      }
      case "drone": {
        const d = this.dur(10);
        for (let i = 0; i < 12; i++) b.drones.push(novoDrone(pl.x, pl.y, null, d));
        this.ativo = d;
        break;
      }
      case "gelo": {
        this.congelado = this.dur(4);
        for (const e of b.enemies) {
          if (!e.alive || !e.alvoavel) continue;
          b.hitEnemy(e, 80 * pw, null, { semMods: true, ult: true });
          e.slowAmt = 0.95;
          e.slowT = this.congelado;
        }
        b.fx.push({ t: "explosao", x: pl.x, y: pl.y, r: 1600, cor: 0x9fe8ff });
        this.ativo = this.congelado;
        break;
      }
    }
    return true;
  }

  step(dt: number): void {
    const b = this.b;
    if (this.congelado > 0) this.congelado -= dt;
    if (this.ativo <= 0) {
      this.energia = Math.min(100, this.energia + (100 / BALANCE.ultimate.tempoCarga) * this.cargaMult() * dt);
      return;
    }
    this.ativo -= dt;
    this.timer -= dt;
    const pw = this.poder();
    const pl = b.planet;
    const v = b.vis;
    switch (this.base) {
      case "canhao":
        while (this.timer <= 0) {
          this.timer += 0.07;
          const e = b.inimigoAleatorio(pl.x, pl.y, 5000);
          const x = e ? e.x : b.rng.range(v.left, v.right);
          const y = e ? e.y : b.rng.range(v.top, pl.y - 300);
          b.beam("linha", x, v.top - 50, x, y, 0xffd9a0, 0.1, 6);
          b.explodir(x, y, 130, 60 * pw, null, 0xff9a3c, true, true);
          b.fx.push({ t: "tremor", força: 4 });
        }
        break;
      case "laser": {
        const total = this.dur(2.5);
        const prog = 1 - Math.max(0, this.ativo) / total;
        const y = v.top + (pl.y - 200 - v.top) * prog;
        b.beam("linha", v.left - 50, y, v.right + 50, y, 0xff4d6d, 0.05, 50);
        while (this.timer <= 0) {
          this.timer += 0.05;
          for (const e of b.enemies) if (e.alive && e.alvoavel && Math.abs(e.y - y) < 70 + e.r) b.hitEnemy(e, 22 * pw, null, { semMods: true, ult: true });
        }
        break;
      }
      case "trilho":
        while (this.timer <= 0 && this.conta < 12) {
          this.timer += 0.15;
          this.conta++;
          const esq = this.conta % 2 === 0;
          const y = b.rng.range(v.top + 80, pl.y - 250);
          const p = b.spawnProj("trilho", esq ? v.left - 60 : v.right + 60, y, esq ? b.rng.range(-0.25, 0.25) : Math.PI + b.rng.range(-0.25, 0.25), 2600, 200 * pw, null, 0xb8f2ff);
          p.pierce = 9999;
          p.r = 46;
          p.life = 1.2;
          p.ult = true;
        }
        break;
      case "feixe":
        while (this.timer <= 0) {
          this.timer += 0.5;
          for (const e of b.enemies) {
            if (!e.alive || !e.alvoavel || !b.naTela(e)) continue;
            b.beam("raio", e.x + b.rng.range(-80, 80), v.top - 20, e.x, e.y, 0x7df9ff, 0.25, 4);
            b.hitEnemy(e, 50 * pw, null, { semMods: true, ult: true });
          }
        }
        break;
      case "missil":
        while (this.timer <= 0 && this.conta < 40) {
          this.timer += 0.05;
          this.conta++;
          const alvo = b.inimigoAleatorio(pl.x, pl.y, 5000);
          const p = b.spawnProj("missil", pl.x, pl.y, -Math.PI / 2 + b.rng.range(-1.4, 1.4), 400, 45 * pw, null, 0xffd25e);
          p.alvo = alvo;
          p.alvoId = alvo ? alvo.id : 0;
          p.area = 100;
          p.life = 4;
          p.ult = true;
        }
        break;
    }
  }
}
