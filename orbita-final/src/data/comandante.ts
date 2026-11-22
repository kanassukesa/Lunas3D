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
  // ~2,5x mais pontos que antes: uma partida boa dá ~10 mil, então Cadete pede umas 5 partidas
  { nome: "Cadete", pontos: 50_000, fase: 1 },
  { nome: "Sargento", pontos: 150_000, fase: 2 },
  { nome: "Tenente", pontos: 350_000, fase: 3 },
  { nome: "Capitão", pontos: 700_000, fase: 5 },
  { nome: "Major", pontos: 1_250_000, fase: 8 },
  { nome: "Coronel", pontos: 2_100_000, fase: 11 },
  { nome: "General", pontos: 3_500_000, fase: 14 },
  { nome: "Almirante", pontos: 5_500_000, fase: 17 },
  { nome: "Lenda da Órbita", pontos: 8_750_000, fase: 20 },
];

/** Avatares (arte final `avatar_1..6`; sem ela, um capacete desenhado na cor). */
/** Ultimates: as 9 clássicas (ids das sentinelas) + 3 exclusivas dos comandantes Elite. */
export type UltId = "canhao" | "laser" | "trilho" | "feixe" | "missil" | "gravidade" | "campo" | "drone" | "gelo" | "supernova" | "cristal" | "vazio";
export const ULTIMATES: Record<UltId, { nome: string; desc: string; icone: string; elite?: boolean }> = {
  canhao: { nome: "Bombardeio Orbital", desc: "3 s de explosões em toda a tela.", icone: "bomba" },
  laser: { nome: "Varredura Laser", desc: "Um laser gigante varre a tela de cima a baixo.", icone: "mira" },
  trilho: { nome: "Lança Cruzada", desc: "12 trilhos atravessam a tela pelos lados.", icone: "avancar" },
  feixe: { nome: "Tempestade Elétrica", desc: "Raios caem em todos os inimigos por 3 s.", icone: "raio" },
  missil: { nome: "Chuva de Mísseis", desc: "40 mísseis teleguiados saem das sentinelas.", icone: "bomba" },
  gravidade: { nome: "Colapso", desc: "Um poço gigante no centro puxa a tela toda.", icone: "espiral" },
  campo: { nome: "Sobretensão", desc: "Pulso gigante, recupera metade do escudo e cura.", icone: "escudo" },
  drone: { nome: "Revoada", desc: "12 drones extras por 10 s.", icone: "grupo" },
  gelo: { nome: "Zero Absoluto", desc: "Congela todos os inimigos por 4 s.", icone: "nevoa" },
  supernova: { nome: "Supernova", desc: "Três ondas solares queimam a tela toda e curam 20% do planeta.", icone: "sol", elite: true },
  cristal: { nome: "Chuva de Cristal", desc: "Escudo cheio na hora e 4 s de cristais perfurantes que congelam.", icone: "diamante", elite: true },
  vazio: { nome: "Colapso do Vazio", desc: "Um buraco negro devora a tela por 5 s e implode no fim.", icone: "espiral", elite: true },
};

/** Comandantes (avatar + ultimate). Arte `avatar_N`; sem ela, um capacete desenhado na cor. */
export interface ComandanteDef {
  id: number;
  cor: string;
  nome: string;
  ult: UltId;
  elite?: boolean;
  /** Marco que libera (fase normal vencida ou patente). Sem `libera` = inicial. */
  libera?: { fase?: number; patente?: number; texto: string };
}
export const AVATARES: ComandanteDef[] = [
  { id: 1, cor: "#4fd6ff", nome: "Comandante Atlas", ult: "canhao" },
  { id: 2, cor: "#ff9a3c", nome: "Comandante Brasa", ult: "feixe" },
  { id: 5, cor: "#5aa8ff", nome: "Comandante Vega", ult: "laser", libera: { fase: 2, texto: "Vença a Fase 2" } },
  { id: 4, cor: "#49e07a", nome: "Comandante Selva", ult: "campo", libera: { fase: 3, texto: "Vença a Fase 3" } },
  { id: 3, cor: "#b36bff", nome: "Comandante Órion", ult: "gravidade", libera: { fase: 4, texto: "Vença a Fase 4" } },
  { id: 6, cor: "#a9dcff", nome: "Comandante Cometa", ult: "trilho", libera: { fase: 6, texto: "Vença a Fase 6" } },
  { id: 12, cor: "#ff8a3c", nome: "Comandante Fagulha", ult: "missil", libera: { fase: 8, texto: "Vença a Fase 8" } },
  { id: 10, cor: "#9fe8ff", nome: "Comandante Geada", ult: "gelo", libera: { fase: 10, texto: "Vença a Fase 10" } },
  { id: 11, cor: "#7dbf5a", nome: "Comandante Enxame", ult: "drone", libera: { patente: 4, texto: "Chegue a Capitão" } },
  // Elite: só com o Passe Premium, com ultimates exclusivas
  { id: 7, cor: "#ffc23d", nome: "Comandante Solar", ult: "supernova", elite: true },
  { id: 8, cor: "#ff5ec8", nome: "Comandante Nebulosa", ult: "cristal", elite: true },
  { id: 9, cor: "#b36bff", nome: "Comandante do Vazio", ult: "vazio", elite: true },
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
  /** XP do passe de batalha ao resgatar (o passe só sobe com missões). */
  xp: number;
}

/*
 * Conta do passe: 60 níveis × 1.000 XP = 60.000 XP.
 * Por dia: 4 diárias × 500 + bônus 500 = 2.500 XP  -> 20 dias = 50.000
 * Por semana: 6 semanais ≈ 3.500 XP                 -> ~3 semanas = ~10.500
 * Total em ~20 dias fazendo tudo: ~60.500 XP = passe completo.
 */
export const DIARIAS_POR_DIA = 4;
export const SEMANAIS_POR_SEMANA = 6;

/** Sorteio de 4 por dia (seed = data). */
export const MISSOES_DIARIAS: MissaoDiariaDef[] = [
  { id: "d_partidas", texto: "Jogue 2 partidas", stat: "partidas", meta: 2, premio: { creditos: 250 }, xp: 500 },
  { id: "d_vitoria", texto: "Vença 1 fase", stat: "vitorias", meta: 1, premio: { nucleos: 4 }, xp: 500 },
  { id: "d_abates", texto: "Destrua 400 inimigos", stat: "abates", meta: 400, premio: { creditos: 350 }, xp: 500 },
  { id: "d_abates2", texto: "Destrua 1.000 inimigos", stat: "abates", meta: 1000, premio: { cristais: 3 }, xp: 500 },
  { id: "d_chefe", texto: "Derrote 1 chefe", stat: "chefes", meta: 1, premio: { nucleos: 5 }, xp: 500 },
  { id: "d_ult", texto: "Use o ultimate 4 vezes", stat: "ultimates", meta: 4, premio: { creditos: 300 }, xp: 500 },
  { id: "d_evo", texto: "Evolua 1 sentinela", stat: "evolucoes", meta: 1, premio: { cristais: 3 }, xp: 500 },
  { id: "d_pontos", texto: "Faça 8.000 pontos", stat: "pontos", meta: 8000, premio: { nucleos: 4 }, xp: 500 },
];
/** Bônus por completar as 4 do dia. */
export const BONUS_DIARIAS: Premio = { cristais: 5 };
export const BONUS_DIARIAS_XP = 500;

/** Sorteio de 6 por semana (seed = semana; renovam toda segunda-feira). */
export const MISSOES_SEMANAIS: MissaoDiariaDef[] = [
  { id: "s_partidas", texto: "Jogue 15 partidas", stat: "partidas", meta: 15, premio: { creditos: 1500 }, xp: 500 },
  { id: "s_vitorias", texto: "Vença 8 fases", stat: "vitorias", meta: 8, premio: { nucleos: 15 }, xp: 600 },
  { id: "s_abates", texto: "Destrua 8.000 inimigos", stat: "abates", meta: 8000, premio: { creditos: 2000 }, xp: 600 },
  { id: "s_chefes", texto: "Derrote 6 chefes", stat: "chefes", meta: 6, premio: { nucleos: 15 }, xp: 600 },
  { id: "s_ult", texto: "Use o ultimate 25 vezes", stat: "ultimates", meta: 25, premio: { creditos: 1500 }, xp: 500 },
  { id: "s_evo", texto: "Evolua 5 sentinelas", stat: "evolucoes", meta: 5, premio: { cristais: 10 }, xp: 600 },
  { id: "s_pontos", texto: "Faça 60.000 pontos", stat: "pontos", meta: 60000, premio: { cristais: 8 }, xp: 600 },
  { id: "s_diarias", texto: "Complete 20 missões diárias", stat: "diarias", meta: 20, premio: { cristais: 15 }, xp: 700 },
];

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
  niveis: 60,
  /** XP de missões por nível do passe (partidas não dão XP de passe: só as missões diárias e semanais). */
  xpPorNivel: 1000,
  /** Versão das regras: mudar zera o passe de quem tinha progresso da regra antiga. */
  versao: 2,
};

/** Recompensa de cada nível (índice 0 = nível 1). */
export const PASSE_PREMIOS: (Premio & { skin?: string })[] = Array.from({ length: 60 }, (_, i) => {
  const n = i + 1;
  if (n === 30) return { skin: "escudo_roxo" };
  if (n === 50) return { skin: "planeta_alien" };
  if (n === 60) return { skin: "escudo_dourado", cristais: 20 };
  if (n % 10 === 0) return { chip: 2 };
  if (n % 5 === 0) return { cristais: 5 };
  if (n % 3 === 0) return { nucleos: 4 };
  return { creditos: 200 + n * 15 };
});
