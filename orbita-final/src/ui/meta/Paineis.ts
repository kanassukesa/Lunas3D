/**
 * Telas Fases, Planeta, Chips, Modos e Hangar no layout dos mockups (painéis neon com arte).
 * Cada tela usa arte final quando existe (`banner_<tela>`, `fase_<n>`, `talento_<id>`, `modo_<id>`)
 * e cai para a arte que já temos enquanto ela não chega.
 */
import { BALANCE, DIF_LIBERA_FASE, DIFICULDADES } from "../../data/balance";
import { BOSSES } from "../../data/bosses";
import { CHIP_RARIDADE_COR, CHIP_RARIDADES, CHIP_SET_MAP, CHIP_SETS, CHIP_SLOT_NOME, CHIP_SLOTS } from "../../data/chips";
import { SENTINELS, SENTINEL_IDS } from "../../data/sentinels";
import { SETORES, STAGES } from "../../data/stages";
import { CAMPOS } from "../../data/journey";
import { ENEMIES } from "../../data/enemies";
import { botao3 } from "../Panels";
import { TALENTS } from "../../data/talents";
import type { Chip, ChipSlot, SentinelId } from "../../data/types";
import { audio } from "../../core/Audio";
import {
  comprarTalento, desafioDoDia, desbloquear, difLiberada, estrelasDe, faseLiberada, formatStat, fundir, hojeStr, jornadaDaSemana, melhorar, podeMelhorar, semanaStr,
} from "../../meta/Meta";
import { urlArte } from "../../render/Sprites";
import { marcoCumprido } from "../../meta/Comandante";
import { fmtInt, fmtTempo, h, hex, ICONE_MOEDA, iconeImg, toast } from "../dom";
import { ic, icT } from "../Icones";
import { moedas, type Nav } from "./Screens";

// ------------------------------------------------------------------ moldura comum

/** Tela com título grande e banner ilustrado no topo (rola junto com o conteúdo). */
function telaBanner(nav: Nav, titulo: string, banner: string | null, ...conteudo: (HTMLElement | null)[]): HTMLElement {
  const img = banner ? urlArte(banner) : null;
  return h("div", { class: "tela tela-v2" },
    h("div", { class: "topo topo-v2" },
      h("button", { class: "btn icone btn-voltar", html: ic("voltar"), "aria-label": "Voltar", onclick: () => nav.ir("hub") }),
      h("div", { class: "titulo-tela", text: titulo }),
      moedas(nav)),
    h("div", { class: "tela-conteudo" },
      img ? h("div", { class: "banner-topo" }, h("img", { src: img, alt: "" })) : h("div", { class: "banner-vazio" }),
      ...conteudo));
}

/** Primeira arte final disponível da lista. */
const arte = (...ids: string[]) => ids.map((i) => urlArte(i)).find(Boolean) ?? null;

// ------------------------------------------------------------------ FASES (lista)

/** Arte de fundo de cada fase enquanto `fase_<n>` não chega. */
const ARTE_FASE = ["planeta_mapa_lava", "carta_explosao", "tile_planeta", "chefe_eclipse", "carta_veneno", "carta_estilhaco", "carta_escudo", "carta_cadencia", "carta_velocidade", "chefe_singularidade"];

/** Dificuldade escolhida na tela de fases (lembrada enquanto o app está aberto). */
let difAtual = 0;

/** `dif` = -1 usa a última escolhida. */
export function telaFases(nav: Nav, difPedida: number): HTMLElement {
  const s = nav.save;
  if (difPedida >= 0) difAtual = difPedida;
  if (!difLiberada(s, difAtual)) difAtual = 0;
  const dif = difAtual;
  const D = DIFICULDADES[dif];
  const arr = estrelasDe(s, dif);
  const atual = Math.max(0, arr.findIndex((x) => x === 0));
  const abas = h("div", { class: "abas-dif" },
    ...DIFICULDADES.map((d, k) => {
      const lib = difLiberada(s, k);
      const est = estrelasDe(s, k).reduce((a, x) => a + x, 0);
      return h("button", { class: "aba-dif" + (k === dif ? " ativa" : "") + (lib ? "" : " bloq"), style: `--cor:${d.cor}`, disabled: !lib,
        onclick: () => { difAtual = k; nav.ir("mapa"); } },
        h("span", { html: ic(lib ? d.icone : "cadeado") }), h("b", { text: d.nome }), h("small", { text: lib ? `${est}/${STAGES.length * 3}` : `Fase ${DIF_LIBERA_FASE + 1}` }));
    }));
  const proxDif = DIFICULDADES[dif + 1];
  const info = h("div", { class: "dif-info", style: `--cor:${D.cor}` },
    h("span", { html: ic(D.icone) }),
    h("div", null, h("b", { text: D.nome }), h("small", { text: D.desc + (proxDif && !difLiberada(s, dif + 1) ? ` Vença a Fase ${DIF_LIBERA_FASE + 1} para liberar o ${proxDif.nome}.` : "") })));
  const linhas = STAGES.map((st, i) => {
    const lib = faseLiberada(s, i, dif);
    const est = arr[i];
    const ehAtual = lib && i === atual;
    // setor 2 reaproveita a arte do setor 1 com outra tonalidade até chegar arte própria (fase_11..20)
    const propria = urlArte(`fase_${st.id}`);
    const fundo = propria ?? arte(`fase_${((st.id - 1) % 10) + 1}`, ARTE_FASE[i % ARTE_FASE.length]);
    const campos = (st.campos ?? []).map((c) => CAMPOS.find((x) => x.id === c)).filter(Boolean) as typeof CAMPOS;
    const linha = h("button", { class: "fase-v2" + (lib ? "" : " bloq") + (ehAtual ? " atual" : "") + ((st.setor ?? 1) === 2 ? " setor2" : ""), disabled: !lib, onclick: () => abrirBriefing(nav, i, dif) },
      fundo ? h("img", { class: "fase-arte" + (!propria && (st.setor ?? 1) === 2 ? " tingida" : ""), src: fundo, alt: "" }) : null,
      h("span", { class: "fase-num" + (est > 0 ? " feita" : ""), html: lib ? `<b>${st.id}</b>` : ic("cadeado") }),
      h("span", { class: "fase-txt" },
        h("b", { text: st.nome }),
        h("small", { text: `Chefe: ${BOSSES[st.chefe].nome}` }),
        lib ? h("span", { class: "fase-est", html: [1, 2, 3].map((k) => ic("estrela", "ic-estrela" + (k <= est ? "" : " off"))).join("") })
          : h("span", { class: "fase-bloq", text: `Vença a Fase ${st.id - 1} para liberar` }),
        campos.length ? h("span", { class: "fase-campos" }, ...campos.map((c) => h("span", { class: "fase-campo", title: c.desc, html: icT(c.icone, c.nome) }))) : null),
      ehAtual ? h("span", { class: "fase-tag", text: "PRÓXIMA" }) : null);
    // cabeçalho do setor antes da primeira fase de cada setor
    const setor = SETORES.find((x) => x.id === (st.setor ?? 1));
    const primeiro = i === 0 || (STAGES[i - 1].setor ?? 1) !== (st.setor ?? 1);
    return primeiro && setor
      ? [h("div", { class: "setor-cab" + (setor.id === 2 ? " s2" : "") }, h("b", { text: setor.nome }), h("small", { text: setor.desc })), linha]
      : [linha];
  }).flat();
  const el = telaBanner(nav, "FASES", arte("banner_fases", "tile_mapa") ? (urlArte("banner_fases") ? "banner_fases" : "tile_mapa") : null, abas, info, ...linhas);
  el.style.setProperty("--dif-cor", D.cor);
  if (dif > 0) el.classList.add("dif-" + D.id);
  return el;
}

// ------------------------------------------------------------------ PLANETA (talentos)

const TALENTO_VIS: Record<string, { icone: string; cor: string }> = {
  hp: { icone: "diamante", cor: "#4fd6ff" },
  escudo: { icone: "escudo", cor: "#5ec8ff" },
  regen: { icone: "folha", cor: "#49e07a" },
  dano: { icone: "config", cor: "#ff9a3c" },
  xp: { icone: "banco", cor: "#4fa3ff" },
  creditos: { icone: "diamante", cor: "#c06bff" },
  rerrolar: { icone: "repetir", cor: "#7df9ff" },
  sorte: { icone: "estrela", cor: "#ffc23d" },
  ult: { icone: "raio", cor: "#ffd25e" },
};

export function telaPlanetaV2(nav: Nav): HTMLElement {
  const s = nav.save;
  const talentos = TALENTS.map((t) => {
    const n = s.talentos[t.id] ?? 0;
    const max = n >= t.max;
    const custo = max ? 0 : t.custo(n);
    const pode = !max && s[t.moeda] >= custo;
    const vis = TALENTO_VIS[t.id] ?? { icone: "estrela", cor: "#4fd6ff" };
    const img = urlArte(`talento_${t.id}`);
    return h("div", { class: "talento neon", style: `--acc:${vis.cor}` },
      h("span", { class: "hex-ic", html: img ? `<img src="${img}" alt="">` : ic(vis.icone) }),
      h("div", { class: "talento-txt" },
        h("div", { class: "talento-cab" }, h("b", { text: t.nome }), h("span", { class: "talento-nv", text: `${n}/${t.max}` })),
        h("span", { class: "desc", text: t.desc }),
        h("div", { class: "talento-pe" },
          h("div", { class: "prog" }, h("b", { style: `width:${(n / t.max) * 100}%` })),
          h("button", { class: "btn primario pequeno", disabled: !pode, html: max ? "Máximo" : `Melhorar ${ICONE_MOEDA[t.moeda]} ${fmtInt(custo)}`,
            onclick: () => { if (comprarTalento(s, t.id)) { audio.sfx("nivel"); nav.persistir(); nav.ir("planeta"); } } }))));
  });
  const el = telaBanner(nav, "PLANETA", urlArte("banner_planeta") ? "banner_planeta" : "tile_planeta",
    ...talentos,
    h("button", { class: "btn roxo", style: "align-self:center", html: icT("estrela", "Skins do planeta e do escudo"), onclick: () => nav.ir("skins") }));
  return el;
}

// ------------------------------------------------------------------ CHIPS

let selecionados: number[] = [];
let modoFundir = false;
const SLOT_IC: Record<ChipSlot, string> = { ataque: "espadas", defesa: "escudo", critico: "mira", energia: "raio", utilidade: "config", nucleo: "modos" };

function cartaoChip(nav: Nav, c: Chip): HTMLElement {
  const s = nav.save;
  const equip = s.equipados[c.slot] === c.uid;
  const cor = CHIP_RARIDADE_COR[c.raridade];
  return h("button", { class: "chip-v2" + (selecionados.includes(c.uid) ? " sel" : "") + (equip ? " equip" : ""), style: `--cor:${cor}`,
    onclick: () => {
      if (modoFundir) {
        if (selecionados.includes(c.uid)) selecionados = selecionados.filter((u) => u !== c.uid);
        else if (selecionados.length < 3) selecionados.push(c.uid);
      } else {
        if (equip) delete s.equipados[c.slot];
        else s.equipados[c.slot] = c.uid;
        audio.sfx("carta");
        nav.persistir();
      }
      nav.ir("chips");
    } },
    equip ? h("span", { class: "chip-equip", html: icT("check", "Equipado") }) : null,
    h("span", { class: "chip-img", html: iconeImg(`chip_${c.set}`, ic("chip")) }),
    h("b", { text: `${CHIP_SET_MAP[c.set]?.nome ?? c.set} · ${CHIP_SLOT_NOME[c.slot]}` }),
    h("span", { class: "chip-rar", style: `color:${cor}`, text: CHIP_RARIDADES[c.raridade] }),
    h("span", { class: "chip-stats" }, h("span", { text: formatStat(c.principal.stat, c.principal.valor) }), ...c.secundarios.map((x) => h("span", { text: formatStat(x.stat, x.valor) }))));
}

export function telaChipsV2(nav: Nav): HTMLElement {
  const s = nav.save;
  const slots = h("div", { class: "slots-v2" }, ...CHIP_SLOTS.map((slot) => {
    const c = s.chips.find((x) => x.uid === s.equipados[slot]);
    if (!c) return h("div", { class: "slot-v2" }, h("span", { class: "slot-ic", html: ic(SLOT_IC[slot]) }), h("b", { text: CHIP_SLOT_NOME[slot] }), h("small", { text: "Vazio" }));
    return h("button", { class: "slot-v2 cheio", style: `--cor:${CHIP_RARIDADE_COR[c.raridade]}`, onclick: () => { delete s.equipados[slot]; nav.persistir(); nav.ir("chips"); } },
      h("span", { class: "slot-rar", text: CHIP_RARIDADES[c.raridade] }),
      h("span", { class: "slot-img", html: iconeImg(`chip_${c.set}`, ic(SLOT_IC[slot])) }), h("b", { text: CHIP_SLOT_NOME[slot] }), h("small", { text: formatStat(c.principal.stat, c.principal.valor) }));
  }));
  const porSet: Record<string, number> = {};
  for (const uid of Object.values(s.equipados)) {
    const c = s.chips.find((x) => x.uid === uid);
    if (c) porSet[c.set] = (porSet[c.set] ?? 0) + 1;
  }
  const sets = h("div", { class: "cartao neon conjuntos" },
    h("div", { class: "conj-titulo", html: icT("infinito", "Bônus de conjunto") }),
    ...CHIP_SETS.map((st) => {
      const n = porSet[st.id] ?? 0;
      return h("div", { class: "conj-linha" }, h("span", { html: iconeImg(`chip_${st.id}`, "", "conj-img") }),
        h("div", { class: "desc", html: `<b style="color:${hex(st.cor)}">${st.nome}</b> (${n}/4) — <span style="opacity:${n >= 2 ? 1 : 0.6}">2: ${st.bonus2.texto}</span> · <span style="opacity:${n >= 4 ? 1 : 0.6}">4: ${st.bonus4.texto}</span>` }));
    }));
  const fundirBtn = h("div", { class: "fundir-linha" },
    h("button", { class: "btn-fundir" + (modoFundir ? " ativo" : ""), html: modoFundir ? icT("fechar", "Cancelar fusão") : icT("fundir", "Fundir 3 em 1"),
      onclick: () => { modoFundir = !modoFundir; selecionados = []; nav.ir("chips"); } }),
    modoFundir ? h("button", { class: "btn ouro", disabled: selecionados.length !== 3, text: `Fundir (${selecionados.length}/3)`,
      onclick: () => {
        const novo = fundir(s, selecionados);
        if (!novo) toast(nav.root, "Escolha 3 chips do mesmo encaixe e raridade");
        else { audio.sfx("vitoria"); toast(nav.root, `Novo chip ${CHIP_RARIDADES[novo.raridade]}!`); modoFundir = false; nav.persistir(); }
        selecionados = [];
        nav.ir("chips");
      } }) : null);
  const lista = [...s.chips].sort((a, b) => Number(s.equipados[b.slot] === b.uid) - Number(s.equipados[a.slot] === a.uid) || b.raridade - a.raridade);
  return telaBanner(nav, "CHIPS", urlArte("banner_chips") ? "banner_chips" : "tile_chips",
    slots, sets, fundirBtn,
    lista.length ? h("div", { class: "chips-grade" }, ...lista.map((c) => cartaoChip(nav, c))) : h("div", { class: "cartao neon desc", text: "Você ainda não tem chips. Vença fases e abra baús para ganhar." }));
}

// ------------------------------------------------------------------ MODOS

function cartaoModo(cor: string, classe: string, icone: string, titulo: string, imgId: string[], corpo: (HTMLElement | null)[], status: string, statusIc: string, botao: string, acao: () => void): HTMLElement {
  const img = arte(...imgId);
  return h("div", { class: "modo-v2 " + classe, style: `--acc:${cor}` },
    h("span", { class: "modo-orn" }),
    img ? h("img", { class: "modo-arte", src: img, alt: "" }) : null,
    h("div", { class: "modo-cab" }, h("span", { class: "hex-ic", html: ic(icone) }), h("b", { text: titulo })),
    h("div", { class: "modo-corpo" }, ...corpo),
    h("div", { class: "modo-status", html: icT(statusIc, status) }),
    h("button", { class: "btn-jogar", html: `<span>${botao}</span><em>&#10095;&#10095;</em>`, onclick: acao }));
}

export function telaModosV2(nav: Nav): HTMLElement {
  const s = nav.save;
  const d = desafioDoDia();
  if (s.diario.data !== hojeStr()) { s.diario = { data: hojeStr(), melhor: 0, concluido: false }; nav.persistir(); }
  const j = jornadaDaSemana();
  if (s.jornada.semana !== semanaStr()) { s.jornada = { semana: semanaStr(), melhor: 0, concluida: false }; nav.persistir(); }
  return telaBanner(nav, "MODOS", null,
    cartaoModo("#4fd6ff", "azul", "calendario", "Desafio Diário", ["modo_diario", "tile_missoes"],
      [h("p", { html: `<b>${d.mod.nome}:</b> ${d.mod.desc}` }), h("p", { text: `Base: fase ${d.stage.id} · chefe ${BOSSES[d.stage.chefe].nome}.` }), h("p", { text: "A mesma seed para todos hoje." })],
      s.diario.concluido ? "Concluído hoje." : s.diario.melhor ? `Melhor tempo hoje: ${fmtTempo(s.diario.melhor)}` : "Ainda não jogado hoje.", "relogio", "Jogar desafio", () => nav.jogarDiario()),
    cartaoModo("#b36bff", "roxo", "infinito", "Sobrevivência Infinita", ["modo_sobrevivencia", "tile_modos"],
      [h("p", { text: "Ondas sem fim que ficam mais fortes. Um chefe a cada 3 minutos. Até onde você aguenta?" })],
      `Recorde: ${fmtTempo(s.sobrevivenciaMelhor)}`, "trofeu", "Sobreviver", () => nav.jogarSobrevivencia()),
    cartaoModo("#ffc23d", "ouro", "sol", "Jornada da Semana", ["modo_jornada", "planeta_mapa_lava"],
      [h("p", { text: `${j.etapas.length} etapas seguidas, sem cura entre elas. A build, o nível e o HP continuam de uma etapa para a outra.` }),
        ...j.campos.map((c) => h("p", { class: "campo-ef", html: `${ic(c.icone)}<span><b>${c.nome}:</b> ${c.desc}</span>` }))],
      s.jornada.concluida ? "Concluída nesta semana" : `Melhor nesta semana: ${s.jornada.melhor}/${j.etapas.length} etapas`, "trofeu", "Partir em jornada", () => nav.jogarJornada()));
}

// ------------------------------------------------------------------ HANGAR (lista)

const abertos = new Set<SentinelId>();

export function telaHangarV2(nav: Nav): HTMLElement {
  const s = nav.save;
  if (!abertos.size) abertos.add(s.deck.base);
  const nDeck = new Set([s.deck.base, ...s.deck.pool]).size;
  const ordem = [s.deck.base, ...s.deck.pool, ...SENTINEL_IDS.filter((x) => x !== s.deck.base && !s.deck.pool.includes(x))];
  const cards = ordem.map((id) => {
    const def = SENTINELS[id];
    const st = s.sentinelas[id];
    const ehBase = s.deck.base === id;
    const noPool = s.deck.pool.includes(id);
    const aberto = abertos.has(id);
    const cor = hex(def.cor);
    const bonus = Math.round(BALANCE.hangar.danoPorNivel * (st.nivel - 1) * 100);
    const img = arte(`hangar_${id}`, `sentinela_${id}`);
    const acoes = h("div", { class: "hg2-acoes" });
    if (!st.desbloqueada && def.libera) {
      const ok = marcoCumprido(s, def.libera);
      acoes.append(ok
        ? h("button", { class: "btn ouro", html: icT("presente", "Liberar grátis"),
          onclick: (e: MouseEvent) => { e.stopPropagation(); if (desbloquear(s, id, true)) { audio.sfx("vitoria"); toast(nav.root, `${def.nome} liberada!`); nav.persistir(); nav.ir("hangar"); } } })
        : h("button", { class: "btn roxo", disabled: s.cristais < def.libera.cristais, html: `Liberar agora ${ICONE_MOEDA.cristais} ${def.libera.cristais}`,
          onclick: (e: MouseEvent) => { e.stopPropagation(); if (desbloquear(s, id)) { audio.sfx("vitoria"); toast(nav.root, `${def.nome} liberada!`); nav.persistir(); nav.ir("hangar"); } } }));
      if (!ok) acoes.prepend(h("span", { class: "hg2-marco", html: `${ic("cadeado")} ${def.libera.texto} para liberar de graça` }));
    } else if (!st.desbloqueada) {
      acoes.append(h("button", { class: "btn ciano", disabled: s.nucleos < def.desbloqueio, html: `Desbloquear ${ICONE_MOEDA.nucleos} ${def.desbloqueio}`,
        onclick: (e: MouseEvent) => { e.stopPropagation(); if (desbloquear(s, id)) { audio.sfx("vitoria"); nav.persistir(); nav.ir("hangar"); } } }));
    } else {
      const { ok, custo } = podeMelhorar(s, id);
      const max = st.nivel >= BALANCE.hangar.nivelMax;
      acoes.append(h("button", { class: "btn primario", disabled: !ok, html: max ? "Nível máximo" : `Melhorar ${ICONE_MOEDA.creditos} ${fmtInt(custo)}`,
        onclick: (e: MouseEvent) => { e.stopPropagation(); if (melhorar(s, id)) { audio.sfx("nivel"); nav.persistir(); nav.ir("hangar"); } } }));
      acoes.append(h("button", { class: "btn" + (ehBase ? " ativo" : ""), html: ehBase ? icT("estrela", "Base") : "Definir base",
        onclick: (e: MouseEvent) => {
          e.stopPropagation();
          const antiga = s.deck.base;
          s.deck.base = id;
          s.deck.pool = s.deck.pool.filter((x) => x !== id);
          if (!s.deck.pool.includes(antiga) && s.deck.pool.length < BALANCE.maxSlots - 1) s.deck.pool.unshift(antiga);
          nav.persistir(); nav.ir("hangar");
        } }));
      if (!ehBase) {
        acoes.append(h("button", { class: "btn" + (noPool ? " ativo" : ""), html: noPool ? icT("check", "No deck") : icT("mais", "Deck"),
          onclick: (e: MouseEvent) => {
            e.stopPropagation();
            if (noPool) s.deck.pool = s.deck.pool.filter((x) => x !== id);
            else if (s.deck.pool.length < BALANCE.maxSlots - 1) s.deck.pool.push(id);
            else { toast(nav.root, `Deck cheio (máx. ${BALANCE.maxSlots - 1})`); return; }
            nav.persistir(); nav.ir("hangar");
          } }));
      }
    }
    return h("div", { class: "hg2 neon" + (ehBase ? " base" : "") + (aberto ? " aberto" : "") + (st.desbloqueada ? "" : " bloq"), style: `--acc:${cor}`,
      onclick: () => { if (abertos.has(id)) abertos.delete(id); else abertos.add(id); nav.ir("hangar"); } },
      h("span", { class: "hg2-losango" }),
      ehBase ? h("span", { class: "hg2-selo", html: ic("estrela") }) : !aberto ? h("span", { class: "hg2-seta", html: ic("voltar") }) : null,
      h("div", { class: "hg2-cab" },
        img ? h("img", { class: "hg2-img", src: img, alt: "" }) : h("span", { class: "hg2-img", html: ic("hangar") }),
        h("div", { class: "hg2-txt" },
          h("b", { text: def.nome }),
          h("small", { text: `${def.papel} · ${st.desbloqueada ? `Nível ${st.nivel}/${BALANCE.hangar.nivelMax}${bonus ? ` · +${bonus}% dano` : ""}` : def.libera ? `Bloqueada · ${def.libera.texto}` : "Bloqueada"}` }),
          h("p", { text: `${def.desc} Supremo: ${def.evolucao.nome} — ${def.evolucao.desc}` }))),
      aberto ? h("div", { class: "tracos" }, ...def.tracos.map((t) => h("span", { class: "traco" + (st.nivel >= t.nivel ? " on" : ""), html: `<b>Nv${t.nivel}:</b> ${t.texto}` }))) : null,
      aberto ? acoes : null);
  });
  return telaBanner(nav, "HANGAR", urlArte("banner_hangar") ? "banner_hangar" : "tile_hangar",
    h("div", { class: "cartao neon deck-info" }, h("span", { class: "deck-ic", html: ic("cartas") }),
      h("div", { class: "desc", html: `<b>Deck:</b> 1 sentinela <b style="color:var(--ciano)">base</b> (começa a partida e define o ultimate) + até ${BALANCE.maxSlots - 1} que podem aparecer como carta. Os slots da partida são as sentinelas do deck: hoje <b style="color:var(--ouro)">${nDeck}/${BALANCE.maxSlots}</b>.` })),
    ...cards);
}

// ------------------------------------------------------------------ BRIEFING (antes de começar a fase)

/** Fase escolhida para o briefing. */
let briefing = { idx: 0, dif: 0, volta: "mapa" };

/** Abre o briefing da fase em vez de começar direto. */
export function abrirBriefing(nav: Nav, idx: number, dif: number, volta = "mapa"): void {
  briefing = { idx, dif, volta };
  nav.ir("briefing");
}

/** Descrição curta de cada inimigo (o que ele faz). */
const DESC_INIMIGO: Record<string, string> = {
  batedor: "Rápido e frágil, vem em linha reta.",
  tanque: "Lento e muito resistente.",
  enxame: "Grupos grandes de inimigos pequenos.",
  atirador: "Para longe e atira no planeta.",
  kamikaze: "Acelera perto do planeta e explode.",
  divisor: "Ao morrer, se divide em fragmentos.",
  escudeiro: "Dá escudo aos inimigos em volta.",
  meteoro: "Cruza a tela na diagonal.",
  espectro: "Fica invisível e reaparece mais perto.",
  medico: "Cura os inimigos em volta. Mate primeiro!",
  bombardeiro: "Solta minas pelo caminho.",
};

export function telaBriefing(nav: Nav): HTMLElement {
  const s = nav.save;
  const { idx, dif } = briefing;
  const st = STAGES[idx];
  const D = DIFICULDADES[dif];
  const chefe = BOSSES[st.chefe];
  const melhor = estrelasDe(s, dif)[idx] ?? 0;
  const tipos = [...new Set(st.ondas.map((o) => o.tipo))].filter((t) => ENEMIES[t] && t !== "mitose_mini" && t !== "mina" && t !== "muro");
  const campos = (st.campos ?? []).map((c) => CAMPOS.find((x) => x.id === c)).filter(Boolean) as typeof CAMPOS;
  const E = BALANCE.estrelas;
  const criterios = [
    { n: 1, txt: "Vencer a fase (derrotar o chefe)" },
    { n: 2, txt: `Terminar com mais de ${Math.round(E.hp2 * 100)}% da vida do planeta` },
    { n: 3, txt: `Terminar com mais de ${Math.round(E.hp3 * 100)}% da vida do planeta` },
  ];
  const arteFase = urlArte(`fase_${st.id}`) ?? urlArte(`fase_${((st.id - 1) % 10) + 1}`);
  const el = h("div", { class: "tela tela-v2 brief" },
    h("div", { class: "topo topo-v2" },
      h("button", { class: "btn icone btn-voltar", html: ic("voltar"), "aria-label": "Voltar", onclick: () => nav.ir(briefing.volta) }),
      h("div", { class: "titulo-tela", text: `FASE ${st.id}` }),
      moedas(nav)),
    h("div", { class: "tela-conteudo" },
      h("div", { class: "brief-capa", style: arteFase ? `background-image:url('${arteFase}')` : "" },
        h("div", { class: "brief-capa-txt" },
          h("span", { class: "brief-dif", style: `--cor:${D.cor}`, html: icT(D.icone, D.nome) }),
          h("b", { text: st.nome }),
          h("small", { text: `${(st.setor ?? 1) === 2 ? "Setor 2 · Fronteira Sombria" : "Setor 1 · Órbita Próxima"}` }))),
      // estrelas
      h("div", { class: "cartao neon ouro brief-est" },
        h("div", { class: "brief-tit", html: `${ic("estrela", "ic-estrela")}<span>Como ganhar as 3 estrelas</span>` }),
        ...criterios.map((c) => h("div", { class: "brief-crit" + (melhor >= c.n ? " ok" : "") },
          h("span", { class: "brief-crit-est", html: Array.from({ length: c.n }, () => ic("estrela", "ic-estrela")).join("") }),
          h("span", { class: "brief-crit-txt", text: c.txt }),
          melhor >= c.n ? h("span", { class: "brief-ok", html: ic("check") }) : null)),
        h("small", { class: "brief-melhor", text: melhor ? `Seu melhor: ${melhor} estrela${melhor > 1 ? "s" : ""}` : "Ainda não vencida nesta dificuldade" })),
      // chefe
      h("div", { class: "cartao neon brief-chefe", style: `--cor:${hex(chefe.cor)}` },
        urlArte(`chefe_${chefe.id}`) ? h("img", { class: "brief-chefe-img", src: urlArte(`chefe_${chefe.id}`)!, alt: "" }) : h("span", { class: "brief-chefe-img", html: ic("coroa2") }),
        h("div", null, h("small", { class: "brief-rotulo", text: "CHEFE DA FASE" }), h("b", { text: chefe.nome }), h("p", { text: chefe.desc }))),
      // efeitos de campo
      campos.length ? h("div", { class: "cartao neon brief-campos" },
        h("div", { class: "brief-tit", html: `${ic("alerta")}<span>Efeitos de campo</span>` }),
        ...campos.map((c) => h("div", { class: "brief-campo" }, h("span", { html: ic(c.icone) }), h("div", null, h("b", { text: c.nome }), h("small", { text: c.desc }))))) : null,
      // inimigos
      h("div", { class: "cartao neon brief-inim" },
        h("div", { class: "brief-tit", html: `${ic("mira")}<span>Inimigos (${tipos.length})</span>` }),
        h("div", { class: "brief-inim-grade" }, ...tipos.map((t) => {
          const d = ENEMIES[t];
          const img = urlArte(`inimigo_${t}`);
          return h("div", { class: "brief-inimigo" },
            img ? h("img", { src: img, alt: "" }) : h("span", { class: "brief-inim-ic", style: `background:${hex(d.cor)}` }),
            h("div", null, h("b", { text: d.nome }), h("small", { text: DESC_INIMIGO[t] ?? "" })));
        }))),
      h("div", { class: "brief-premio desc", html: `${ICONE_MOEDA.creditos} Créditos e pontos · ${ICONE_MOEDA.nucleos} núcleos e um chip ao vencer${D.premio > 1 ? ` · <b style="color:${D.cor}">prêmios ×${String(D.premio).replace(".", ",")}</b>` : ""}` })),
    h("div", { class: "brief-rodape" }, botao3("laranja", "play", "INICIAR", () => nav.jogarCampanha(idx, dif))));
  return el;
}
