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
  // ================= SETOR 2: FRONTEIRA SOMBRIA (efeitos de campo, inimigos bem mais fortes) =================
  {
    id: 11, nome: "Eco Distante", duracao: 300, chefe: "colosso_igneo", mult: 3.6, modificadores: [], setor: 2,
    ondas: [
      fluxo("batedor", 1, 270, 0.4),
      fluxo("tanque", 15, 270, 6),
      fluxo("atirador", 30, 270, 6),
      fluxo("enxame", 30, 270, 7),
      fluxo("meteoro", 10, 270, 4),
      ...picos(["batedor", "tanque", "enxame", "atirador"], 16, 6),
    ],
  },
  {
    id: 12, nome: "Nebulosa Rubra", duracao: 300, chefe: "rainha_colmeia", mult: 4.0, modificadores: [], setor: 2, campos: ["nevoa"],
    ondas: [
      fluxo("batedor", 1, 270, 0.38),
      fluxo("enxame", 10, 270, 6),
      fluxo("kamikaze", 30, 270, 4),
      fluxo("escudeiro", 50, 270, 9),
      fluxo("tanque", 60, 270, 7),
      ...picos(["enxame", "kamikaze", "enxame", "batedor"], 18, 6),
    ],
  },
  {
    id: 13, nome: "Corrente Faminta", duracao: 300, chefe: "construtor_muros", mult: 4.4, modificadores: [], setor: 2, campos: ["aceleracao"],
    ondas: [
      fluxo("batedor", 1, 270, 0.36),
      fluxo("kamikaze", 10, 270, 3.2),
      fluxo("atirador", 30, 270, 5.5),
      fluxo("divisor", 50, 270, 6),
      fluxo("escudeiro", 90, 270, 9),
      ...picos(["kamikaze", "batedor", "divisor", "kamikaze"], 16, 6),
    ],
  },
  {
    id: 14, nome: "Coroa Solar", duracao: 300, chefe: "eclipse", mult: 4.5, modificadores: [], setor: 2, campos: ["tempestade_solar"],
    ondas: [
      fluxo("batedor", 1, 270, 0.34),
      fluxo("tanque", 10, 270, 5),
      fluxo("escudeiro", 30, 270, 9),
      fluxo("enxame", 30, 270, 6),
      fluxo("meteoro", 20, 270, 3.5),
      ...picos(["tanque", "enxame", "escudeiro", "batedor"], 16, 7),
    ],
  },
  {
    id: 15, nome: "Campo de Estilhaços", duracao: 300, chefe: "singularidade", mult: 4.9, modificadores: [], setor: 2, campos: ["campo_minado"],
    ondas: [
      fluxo("batedor", 1, 270, 0.34),
      fluxo("divisor", 15, 270, 5),
      fluxo("atirador", 30, 270, 5),
      fluxo("kamikaze", 40, 270, 3.5),
      fluxo("tanque", 60, 270, 6),
      ...picos(["divisor", "kamikaze", "batedor", "divisor"], 16, 7),
    ],
  },
  {
    id: 16, nome: "Redemoinho", duracao: 300, chefe: "colosso_igneo", mult: 4.95, modificadores: [], setor: 2, campos: ["gravidade_invertida"],
    ondas: [
      fluxo("batedor", 1, 270, 0.32),
      fluxo("enxame", 10, 270, 5.5),
      fluxo("tanque", 20, 270, 5),
      fluxo("escudeiro", 40, 270, 9),
      fluxo("atirador", 50, 270, 5),
      ...picos(["enxame", "tanque", "enxame", "escudeiro"], 18, 7),
    ],
  },
  {
    id: 17, nome: "Zona Morta", duracao: 300, chefe: "rainha_colmeia", mult: 5.8, modificadores: [], setor: 2, campos: ["radiacao"],
    ondas: [
      fluxo("batedor", 1, 270, 0.3),
      fluxo("kamikaze", 10, 270, 3),
      fluxo("divisor", 20, 270, 5),
      fluxo("tanque", 30, 270, 5),
      fluxo("escudeiro", 80, 270, 9),
      ...picos(["kamikaze", "divisor", "tanque", "kamikaze"], 18, 7),
    ],
  },
  {
    id: 18, nome: "Cerco Total", duracao: 300, chefe: "construtor_muros", mult: 5.8, modificadores: [], setor: 2, campos: ["nevoa", "aceleracao"],
    ondas: [
      fluxo("batedor", 1, 270, 0.3),
      fluxo("atirador", 10, 270, 4.5),
      fluxo("escudeiro", 20, 270, 9),
      fluxo("enxame", 20, 270, 5),
      fluxo("tanque", 40, 270, 5),
      fluxo("kamikaze", 60, 270, 3.5),
      ...picos(["enxame", "atirador", "kamikaze", "tanque"], 18, 8),
    ],
  },
  {
    id: 19, nome: "Juízo Final", duracao: 300, chefe: "eclipse", mult: 6.2, modificadores: [], setor: 2, campos: ["tempestade_solar", "campo_minado"],
    ondas: [
      fluxo("batedor", 1, 270, 0.28),
      fluxo("tanque", 10, 270, 4.5),
      fluxo("divisor", 20, 270, 4.5),
      fluxo("escudeiro", 30, 270, 9),
      fluxo("kamikaze", 40, 270, 3.2),
      fluxo("meteoro", 20, 270, 3),
      ...picos(["tanque", "divisor", "kamikaze", "escudeiro"], 18, 8),
    ],
  },
  {
    id: 20, nome: "Coração do Vazio", duracao: 300, chefe: "singularidade", mult: 6.3, modificadores: [], setor: 2, campos: ["radiacao", "gravidade_invertida"],
    ondas: [
      fluxo("batedor", 1, 270, 0.27),
      fluxo("tanque", 10, 270, 4.2),
      fluxo("enxame", 10, 270, 4.5),
      fluxo("atirador", 20, 270, 4.5),
      fluxo("escudeiro", 30, 270, 9),
      fluxo("divisor", 40, 270, 4.5),
      fluxo("kamikaze", 50, 270, 3),
      ...picos(["tanque", "enxame", "kamikaze", "divisor"], 20, 8),
    ],
  },
];

// Setor 2: menos inimigos ao mesmo tempo (o peso fica no HP/dano via `mult`), senão a tela entope.
const DENSIDADE_S2 = 1.45;
/** Em hordas instantâneas, estes vêm em bem menor número (são tanques/escudos). */
const PESADOS = ["tanque", "escudeiro", "divisor"];
for (const st of STAGES) {
  if ((st.setor ?? 1) !== 2) continue;
  st.ondas = st.ondas.map((o) =>
    o.intervalo >= 0.25
      ? { ...o, intervalo: o.intervalo * DENSIDADE_S2, qtd: Math.max(1, Math.floor(o.qtd / DENSIDADE_S2)) }
      : { ...o, qtd: Math.max(1, Math.round(o.qtd / (PESADOS.includes(o.tipo) ? 3.5 : 1.2))) },
  );
}

/** Setores da campanha (cabeçalhos na tela de fases). */
export const SETORES = [
  { id: 1, nome: "Setor 1 · Órbita Próxima", desc: "As primeiras ondas da invasão." },
  { id: 2, nome: "Setor 2 · Fronteira Sombria", desc: "Efeitos de campo e inimigos muito mais fortes." },
];

/** Fase normal que libera o modo Difícil (índice 0-based). */
export const FASE_LIBERA_DIFICIL = 9;

/** Sobrevivência infinita: ondas geradas por tempo; chefe a cada 180 s. */
export const SOBREVIVENCIA = {
  chefeACada: 180,
  chefes: CHEFES,
  /** Multiplicador cresce com o tempo: mult = 0.8 + t / 150. */
  multBase: 0.8,
  multPorSegundo: 1 / 150,
};
