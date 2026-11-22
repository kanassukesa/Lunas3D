import type { Raridade } from "./types";

/** Todos os números globais de balanceamento. */
export const BALANCE = {
  mundo: { largura: 1080, altura: 1920 },
  planeta: {
    x: 540,
    y: 1500,
    raio: 110,
    raioEscudo: 150,
    hp: 3000,
    escudo: 500,
    escudoRegen: 50,
    escudoAtraso: 3,
    armadura: 0,
  },
  aneis: [
    { raio: 200, slots: 3, velAngular: 0.25 },
    { raio: 280, slots: 3, velAngular: -0.18 },
  ],
  maxSlots: 6,
  critBase: { chance: 0.05, dano: 1.5 },
  xp: { base: 4.6, expoente: 1.45 },
  /** Nível em que aparecem 5 cartas (múltiplos). */
  nivelCincoCartas: 10,
  raridades: { comum: 60, rara: 28, epica: 10, lendaria: 2 } as Record<Raridade, number>,
  rerrolagem: { gratis: 1, custoSucata: 25, custoIncremento: 25 },
  ultimate: {
    tempoCarga: 50,
    porAbate: 0.09,
    /** Bônus máximo de velocidade de carga (cartas + chips + passivas). */
    cargaMax: 1.0,
    /** Contra chefes o ultimate causa só esta fração do dano… */
    fatorChefe: 0.25,
    /** …e no máximo esta fração do HP do chefe por ativação. */
    limiteChefe: 0.12,
  },
  escalaOnda: 0.12,
  duracaoOnda: 30,
  avisoChefe: 270,
  entradaChefe: 280,
  retargetIntervalo: 0.1,
  recompensas: {
    creditosPorAbate: 0.35,
    creditosPorSegundo: 0.4,
    creditosVitoriaPorFase: 60,
    nucleosChefeBase: 3,
    sucataPorAbate: 1,
    /** Desistir pela pausa: fica só com esta fração dos créditos e pontos, sem núcleos nem chip. */
    fatorDesistencia: 0.4,
  },
  estrelas: { hp2: 0.5, hp3: 0.9 },
  /** Combo: abates seguidos dentro da janela; a cada `passo` abates o multiplicador sobe `bonus` (até `max`). */
  combo: { janela: 2.2, passo: 15, bonus: 0.1, max: 2.5, pontosPorAbate: 1 },
  /** Habilidade ativa do planeta: onda de choque. */
  habilidade: { recarga: 22, raio: 620, empurrao: 260, dano: 40, escudoPct: 0.2 },
  hangar: {
    nivelMax: 40,
    danoPorNivel: 0.06,
    custoBase: 60,
    custoCresc: 1.16,
  },
} as const;

export const RARIDADE_COR: Record<Raridade, string> = {
  comum: "#9aa4b8",
  rara: "#4fa3ff",
  epica: "#b36bff",
  lendaria: "#ffc23d",
};

export const RARIDADE_NOME: Record<Raridade, string> = {
  comum: "Comum",
  rara: "Rara",
  epica: "Épica",
  lendaria: "Lendária",
};

export function xpParaNivel(nivel: number): number {
  return Math.round(BALANCE.xp.base * Math.pow(nivel, BALANCE.xp.expoente) + 4);
}

export function custoHangar(nivel: number): number {
  return Math.round(BALANCE.hangar.custoBase * Math.pow(BALANCE.hangar.custoCresc, nivel - 1));
}

/** Níveis de dificuldade da campanha. Cada um libera ao vencer a fase `liberaFase` do nível anterior. */
export interface DificuldadeDef {
  id: "normal" | "dificil" | "pesadelo" | "apocalipse";
  nome: string;
  hpMult: number;
  danoMult: number;
  /** Multiplica créditos, núcleos e pontos. */
  premio: number;
  /** Bônus na chance de chip raro. */
  raridade: number;
  cor: string;
  icone: string;
  desc: string;
}
export const DIFICULDADES: DificuldadeDef[] = [
  { id: "normal", nome: "Normal", hpMult: 1, danoMult: 1, premio: 1, raridade: 0, cor: "#4fd6ff", icone: "play", desc: "A campanha padrão." },
  { id: "dificil", nome: "Difícil", hpMult: 2.5, danoMult: 1.4, premio: 2, raridade: 0.5, cor: "#ff9a3c", icone: "alerta", desc: "Inimigos com 2,5× HP e +40% de dano. Prêmios ×2." },
  { id: "pesadelo", nome: "Pesadelo", hpMult: 4.2, danoMult: 1.75, premio: 3.5, raridade: 1, cor: "#ff4d6d", icone: "radiacao", desc: "Inimigos com 4,2× HP e +75% de dano. Prêmios ×3,5 e mais chips raros." },
  { id: "apocalipse", nome: "Apocalipse", hpMult: 6.5, danoMult: 2.2, premio: 6, raridade: 1.6, cor: "#b36bff", icone: "coroa2", desc: "Inimigos com 6,5× HP e dano dobrado. Prêmios ×6 e chips lendários com frequência." },
];
/** Fase (índice 0-based) do nível anterior que libera o próximo nível de dificuldade. */
export const DIF_LIBERA_FASE = 9;
