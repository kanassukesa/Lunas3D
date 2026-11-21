import { ENEMIES } from "./enemies";
import type { Onda, StageDef } from "./types";

/**
 * Fases da campanha. Cada onda: a partir de `t` (s), nasce `qtd` do `tipo` a cada `intervalo` s.
 * Os helpers abaixo só geram essas listas de forma compacta — o Spawner lê o formato do GDD.
 */
const fluxo = (tipo: string, de: number, ate: number, intervalo: number): Onda => ({
  t: de,
  tipo,
  qtd: Math.max(1, Math.floor((ate - de) / intervalo)),
  intervalo,
});
/** Horda instantânea. Para tipos em grupo (enxame), `qtd` vira número de grupos proporcional. */
const horda = (t: number, tipo: string, qtd: number, intervalo = 0.12): Onda => {
  const grupo = ENEMIES[tipo]?.grupo ?? 1;
  return { t, tipo, qtd: grupo > 1 ? Math.max(1, Math.round((qtd * 3) / grupo)) : qtd, intervalo: grupo > 1 ? 0.6 : intervalo };
};

/** Picos a cada 60 s. */
const picos = (tipos: string[], qtdBase: number, cresc: number): Onda[] =>
  [60, 120, 180, 240].map((t, i) => horda(t, tipos[i % tipos.length], Math.round(qtdBase + cresc * i)));

const CHEFES = ["colosso_igneo", "rainha_colmeia", "construtor_muros", "eclipse", "singularidade"];

export const STAGES: StageDef[] = [
  {
    id: 1, nome: "Primeiro Contato", duracao: 300, chefe: "colosso_igneo", mult: 0.75, modificadores: [],
    ondas: [
      fluxo("batedor", 1, 60, 1.1),
      fluxo("batedor", 60, 150, 0.8),
      fluxo("meteoro", 40, 270, 9),
      fluxo("tanque", 100, 270, 14),
      fluxo("batedor", 150, 270, 0.6),
      fluxo("enxame", 170, 270, 16),
      ...picos(["batedor"], 10, 4),
    ],
  },
  {
    id: 2, nome: "Chuva de Ferro", duracao: 300, chefe: "rainha_colmeia", mult: 0.9, modificadores: [],
    ondas: [
      fluxo("batedor", 1, 270, 0.8),
      fluxo("enxame", 30, 270, 14),
      fluxo("meteoro", 20, 270, 6),
      fluxo("tanque", 80, 270, 12),
      fluxo("batedor", 150, 270, 0.6),
      ...picos(["batedor", "enxame"], 12, 4),
    ],
  },
  {
    id: 3, nome: "Linha de Tiro", duracao: 300, chefe: "construtor_muros", mult: 1.0, modificadores: [],
    ondas: [
      fluxo("batedor", 1, 270, 0.7),
      fluxo("atirador", 40, 270, 9),
      fluxo("enxame", 50, 270, 13),
      fluxo("tanque", 90, 270, 11),
      fluxo("meteoro", 30, 270, 7),
      ...picos(["batedor", "enxame", "batedor", "atirador"], 14, 4),
    ],
  },
  {
    id: 4, nome: "Cometas", duracao: 300, chefe: "eclipse", mult: 1.25, modificadores: [],
    ondas: [
      fluxo("batedor", 1, 270, 0.65),
      fluxo("kamikaze", 30, 270, 5),
      fluxo("atirador", 70, 270, 9),
      fluxo("tanque", 90, 270, 10),
      fluxo("enxame", 60, 270, 12),
      ...picos(["kamikaze", "batedor"], 12, 4),
    ],
  },
  {
    id: 5, nome: "Divisão Celular", duracao: 300, chefe: "singularidade", mult: 1.5, modificadores: [],
    ondas: [
      fluxo("batedor", 1, 270, 0.6),
      fluxo("divisor", 45, 270, 6),
      fluxo("kamikaze", 60, 270, 6),
      fluxo("tanque", 80, 270, 9),
      fluxo("enxame", 40, 270, 11),
      fluxo("atirador", 100, 270, 10),
      ...picos(["divisor", "enxame", "batedor", "kamikaze"], 12, 4),
    ],
  },
  {
    id: 6, nome: "Cinturão de Ferro", duracao: 300, chefe: "colosso_igneo", mult: 1.85, modificadores: [],
    ondas: [
      fluxo("batedor", 1, 270, 0.55),
      fluxo("escudeiro", 30, 270, 9),
      fluxo("tanque", 40, 270, 8),
      fluxo("meteoro", 10, 270, 4),
      fluxo("divisor", 70, 270, 7),
      fluxo("atirador", 90, 270, 9),
      ...picos(["batedor", "tanque", "enxame", "batedor"], 14, 5),
    ],
  },
  {
    id: 7, nome: "Muralha Viva", duracao: 300, chefe: "rainha_colmeia", mult: 2.1, modificadores: [],
    ondas: [
      fluxo("batedor", 1, 270, 0.5),
      fluxo("escudeiro", 20, 270, 7),
      fluxo("enxame", 20, 270, 9),
      fluxo("kamikaze", 50, 270, 5),
      fluxo("tanque", 60, 270, 8),
      fluxo("atirador", 80, 270, 8),
      ...picos(["enxame", "kamikaze", "batedor", "enxame"], 14, 5),
    ],
  },
  {
    id: 8, nome: "Fogo Cruzado", duracao: 300, chefe: "construtor_muros", mult: 2.15, modificadores: [],
    ondas: [
      fluxo("batedor", 1, 270, 0.45),
      fluxo("atirador", 20, 270, 6),
      fluxo("divisor", 30, 270, 6),
      fluxo("tanque", 50, 270, 7),
      fluxo("escudeiro", 60, 270, 8),
      fluxo("meteoro", 10, 270, 4),
      ...picos(["atirador", "divisor", "batedor", "tanque"], 12, 5),
    ],
  },
  {
    id: 9, nome: "Mar de Cometas", duracao: 300, chefe: "eclipse", mult: 2.7, modificadores: [],
    ondas: [
      fluxo("batedor", 1, 270, 0.42),
      fluxo("kamikaze", 10, 270, 3.5),
      fluxo("enxame", 30, 270, 8),
      fluxo("tanque", 50, 270, 7),
      fluxo("escudeiro", 70, 270, 8),
      fluxo("divisor", 90, 270, 6),
      ...picos(["kamikaze", "enxame", "kamikaze", "batedor"], 16, 5),
    ],
  },
  {
    id: 10, nome: "Horizonte de Eventos", duracao: 300, chefe: "singularidade", mult: 3.15, modificadores: [],
    ondas: [
      fluxo("batedor", 1, 270, 0.4),
      fluxo("tanque", 20, 270, 6),
      fluxo("enxame", 20, 270, 7),
      fluxo("atirador", 40, 270, 6),
      fluxo("escudeiro", 50, 270, 7),
      fluxo("divisor", 60, 270, 6),
      fluxo("kamikaze", 80, 270, 4),
      ...picos(["tanque", "enxame", "kamikaze", "divisor"], 14, 6),
    ],
  },
];

/** Sobrevivência infinita: ondas geradas por tempo; chefe a cada 180 s. */
export const SOBREVIVENCIA = {
  chefeACada: 180,
  chefes: CHEFES,
  /** Multiplicador cresce com o tempo: mult = 0.8 + t / 150. */
  multBase: 0.8,
  multPorSegundo: 1 / 150,
};
