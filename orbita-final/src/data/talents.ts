import type { Efeito } from "./types";

export interface TalentDef {
  id: string;
  nome: string;
  desc: string;
  max: number;
  moeda: "creditos" | "nucleos";
  custo: (nivel: number) => number;
  efeito: (nivel: number) => Efeito;
}

/** Árvore simples do Planeta (GDD 5.4). */
export const TALENTS: TalentDef[] = [
  { id: "hp", nome: "Núcleo Denso", desc: "+8% de HP máximo por nível", max: 10, moeda: "creditos", custo: (n) => Math.round(120 * Math.pow(1.45, n)), efeito: (n) => ({ hpMaxPct: 0.08 * n }) },
  { id: "escudo", nome: "Gerador de Escudo", desc: "+10% de escudo por nível", max: 10, moeda: "creditos", custo: (n) => Math.round(110 * Math.pow(1.45, n)), efeito: (n) => ({ escudoMaxPct: 0.1 * n }) },
  { id: "regen", nome: "Ecossistema", desc: "+1,5 HP/s de regeneração por nível", max: 8, moeda: "creditos", custo: (n) => Math.round(150 * Math.pow(1.5, n)), efeito: (n) => ({ regenHp: 1.5 * n }) },
  { id: "dano", nome: "Forja Orbital", desc: "+4% de dano global por nível", max: 10, moeda: "creditos", custo: (n) => Math.round(160 * Math.pow(1.5, n)), efeito: (n) => ({ danoPct: 0.04 * n }) },
  { id: "xp", nome: "Banco de Dados", desc: "+6% de XP por nível", max: 5, moeda: "creditos", custo: (n) => Math.round(200 * Math.pow(1.6, n)), efeito: (n) => ({ xpPct: 0.06 * n }) },
  { id: "creditos", nome: "Mineração", desc: "+10% de créditos por nível", max: 5, moeda: "creditos", custo: (n) => Math.round(250 * Math.pow(1.6, n)), efeito: (n) => ({ creditosPct: 0.1 * n }) },
  { id: "rerrolar", nome: "Segunda Chance", desc: "+1 rerrolagem grátis por partida", max: 3, moeda: "nucleos", custo: (n) => 10 * Math.pow(2, n), efeito: (n) => ({ rerrolagens: n }) },
  { id: "sorte", nome: "Sorte Cósmica", desc: "Cartas raras aparecem mais", max: 5, moeda: "nucleos", custo: (n) => 8 + 8 * n, efeito: (n) => ({ sorte: 0.15 * n }) },
  { id: "ult", nome: "Reator Auxiliar", desc: "Começa com +15% de energia do ultimate", max: 4, moeda: "nucleos", custo: (n) => 12 + 10 * n, efeito: (n) => ({ ultInicio: 15 * n }) },
];
