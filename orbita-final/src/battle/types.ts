import type { BossDef, EnemyDef, SentinelBase, SentinelDef, SentinelId, StageDef } from "../data/types";
import type { DailyMod } from "../data/modes";
import type { Mods } from "./StatSystem";

export type Modo = "campanha" | "diario" | "sobrevivencia" | "jornada";

export interface RunConfig {
  modo: Modo;
  stage: StageDef;
  dificil: boolean;
  seed: number;
  base: SentinelId;
  pool: SentinelId[];
  /** Modificadores permanentes globais (talentos, chips, desafio). */
  globais: Mods;
  /** Modificadores permanentes por sentinela (nível do hangar + traços). */
  perm: Partial<Record<SentinelId, Mods>>;
  daily?: DailyMod;
  tutorial: boolean;
  /** Efeitos de campo ativos (Jornada). */
  campos?: string[];
  /** Etapas da Jornada (a primeira é `stage`). */
  etapas?: StageDef[];
}

export interface Visivel {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface BossState {
  def: BossDef;
  fase: number;
  t1: number;
  t2: number;
  t3: number;
  ang: number;
  invisivel: number;
  campo: number;
  chegou: boolean;
  alvoY: number;
}

export interface Enemy {
  id: number;
  alive: boolean;
  def: EnemyDef;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hp: number;
  hpMax: number;
  escudo: number;
  dano: number;
  vel: number;
  xp: number;
  idade: number;
  rot: number;
  flash: number;
  slowT: number;
  slowAmt: number;
  gravSlow: number;
  burnDps: number;
  burnT: number;
  poisonDps: number;
  poisonT: number;
  dotTick: number;
  fireT: number;
  alvoavel: boolean;
  radT?: number;
  boss: BossState | null;
  view?: unknown;
}

export type ProjKind = "bala" | "trilho" | "missil" | "gelo" | "drone" | "estilhaco";

export interface Projectile {
  id: number;
  alive: boolean;
  kind: ProjKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  vel: number;
  r: number;
  dano: number;
  pierce: number;
  hits: number[];
  life: number;
  cor: number;
  alvo: Enemy | null;
  alvoId: number;
  area: number;
  ricochete: number;
  profundidade: number;
  src: SentinelRun | null;
  ult: boolean;
  view?: unknown;
}

export interface EnemyShot {
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  dano: number;
  cor: number;
  life: number;
  view?: unknown;
}

export interface SentinelStats extends SentinelBase {
  tiroDuplo: number;
  giro: number;
}

export interface SentinelRun {
  def: SentinelDef;
  slot: number;
  nivel: number;
  evoluido: boolean;
  run: Mods;
  stats: SentinelStats;
  x: number;
  y: number;
  ang: number;
  cd: number;
  retarget: number;
  alvo: Enemy | null;
  /** Laser: ângulos/alvos dos raios. */
  raios: { alvo: Enemy | null; ang: number; tick: number; ativo: boolean; x2: number; y2: number }[];
  modoAlvo: "proximo" | "maisHp" | "chefe" | "aleatorio";
  danoCausado: number;
  view?: unknown;
}

export interface Drone {
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alvo: Enemy | null;
  cd: number;
  retarget: number;
  dono: SentinelRun | null;
  temp: number; // >0 = drone temporário do ultimate (tempo restante)
  ang: number;
  view?: unknown;
}

export interface Zone {
  alive: boolean;
  x: number;
  y: number;
  r: number;
  life: number;
  maxLife: number;
  dano: number;
  tick: number;
  lentidao: number;
  puxao: number;
  buracoNegro: boolean;
  src: SentinelRun | null;
  view?: unknown;
}

/** Efeitos visuais de linha (laser, raio, pulso) com vida curta. */
export interface Beam {
  kind: "raio" | "pulso" | "linha";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cor: number;
  life: number;
  maxLife: number;
  w: number;
}

export type FxEvent =
  | { t: "dmg"; x: number; y: number; v: number; crit: boolean }
  | { t: "dmgPlaneta"; x: number; y: number; v: number }
  | { t: "morte"; x: number; y: number; cor: number; r: number }
  | { t: "explosao"; x: number; y: number; r: number; cor: number }
  | { t: "escudo"; ang: number }
  | { t: "tremor"; força: number }
  | { t: "flash"; força: number }
  | { t: "som"; id: string }
  | { t: "absorve"; x: number; y: number };
