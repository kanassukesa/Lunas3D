import type { SaveData } from "../core/Save";
import { eventosAtivos, type EventoDef, type MetaEvento } from "../data/eventos";

/** Progresso salvo de um evento (criado na primeira vez que algo conta). */
function dados(s: SaveData, id: string): { stats: Record<string, number>; resgatados: string[] } {
  s.eventos ??= {};
  return (s.eventos[id] ??= { stats: {}, resgatados: [] });
}

/** Soma uma estatística em todos os eventos ativos (chamado junto com as missões). */
export function statEventos(s: SaveData, k: string, v: number): void {
  for (const e of eventosAtivos()) {
    if (!e.metas.some((m) => m.stat === k)) continue;
    const d = dados(s, e.id);
    d.stats[k] = (d.stats[k] ?? 0) + v;
  }
}

export function progressoMeta(s: SaveData, e: EventoDef, m: MetaEvento): { valor: number; pronta: boolean; resgatada: boolean } {
  const d = s.eventos?.[e.id];
  const valor = d?.stats[m.stat] ?? 0;
  const resgatada = d?.resgatados.includes(m.id) ?? false;
  return { valor, resgatada, pronta: !resgatada && valor >= m.meta };
}

/** Marca a meta como resgatada (o prêmio é dado por quem chama, com darPremio). */
export function marcarResgate(s: SaveData, e: EventoDef, m: MetaEvento): boolean {
  if (!progressoMeta(s, e, m).pronta) return false;
  dados(s, e.id).resgatados.push(m.id);
  return true;
}

/** Quantos prêmios de evento estão prontos para resgatar (para o "!" do botão). */
export function premiosDeEventoProntos(s: SaveData): number {
  let n = 0;
  for (const e of eventosAtivos()) for (const m of e.metas) if (progressoMeta(s, e, m).pronta) n++;
  return n;
}
