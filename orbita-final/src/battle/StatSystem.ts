import type { Efeito } from "../data/types";

/** Chaves instantâneas: não viram modificador permanente. */
const INSTANTANEAS = new Set(["curaPct", "escudoCheio", "ultEnergia"]);

/**
 * Camada de modificadores. Valor final de um atributo:
 *   final = (base + Σaditivos) * (1 + Σpercentuais) * Πmultiplicadores
 */
export class Mods {
  add: Record<string, number> = {};
  pct: Record<string, number> = {};
  mult: Record<string, number> = {};

  apply(ef: Efeito, vezes = 1): this {
    for (const k in ef) {
      if (INSTANTANEAS.has(k)) continue;
      const v = ef[k] * vezes;
      if (k.endsWith("Pct")) {
        const s = k.slice(0, -3);
        this.pct[s] = (this.pct[s] ?? 0) + v;
      } else if (k.endsWith("Mult")) {
        const s = k.slice(0, -4);
        this.mult[s] = (this.mult[s] ?? 1) * Math.pow(ef[k], vezes);
      } else {
        this.add[k] = (this.add[k] ?? 0) + v;
      }
    }
    return this;
  }

  merge(o: Mods): this {
    for (const k in o.add) this.add[k] = (this.add[k] ?? 0) + o.add[k];
    for (const k in o.pct) this.pct[k] = (this.pct[k] ?? 0) + o.pct[k];
    for (const k in o.mult) this.mult[k] = (this.mult[k] ?? 1) * o.mult[k];
    return this;
  }

  clone(): Mods {
    return new Mods().merge(this);
  }
}

export function statFinal(base: number, key: string, ...camadas: Mods[]): number {
  let add = 0;
  let pct = 0;
  let mult = 1;
  for (const m of camadas) {
    add += m.add[key] ?? 0;
    pct += m.pct[key] ?? 0;
    mult *= m.mult[key] ?? 1;
  }
  return (base + add) * Math.max(0, 1 + pct) * mult;
}

/** Soma apenas aditivos (para flags como split, queima, ricochete). */
export function statAdd(key: string, ...camadas: Mods[]): number {
  let add = 0;
  for (const m of camadas) add += m.add[key] ?? 0;
  return add;
}
