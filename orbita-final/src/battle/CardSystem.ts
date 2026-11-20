import { BALANCE } from "../data/balance";
import { CARD_MAP, CARDS } from "../data/cards";
import { SENTINELS } from "../data/sentinels";
import type { CardDef, Raridade } from "../data/types";
import type { Battle } from "./Battle";

const ORDEM: Raridade[] = ["comum", "rara", "epica", "lendaria"];

export interface Oferta {
  card: CardDef;
  texto: string;
  nivel?: number;
}

/** Sorteio ponderado de cartas, pilhas, requisitos e evoluções. */
export class CardSystem {
  pilhas = new Map<string, number>();
  pegas: string[] = [];
  rerrolagensGratis: number;
  custoRerrolagem: number = BALANCE.rerrolagem.custoSucata;
  ofertas: Oferta[] = [];

  constructor(private b: Battle) {
    this.rerrolagensGratis = BALANCE.rerrolagem.gratis + Math.round(b.gAdd("rerrolagens"));
  }

  qtd(id: string): number {
    return this.pilhas.get(id) ?? 0;
  }

  elegivel(c: CardDef): boolean {
    const b = this.b;
    if (this.qtd(c.id) >= (c.maxPilhas ?? 1)) return false;
    const r = c.requisitos;
    if (r?.sentinela) {
      const s = b.getSentinel(r.sentinela);
      if (!s) return false;
      if (r.nivelMin && s.nivel < r.nivelMin) return false;
    }
    if (r?.carta && this.qtd(r.carta) === 0) return false;
    switch (c.tipo) {
      case "nova_sentinela":
        return !!c.alvo && b.sentinels.length < b.slots() && !b.getSentinel(c.alvo) && b.cfg.pool.includes(c.alvo);
      case "sentinela_nivel": {
        const s = c.alvo && b.getSentinel(c.alvo);
        return !!s && s.nivel < 5;
      }
      case "evolucao": {
        const s = c.alvo && b.getSentinel(c.alvo);
        return !!s && !s.evoluido;
      }
      case "planeta":
        if (c.id === "cura_1") return b.planet.hp < b.planet.hpMax * 0.8;
        return true;
      default:
        return true;
    }
  }

  textoDe(c: CardDef): { texto: string; nivel?: number } {
    if (c.tipo === "sentinela_nivel" && c.alvo) {
      const s = this.b.getSentinel(c.alvo);
      const n = s ? s.nivel + 1 : 2;
      const lv = SENTINELS[c.alvo].niveis[n - 2];
      return { texto: `Nível ${n}: ${lv?.texto ?? ""}`, nivel: n };
    }
    return { texto: c.texto };
  }

  sortear(n: number): Oferta[] {
    const b = this.b;
    const escolhidas: CardDef[] = [];
    const evos = CARDS.filter((c) => c.tipo === "evolucao" && this.elegivel(c));
    if (evos.length) escolhidas.push(b.rng.pick(evos));
    // começo da partida: garante uma sentinela nova entre as opções para a build crescer
    if (b.sentinels.length < 3) {
      const novas = CARDS.filter((c) => c.tipo === "nova_sentinela" && this.elegivel(c));
      if (novas.length) escolhidas.push(b.rng.pick(novas));
    }

    const sorte = b.gAdd("sorte");
    const pesosR = ORDEM.map((r, i) => BALANCE.raridades[r] * (i === 0 ? Math.max(0.3, 1 - sorte) : 1 + sorte * i));
    let tentativas = 0;
    while (escolhidas.length < n && tentativas++ < 40) {
      const r = ORDEM[b.rng.weighted(pesosR)];
      let cand = CARDS.filter((c) => c.raridade === r && c.tipo !== "evolucao" && !escolhidas.includes(c) && this.elegivel(c));
      if (!cand.length) cand = CARDS.filter((c) => c.tipo !== "evolucao" && !escolhidas.includes(c) && this.elegivel(c));
      if (!cand.length) break;
      // nas primeiras escolhas, favorece novas sentinelas para a build crescer
      const idx = b.rng.weighted(cand.map((c) => (c.peso ?? 1) * (c.tipo === "nova_sentinela" && b.sentinels.length < 3 ? 2.5 : 1)));
      escolhidas.push(cand[idx]);
    }
    if (!escolhidas.length) escolhidas.push(CARD_MAP["cura_1"]);
    this.ofertas = escolhidas.map((card) => ({ card, ...this.textoDe(card) }));
    return this.ofertas;
  }

  numeroDeCartas(): number {
    const nivel = this.b.nivel - this.b.pendentes + 1;
    return nivel % BALANCE.nivelCincoCartas === 0 ? 5 : 3;
  }

  podeRerrolar(): boolean {
    return this.rerrolagensGratis > 0 || this.b.sucata >= this.custoRerrolagem;
  }

  rerrolar(): Oferta[] | null {
    if (this.rerrolagensGratis > 0) this.rerrolagensGratis--;
    else if (this.b.sucata >= this.custoRerrolagem) {
      this.b.sucata -= this.custoRerrolagem;
      this.custoRerrolagem += BALANCE.rerrolagem.custoIncremento;
    } else return null;
    return this.sortear(this.ofertas.length || 3);
  }

  aplicar(c: CardDef): void {
    const b = this.b;
    this.pilhas.set(c.id, this.qtd(c.id) + 1);
    this.pegas.push(c.id);
    const ef = c.efeito;
    switch (c.tipo) {
      case "nova_sentinela":
        if (c.alvo) b.addSentinel(c.alvo);
        break;
      case "sentinela_nivel": {
        const s = c.alvo && b.getSentinel(c.alvo);
        if (s) {
          s.nivel++;
          const lv = s.def.niveis[s.nivel - 2];
          if (lv) s.run.apply(lv.efeito);
        }
        break;
      }
      case "sentinela_mod": {
        const s = c.alvo && b.getSentinel(c.alvo);
        if (s) s.run.apply(ef);
        break;
      }
      case "evolucao": {
        const s = c.alvo && b.getSentinel(c.alvo);
        if (s) {
          s.evoluido = true;
          s.run.apply(ef);
          b.evolucoes++;
          b.fx.push({ t: "flash", força: 0.6 });
        }
        break;
      }
      default:
        b.globais.apply(ef);
    }
    b.recalcTudo();
    if (ef.curaPct) b.curar(b.planet.hpMax * ef.curaPct);
    if (ef.escudoCheio) b.planet.escudo = b.planet.escudoMax;
    if (ef.ultEnergia) b.ult.energia = Math.min(100, b.ult.energia + ef.ultEnergia);
    b.pendentes = Math.max(0, b.pendentes - 1);
  }
}
