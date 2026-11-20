import type { Battle } from "../battle/Battle";
import type { Oferta } from "../battle/CardSystem";
import { RARIDADE_COR, RARIDADE_NOME } from "../data/balance";
import { SENTINELS } from "../data/sentinels";
import type { CardDef } from "../data/types";
import { h, hex } from "./dom";

export const ICONE_TIPO: Record<string, string> = {
  nova_sentinela: "🛰️",
  sentinela_nivel: "⬆️",
  sentinela_mod: "🔧",
  global: "✦",
  planeta: "🌍",
  mod_tiro: "💥",
  ultimate: "⚡",
  passiva: "🔮",
  evolucao: "👑",
};

export function iconeCarta(c: CardDef): HTMLElement {
  const ic = h("div", { class: "ic", text: ICONE_TIPO[c.tipo] ?? "✦" });
  if (c.alvo) ic.style.boxShadow = `inset 0 0 0 2px ${hex(SENTINELS[c.alvo].cor)}`;
  return ic;
}

/** Tela de level-up: 3 (ou 5) cartas + rerrolagem. */
export function telaLevelUp(b: Battle, aoEscolher: (o: Oferta) => void, aoRerrolar: () => void): HTMLElement {
  const ofertas = b.cards.ofertas;
  const lista = h("div", { class: "cartas" + (ofertas.length > 3 ? " cinco" : "") });
  ofertas.forEach((o, i) => {
    const c = o.card;
    const cor = RARIDADE_COR[c.raridade];
    let tag: HTMLElement | null = null;
    if (c.tipo === "nova_sentinela") tag = h("span", { class: "tag", text: "NOVA" });
    if (c.tipo === "evolucao") tag = h("span", { class: "tag", text: "EVOLUÇÃO" });
    let pips: HTMLElement | null = null;
    if (c.tipo === "sentinela_nivel" && o.nivel) {
      pips = h("span", { class: "pips" });
      for (let k = 1; k <= 5; k++) pips.append(h("i", { class: k <= o.nivel ? "on" : "" }));
    }
    const pilhas = b.cards.qtd(c.id);
    const el = h(
      "button",
      { class: "carta " + c.raridade, style: `--cor:${cor};animation-delay:${i * 0.05}s`, onclick: () => aoEscolher(o) },
      iconeCarta(c),
      h("div", null, h("div", { class: "nome" }, c.nome, tag, pips), h("div", { class: "txt", text: o.texto }),
        pilhas > 0 && (c.maxPilhas ?? 1) > 1 ? h("div", { class: "txt", style: "opacity:.6;font-size:11px", text: `Possui ${pilhas}/${c.maxPilhas}` }) : null),
      h("div", { class: "rar", text: RARIDADE_NOME[c.raridade] }),
    );
    lista.append(el);
  });
  const gratis = b.cards.rerrolagensGratis;
  const txtRer = gratis > 0 ? `🔄 Rerrolar (${gratis} grátis)` : `🔄 Rerrolar (${b.cards.custoRerrolagem} ⚙ sucata)`;
  return h(
    "div",
    { class: "overlay" },
    h("div", { class: "titulo", text: `NÍVEL ${b.nivel - b.pendentes + 1}` }),
    h("div", { class: "subtitulo", text: "Escolha uma melhoria" }),
    lista,
    h("div", { class: "linha" },
      h("button", { class: "btn", text: txtRer, disabled: !b.cards.podeRerrolar(), onclick: aoRerrolar }),
      h("span", { class: "moeda", style: "color:var(--texto2)", text: `⚙ ${Math.floor(b.sucata)}` })),
  );
}
