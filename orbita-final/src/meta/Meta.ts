import type { Battle } from "../battle/Battle";
import type { MetaSnapshot } from "../battle/Loadout";
import { BALANCE, custoHangar } from "../data/balance";
import { CHIP_PRINCIPAL, CHIP_SECUNDARIO_FATOR, CHIP_SETS, CHIP_SLOTS, CHIP_STATS } from "../data/chips";
import { MISSIONS } from "../data/missions";
import { DAILY_MODS, type DailyMod } from "../data/modes";
import { SENTINELS } from "../data/sentinels";
import { STAGES } from "../data/stages";
import { TALENTS } from "../data/talents";
import type { Chip, SentinelId, StageDef } from "../data/types";
import { Rng, hashString } from "../core/Rng";
import { stat, type SaveData } from "../core/Save";
import type { Modo } from "../battle/types";
import { CAMPOS, JORNADA, type CampoDef } from "../data/journey";

export function snapshot(s: SaveData): MetaSnapshot {
  const niveis: MetaSnapshot["niveis"] = {};
  for (const id of Object.keys(s.sentinelas) as SentinelId[]) niveis[id] = s.sentinelas[id].nivel;
  const chips = Object.values(s.equipados)
    .map((uid) => s.chips.find((c) => c.uid === uid))
    .filter((c): c is Chip => !!c);
  return { niveis, talentos: s.talentos, chipsEquipados: chips, base: s.deck.base, pool: s.deck.pool };
}

// ------------------------------------------------------------- hangar

export function podeMelhorar(s: SaveData, id: SentinelId): { ok: boolean; custo: number } {
  const st = s.sentinelas[id];
  const custo = custoHangar(st.nivel);
  return { ok: st.desbloqueada && st.nivel < BALANCE.hangar.nivelMax && s.creditos >= custo, custo };
}

export function melhorar(s: SaveData, id: SentinelId): boolean {
  const { ok, custo } = podeMelhorar(s, id);
  if (!ok) return false;
  s.creditos -= custo;
  s.sentinelas[id].nivel++;
  return true;
}

export function desbloquear(s: SaveData, id: SentinelId): boolean {
  const custo = SENTINELS[id].desbloqueio;
  if (s.sentinelas[id].desbloqueada || s.nucleos < custo) return false;
  s.nucleos -= custo;
  s.sentinelas[id].desbloqueada = true;
  if (s.deck.pool.length < BALANCE.maxSlots - 1 && !s.deck.pool.includes(id) && s.deck.base !== id) s.deck.pool.push(id);
  return true;
}

// ------------------------------------------------------------- talentos

export function custoTalento(id: string, nivel: number): number {
  return TALENTS.find((t) => t.id === id)!.custo(nivel);
}

export function comprarTalento(s: SaveData, id: string): boolean {
  const t = TALENTS.find((x) => x.id === id);
  if (!t) return false;
  const n = s.talentos[id] ?? 0;
  if (n >= t.max) return false;
  const c = t.custo(n);
  if (s[t.moeda] < c) return false;
  s[t.moeda] -= c;
  s.talentos[id] = n + 1;
  return true;
}

// ------------------------------------------------------------- chips

export function gerarChip(s: SaveData, rng: Rng, raridade: number): Chip {
  const slot = rng.pick(CHIP_SLOTS);
  const set = rng.pick(CHIP_SETS).id;
  const principal = rng.pick(CHIP_PRINCIPAL[slot]);
  const nSec = [1, 1, 2, 3][raridade];
  const opcoes = Object.keys(CHIP_STATS).filter((k) => k !== principal);
  const secundarios: Chip["secundarios"] = [];
  for (let i = 0; i < nSec && opcoes.length; i++) {
    const k = opcoes.splice(Math.floor(rng.next() * opcoes.length), 1)[0];
    const v = CHIP_STATS[k].valores[raridade] * CHIP_SECUNDARIO_FATOR * rng.range(0.7, 1.2);
    secundarios.push({ stat: k, valor: CHIP_STATS[k].pct ? Math.round(v * 1000) / 1000 : Math.max(1, Math.round(v)) });
  }
  return { uid: s.proxUid++, slot, set, raridade, principal: { stat: principal, valor: CHIP_STATS[principal].valores[raridade] }, secundarios };
}

export function raridadeDrop(rng: Rng, fase: number, dificil: boolean): number {
  const bonus = fase / 10 + (dificil ? 0.5 : 0);
  const pesos = [Math.max(10, 60 - bonus * 40), 28 + bonus * 15, 9 + bonus * 15, 2 + bonus * 6];
  return rng.weighted(pesos);
}

/** Funde 3 chips de mesmo encaixe e raridade em 1 de raridade acima. */
export function fundir(s: SaveData, uids: number[]): Chip | null {
  if (uids.length !== 3) return null;
  const chips = uids.map((u) => s.chips.find((c) => c.uid === u)).filter((c): c is Chip => !!c);
  if (chips.length !== 3) return null;
  const { slot, raridade } = chips[0];
  if (raridade >= 3 || chips.some((c) => c.slot !== slot || c.raridade !== raridade)) return null;
  const rng = new Rng(Date.now() >>> 0);
  let novo = gerarChip(s, rng, raridade + 1);
  // mantém o encaixe e o conjunto do primeiro chip
  novo = { ...novo, slot, set: chips[0].set, principal: { stat: rng.pick(CHIP_PRINCIPAL[slot]), valor: 0 } };
  novo.principal.valor = CHIP_STATS[novo.principal.stat].valores[raridade + 1];
  for (const c of chips) {
    for (const k of Object.keys(s.equipados) as (keyof SaveData["equipados"])[]) if (s.equipados[k] === c.uid) delete s.equipados[k];
  }
  s.chips = s.chips.filter((c) => !uids.includes(c.uid));
  s.chips.push(novo);
  return novo;
}

export function formatStat(statId: string, valor: number): string {
  const d = CHIP_STATS[statId];
  if (!d) return `${statId} ${valor}`;
  return d.pct ? `+${(valor * 100).toFixed(valor < 0.1 ? 1 : 0)}% ${d.nome}` : `+${valor} ${d.nome}`;
}

// ------------------------------------------------------------- desafio diário

export function hojeStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function desafioDoDia(): { seed: number; stage: StageDef; mod: DailyMod } {
  const seed = hashString("orbita-" + hojeStr());
  const rng = new Rng(seed);
  const base = STAGES[rng.int(2, 6)];
  const mod = rng.pick(DAILY_MODS);
  return { seed, mod, stage: { ...base, nome: `Diário: ${mod.nome}`, mult: base.mult * 0.9 } };
}

// ------------------------------------------------------------- jornada

/** Semana ISO no formato 2026-W47 (muda toda segunda-feira). */
export function semanaStr(d = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dia = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dia);
  const ano = t.getUTCFullYear();
  const semana = Math.ceil(((t.getTime() - Date.UTC(ano, 0, 1)) / 86400000 + 1) / 7);
  return `${ano}-W${String(semana).padStart(2, "0")}`;
}

export function jornadaDaSemana(): { seed: number; campos: CampoDef[]; etapas: StageDef[] } {
  const seed = hashString("jornada-" + semanaStr());
  const rng = new Rng(seed);
  const pool = [...CAMPOS];
  const campos: CampoDef[] = [];
  for (let i = 0; i < 2; i++) campos.push(pool.splice(Math.floor(rng.next() * pool.length), 1)[0]);
  const fases = [...JORNADA.poolFases];
  const etapas: StageDef[] = [];
  const k = JORNADA.entradaChefe / 280;
  for (let i = 0; i < JORNADA.etapas; i++) {
    const base = STAGES[fases.splice(Math.floor(rng.next() * fases.length), 1)[0]];
    etapas.push({
      ...base,
      nome: `Jornada ${i + 1}/${JORNADA.etapas} · ${base.nome}`,
      duracao: JORNADA.duracao,
      mult: JORNADA.multEtapa[i],
      // comprime a linha do tempo da fase para a duração da etapa
      ondas: base.ondas.map((o) => ({ ...o, t: o.t * k, qtd: Math.max(1, Math.round(o.qtd * k)) })),
    });
  }
  return { seed, campos, etapas };
}

// ------------------------------------------------------------- recompensas

export interface Recompensa {
  creditos: number;
  nucleos: number;
  chip: Chip | null;
  primeiraVez: boolean;
  recorde: boolean;
}

export function calcularRecompensas(s: SaveData, b: Battle, modo: Modo): Recompensa {
  const fim = b.fim!;
  const stage = b.cfg.stage;
  const R = BALANCE.recompensas;
  const credMult = 1 + (b.cfg.globais.pct.creditos ?? 0);
  const dif = b.cfg.dificil ? 2 : 1;
  let creditos = (fim.abates * R.creditosPorAbate + fim.tempo * R.creditosPorSegundo) * (1 + stage.id * 0.15);
  if (fim.vitoria) creditos += R.creditosVitoriaPorFase * stage.id;
  creditos = Math.round(creditos * credMult * dif);
  let nucleos = 0;
  let primeiraVez = false;
  let recorde = false;
  let chip: Chip | null = null;
  const rng = new Rng((Date.now() ^ (fim.abates * 7919)) >>> 0);

  if (modo === "campanha") {
    const arr = b.cfg.dificil ? s.campanha.dificil : s.campanha.normal;
    const idx = stage.id - 1;
    if (fim.vitoria) {
      primeiraVez = arr[idx] === 0;
      nucleos = R.nucleosChefeBase + stage.id + (primeiraVez ? 5 : 0);
      if (b.cfg.dificil) nucleos *= 2;
      arr[idx] = Math.max(arr[idx], fim.estrelas);
      chip = gerarChip(s, rng, raridadeDrop(rng, stage.id, b.cfg.dificil));
    }
  } else if (modo === "diario") {
    if (fim.vitoria) {
      nucleos = 8;
      if (!s.diario.concluido) {
        stat(s, "diarios", 1);
        s.cristais += 5;
      }
      s.diario.concluido = true;
      chip = gerarChip(s, rng, raridadeDrop(rng, 8, false));
    }
    if (fim.tempo > s.diario.melhor) {
      recorde = true;
      s.diario.melhor = fim.tempo;
    }
  } else if (modo === "jornada") {
    const n = fim.etapas;
    creditos += Math.round(JORNADA.recompensaEtapa.creditos * n * (1 + n * 0.3) * credMult);
    nucleos = JORNADA.recompensaEtapa.nucleos * n;
    if (s.jornada.semana !== semanaStr()) s.jornada = { semana: semanaStr(), melhor: 0, concluida: false };
    if (n > s.jornada.melhor) {
      recorde = true;
      s.jornada.melhor = n;
    }
    if (fim.vitoria) {
      if (!s.jornada.concluida) {
        nucleos += JORNADA.recompensaFinal.nucleos;
        s.cristais += JORNADA.recompensaFinal.cristais;
        primeiraVez = true;
        stat(s, "jornadas", 1);
      }
      s.jornada.concluida = true;
      chip = gerarChip(s, rng, Math.max(2, raridadeDrop(rng, 10, true)));
    } else if (n >= 2) chip = gerarChip(s, rng, raridadeDrop(rng, 4 + n, false));
  } else {
    nucleos = (b.chefesMortos ?? 0) * 4;
    if (fim.tempo > s.sobrevivenciaMelhor) {
      recorde = true;
      s.sobrevivenciaMelhor = fim.tempo;
    }
    if (fim.tempo > 300) chip = gerarChip(s, rng, raridadeDrop(rng, Math.min(10, fim.tempo / 60), false));
  }

  s.creditos += creditos;
  s.nucleos += nucleos;
  if (chip) s.chips.push(chip);
  stat(s, "abates", fim.abates);
  stat(s, "partidas", 1);
  stat(s, "evolucoes", fim.evolucoes);
  if (fim.chefeDerrotado || (b.chefesMortos ?? 0) > 0) stat(s, "chefes", Math.max(1, b.chefesMortos ?? 0));
  s.estatisticas.estrelas = s.campanha.normal.reduce((a, x) => a + x, 0) + s.campanha.dificil.reduce((a, x) => a + x, 0);
  return { creditos, nucleos, chip, primeiraVez, recorde };
}

// ------------------------------------------------------------- missões

export function missoesProntas(s: SaveData): number {
  return MISSIONS.filter((m) => !s.missoesResgatadas.includes(m.id) && (s.estatisticas[m.stat] ?? 0) >= m.meta).length;
}

export function resgatarMissao(s: SaveData, id: string): boolean {
  const m = MISSIONS.find((x) => x.id === id);
  if (!m || s.missoesResgatadas.includes(id) || (s.estatisticas[m.stat] ?? 0) < m.meta) return false;
  s.missoesResgatadas.push(id);
  s.creditos += m.recompensa.creditos ?? 0;
  s.nucleos += m.recompensa.nucleos ?? 0;
  s.cristais += m.recompensa.cristais ?? 0;
  return true;
}

export function faseLiberada(s: SaveData, idx: number, dificil: boolean): boolean {
  if (dificil) {
    if (s.campanha.normal[STAGES.length - 1] === 0) return false;
    return idx === 0 || s.campanha.dificil[idx - 1] > 0;
  }
  return idx === 0 || s.campanha.normal[idx - 1] > 0;
}

export const CUSTO_REVIVER = 15;
