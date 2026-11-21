import { PATENTES } from "../data/comandante";
import { urlArte } from "../render/Sprites";
import { audio } from "../core/Audio";
import { h } from "./dom";
import { ic } from "./Icones";

/**
 * Cerimônia de promoção: raios girando, a insígnia antiga se apaga, a nova desce com um clarão,
 * faíscas sobem e o nome da patente aparece letra a letra. Toque pula direto para o final.
 */
export function telaPromocao(anterior: number, nova: number, nomeCmd: string, aoTerminar: () => void): HTMLElement {
  const insig = (i: number, classe: string) => {
    const u = urlArte(`patente_${i + 1}`);
    return h("div", { class: classe }, u ? h("img", { src: u, alt: "" }) : h("span", { class: "promo-estrela", html: ic("estrela", "ic-estrela") }));
  };
  const nome = PATENTES[nova].nome;
  const letras = h("div", { class: "promo-nome" }, ...[...nome].map((c, i) => h("span", { style: `animation-delay:${1.5 + i * 0.05}s`, text: c === " " ? " " : c })));
  const faiscas = h("div", { class: "promo-faiscas" });
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = 110 + Math.random() * 120;
    faiscas.append(h("i", { style: `--dx:${(Math.cos(a) * d).toFixed(0)}px;--dy:${(Math.sin(a) * d - 40).toFixed(0)}px;animation-delay:${(1.15 + Math.random() * 0.25).toFixed(2)}s` }));
  }
  const btn = h("button", { class: "btn primario promo-btn", html: `<span>Continuar</span>${ic("play")}`, onclick: (e: MouseEvent) => { e.stopPropagation(); aoTerminar(); } });
  const el = h("div", { class: "overlay promo" },
    h("div", { class: "promo-raios" }),
    h("div", { class: "promo-topo", text: "PROMOÇÃO" }),
    h("div", { class: "promo-palco" },
      insig(anterior, "promo-insig antiga"),
      h("div", { class: "promo-anel" }),
      insig(nova, "promo-insig nova"),
      faiscas),
    letras,
    h("div", { class: "promo-sub", text: `Cmd. ${nomeCmd || "Comandante"}, você foi promovido a ${nome}!` }),
    h("div", { class: "promo-de", html: `${PATENTES[anterior].nome} ${ic("play")} <b>${nome}</b>` }),
    btn);
  el.addEventListener("click", () => el.classList.add("pular"));
  setTimeout(() => audio.sfx("alerta"), 300);
  setTimeout(() => audio.sfx("explosaoGrande"), 1150);
  setTimeout(() => audio.sfx("vitoria"), 1500);
  return el;
}
