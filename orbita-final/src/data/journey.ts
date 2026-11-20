import type { Efeito } from "./types";

/**
 * Modo Jornada: sequência de etapas sem cura entre elas. A build, o nível e o HP continuam.
 * Toda semana sorteia 2 efeitos de campo (seed = semana do ano).
 */
export interface CampoDef {
  id: string;
  nome: string;
  desc: string;
  icone: string;
  /** Modificadores aplicados à partida inteira. */
  efeito?: Efeito;
  velInimigoMult?: number;
  xpMult?: number;
}

export const CAMPOS: CampoDef[] = [
  {
    id: "radiacao", nome: "Zona de Radiação", icone: "☢️",
    desc: "Faixas radioativas cortam a tela: inimigos que passam por elas perdem 6% do HP por segundo. O escudo regenera 30% mais devagar.",
    efeito: { escudoRegenPct: -0.3 },
  },
  {
    id: "gravidade_invertida", nome: "Gravidade Invertida", icone: "🌀",
    desc: "Inimigos descem em espiral, 15% mais rápidos. Projéteis ganham +20% de velocidade.",
    velInimigoMult: 1.15, efeito: { velProjPct: 0.2 },
  },
  {
    id: "aceleracao", nome: "Corrente Rápida", icone: "⏩",
    desc: "Inimigos 35% mais rápidos, mas dão 30% mais XP.",
    velInimigoMult: 1.35, xpMult: 1.3,
  },
  {
    id: "tempestade_solar", nome: "Tempestade Solar", icone: "☀️",
    desc: "A cada 20 s uma erupção solar fere todos os inimigos (12% do HP) mas desliga a regeneração do escudo por 5 s.",
  },
  {
    id: "nevoa", nome: "Nebulosa Densa", icone: "🌫️",
    desc: "Alcance das sentinelas −20%, mas +12% de chance de crítico.",
    efeito: { alcancePct: -0.2, critChance: 0.12 },
  },
  {
    id: "campo_minado", nome: "Campo Minado", icone: "💣",
    desc: "Minas flutuam no campo e explodem quando inimigos passam (dano alto em área). Inimigos com +20% de HP.",
  },
];

export const JORNADA = {
  etapas: 5,
  /** Fases da campanha usadas como base de cada etapa (índices 0-based), embaralhadas pela seed. */
  poolFases: [1, 2, 3, 4, 5, 6, 7],
  /** Multiplicador de dificuldade de cada etapa. */
  multEtapa: [1.0, 1.9, 3.2, 5.0, 7.2],
  /** Duração reduzida de cada etapa (s) e momento do chefe. */
  duracao: 200,
  entradaChefe: 185,
  avisoChefe: 178,
  recompensaEtapa: { creditos: 150, nucleos: 4 },
  recompensaFinal: { nucleos: 30, cristais: 15 },
};
