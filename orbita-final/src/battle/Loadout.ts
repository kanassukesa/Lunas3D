import { BALANCE } from "../data/balance";
import { CHIP_SET_MAP } from "../data/chips";
import { SENTINELS } from "../data/sentinels";
import { TALENTS } from "../data/talents";
import type { Chip, SentinelId, StageDef } from "../data/types";
import type { DailyMod } from "../data/modes";
import { CAMPOS } from "../data/journey";
import { Mods } from "./StatSystem";
import type { Modo, RunConfig } from "./types";

export interface MetaSnapshot {
  niveis: Partial<Record<SentinelId, number>>;
  talentos: Record<string, number>;
  chipsEquipados: Chip[];
  base: SentinelId;
  pool: SentinelId[];
}

/** Modificadores permanentes de uma sentinela: nível do hangar + traços liberados. */
export function modsPermanentes(id: SentinelId, nivel: number): Mods {
  const m = new Mods();
  m.apply({ danoPct: BALANCE.hangar.danoPorNivel * (nivel - 1) });
  for (const t of SENTINELS[id].tracos) if (nivel >= t.nivel) m.apply(t.efeito);
  return m;
}

export function modsGlobais(meta: MetaSnapshot): Mods {
  const g = new Mods();
  for (const t of TALENTS) {
    const n = meta.talentos[t.id] ?? 0;
    if (n > 0) g.apply(t.efeito(n));
  }
  const porSet: Record<string, number> = {};
  for (const c of meta.chipsEquipados) {
    g.apply({ [c.principal.stat]: c.principal.valor });
    for (const s of c.secundarios) g.apply({ [s.stat]: s.valor });
    porSet[c.set] = (porSet[c.set] ?? 0) + 1;
  }
  for (const [set, n] of Object.entries(porSet)) {
    const def = CHIP_SET_MAP[set];
    if (!def) continue;
    if (n >= 2) g.apply(def.bonus2.efeito);
    if (n >= 4) g.apply(def.bonus4.efeito);
  }
  return g;
}

export function montarRun(opts: {
  modo: Modo;
  stage: StageDef;
  dif: number;
  seed: number;
  meta: MetaSnapshot;
  daily?: DailyMod;
  tutorial?: boolean;
  campos?: string[];
  etapas?: StageDef[];
}): RunConfig {
  const { meta, daily } = opts;
  const globais = modsGlobais(meta);
  let base = meta.base;
  let pool = [...new Set([meta.base, ...meta.pool])];
  if (daily?.sentinelas) {
    base = daily.sentinelas[0];
    pool = [...daily.sentinelas];
  }
  if (daily?.efeito) globais.apply(daily.efeito);
  for (const id of opts.campos ?? []) {
    const c = CAMPOS.find((x) => x.id === id);
    if (c?.efeito) globais.apply(c.efeito);
  }
  const perm: RunConfig["perm"] = {};
  for (const id of pool) perm[id] = modsPermanentes(id, meta.niveis[id] ?? 1);
  return {
    modo: opts.modo, stage: opts.stage, dif: opts.dif, seed: opts.seed, base, pool, globais, perm, daily,
    tutorial: opts.tutorial ?? false,
    campos: opts.campos,
    etapas: opts.etapas,
  };
}
