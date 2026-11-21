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
  dificil: { hpMult: 2.5, danoMult: 1.4 },
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
    nivelMax: 30,
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
