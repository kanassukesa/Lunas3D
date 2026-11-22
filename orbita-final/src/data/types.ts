/**
 * Tipos dos dados de balanceamento.
 *
 * Convenção de efeitos (cartas, chips, traços, talentos): um objeto `Efeito` mapeia chaves para números.
 *  - `<stat>`      → soma aditiva   (ex.: { critChance: 0.05 })
 *  - `<stat>Pct`   → percentual     (ex.: { danoPct: 0.10 } = +10%)
 *  - `<stat>Mult`  → multiplicador  (ex.: { cadenciaMult: 1.5 })
 * Chaves especiais (instantâneas): `curaPct`, `escudoCheio`, `ultEnergia`.
 */
export type Efeito = Record<string, number>;

export type Raridade = "comum" | "rara" | "epica" | "lendaria";

export type SentinelId =
  | "canhao"
  | "laser"
  | "trilho"
  | "feixe"
  | "missil"
  | "gravidade"
  | "campo"
  | "drone"
  | "gelo";

export type ModoAlvo = "proximo" | "maisHp" | "chefe" | "aleatorio";

export interface SentinelBase {
  dano: number;
  cadencia: number;
  alcance: number;
  velProj: number;
  perfuracao: number;
  area: number;
  projeteis: number;
  cadeia: number;
  duracao: number;
  lentidao: number;
  critChance: number;
  critDano: number;
}

export interface Traco {
  nivel: number;
  texto: string;
  efeito: Efeito;
}

export interface SentinelDef {
  id: SentinelId;
  nome: string;
  papel: string;
  desc: string;
  cor: number;
  base: SentinelBase;
  alvoPadrao: ModoAlvo;
  /** Bônus ao subir de nível na partida: índice 0 = nível 2 ... índice 3 = nível 5. */
  niveis: { texto: string; efeito: Efeito }[];
  /** Traços permanentes do hangar (a cada 5 níveis). */
  tracos: Traco[];
  /** Custo em núcleos para desbloquear (0 = inicial). */
  desbloqueio: number;
  ultimate: { nome: string; desc: string };
  evolucao: { passiva: string; nome: string; desc: string };
}

export type EnemyBehavior =
  | "reto"
  | "atirador"
  | "kamikaze"
  | "divisor"
  | "escudeiro"
  | "meteoro"
  | "muro"
  | "espectro"
  | "medico"
  | "bombardeiro";

export interface EnemyDef {
  id: string;
  nome: string;
  hp: number;
  vel: number;
  dano: number;
  xp: number;
  raio: number;
  cor: number;
  forma: string;
  comportamento: EnemyBehavior;
  /** Quantos nascem por spawn (enxame). */
  grupo?: number;
  /** Parâmetros específicos do comportamento. */
  params?: Record<string, number | string>;
}

export interface BossDef {
  id: string;
  nome: string;
  desc: string;
  hp: number;
  raio: number;
  cor: number;
  forma: string;
  danoTiro: number;
  dano: number;
}

export interface Onda {
  /** Segundo em que começa. */
  t: number;
  tipo: string;
  qtd: number;
  intervalo: number;
}

export interface StageDef {
  id: number;
  nome: string;
  duracao: number;
  chefe: string;
  /** Multiplicador de dificuldade (HP/dano inimigo e HP do chefe). */
  mult: number;
  ondas: Onda[];
  modificadores: string[];
  /** Efeitos de campo (ids de CAMPOS em journey.ts) aplicados na fase. */
  campos?: string[];
  /** Setor da campanha (1 = Órbita Próxima, 2 = Fronteira Sombria). */
  setor?: number;
}

export interface CardRequisitos {
  /** Precisa possuir esta sentinela. */
  sentinela?: SentinelId;
  /** Nível mínimo da sentinela. */
  nivelMin?: number;
  /** Precisa ter esta carta. */
  carta?: string;
}

export type CardTipo =
  | "nova_sentinela"
  | "sentinela_nivel"
  | "sentinela_mod"
  | "global"
  | "planeta"
  | "mod_tiro"
  | "ultimate"
  | "passiva"
  | "evolucao";

export interface CardDef {
  id: string;
  nome: string;
  raridade: Raridade;
  tipo: CardTipo;
  alvo?: SentinelId;
  texto: string;
  efeito: Efeito;
  maxPilhas?: number;
  requisitos?: CardRequisitos;
  peso?: number;
}

export type ChipSlot = "ataque" | "defesa" | "critico" | "energia" | "utilidade" | "nucleo";

export interface ChipSetDef {
  id: string;
  nome: string;
  cor: number;
  bonus2: { texto: string; efeito: Efeito };
  bonus4: { texto: string; efeito: Efeito };
}

export interface Chip {
  uid: number;
  slot: ChipSlot;
  set: string;
  raridade: number; // 0..3
  principal: { stat: string; valor: number };
  secundarios: { stat: string; valor: number }[];
}
