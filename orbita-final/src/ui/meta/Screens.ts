import { BALANCE, custoHangar } from "../../data/balance";
import { CHIP_RARIDADE_COR, CHIP_RARIDADES, CHIP_SET_MAP, CHIP_SETS, CHIP_SLOT_NOME, CHIP_SLOTS } from "../../data/chips";
import { MISSIONS } from "../../data/missions";
import { SENTINELS, SENTINEL_IDS } from "../../data/sentinels";
import { STAGES } from "../../data/stages";
import { BOSSES } from "../../data/bosses";
import { TALENTS } from "../../data/talents";
import type { Chip, SentinelId } from "../../data/types";
import { audio } from "../../core/Audio";
import { apagar, salvar, saveNovo, type SaveData } from "../../core/Save";
import {
  comprarTalento, desafioDoDia, jornadaDaSemana, semanaStr, desbloquear, faseLiberada, formatStat, fundir, hojeStr, melhorar, podeMelhorar, resgatarMissao,
} from "../../meta/Meta";
import { fmtInt, fmtTempo, h, hex, ICONE_MOEDA, iconeImg, toast } from "../dom";
import { ic, icT } from "../Icones";
import { urlArte } from "../../render/Sprites";
import metaCabecas from "../../assets/sprites/cabecas.json";
import { secaoAparencia } from "./Hub";
import { CARD_MAP } from "../../data/cards";

const CARTA_NOME: Record<string, string> = Object.fromEntries(Object.values(CARD_MAP).map((c) => [c.id, c.nome]));

export interface Nav {
  save: SaveData;
  root: HTMLElement;
  ir(tela: string): void;
  jogarCampanha(idx: number, dificil: boolean): void;
  jogarDiario(): void;
  jogarSobrevivencia(): void;
  jogarJornada(): void;
  aplicarConfig(): void;
  persistir(): void;
}

export function moedas(nav: Nav): HTMLElement {
  const s = nav.save;
  const pilula = (icone: string, v: number) =>
    h("button", { class: "pilula", "aria-label": "Loja", onclick: () => nav.ir("loja") },
      h("span", { class: "moeda", html: `${icone} ${fmtInt(v)}` }), h("span", { class: "pil-mais", html: ic("mais") }));
  return h("div", { class: "moedas" }, pilula(ICONE_MOEDA.creditos, s.creditos), pilula(ICONE_MOEDA.nucleos, s.nucleos), pilula(ICONE_MOEDA.cristais, s.cristais));
}

export function topo(nav: Nav, titulo: string | null): HTMLElement {
  return h("div", { class: "topo" },
    titulo ? h("button", { class: "btn icone", html: ic("voltar"), "aria-label": "Voltar", onclick: () => nav.ir("hub") })
      : h("button", { class: "btn icone", html: ic("config"), "aria-label": "Configurações", onclick: () => nav.ir("config") }),
    titulo ? h("div", { style: "font-weight:900;letter-spacing:.08em;font-size:18px", text: titulo }) : null,
    moedas(nav));
}

export function tela(nav: Nav, titulo: string, ...conteudo: (HTMLElement | null)[]): HTMLElement {
  return h("div", { class: "tela", style: "background:rgba(5,7,15,0.78)" }, topo(nav, titulo), h("div", { class: "tela-conteudo" }, ...conteudo));
}

export function proximaFase(s: SaveData): number {
  const i = s.campanha.normal.findIndex((x) => x === 0);
  return i < 0 ? STAGES.length - 1 : i;
}

// ------------------------------------------------------------------ HUB

// ------------------------------------------------------------------ MAPA

/** Cores dos planetas de cada fase no mapa (gradiente da esfera). */
const COR_FASE = ["#4fd6ff", "#ff9a3c", "#7df9ff", "#ff5aa5", "#7dff6b", "#b36bff", "#ffd04a", "#ff4d5e", "#5ec8ff", "#c28bff"];

export function telaMapa(nav: Nav, dificil: boolean): HTMLElement {
  const s = nav.save;
  const difLib = s.campanha.normal[STAGES.length - 1] > 0;
  const arr = dificil ? s.campanha.dificil : s.campanha.normal;
  const atual = Math.max(0, arr.findIndex((x) => x === 0) === -1 ? STAGES.length - 1 : arr.findIndex((x) => x === 0));
  const abas = h("div", { class: "abas" },
    h("button", { class: "btn pequeno" + (!dificil ? " ativo" : ""), text: "Normal", onclick: () => nav.ir("mapa") }),
    h("button", { class: "btn pequeno" + (dificil ? " ativo" : ""), html: difLib ? "Difícil" : icT("cadeado", "Difícil"), disabled: !difLib, onclick: () => nav.ir("mapaDificil") }));

  // caminho em zigue-zague de baixo (fase 1) para cima (fase 10)
  const PASSO = 150;
  const altura = STAGES.length * PASSO + 60;
  const xs = [30, 70, 38, 72, 28, 64, 34, 70, 30, 60];
  const pos = STAGES.map((_, i) => ({ x: xs[i % xs.length], y: altura - 90 - i * PASSO }));
  let d = "";
  pos.forEach((p, i) => {
    if (i === 0) d += `M ${p.x} ${p.y}`;
    else {
      const a = pos[i - 1];
      d += ` C ${a.x} ${a.y - PASSO * 0.55}, ${p.x} ${p.y + PASSO * 0.55}, ${p.x} ${p.y}`;
    }
  });
  const pctVenc = arr.filter((x) => x > 0).length;
  const caminho = `<svg class="mapa-caminho" viewBox="0 0 100 ${altura}" preserveAspectRatio="none" aria-hidden="true">
    <path d="${d}" class="trilha" vector-effect="non-scaling-stroke"/>
    <path d="${d}" class="trilha-feita" vector-effect="non-scaling-stroke" pathLength="100" style="stroke-dasharray:${(Math.max(0, pctVenc) / (STAGES.length - 1)) * 100} 100"/></svg>`;

  const nos = STAGES.map((st, i) => {
    const lib = faseLiberada(s, i, dificil);
    const est = arr[i];
    const chefe = urlArte(`chefe_${st.chefe}`);
    const p = pos[i];
    return h("button", { class: "no-fase" + (lib ? "" : " bloq") + (i === atual && lib ? " atual" : "") + (est > 0 ? " vencida" : ""),
      style: `left:${p.x}%;top:${p.y}px;--cor:${COR_FASE[i % COR_FASE.length]}`, disabled: !lib, onclick: () => nav.jogarCampanha(i, dificil) },
      h("span", { class: "no-planeta" }, chefe ? h("img", { class: "no-chefe", src: chefe, alt: "" }) : null, h("b", { html: lib ? String(st.id) : ic("cadeado") })),
      h("span", { class: "no-est", html: [1, 2, 3].map((k) => ic("estrela", "ic-estrela" + (k <= est ? "" : " off"))).join("") }),
      h("span", { class: "no-nome", text: st.nome }),
      h("small", { class: "no-chefe-nome", text: BOSSES[st.chefe].nome }));
  });
  const mapa = h("div", { class: "mapa-fases", style: `height:${altura}px`, html: caminho }, ...nos);
  const el = tela(nav, "FASES", abas, mapa);
  // rola até a fase atual
  requestAnimationFrame(() => {
    const c = el.querySelector(".tela-conteudo") as HTMLElement | null;
    if (c) c.scrollTop = Math.max(0, pos[atual].y - c.clientHeight / 2);
  });
  return el;
}

// ------------------------------------------------------------------ HANGAR

let hangarSel: SentinelId = "canhao";

const CABECA_DE: Record<SentinelId, string> = {
  canhao: "canhao", laser: "laser", trilho: "trilho", feixe: "prisma", missil: "missil",
  gravidade: "gravidade", campo: "domo", drone: "colmeia", gelo: "gelo",
};

/** Torre montada (base + cabeça girando) para a vitrine do hangar, com o tiro piscando. */
function vitrineTorre(id: SentinelId, cor: string): HTMLElement {
  const base = urlArte("torre_base");
  const cab = urlArte(`cabeca_${CABECA_DE[id]}`);
  const k = (metaCabecas as Record<string, number>)[CABECA_DE[id]] ?? 0.8;
  if (base && cab) {
    return h("div", { class: "torre-vitrine", style: `--cor:${cor};--cab:${(0.66 / k) * 100}%` },
      h("img", { class: "tv-base", src: base, alt: "" }),
      h("span", { class: "tv-giro" }, h("img", { class: "tv-cab", src: cab, alt: "" }), h("i", { class: "tv-tiro" })));
  }
  const inteira = urlArte(`sentinela_${id}`);
  return h("div", { class: "torre-vitrine", style: `--cor:${cor}` }, inteira ? h("img", { class: "tv-base", src: inteira, alt: "" }) : null);
}

export function telaHangar(nav: Nav): HTMLElement {
  const s = nav.save;
  if (!SENTINELS[hangarSel]) hangarSel = s.deck.base;
  const id = hangarSel;
  const def = SENTINELS[id];
  const st = s.sentinelas[id];
  const cor = hex(def.cor);
  const ehBase = s.deck.base === id;
  const noPool = s.deck.pool.includes(id);

  // atributos (com o bônus de dano do nível do hangar), normalizados pelo maior entre as sentinelas
  const mult = 1 + BALANCE.hangar.danoPorNivel * (st.nivel - 1);
  const dps = (d: typeof def) => d.base.dano * d.base.cadencia * Math.max(1, d.base.projeteis) * (1 + d.base.cadeia * 0.7);
  const maxDps = Math.max(...SENTINEL_IDS.map((x) => dps(SENTINELS[x]))) * 1.6;
  const maxAlc = Math.max(...SENTINEL_IDS.map((x) => SENTINELS[x].base.alcance));
  const maxCad = Math.max(...SENTINEL_IDS.map((x) => SENTINELS[x].base.cadencia));
  const barra = (nome: string, v: number, max: number, txt: string) =>
    h("div", { class: "attr" }, h("span", { text: nome }), h("i", null, h("b", { style: `width:${Math.min(100, (v / max) * 100)}%` })), h("small", { text: txt }));

  const acoes = h("div", { class: "hg-acoes" });
  if (!st.desbloqueada) {
    acoes.append(h("button", { class: "btn ciano", disabled: s.nucleos < def.desbloqueio, html: `Desbloquear ${ICONE_MOEDA.nucleos} ${def.desbloqueio}`,
      onclick: () => { if (desbloquear(s, id)) { audio.sfx("vitoria"); nav.persistir(); nav.ir("hangar"); } } }));
  } else {
    const { ok, custo } = podeMelhorar(s, id);
    const max = st.nivel >= BALANCE.hangar.nivelMax;
    acoes.append(h("button", { class: "btn primario", disabled: !ok, html: max ? "Nível máximo" : `Melhorar ${ICONE_MOEDA.creditos} ${fmtInt(custo)}`,
      onclick: () => {
        if (!melhorar(s, id)) return;
        audio.sfx("nivel");
        nav.persistir();
        nav.ir("hangar");
        const v = nav.root.querySelector(".hg-vitrine");
        v?.classList.add("subiu");
        v?.append(h("span", { class: "hg-up", text: `NÍVEL ${s.sentinelas[id].nivel}` }));
      } }));
    acoes.append(h("button", { class: "btn" + (ehBase ? " ativo" : ""), html: ehBase ? icT("estrela", "Base") : "Definir base",
      onclick: () => {
        const antiga = s.deck.base;
        s.deck.base = id;
        s.deck.pool = s.deck.pool.filter((x) => x !== id);
        if (!s.deck.pool.includes(antiga) && s.deck.pool.length < BALANCE.maxSlots - 1) s.deck.pool.unshift(antiga);
        nav.persistir();
        nav.ir("hangar");
      } }));
    if (!ehBase) {
      acoes.append(h("button", { class: "btn" + (noPool ? " ativo" : ""), html: noPool ? icT("check", "No deck") : icT("mais", "Deck"),
        onclick: () => {
          if (noPool) s.deck.pool = s.deck.pool.filter((x) => x !== id);
          else if (s.deck.pool.length < BALANCE.maxSlots - 1) s.deck.pool.push(id);
          else { toast(nav.root, `Deck cheio (máx. ${BALANCE.maxSlots - 1})`); return; }
          nav.persistir(); nav.ir("hangar");
        } }));
    }
  }

  const carrossel = h("div", { class: "hg-carrossel" }, ...SENTINEL_IDS.map((x) => {
    const sx = s.sentinelas[x];
    const img = urlArte(`sentinela_${x}`);
    return h("button", { class: "hg-mini" + (x === id ? " sel" : "") + (sx.desbloqueada ? "" : " bloq") + (s.deck.base === x ? " base" : s.deck.pool.includes(x) ? " deck" : ""),
      style: `--cor:${hex(SENTINELS[x].cor)}`, onclick: () => { hangarSel = x; nav.ir("hangar"); } },
      img ? h("img", { src: img, alt: SENTINELS[x].nome }) : h("span", { html: ic("hangar") }),
      sx.desbloqueada ? h("small", { text: `Nv ${sx.nivel}` }) : h("small", { html: ic("cadeado") }));
  }));

  const evoArte = urlArte(`carta_evo_${id}`);
  return tela(nav, "HANGAR",
    carrossel,
    h("div", { class: "hg-vitrine neon" + (st.desbloqueada ? "" : " bloq"), style: `--cor:${cor}` },
      vitrineTorre(id, cor),
      h("div", { class: "hg-info" },
        h("small", { class: "hg-papel", text: def.papel.toUpperCase() }),
        h("b", { class: "hg-nome", text: def.nome }),
        h("div", { class: "hg-nivel", html: `Nível <b>${st.nivel}</b>/${BALANCE.hangar.nivelMax}${st.nivel > 1 ? ` · +${Math.round((mult - 1) * 100)}% dano` : ""}` }),
        h("div", { class: "hg-deck", text: ehBase ? "Sentinela base" : noPool ? "No deck" : st.desbloqueada ? "Fora do deck" : "Bloqueada" }))),
    h("div", { class: "cartao neon" },
      h("div", { class: "desc", text: def.desc }),
      barra("Dano", dps(def) * mult, maxDps, fmtInt(def.base.dano * mult)),
      barra("Cadência", def.base.cadencia, maxCad, `${def.base.cadencia}/s`),
      barra("Alcance", def.base.alcance, maxAlc, fmtInt(def.base.alcance))),
    acoes,
    h("div", { class: "cartao neon ouro hg-evo" },
      evoArte ? h("img", { src: evoArte, alt: "" }) : null,
      h("div", null,
        h("small", { text: "EVOLUÇÃO NA PARTIDA" }),
        h("b", { text: def.evolucao.nome }),
        h("div", { class: "desc", text: `${def.evolucao.desc} Nível 5 + carta "${CARTA_NOME[def.evolucao.passiva] ?? def.evolucao.passiva}".` }))),
    h("div", { class: "cartao neon" },
      h("div", { class: "nome", text: `Ultimate: ${def.ultimate.nome}` }), h("div", { class: "desc", text: def.ultimate.desc })),
    h("div", { class: "cartao neon" }, h("div", { class: "nome", style: "margin-bottom:6px", text: "Traços (a cada 5 níveis)" }),
      h("div", { class: "tracos" }, ...def.tracos.map((t) => h("span", { class: "traco" + (st.nivel >= t.nivel ? " on" : ""), text: `Nv${t.nivel}: ${t.texto}` })))));
}

// ------------------------------------------------------------------ CHIPS

let selecionados: number[] = [];
let modoFundir = false;

function descChip(c: Chip): HTMLElement[] {
  return [
    h("span", { class: "chip-ic", html: iconeImg(`chip_${c.set}`, "") }),
    h("b", { text: `${CHIP_SET_MAP[c.set]?.nome ?? c.set} · ${CHIP_SLOT_NOME[c.slot]}` }),
    h("div", { style: `color:${CHIP_RARIDADE_COR[c.raridade]};font-size:11px;font-weight:800`, text: CHIP_RARIDADES[c.raridade] }),
    h("div", { text: formatStat(c.principal.stat, c.principal.valor) }),
    ...c.secundarios.map((x) => h("div", { style: "color:var(--texto2)", text: formatStat(x.stat, x.valor) })),
  ];
}

export function telaChips(nav: Nav): HTMLElement {
  const s = nav.save;
  const slots = h("div", { class: "slots" }, ...CHIP_SLOTS.map((slot) => {
    const c = s.chips.find((x) => x.uid === s.equipados[slot]);
    if (!c) return h("div", { class: "slot" }, h("b", { text: CHIP_SLOT_NOME[slot] }), h("span", { style: "color:var(--texto2)", text: "vazio" }));
    return h("button", { class: "slot cheio", style: `--cor:${CHIP_RARIDADE_COR[c.raridade]}`, onclick: () => { delete s.equipados[slot]; nav.persistir(); nav.ir("chips"); } },
      h("span", { class: "chip-ic", html: iconeImg(`chip_${c.set}`, "") }), h("b", { text: CHIP_SLOT_NOME[slot] }), h("span", { text: formatStat(c.principal.stat, c.principal.valor) }));
  }));
  // bônus de conjunto ativos
  const porSet: Record<string, number> = {};
  for (const uid of Object.values(s.equipados)) {
    const c = s.chips.find((x) => x.uid === uid);
    if (c) porSet[c.set] = (porSet[c.set] ?? 0) + 1;
  }
  const sets = h("div", { class: "cartao" }, h("div", { style: "font-weight:800;margin-bottom:6px", text: "Bônus de conjunto" }),
    ...CHIP_SETS.map((st) => {
      const n = porSet[st.id] ?? 0;
      return h("div", { class: "desc", html: `${iconeImg(`chip_${st.id}`, "", "ic-moeda")} <b style="color:${hex(st.cor)}">${st.nome}</b> (${n}/4) — <span style="opacity:${n >= 2 ? 1 : 0.45}">2: ${st.bonus2.texto}</span> · <span style="opacity:${n >= 4 ? 1 : 0.45}">4: ${st.bonus4.texto}</span>` });
    }));
  const ordenados = [...s.chips].sort((a, b) => b.raridade - a.raridade || a.slot.localeCompare(b.slot));
  const lista = h("div", { class: "lista-chips" }, ...ordenados.map((c) => {
    const equip = s.equipados[c.slot] === c.uid;
    return h("button", { class: "chip" + (selecionados.includes(c.uid) ? " sel" : ""), style: `--cor:${CHIP_RARIDADE_COR[c.raridade]}`,
      onclick: () => {
        if (modoFundir) {
          if (selecionados.includes(c.uid)) selecionados = selecionados.filter((u) => u !== c.uid);
          else if (selecionados.length < 3) selecionados.push(c.uid);
        } else {
          if (equip) delete s.equipados[c.slot];
          else s.equipados[c.slot] = c.uid;
          nav.persistir();
        }
        nav.ir("chips");
      } }, ...descChip(c), equip ? h("div", { style: "color:var(--verde);font-weight:800", html: icT("check", "Equipado") }) : null);
  }));
  const fundirBar = h("div", { class: "acoes" },
    h("button", { class: "btn pequeno" + (modoFundir ? " ativo" : ""), html: modoFundir ? "Cancelar fusão" : icT("fundir", "Fundir 3 em 1"),
      onclick: () => { modoFundir = !modoFundir; selecionados = []; nav.ir("chips"); } }),
    modoFundir ? h("button", { class: "btn ouro pequeno", disabled: selecionados.length !== 3, text: `Fundir (${selecionados.length}/3)`,
      onclick: () => {
        const novo = fundir(s, selecionados);
        if (!novo) toast(nav.root, "Escolha 3 chips do mesmo encaixe e raridade");
        else { audio.sfx("nivel"); toast(nav.root, `Novo chip ${CHIP_RARIDADES[novo.raridade]}!`); modoFundir = false; nav.persistir(); }
        selecionados = [];
        nav.ir("chips");
      } }) : null);
  return tela(nav, "CHIPS", slots, sets, fundirBar,
    s.chips.length ? lista : h("div", { class: "cartao desc", text: "Você ainda não tem chips. Vença fases para ganhar." }));
}

// ------------------------------------------------------------------ PLANETA (talentos)

export function telaPlaneta(nav: Nav): HTMLElement {
  const s = nav.save;
  const el = tela(nav, "PLANETA", secaoAparencia(nav), h("div", { class: "secao-titulo", text: "Talentos" }), ...TALENTS.map((t) => {
    const n = s.talentos[t.id] ?? 0;
    const max = n >= t.max;
    const custo = max ? 0 : t.custo(n);
    const pode = !max && s[t.moeda] >= custo;
    return h("div", { class: "cartao" },
      h("div", { class: "cab" }, h("div", { style: "flex:1" }, h("div", { class: "nome", text: t.nome }), h("div", { class: "desc", text: t.desc })),
        h("div", { style: "font-weight:800", text: `${n}/${t.max}` })),
      h("div", { class: "prog" }, h("b", { style: `width:${(n / t.max) * 100}%` })),
      h("div", { class: "acoes" }, h("button", { class: "btn primario pequeno", disabled: !pode, html: max ? "Máximo" : `Melhorar ${ICONE_MOEDA[t.moeda]} ${fmtInt(custo)}`,
        onclick: () => { if (comprarTalento(s, t.id)) { audio.sfx("nivel"); nav.persistir(); nav.ir("planeta"); } } })));
  }));
  el.style.background = "rgba(5,7,15,0.45)"; // deixa ver o planeta da vitrine
  return el;
}

// ------------------------------------------------------------------ MISSÕES

export function telaMissoes(nav: Nav): HTMLElement {
  const s = nav.save;
  const itens = MISSIONS.map((m) => {
    const v = s.estatisticas[m.stat] ?? 0;
    const feita = s.missoesResgatadas.includes(m.id);
    const pronta = !feita && v >= m.meta;
    const rec = [m.recompensa.creditos ? `${ICONE_MOEDA.creditos} ${m.recompensa.creditos}` : "", m.recompensa.nucleos ? `${ICONE_MOEDA.nucleos} ${m.recompensa.nucleos}` : "", m.recompensa.cristais ? `${ICONE_MOEDA.cristais} ${m.recompensa.cristais}` : ""].filter(Boolean).join("  ");
    return { feita, pronta, el: h("div", { class: "cartao" + (feita ? " bloq" : "") },
      h("div", { class: "cab" }, h("div", { style: "flex:1" }, h("div", { class: "nome", style: "font-size:14px", text: m.texto }), h("div", { class: "desc", html: rec })),
        pronta ? h("button", { class: "btn ouro pequeno", text: "Resgatar", onclick: () => { if (resgatarMissao(s, m.id)) { audio.sfx("nivel"); nav.persistir(); nav.ir("missoes"); } } })
          : h("span", { style: "font-size:12px;color:var(--texto2)", html: feita ? ic("check") : `${fmtInt(Math.min(v, m.meta))}/${fmtInt(m.meta)}` })),
      h("div", { class: "prog" }, h("b", { style: `width:${Math.min(100, (v / m.meta) * 100)}%` }))) };
  });
  itens.sort((a, b) => Number(b.pronta) - Number(a.pronta) || Number(a.feita) - Number(b.feita));
  return tela(nav, "CONQUISTAS", ...itens.map((i) => i.el));
}

// ------------------------------------------------------------------ MODOS

export function telaModos(nav: Nav): HTMLElement {
  const s = nav.save;
  const d = desafioDoDia();
  if (s.diario.data !== hojeStr()) {
    s.diario = { data: hojeStr(), melhor: 0, concluido: false };
    nav.persistir();
  }
  return tela(nav, "MODOS",
    h("div", { class: "cartao" },
      h("div", { class: "nome", style: "font-weight:900;font-size:17px", html: icT("calendario", "Desafio Diário") }),
      h("div", { class: "desc", html: `<b>${d.mod.nome}:</b> ${d.mod.desc}<br>Base: fase ${d.stage.id} · chefe ${BOSSES[d.stage.chefe].nome}. A mesma seed para todos hoje.` }),
      h("div", { class: "desc", text: s.diario.concluido ? "Concluído hoje" : s.diario.melhor ? `Melhor tempo hoje: ${fmtTempo(s.diario.melhor)}` : "Ainda não jogado hoje" }),
      h("div", { class: "acoes" }, h("button", { class: "btn primario", text: "Jogar desafio", onclick: () => nav.jogarDiario() }))),
    h("div", { class: "cartao" },
      h("div", { class: "nome", style: "font-weight:900;font-size:17px", html: icT("infinito", "Sobrevivência Infinita") }),
      h("div", { class: "desc", text: "Ondas sem fim que ficam mais fortes. Um chefe a cada 3 minutos. Até onde você aguenta?" }),
      h("div", { class: "desc", text: `Recorde: ${fmtTempo(s.sobrevivenciaMelhor)}` }),
      h("div", { class: "acoes" }, h("button", { class: "btn primario", text: "Sobreviver", onclick: () => nav.jogarSobrevivencia() }))),
    cartaoJornada(nav));
}

function cartaoJornada(nav: Nav): HTMLElement {
  const s = nav.save;
  const j = jornadaDaSemana();
  if (s.jornada.semana !== semanaStr()) {
    s.jornada = { semana: semanaStr(), melhor: 0, concluida: false };
    nav.persistir();
  }
  return h("div", { class: "cartao" },
    h("div", { class: "nome", style: "font-weight:900;font-size:17px", html: icT("bussola", "Jornada da Semana") }),
    h("div", { class: "desc", text: `${j.etapas.length} etapas seguidas, sem cura entre elas. A build, o nível e o HP continuam de uma etapa para a outra.` }),
    ...j.campos.map((c) => h("div", { class: "desc", html: `${ic(c.icone)} <b>${c.nome}:</b> ${c.desc}` })),
    h("div", { class: "desc", text: s.jornada.concluida ? "Concluída nesta semana" : `Melhor nesta semana: ${s.jornada.melhor}/${j.etapas.length} etapas` }),
    h("div", { class: "acoes" }, h("button", { class: "btn primario", text: "Partir em jornada", onclick: () => nav.jogarJornada() })));
}

// ------------------------------------------------------------------ CONFIG

export function painelConfig(nav: Nav, voltar: () => void, noJogo = false): HTMLElement {
  const c = nav.save.config;
  const toggle = (rot: string, v: boolean, set: (b: boolean) => void) =>
    h("div", { class: "config-linha" }, h("span", { text: rot }),
      h("button", { class: "btn pequeno" + (v ? " ativo" : ""), text: v ? "Ligado" : "Desligado", onclick: () => { set(!v); nav.aplicarConfig(); nav.persistir(); voltar(); } }));
  const slider = (rot: string, v: number, set: (n: number) => void) => {
    const inp = h("input", { type: "range", min: "0", max: "1", step: "0.05", value: String(v) }) as HTMLInputElement;
    inp.addEventListener("input", () => { set(Number(inp.value)); nav.aplicarConfig(); });
    inp.addEventListener("change", () => nav.persistir());
    return h("div", { class: "config-linha" }, h("span", { text: rot }), inp);
  };
  const p = h("div", { class: "painel" },
    h("div", { class: "config-linha" }, h("span", { text: "Efeitos" }),
      h("div", { class: "abas" },
        h("button", { class: "btn pequeno" + (c.efeitos === "completo" ? " ativo" : ""), text: "Completos", onclick: () => { c.efeitos = "completo"; nav.aplicarConfig(); nav.persistir(); voltar(); } }),
        h("button", { class: "btn pequeno" + (c.efeitos === "leve" ? " ativo" : ""), text: "Leves", onclick: () => { c.efeitos = "leve"; nav.aplicarConfig(); nav.persistir(); voltar(); } }))),
    toggle("Bloom (brilho real)", c.bloom, (b) => (c.bloom = b)),
    toggle("Halo nos projéteis", c.brilho, (b) => (c.brilho = b)),
    toggle("Números de dano", c.numeros, (b) => (c.numeros = b)),
    toggle("Mostrar FPS", c.fps, (b) => (c.fps = b)),
    slider("Som", c.som, (n) => (c.som = n)),
    slider("Música", c.musica, (n) => (c.musica = n)),
  );
  if (!noJogo) {
    p.append(h("div", { class: "config-linha" }, h("span", { text: `Comandante: ${nav.save.perfil.nome || "—"}` }),
      h("button", { class: "btn pequeno", html: icT("usuario", "Editar perfil"), onclick: () => nav.ir("login") })));
    p.append(h("div", { class: "config-linha" }, h("span", { text: "Apagar progresso" }),
      h("button", { class: "btn pequeno", style: "color:var(--vermelho)", text: "Apagar", onclick: () => {
        if (!confirm("Apagar todo o progresso? Isso não pode ser desfeito.")) return;
        apagar();
        Object.assign(nav.save, saveNovo());
        salvar(nav.save);
        nav.ir("hub");
      } })));
  }
  return p;
}

export function telaConfig(nav: Nav): HTMLElement {
  return tela(nav, "CONFIGURAÇÕES", painelConfig(nav, () => nav.ir("config")),
    h("div", { class: "cartao desc", html: "Dica: no iPhone, toque em <b>Compartilhar → Adicionar à Tela de Início</b> para jogar em tela cheia." }));
}

export function custoHangarTexto(n: number): string {
  return fmtInt(custoHangar(n));
}

export type { SentinelId };
