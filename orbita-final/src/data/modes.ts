import type { SentinelId } from "./types";

/** Modificadores do Desafio Diário (um é sorteado pela seed do dia). */
export interface DailyMod {
  id: string;
  nome: string;
  desc: string;
  /** Força a sentinela base e o pool. */
  sentinelas?: SentinelId[];
  efeito?: Record<string, number>;
  spawnMult?: number;
  hpInimigoMult?: number;
  velInimigoMult?: number;
}

export const DAILY_MODS: DailyMod[] = [
  { id: "so_misseis", nome: "Só Mísseis", desc: "Apenas o Enxame está disponível.", sentinelas: ["missil"], efeito: { danoPct: 0.3 } },
  { id: "vidro", nome: "Planeta de Vidro", desc: "Planeta com 1 HP, mas escudo enorme que regenera rápido.", efeito: { hpMaxMult: 0.0004, escudoMaxMult: 5, escudoRegenMult: 4 } },
  { id: "horda", nome: "Horda", desc: "60% mais inimigos, +30% de XP.", spawnMult: 1.6, efeito: { xpPct: 0.3 } },
  { id: "velozes", nome: "Hiperpropulsão", desc: "Inimigos 40% mais rápidos; +25% de cadência.", velInimigoMult: 1.4, efeito: { cadenciaPct: 0.25 } },
  { id: "criticos", nome: "Lua Sangrenta", desc: "+25% de crítico, inimigos com +50% de HP.", hpInimigoMult: 1.5, efeito: { critChance: 0.25 } },
  { id: "eletrico", nome: "Alta Tensão", desc: "Apenas Prisma e Domo Elétrico.", sentinelas: ["feixe", "campo"], efeito: { danoPct: 0.2 } },
];
