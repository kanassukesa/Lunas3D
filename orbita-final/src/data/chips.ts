import type { ChipSetDef, ChipSlot } from "./types";

export const CHIP_SLOTS: ChipSlot[] = ["ataque", "defesa", "critico", "energia", "utilidade", "nucleo"];

export const CHIP_SLOT_NOME: Record<ChipSlot, string> = {
  ataque: "Ataque",
  defesa: "Defesa",
  critico: "Crítico",
  energia: "Energia",
  utilidade: "Utilidade",
  nucleo: "Núcleo",
};

export const CHIP_RARIDADES = ["Comum", "Raro", "Épico", "Lendário"];
export const CHIP_RARIDADE_COR = ["#9aa4b8", "#4fa3ff", "#b36bff", "#ffc23d"];

/** Atributos possíveis: chave de efeito → [nome, valor por raridade (principal)]. */
export const CHIP_STATS: Record<string, { nome: string; valores: number[]; pct: boolean }> = {
  danoPct: { nome: "Dano", valores: [0.05, 0.08, 0.12, 0.18], pct: true },
  hpMaxPct: { nome: "HP", valores: [0.06, 0.1, 0.15, 0.22], pct: true },
  escudoMaxPct: { nome: "Escudo", valores: [0.08, 0.13, 0.2, 0.3], pct: true },
  armadura: { nome: "Armadura", valores: [1, 2, 3, 5], pct: false },
  critChance: { nome: "Chance crít.", valores: [0.02, 0.035, 0.05, 0.08], pct: true },
  critDano: { nome: "Dano crít.", valores: [0.1, 0.16, 0.25, 0.4], pct: true },
  ultCargaPct: { nome: "Carga ult.", valores: [0.06, 0.1, 0.15, 0.22], pct: true },
  ultDanoPct: { nome: "Dano ult.", valores: [0.08, 0.13, 0.2, 0.3], pct: true },
  cadenciaPct: { nome: "Cadência", valores: [0.03, 0.05, 0.08, 0.12], pct: true },
  alcancePct: { nome: "Alcance", valores: [0.03, 0.05, 0.08, 0.12], pct: true },
  xpPct: { nome: "XP", valores: [0.04, 0.07, 0.1, 0.15], pct: true },
  areaPct: { nome: "Área", valores: [0.05, 0.08, 0.12, 0.18], pct: true },
};

/** Atributo principal possível por encaixe. */
export const CHIP_PRINCIPAL: Record<ChipSlot, string[]> = {
  ataque: ["danoPct"],
  defesa: ["hpMaxPct", "escudoMaxPct", "armadura"],
  critico: ["critChance", "critDano"],
  energia: ["ultCargaPct", "ultDanoPct"],
  utilidade: ["cadenciaPct", "alcancePct", "xpPct"],
  nucleo: Object.keys(CHIP_STATS),
};

/** Secundários valem esta fração do valor principal da mesma raridade. */
export const CHIP_SECUNDARIO_FATOR = 0.4;

export const CHIP_SETS: ChipSetDef[] = [
  {
    id: "supernova", nome: "Supernova", cor: 0xff7a3c,
    bonus2: { texto: "+15% de área", efeito: { areaPct: 0.15 } },
    bonus4: { texto: "Explosões e acertos queimam (25%/s)", efeito: { queima: 0.25 } },
  },
  {
    id: "bastiao", nome: "Bastião", cor: 0x5ec8ff,
    bonus2: { texto: "+15% de HP", efeito: { hpMaxPct: 0.15 } },
    bonus4: { texto: "+60% de regeneração do escudo e +4 de armadura", efeito: { escudoRegenPct: 0.6, armadura: 4 } },
  },
  {
    id: "tempestade", nome: "Tempestade", cor: 0x7df9ff,
    bonus2: { texto: "+8% de cadência", efeito: { cadenciaPct: 0.08 } },
    bonus4: { texto: "+1 ricochete e +5% de crítico", efeito: { ricochete: 1, critChance: 0.05 } },
  },
  {
    id: "vortice", nome: "Vórtice", cor: 0xb36bff,
    bonus2: { texto: "+15% de carga do ultimate", efeito: { ultCargaPct: 0.15 } },
    bonus4: { texto: "Ultimate dura +50% e começa com 40% de carga", efeito: { ultDuracaoPct: 0.5, ultInicio: 40 } },
  },
];

export const CHIP_SET_MAP = Object.fromEntries(CHIP_SETS.map((s) => [s.id, s]));
