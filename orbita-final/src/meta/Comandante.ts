import type { Battle } from "../battle/Battle";
import type { Modo } from "../battle/types";
import { BONUS_DIARIAS, CORREIO, LOGIN_DIAS, LOJA, MISSOES_DIARIAS, PATENTES, type MissaoDiariaDef, type Patente, type Premio } from "../data/comandante";
import { Rng, hashString } from "../core/Rng";
import type { SaveData } from "../core/Save";
import { gerarChip, hojeStr } from "./Meta";
import type { Chip } from "../data/types";

// ------------------------------------------------------------- pontuação e patente

/** Pontos ganhos numa partida. */
export function pontosDaPartida(b: Battle, modo: Modo): number {
  const f = b.fim!;
  let p = f.abates * 2 + f.tempo * 1 + b.chefesMortos * 300 + f.evolucoes * 200;
  if (modo === "campanha") p += (f.vitoria ? 400 * b.cfg.stage.id : 0) + f.estrelas * 150;
  if (modo === "diario" && f.vitoria) p += 1500;
  if (modo === "jornada") p += f.etapas * 900;
  if (modo === "sobrevivencia") p += f.tempo * 2;
  if (b.cfg.dificil) p *= 2;
  return Math.round(p);
}

export function patenteDe(pontos: number): { atual: Patente; prox: Patente | null; frac: number; indice: number } {
  let i = 0;
  while (i + 1 < PATENTES.length && pontos >= PATENTES[i + 1].pontos) i++;
  const atual = PATENTES[i];
  const prox = PATENTES[i + 1] ?? null;
  const frac = prox ? (pontos - atual.pontos) / (prox.pontos - atual.pontos) : 1;
  return { atual, prox, frac, indice: i };
}

// ------------------------------------------------------------- prêmios

export function darPremio(s: SaveData, p: Premio): Chip | null {
  s.creditos += p.creditos ?? 0;
  s.nucleos += p.nucleos ?? 0;
  s.cristais += p.cristais ?? 0;
  if (p.chip === undefined) return null;
  const rng = new Rng((Date.now() ^ s.proxUid * 7919) >>> 0);
  let rar = rng.weighted([60, 28, 10, 2]);
  rar = Math.max(rar, p.chip);
  const c = gerarChip(s, rng, Math.min(3, rar));
  s.chips.push(c);
  return c;
}

// ------------------------------------------------------------- dia a dia

/** Zera contadores diários quando o dia muda. */
export function atualizarDia(s: SaveData): void {
  const hoje = hojeStr();
  if (s.dia.data !== hoje) s.dia = { data: hoje, stats: {}, resgatadas: [], bonus: false, lojaGratis: false };
}

export function statDia(s: SaveData, k: string, v: number): void {
  atualizarDia(s);
  s.dia.stats[k] = (s.dia.stats[k] ?? 0) + v;
}

export function missoesDoDia(): MissaoDiariaDef[] {
  const rng = new Rng(hashString("missoes-" + hojeStr()));
  const pool = [...MISSOES_DIARIAS];
  const out: MissaoDiariaDef[] = [];
  while (out.length < 3 && pool.length) {
    const m = pool.splice(Math.floor(rng.next() * pool.length), 1)[0];
    if (!out.some((o) => o.stat === m.stat)) out.push(m);
  }
  return out;
}

export function resgatarDiaria(s: SaveData, id: string): boolean {
  atualizarDia(s);
  const m = missoesDoDia().find((x) => x.id === id);
  if (!m || s.dia.resgatadas.includes(id) || (s.dia.stats[m.stat] ?? 0) < m.meta) return false;
  s.dia.resgatadas.push(id);
  darPremio(s, m.premio);
  return true;
}

export function resgatarBonusDiario(s: SaveData): boolean {
  atualizarDia(s);
  if (s.dia.bonus || s.dia.resgatadas.length < 3) return false;
  s.dia.bonus = true;
  darPremio(s, BONUS_DIARIAS);
  return true;
}

export function diariasProntas(s: SaveData): number {
  atualizarDia(s);
  const n = missoesDoDia().filter((m) => !s.dia.resgatadas.includes(m.id) && (s.dia.stats[m.stat] ?? 0) >= m.meta).length;
  return n + (s.dia.resgatadas.length >= 3 && !s.dia.bonus ? 1 : 0);
}

/** Registra a partida nos contadores do dia e na pontuação do comandante. */
export function registrarPartida(s: SaveData, b: Battle, modo: Modo): number {
  const f = b.fim!;
  const pts = pontosDaPartida(b, modo);
  s.pontos += pts;
  statDia(s, "partidas", 1);
  statDia(s, "abates", f.abates);
  statDia(s, "chefes", b.chefesMortos);
  statDia(s, "ultimates", b.ult.usos);
  statDia(s, "evolucoes", f.evolucoes);
  statDia(s, "pontos", pts);
  if (f.vitoria) statDia(s, "vitorias", 1);
  s.estatisticas.melhorPartida = Math.max(s.estatisticas.melhorPartida ?? 0, pts);
  return pts;
}

// ------------------------------------------------------------- login diário

export function loginDisponivel(s: SaveData): boolean {
  return s.login.ultimoDia !== hojeStr();
}

export function resgatarLogin(s: SaveData): { premio: Premio; chip: Chip | null } | null {
  if (!loginDisponivel(s)) return null;
  const premio = LOGIN_DIAS[s.login.dias % LOGIN_DIAS.length];
  s.login.dias++;
  s.login.ultimoDia = hojeStr();
  return { premio, chip: darPremio(s, premio) };
}

// ------------------------------------------------------------- loja

export function comprar(s: SaveData, id: string): { ok: boolean; msg: string; chip?: Chip | null } {
  atualizarDia(s);
  const it = LOJA.find((x) => x.id === id);
  if (!it) return { ok: false, msg: "Item não encontrado" };
  if (!it.custo) {
    if (s.dia.lojaGratis) return { ok: false, msg: "Volte amanhã para outro presente" };
    s.dia.lojaGratis = true;
  } else {
    if (s[it.custo.moeda] < it.custo.valor) return { ok: false, msg: "Moedas insuficientes" };
    s[it.custo.moeda] -= it.custo.valor;
  }
  const chip = darPremio(s, it.premio);
  return { ok: true, msg: `${it.nome}: recebido!`, chip };
}

// ------------------------------------------------------------- correio

export function mensagensNovas(s: SaveData): number {
  return CORREIO.filter((m) => !s.correio.lidas.includes(m.id) || (m.premio && !s.correio.resgatadas.includes(m.id))).length;
}

export function resgatarMensagem(s: SaveData, id: string): boolean {
  const m = CORREIO.find((x) => x.id === id);
  if (!m?.premio || s.correio.resgatadas.includes(id)) return false;
  s.correio.resgatadas.push(id);
  darPremio(s, m.premio);
  return true;
}

export function textoPremio(p: Premio, ic: { creditos: string; nucleos: string; cristais: string }): string {
  const partes: string[] = [];
  if (p.creditos) partes.push(`${ic.creditos} ${p.creditos.toLocaleString("pt-BR")}`);
  if (p.nucleos) partes.push(`${ic.nucleos} ${p.nucleos}`);
  if (p.cristais) partes.push(`${ic.cristais} ${p.cristais}`);
  if (p.chip !== undefined) partes.push(["Chip", "Chip raro", "Chip épico", "Chip lendário"][p.chip]);
  return partes.join(" &nbsp;");
}
