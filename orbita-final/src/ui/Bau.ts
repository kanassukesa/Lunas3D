import type { Recompensa } from "../meta/Meta";
import { CHIP_RARIDADE_COR, CHIP_RARIDADES, CHIP_SET_MAP, CHIP_SLOT_NOME } from "../data/chips";
import { formatStat } from "../meta/Meta";
import { urlArte } from "../render/Sprites";
import { audio } from "../core/Audio";
import { fmtInt, h, ICONE_MOEDA, iconeImg } from "./dom";
import { ic } from "./Icones";

/** Conta de 0 até `alvo` no elemento. */
function contar(el: HTMLElement, alvo: number, ms = 700): void {
  const t0 = performance.now();
  const passo = (t: number) => {
    const f = Math.min(1, (t - t0) / ms);
    el.textContent = "+" + fmtInt(Math.round(alvo * (1 - Math.pow(1 - f, 3))));
    if (f < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

/**
 * Baú de recompensas animado (antes da tela de resultado): o baú treme, abre com um clarão,
 * moedas voam para cima e cada prêmio aparece contando. Toque pula a animação.
 */
export function telaBau(rec: Recompensa, aoTerminar: () => void): HTMLElement {
  const fechado = urlArte("loja_creditos");
  const aberto = urlArte("banner_recompensas");
  const bau = h("div", { class: "bau-img" },
    fechado ? h("img", { class: "bau-fechado", src: fechado, alt: "" }) : h("span", { class: "bau-fechado", html: ic("presente") }),
    aberto ? h("img", { class: "bau-aberto", src: aberto, alt: "" }) : null);
  const premios = h("div", { class: "bau-premios" });
  const titulo = h("div", { class: "titulo", text: "RECOMPENSAS" });
  const dica = h("div", { class: "subtitulo bau-dica", text: "Toque para abrir" });
  const btn = h("button", { class: "btn primario oculto", html: `<span>Continuar</span>${ic("play")}`, onclick: (e: MouseEvent) => { e.stopPropagation(); aoTerminar(); } });
  const el = h("div", { class: "overlay bau" }, titulo, bau, dica, premios, btn);

  let aberto_ = false;
  const itens: { html: string; valor: number }[] = [];
  if (rec.pontos) itens.push({ html: ic("estrela", "ic-estrela"), valor: rec.pontos });
  if (rec.creditos) itens.push({ html: ICONE_MOEDA.creditos, valor: rec.creditos });
  if (rec.nucleos) itens.push({ html: ICONE_MOEDA.nucleos, valor: rec.nucleos });

  const abrir = () => {
    if (aberto_) return;
    aberto_ = true;
    el.classList.add("aberto");
    dica.classList.add("oculto");
    audio.sfx("explosaoGrande");
    // moedas voando
    for (let i = 0; i < 16; i++) {
      const m = h("span", { class: "bau-moeda", html: ICONE_MOEDA.creditos });
      m.style.setProperty("--dx", `${(Math.random() - 0.5) * 300}px`);
      m.style.setProperty("--dy", `${-160 - Math.random() * 220}px`);
      m.style.animationDelay = `${Math.random() * 0.25}s`;
      bau.append(m);
    }
    itens.forEach((it, i) => {
      setTimeout(() => {
        const valor = h("b", { text: "+0" });
        premios.append(h("div", { class: "bau-item" }, h("span", { html: it.html }), valor, i === 0 && rec.pontos ? h("small", { text: "pontos" }) : null));
        contar(valor, it.valor);
        audio.sfx("carta");
      }, 450 + i * 380);
    });
    const depois = 450 + itens.length * 380;
    if (rec.chip) {
      const c = rec.chip;
      setTimeout(() => {
        premios.append(h("div", { class: "bau-chip", style: `--cor:${CHIP_RARIDADE_COR[c.raridade]}` },
          h("span", { html: iconeImg(`chip_${c.set}`, ic("chip")) }),
          h("div", null,
            h("small", { text: `Chip ${CHIP_RARIDADES[c.raridade]}` }),
            h("b", { text: `${CHIP_SET_MAP[c.set]?.nome} · ${CHIP_SLOT_NOME[c.slot]}` }),
            h("div", { text: formatStat(c.principal.stat, c.principal.valor) }))));
        audio.sfx(c.raridade >= 2 ? "vitoria" : "nivel");
      }, depois + 200);
    }
    if (rec.novaPatente) {
      setTimeout(() => premios.append(h("div", { class: "bau-patente", html: `${ic("estrela", "ic-estrela")} Nova patente: <b>${rec.novaPatente}</b>` })), depois + 600);
    }
    setTimeout(() => btn.classList.remove("oculto"), depois + 700);
  };
  el.addEventListener("click", abrir);
  setTimeout(abrir, 1300);
  return el;
}
