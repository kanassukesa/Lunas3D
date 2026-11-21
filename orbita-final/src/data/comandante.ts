/** Perfil do comandante, patentes por pontuação, recompensas diárias, missões diárias, loja e correio. */

export interface Patente {
  nome: string;
  /** Pontos de comandante acumulados. */
  pontos: number;
  /** Fase da campanha (1-10) que precisa estar vencida para receber a patente. */
  fase: number;
}

/**
 * Progressão por pontuação acumulada (não por nível) + exigência de fase vencida.
 * Uma partida rende ~4.000-10.000 pts: Cadete sai em ~4 partidas, Capitão em ~40, Lenda em ~350.
 */
export const PATENTES: Patente[] = [
  { nome: "Recruta", pontos: 0, fase: 0 },
  { nome: "Cadete", pontos: 20_000, fase: 1 },
  { nome: "Sargento", pontos: 60_000, fase: 2 },
  { nome: "Tenente", pontos: 140_000, fase: 3 },
  { nome: "Capitão", pontos: 280_000, fase: 4 },
  { nome: "Major", pontos: 500_000, fase: 5 },
  { nome: "Coronel", pontos: 850_000, fase: 6 },
  { nome: "General", pontos: 1_400_000, fase: 8 },
  { nome: "Almirante", pontos: 2_200_000, fase: 9 },
  { nome: "Lenda da Órbita", pontos: 3_500_000, fase: 10 },
];

/** Avatares (arte final `avatar_1..6`; sem ela, um capacete desenhado na cor). */
export const AVATARES = [
  { id: 1, cor: "#4fd6ff" },
  { id: 2, cor: "#ff9a3c" },
  { id: 3, cor: "#b36bff" },
  { id: 4, cor: "#49e07a" },
  { id: 5, cor: "#5aa8ff" },
  { id: 6, cor: "#a9dcff" },
];

export type Premio = { creditos?: number; nucleos?: number; cristais?: number; chip?: number };

/** Trilha de 7 dias de login (repete depois do 7º). Chip = raridade garantida. */
export const LOGIN_DIAS: Premio[] = [
  { creditos: 300 },
  { nucleos: 5 },
  { creditos: 600 },
  { cristais: 5 },
  { nucleos: 10 },
  { creditos: 1200 },
  { chip: 2, cristais: 10 },
];

export interface MissaoDiariaDef {
  id: string;
  texto: string;
  stat: string;
  meta: number;
  premio: Premio;
}

/** Sorteio de 3 por dia (seed = data). */
export const MISSOES_DIARIAS: MissaoDiariaDef[] = [
  { id: "d_partidas", texto: "Jogue 2 partidas", stat: "partidas", meta: 2, premio: { creditos: 250 } },
  { id: "d_vitoria", texto: "Vença 1 fase", stat: "vitorias", meta: 1, premio: { nucleos: 4 } },
  { id: "d_abates", texto: "Destrua 400 inimigos", stat: "abates", meta: 400, premio: { creditos: 350 } },
  { id: "d_abates2", texto: "Destrua 1.000 inimigos", stat: "abates", meta: 1000, premio: { cristais: 3 } },
  { id: "d_chefe", texto: "Derrote 1 chefe", stat: "chefes", meta: 1, premio: { nucleos: 5 } },
  { id: "d_ult", texto: "Use o ultimate 4 vezes", stat: "ultimates", meta: 4, premio: { creditos: 300 } },
  { id: "d_evo", texto: "Evolua 1 sentinela", stat: "evolucoes", meta: 1, premio: { cristais: 3 } },
  { id: "d_pontos", texto: "Faça 2.000 pontos", stat: "pontos", meta: 2000, premio: { nucleos: 4 } },
];
/** Bônus por completar as 3 do dia. */
export const BONUS_DIARIAS: Premio = { cristais: 5 };

export interface ItemLoja {
  id: string;
  nome: string;
  desc: string;
  icone: string; // id da arte (moeda_*, chip_*)
  custo: { moeda: "creditos" | "nucleos" | "cristais"; valor: number } | null; // null = grátis 1x/dia
  premio: Premio;
}

export const LOJA: ItemLoja[] = [
  { id: "gratis", nome: "Presente diário", desc: "Grátis uma vez por dia.", icone: "moeda_creditos", custo: null, premio: { creditos: 150 } },
  { id: "creditos", nome: "Saco de créditos", desc: "1.500 créditos para o hangar e o planeta.", icone: "moeda_creditos", custo: { moeda: "cristais", valor: 10 }, premio: { creditos: 1500 } },
  { id: "nucleos", nome: "Caixa de núcleos", desc: "15 núcleos para desbloquear sentinelas e talentos.", icone: "moeda_nucleos", custo: { moeda: "cristais", valor: 12 }, premio: { nucleos: 15 } },
  { id: "chip", nome: "Chip aleatório", desc: "Um chip de qualquer raridade.", icone: "chip_tempestade", custo: { moeda: "creditos", valor: 900 }, premio: { chip: 0 } },
  { id: "chip_raro", nome: "Chip raro garantido", desc: "Raro ou melhor.", icone: "chip_bastiao", custo: { moeda: "nucleos", valor: 25 }, premio: { chip: 1 } },
  { id: "chip_epico", nome: "Chip épico garantido", desc: "Épico ou lendário.", icone: "chip_vortice", custo: { moeda: "cristais", valor: 30 }, premio: { chip: 2 } },
];

export interface Mensagem {
  id: string;
  data: string;
  titulo: string;
  texto: string;
  premio?: Premio;
}

/** Correio local (mensagens do jogo). Novas mensagens entram nesta lista a cada versão. */
export const CORREIO: Mensagem[] = [
  { id: "boas_vindas", data: "2026-11-21", titulo: "Bem-vindo, comandante!", texto: "O planeta conta com você. Aceite este reforço para começar a defesa.", premio: { creditos: 500, cristais: 10 } },
  { id: "arte_nova", data: "2026-11-21", titulo: "Frota renovada", texto: "Sentinelas, inimigos e chefes ganharam visual novo. Um presente pela espera.", premio: { nucleos: 8 } },
  { id: "jornada", data: "2026-11-21", titulo: "Jornada da Semana", texto: "Toda segunda-feira começa uma Jornada nova com efeitos de campo diferentes. Veja em Eventos." },
];

// ------------------------------------------------------------- skins

export interface SkinDef {
  id: string;
  nome: string;
  tipo: "escudo" | "planeta";
  /** Cor do escudo (tint) ou id do mapa do planeta (`planeta_mapa_<id>`, `planeta_nuvens` compartilhado). */
  cor?: number;
  /** Preço na loja em cristais; null = só pelo Passe de Batalha. */
  preco: number | null;
}

export const SKINS: SkinDef[] = [
  { id: "escudo_azul", nome: "Escudo Padrão", tipo: "escudo", cor: 0xffffff, preco: 0 },
  { id: "escudo_verde", nome: "Escudo Esmeralda", tipo: "escudo", cor: 0x8dffb0, preco: 35 },
  { id: "escudo_vermelho", nome: "Escudo Rubi", tipo: "escudo", cor: 0xff8a8a, preco: 35 },
  { id: "escudo_roxo", nome: "Escudo Nebulosa", tipo: "escudo", cor: 0xd0a0ff, preco: null },
  { id: "escudo_dourado", nome: "Escudo Solar", tipo: "escudo", cor: 0xffd77a, preco: null },
  { id: "escudo_aurora", nome: "Escudo Aurora", tipo: "escudo", cor: 0x9fffe0, preco: null },
  { id: "escudo_premium", nome: "Escudo Cobalto", tipo: "escudo", cor: 0x6f8cff, preco: null },
  { id: "escudo_supernova", nome: "Escudo Supernova", tipo: "escudo", cor: 0xff9e5e, preco: null },
  { id: "planeta_terra", nome: "Terra Nova", tipo: "planeta", preco: 0 },
  { id: "planeta_lava", nome: "Mundo de Lava", tipo: "planeta", preco: 60 },
  { id: "planeta_gelo", nome: "Mundo Congelado", tipo: "planeta", preco: 60 },
  { id: "planeta_deserto", nome: "Mundo Desértico", tipo: "planeta", preco: 60 },
  { id: "planeta_alien", nome: "Mundo Alienígena", tipo: "planeta", preco: null },
  { id: "planeta_premium_lava", nome: "Lava Premium", tipo: "planeta", preco: null },
];

// ------------------------------------------------------------- passe de batalha (gratuito)

export const PASSE = {
  niveis: 30,
  /** Pontos de comandante por nível do passe. */
  pontosPorNivel: 1200,
};

/** Recompensa de cada nível (índice 0 = nível 1). */
export const PASSE_PREMIOS: (Premio & { skin?: string })[] = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1;
  if (n === 15) return { skin: "escudo_roxo" };
  if (n === 30) return { skin: "escudo_dourado", cristais: 20 };
  if (n === 25) return { skin: "planeta_alien" };
  if (n % 10 === 0) return { chip: 2 };
  if (n % 5 === 0) return { cristais: 8 };
  if (n % 3 === 0) return { nucleos: 6 };
  return { creditos: 250 + n * 25 };
});
