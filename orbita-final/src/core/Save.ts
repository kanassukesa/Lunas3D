import { SENTINELS, SENTINEL_IDS } from "../data/sentinels";
import { STAGES } from "../data/stages";
import type { Chip, ChipSlot, SentinelId } from "../data/types";

export const SAVE_VERSAO = 1;
const KEY = "orbita-final-save";

export interface Config {
  efeitos: "completo" | "leve";
  numeros: boolean;
  brilho: boolean;
  bloom: boolean;
  som: number;
  musica: number;
  fps: boolean;
}

export interface SaveData {
  v: number;
  creditos: number;
  nucleos: number;
  cristais: number;
  sentinelas: Record<SentinelId, { desbloqueada: boolean; nivel: number }>;
  deck: { base: SentinelId; pool: SentinelId[] };
  campanha: { normal: number[]; dificil: number[] };
  chips: Chip[];
  equipados: Partial<Record<ChipSlot, number>>;
  proxUid: number;
  talentos: Record<string, number>;
  estatisticas: Record<string, number>;
  missoesResgatadas: string[];
  config: Config;
  diario: { data: string; melhor: number; concluido: boolean };
  sobrevivenciaMelhor: number;
  tutorialVisto: boolean;
  jornada: { semana: string; melhor: number; concluida: boolean };
  /** Login local do comandante. */
  perfil: { nome: string; avatar: number };
  /** Pontuação acumulada (define a patente). */
  pontos: number;
  dia: { data: string; stats: Record<string, number>; resgatadas: string[]; bonus: boolean; lojaGratis: boolean };
  login: { ultimoDia: string; dias: number };
  correio: { lidas: string[]; resgatadas: string[] };
  skins: { possui: string[]; planeta: string; escudo: string };
  passe: { temporada: string; pontos: number; resgatados: number[] };
  /** Passos do tutorial guiado já mostrados. */
  tutorialPassos: string[];
}

export function saveNovo(): SaveData {
  const sentinelas = {} as SaveData["sentinelas"];
  for (const id of SENTINEL_IDS) sentinelas[id] = { desbloqueada: SENTINELS[id].desbloqueio === 0, nivel: 1 };
  return {
    v: SAVE_VERSAO,
    creditos: 0,
    nucleos: 0,
    cristais: 0,
    sentinelas,
    deck: { base: "canhao", pool: ["laser", "feixe", "missil", "campo"] },
    campanha: { normal: STAGES.map(() => 0), dificil: STAGES.map(() => 0) },
    chips: [],
    equipados: {},
    proxUid: 1,
    talentos: {},
    estatisticas: {},
    missoesResgatadas: [],
    config: { efeitos: "completo", numeros: true, brilho: true, bloom: true, som: 0.7, musica: 0.5, fps: false },
    diario: { data: "", melhor: 0, concluido: false },
    sobrevivenciaMelhor: 0,
    tutorialVisto: false,
    jornada: { semana: "", melhor: 0, concluida: false },
    perfil: { nome: "", avatar: 1 },
    pontos: 0,
    dia: { data: "", stats: {}, resgatadas: [], bonus: false, lojaGratis: false },
    login: { ultimoDia: "", dias: 0 },
    correio: { lidas: [], resgatadas: [] },
    skins: { possui: ["escudo_azul", "planeta_terra"], planeta: "planeta_terra", escudo: "escudo_azul" },
    passe: { temporada: "", pontos: 0, resgatados: [] },
    tutorialPassos: [],
  };
}

/** Migrações por versão. Cada função recebe o save da versão N e devolve o da N+1. */
const MIGRACOES: Record<number, (s: Record<string, unknown>) => Record<string, unknown>> = {
  // 1: (s) => ({ ...s, v: 2, novoCampo: ... }),
};

function preencher<T>(padrao: T, dado: unknown): T {
  if (Array.isArray(padrao)) {
    if (!Array.isArray(dado)) return padrao;
    // arrays de tamanho fixo (estrelas) preservam o tamanho do padrão
    if (padrao.length && typeof padrao[0] === "number") return padrao.map((v, i) => (typeof dado[i] === "number" ? dado[i] : v)) as T;
    return dado as T;
  }
  if (padrao && typeof padrao === "object") {
    if (!dado || typeof dado !== "object") return padrao;
    const out: Record<string, unknown> = { ...(dado as Record<string, unknown>) };
    for (const k of Object.keys(padrao as object)) out[k] = preencher((padrao as Record<string, unknown>)[k], (dado as Record<string, unknown>)[k]);
    return out as T;
  }
  return (typeof dado === typeof padrao ? dado : padrao) as T;
}

export function carregar(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return saveNovo();
    let obj = JSON.parse(raw) as Record<string, unknown>;
    let v = Number(obj.v ?? 1);
    while (v < SAVE_VERSAO && MIGRACOES[v]) {
      obj = MIGRACOES[v](obj);
      v++;
    }
    const s = preencher(saveNovo(), obj);
    s.v = SAVE_VERSAO;
    return s;
  } catch {
    return saveNovo();
  }
}

export function salvar(s: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* armazenamento indisponível (modo privado) — o jogo segue sem salvar */
  }
}

export function apagar(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function stat(s: SaveData, k: string, v: number): void {
  s.estatisticas[k] = (s.estatisticas[k] ?? 0) + v;
}
