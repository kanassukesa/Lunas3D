import type { Battle } from "../battle/Battle";
import type { Oferta } from "../battle/CardSystem";
import { RARIDADE_COR, RARIDADE_NOME } from "../data/balance";
import { SENTINELS } from "../data/sentinels";
import type { SentinelId } from "../data/types";
import { arteCarta, arteSentinela } from "./CardArt";
import { urlArte } from "../render/Sprites";
import { h, ICONE_MOEDA } from "./dom";
import { ic } from "./Icones";
import { faixaTitulo } from "./Panels";

/** Linha de slots das sentinelas (6), com a arte e as estrelas de nível. */
export function slotsSentinelas(b: Battle, destaque?: string): HTMLElement {
  const linha = h("div", { class: "slots-sent" });
  const n = b.slots();
  // poucos slots (ex.: desafio "Só Mísseis") ficam centralizados no tamanho normal
  linha.style.gridTemplateColumns = n >= 4 ? `repeat(${n}, 1fr)` : `repeat(${n}, 15%)`;
  linha.style.justifyContent = "center";
  for (let i = 0; i < n; i++) {
    const s = b.sentinels[i];
    if (!s) {
      linha.append(h("div", { class: "slot-sent vazio" }, h("span", { class: "slot-mais", html: ic("mais") })));
      continue;
    }
    const est = h("div", { class: "estrelinhas" });
    for (let k = 1; k <= 5; k++) est.append(h("i", { class: k <= s.nivel ? (s.evoluido ? "on evo" : "on") : "" }));
    const el = h("div", { class: "slot-sent" + (s.def.id === destaque ? " alvo" : ""), title: s.def.nome },
      h("img", { src: urlArte(`sentinela_${s.def.id}`) ?? arteSentinela(s.def.id, s.evoluido), alt: s.def.nome, class: urlArte(`sentinela_${s.def.id}`) ? "real" : "" }), est);
    linha.append(el);
  }
  return linha;
}

/** Sentinela cuja evolução (Supremo) esta carta ajuda: a própria sentinela ou a passiva que a evolução exige. */
function sentinelaDaEvolucao(c: Oferta["card"]): SentinelId | null {
  if ((c.tipo === "nova_sentinela" || c.tipo === "sentinela_nivel") && c.alvo) return c.alvo as SentinelId;
  const dono = (Object.keys(SENTINELS) as SentinelId[]).find((id) => SENTINELS[id].evolucao?.passiva === c.id);
  return dono ?? null;
}

/** Quadrinho "Supremo": o que falta para evoluir (nível 5 + carta passiva). */
function blocoEvolucao(b: Battle, o: Oferta): HTMLElement | null {
  const c = o.card;
  if (c.tipo === "evolucao") return h("div", { class: "cl-evo pronta", html: `${ic("coroa")}<span>Requisitos completos!</span>` });
  const id = sentinelaDaEvolucao(c);
  if (!id) return null;
  const ev = b.cards.evolucaoDe(id);
  if (!ev || ev.evoluido) return null;
  // nível depois de pegar esta carta / passiva depois de pegar esta carta
  const nivel = c.tipo === "sentinela_nivel" ? (o.nivel ?? ev.nivel + 1) : c.tipo === "nova_sentinela" ? 1 : ev.nivel;
  const passiva = ev.temPassiva || SENTINELS[id].evolucao?.passiva === c.id;
  const ok = (v: boolean) => (v ? ic("check") : ic("fechar"));
  const libera = nivel >= 5 && passiva;
  return h("div", { class: "cl-evo" + (libera ? " pronta" : "") },
    h("div", { class: "cl-evo-tit", html: `${ic("coroa")}<span>Supremo: <b>${ev.nome}</b></span>` }),
    h("div", { class: "cl-evo-req" + (nivel >= 5 ? " ok" : "") , html: `${ok(nivel >= 5)}<span>Nível ${Math.min(nivel, 5)}/5</span>` }),
    h("div", { class: "cl-evo-req" + (passiva ? " ok" : ""), html: `${ok(passiva)}<span>${ev.passiva}</span>` }),
    libera ? h("div", { class: "cl-evo-lib", text: "Libera o Supremo!" }) : null);
}

/** Tela de level-up: slots no topo, cartas lado a lado (título, ilustração, descrição) e rerrolagem. */
export function telaLevelUp(b: Battle, aoEscolher: (o: Oferta) => void, aoRerrolar: () => void, anuncio = false): HTMLElement {
  const ofertas = b.cards.ofertas;
  // a tela não rola: as cartas encolhem para caber (2 linhas quando há mais de 3 opções)
  const lista = h("div", { class: "cartas-lv" + (ofertas.length > 3 ? " cinco" : ""), style: `--linhas:${ofertas.length > 3 ? 2 : 1}` });
  ofertas.forEach((o, i) => {
    const c = o.card;
    const cor = RARIDADE_COR[c.raridade];
    let tag: HTMLElement | null = null;
    if (c.tipo === "nova_sentinela") tag = h("span", { class: "tag-nova", text: "Nova" });
    if (c.tipo === "evolucao") tag = h("span", { class: "tag-nova evo", text: "Evolução" });
    let est: HTMLElement | null = null;
    if (c.tipo === "sentinela_nivel" && o.nivel) {
      est = h("div", { class: "estrelinhas na-arte" });
      for (let k = 1; k <= 5; k++) est.append(h("i", { class: k < o.nivel ? "on" : k === o.nivel ? "on novo" : "" }));
    }
    const pilhas = b.cards.qtd(c.id);
    const max = c.maxPilhas ?? 1;
    // moldura de arte por raridade (evolução usa a Suprema)
    const molduraId = c.tipo === "evolucao" ? "suprema" : c.raridade;
    const moldura = urlArte(`moldura_${molduraId}`);
    lista.append(
      h("button", { class: "carta-lv " + c.raridade + (moldura ? ` com-moldura m-${molduraId}` : ""),
        style: `--cor:${cor};animation-delay:${i * 0.06}s${moldura ? `;--moldura:url('${moldura}')` : ""}`, onclick: () => aoEscolher(o) },
        h("div", { class: "cl-titulo", text: c.nome }),
        h("div", { class: "cl-arte" }, h("img", { src: arteCarta(c), alt: "" }), tag, est),
        // a etiqueta "Nova" já diz que é sentinela nova: o texto fica só com o que ela faz
        h("div", { class: "cl-desc", text: c.tipo === "nova_sentinela" ? o.texto.replace(/^Nova sentinela:\s*/i, "") : o.texto }),
        blocoEvolucao(b, o),
        h("div", { class: "cl-rodape" },
          h("span", { style: `color:${cor}`, text: RARIDADE_NOME[c.raridade] }),
          pilhas > 0 && max > 1 && max < 99 ? h("span", { text: `${pilhas}/${max}` }) : null),
        h("i", { class: "cl-gema" })),
    );
  });
  const gratis = b.cards.rerrolagensGratis;
  const txtRer = gratis > 0 ? `${ic("repetir")}<span>Rerrolar (${gratis} grátis)</span>` : `${ic("repetir")}<span>Rerrolar · ${ICONE_MOEDA.sucata} ${b.cards.custoRerrolagem}</span>`;
  return h(
    "div",
    { class: "overlay levelup" },
    urlArte("emblema_nivel") ? h("img", { class: "lv-emblema", src: urlArte("emblema_nivel")!, alt: "" }) : null,
    faixaTitulo("SUBIU DE NÍVEL", h("em", { class: "lv-nv", text: `Nv. ${b.nivel - b.pendentes + 1}` }), "nivel"),
    h("div", { class: "moldura3 lv-painel3" }, slotsSentinelas(b), h("div", { class: "lv-legenda", text: `Sentinelas ${b.sentinels.length}/${b.slots()}` })),
    lista,
    h("div", { class: "linha" },
      b.cards.podeRerrolar() || !anuncio
        ? h("button", { class: "bt3 ouro lv-rer", html: txtRer, disabled: !b.cards.podeRerrolar(), onclick: aoRerrolar })
        : h("button", { class: "bt3 azul lv-rer", html: `${ic("play")}<span>Rerrolar · anúncio</span>`, onclick: aoRerrolar }),
      h("span", { class: "lv-sucata", html: `${ICONE_MOEDA.sucata} ${Math.floor(b.sucata)} sucata` })),
  );
}
