import type { LinhaRankingEnvio } from "../core/Nuvem";
import { BALANCE, DIFICULDADES } from "../data/balance";
import type { Battle } from "../battle/Battle";
import type { Modo } from "../battle/types";
import { AVATARES, BONUS_DIARIAS, BONUS_DIARIAS_XP, CORREIO, DIARIAS_POR_DIA, type ComandanteDef, type UltId, LOGIN_DIAS, LOJA, MISSOES_DIARIAS, MISSOES_SEMANAIS, PASSE, PASSE_PREMIOS, PATENTES, SEMANAIS_POR_SEMANA, SKINS, type MissaoDiariaDef, type Patente, type Premio } from "../data/comandante";
import { Rng, hashString } from "../core/Rng";
import type { SaveData } from "../core/Save";
import { gerarChip, hojeStr, semanaStr } from "./Meta";
import type { Chip } from "../data/types";

// ------------------------------------------------------------- pontuação e patente

/** Pontos ganhos numa partida. */
export function pontosDaPartida(b: Battle, modo: Modo): number {
  const f = b.fim!;
  let p = f.abates * 2 + f.tempo * 1 + b.chefesMortos * 300 + f.evolucoes * 200 + b.pontosCombo + b.melhorCombo * 3;
  if (modo === "campanha") p += (f.vitoria ? 400 * b.cfg.stage.id : 0) + f.estrelas * 150;
  if (modo === "diario" && f.vitoria) p += 1500;
  if (modo === "jornada") p += f.etapas * 900;
  if (modo === "sobrevivencia") p += f.tempo * 2;
  p *= DIFICULDADES[b.cfg.dif].premio;
  if (b.desistiu) p *= BALANCE.recompensas.fatorDesistencia;
  return Math.round(p);
}

/** Patente atual: exige os pontos E a fase da campanha vencida. `trava` diz o que falta quando os pontos já bastam. */
export function patenteDe(s: Pick<SaveData, "pontos" | "campanha">): { atual: Patente; prox: Patente | null; frac: number; indice: number; trava: string | null } {
  const vencidas = s.campanha.normal.filter((x) => x > 0).length;
  const ok = (p: Patente) => s.pontos >= p.pontos && (p.fase <= 0 || (s.campanha.normal[p.fase - 1] ?? 0) > 0 || vencidas >= p.fase);
  let i = 0;
  while (i + 1 < PATENTES.length && ok(PATENTES[i + 1])) i++;
  const atual = PATENTES[i];
  const prox = PATENTES[i + 1] ?? null;
  const frac = prox ? Math.min(1, (s.pontos - atual.pontos) / (prox.pontos - atual.pontos)) : 1;
  const trava = prox && s.pontos >= prox.pontos ? `Vença a Fase ${prox.fase} para ser promovido` : null;
  return { atual, prox, frac, indice: i, trava };
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

export function atualizarSemana(s: SaveData): void {
  const sem = semanaStr();
  if (s.semana.id !== sem) s.semana = { id: sem, stats: {}, resgatadas: [] };
}

/** Soma no contador do dia e no da semana (as missões semanais usam os mesmos stats). */
export function statDia(s: SaveData, k: string, v: number): void {
  atualizarDia(s);
  atualizarSemana(s);
  s.dia.stats[k] = (s.dia.stats[k] ?? 0) + v;
  s.semana.stats[k] = (s.semana.stats[k] ?? 0) + v;
}

/** XP do passe: só missões dão (partida não dá). */
function ganharXpPasse(s: SaveData, xp: number): void {
  atualizarTemporada(s);
  s.passe.pontos += xp;
}

export function missoesDaSemana(): MissaoDiariaDef[] {
  const rng = new Rng(hashString("semanais-" + semanaStr()));
  const pool = [...MISSOES_SEMANAIS];
  const out: MissaoDiariaDef[] = [];
  while (out.length < SEMANAIS_POR_SEMANA && pool.length) out.push(pool.splice(Math.floor(rng.next() * pool.length), 1)[0]);
  return out;
}

export function resgatarSemanal(s: SaveData, id: string): boolean {
  atualizarSemana(s);
  const m = missoesDaSemana().find((x) => x.id === id);
  if (!m || s.semana.resgatadas.includes(id) || (s.semana.stats[m.stat] ?? 0) < m.meta) return false;
  s.semana.resgatadas.push(id);
  darPremio(s, m.premio);
  ganharXpPasse(s, m.xp);
  return true;
}

export function missoesDoDia(): MissaoDiariaDef[] {
  const rng = new Rng(hashString("missoes-" + hojeStr()));
  const pool = [...MISSOES_DIARIAS];
  const out: MissaoDiariaDef[] = [];
  while (out.length < DIARIAS_POR_DIA && pool.length) {
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
  ganharXpPasse(s, m.xp);
  // conta para a semanal "Complete 20 missões diárias"
  atualizarSemana(s);
  s.semana.stats.diarias = (s.semana.stats.diarias ?? 0) + 1;
  return true;
}

export function resgatarBonusDiario(s: SaveData): boolean {
  atualizarDia(s);
  if (s.dia.bonus || s.dia.resgatadas.length < DIARIAS_POR_DIA) return false;
  s.dia.bonus = true;
  darPremio(s, BONUS_DIARIAS);
  ganharXpPasse(s, BONUS_DIARIAS_XP);
  return true;
}

/** Missões (diárias, bônus e semanais) prontas para resgatar: o número do selo no menu. */
export function diariasProntas(s: SaveData): number {
  atualizarDia(s);
  atualizarSemana(s);
  const n = missoesDoDia().filter((m) => !s.dia.resgatadas.includes(m.id) && (s.dia.stats[m.stat] ?? 0) >= m.meta).length;
  const sem = missoesDaSemana().filter((m) => !s.semana.resgatadas.includes(m.id) && (s.semana.stats[m.stat] ?? 0) >= m.meta).length;
  return n + sem + (s.dia.resgatadas.length >= DIARIAS_POR_DIA && !s.dia.bonus ? 1 : 0);
}

/** Registra a partida nos contadores do dia e na pontuação do comandante.
 *  `valePontos = false` (partidas do tutorial): não conta nada (nem patente, nem missões, que dão XP do passe). */
export function registrarPartida(s: SaveData, b: Battle, modo: Modo, valePontos = true): number {
  if (!valePontos) return 0;
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

// ------------------------------------------------------------- passe de batalha

/** Temporada = mês corrente (AAAA-MM). Ao virar o mês, o passe recomeça. */
export function temporadaAtual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function atualizarTemporada(s: SaveData): void {
  const t = temporadaAtual();
  if (s.passe.temporada !== t || s.passe.v !== PASSE.versao) {
    // regra nova (passe por missões, 60 níveis): quem tinha progresso da regra antiga recomeça
    if (s.passe.temporada === t && s.passe.v !== PASSE.versao) s.monet.premiumResgatados = [];
    s.passe = { temporada: t, pontos: 0, resgatados: [], v: PASSE.versao };
  }
}

export function nivelPasse(s: SaveData): { nivel: number; frac: number; xp: number } {
  atualizarTemporada(s);
  const n = Math.min(PASSE.niveis, Math.floor(s.passe.pontos / PASSE.xpPorNivel));
  const frac = n >= PASSE.niveis ? 1 : (s.passe.pontos % PASSE.xpPorNivel) / PASSE.xpPorNivel;
  return { nivel: n, frac, xp: s.passe.pontos % PASSE.xpPorNivel };
}

export function passeProntos(s: SaveData): number {
  const { nivel } = nivelPasse(s);
  let n = 0;
  for (let i = 1; i <= nivel; i++) if (!s.passe.resgatados.includes(i)) n++;
  return n;
}

export function resgatarPasse(s: SaveData, nivel: number): { chip: Chip | null; skin?: string } | null {
  if (nivelPasse(s).nivel < nivel || s.passe.resgatados.includes(nivel)) return null;
  s.passe.resgatados.push(nivel);
  const p = PASSE_PREMIOS[nivel - 1];
  if (p.skin && !s.skins.possui.includes(p.skin)) s.skins.possui.push(p.skin);
  return { chip: darPremio(s, p), skin: p.skin };
}

// ------------------------------------------------------------- skins

export function comprarSkin(s: SaveData, id: string): boolean {
  const sk = SKINS.find((x) => x.id === id);
  if (!sk || sk.preco === null || s.skins.possui.includes(id) || s.cristais < sk.preco) return false;
  s.cristais -= sk.preco;
  s.skins.possui.push(id);
  return true;
}

export function usarSkin(s: SaveData, id: string): boolean {
  const sk = SKINS.find((x) => x.id === id);
  if (!sk || !s.skins.possui.includes(id)) return false;
  if (sk.tipo === "escudo") s.skins.escudo = id;
  else s.skins.planeta = id;
  return true;
}

/** Linha que o jogador publica no ranking global (recordes por modo). */
export function linhaRanking(s: SaveData): LinhaRankingEnvio {
  const e = s.estatisticas;
  const ch = ["partidas", "abates", "chefes", "evolucoes", "melhorPartida", "jornadas", "diarios"] as const;
  return {
    perfil: {
      e: Object.fromEntries(ch.map((k) => [k, Math.floor(e[k] ?? 0)])),
      fases: s.campanha.normal.filter((x) => x > 0).length,
      fasesDificil: (s.campanha as unknown as { dificil?: number[] }).dificil?.filter((x) => x > 0).length ?? 0,
      skinPlaneta: s.skins.planeta, skinEscudo: s.skins.escudo, skins: s.skins.possui.slice(0, 40), ult: ultDoComandante(s),
    },
    nome: s.perfil.nome, avatar: s.perfil.avatar, patente: patenteDe(s).indice, pontos: Math.floor(s.pontos),
    estrelas: s.estatisticas.estrelas ?? 0, sobrevivencia: Math.floor(s.sobrevivenciaMelhor),
    jornada_semana: s.jornada.semana, jornada: s.jornada.melhor, diario_dia: s.diario.data, diario: Math.floor(s.diario.melhor),
  };
}

/** O marco que libera uma arma da progressão foi cumprido? */
export function marcoCumprido(s: SaveData, libera: { fase?: number; patente?: number }): boolean {
  if (libera.fase && !((s.campanha.normal[libera.fase - 1] ?? 0) > 0)) return false;
  if (libera.patente && patenteDe(s).indice < libera.patente) return false;
  return true;
}

/** O comandante pode ser escolhido? (Elite = Passe Premium ativo; normais = marco cumprido.) */
export function comandanteLiberado(s: SaveData, def: ComandanteDef): boolean {
  if (def.elite) return s.monet.passePremium === temporadaAtual();
  return !def.libera || marcoCumprido(s, def.libera);
}

/** Ultimate que o comandante escolhido leva para a partida. */
export function ultDoComandante(s: SaveData): UltId {
  const def = AVATARES.find((a) => a.id === s.perfil.avatar);
  if (!def || !comandanteLiberado(s, def)) return "canhao";
  return def.ult;
}
