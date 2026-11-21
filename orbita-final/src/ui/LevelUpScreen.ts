import type { Battle } from "../battle/Battle";
import type { Oferta } from "../battle/CardSystem";
import { RARIDADE_COR, RARIDADE_NOME } from "../data/balance";
import { arteCarta, arteSentinela } from "./CardArt";
import { urlArte } from "../render/Sprites";
import { h, ICONE_MOEDA } from "./dom";

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
      linha.append(h("div", { class: "slot-sent vazio" }));
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

/** Tela de level-up: slots no topo, cartas lado a lado (título, ilustração, descrição) e rerrolagem. */
export function telaLevelUp(b: Battle, aoEscolher: (o: Oferta) => void, aoRerrolar: () => void): HTMLElement {
  const ofertas = b.cards.ofertas;
  const lista = h("div", { class: "cartas-lv" + (ofertas.length > 3 ? " cinco" : "") });
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
    lista.append(
      h("button", { class: "carta-lv " + c.raridade, style: `--cor:${cor};animation-delay:${i * 0.06}s`, onclick: () => aoEscolher(o) },
        h("div", { class: "cl-titulo", text: c.nome }),
        h("div", { class: "cl-arte" }, h("img", { src: arteCarta(c), alt: "" }), tag, est),
        h("div", { class: "cl-desc", text: o.texto }),
        h("div", { class: "cl-rodape" },
          h("span", { style: `color:${cor}`, text: RARIDADE_NOME[c.raridade] }),
          pilhas > 0 && max > 1 && max < 99 ? h("span", { text: `${pilhas}/${max}` }) : null)),
    );
  });
  const gratis = b.cards.rerrolagensGratis;
  const txtRer = gratis > 0 ? `🔄 Rerrolar (${gratis} grátis)` : `🔄 Rerrolar · ${ICONE_MOEDA.sucata} ${b.cards.custoRerrolagem}`;
  return h(
    "div",
    { class: "overlay levelup" },
    h("div", { class: "lv-cabecalho" }, h("span", { text: "SUBIU DE NÍVEL" }), h("b", { text: `Nv. ${b.nivel - b.pendentes + 1}` })),
    h("div", { class: "lv-painel" }, slotsSentinelas(b), h("div", { class: "lv-legenda", text: `Sentinelas ${b.sentinels.length}/${b.slots()}` })),
    lista,
    h("div", { class: "linha" },
      h("button", { class: "btn", html: txtRer, disabled: !b.cards.podeRerrolar(), onclick: aoRerrolar }),
      h("span", { class: "moeda", style: "color:var(--texto2)", html: `${ICONE_MOEDA.sucata} ${Math.floor(b.sucata)} sucata` })),
  );
}
