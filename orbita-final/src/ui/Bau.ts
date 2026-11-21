import type { Chip } from "../data/types";

/** Conteúdo do baú (resultado da partida ou prêmio da loja/recompensas). */
export interface ConteudoBau {
  creditos: number;
  nucleos: number;
  cristais?: number;
  chip?: Chip | null;
  pontos?: number;
  novaPatente?: string;
  titulo?: string;
}
import { CHIP_RARIDADE_COR, CHIP_RARIDADES, CHIP_SET_MAP, CHIP_SLOT_NOME } from "../data/chips";
import { formatStat } from "../meta/Meta";
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

/** Baú desenhado em SVG (tampa e corpo separados para a tampa abrir de verdade). */
const SVG_TAMPA = `<svg viewBox="0 0 220 90" aria-hidden="true">
  <defs>
    <linearGradient id="bt-metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d6fb8"/><stop offset=".55" stop-color="#1b3a6e"/><stop offset="1" stop-color="#0c1d3d"/></linearGradient>
    <linearGradient id="bt-ouro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset=".5" stop-color="#ffc23d"/><stop offset="1" stop-color="#b86f00"/></linearGradient>
  </defs>
  <path d="M14 86 L14 46 Q14 10 110 8 Q206 10 206 46 L206 86 Z" fill="url(#bt-metal)" stroke="#0a1630" stroke-width="3"/>
  <path d="M26 80 L26 48 Q28 22 110 20 Q192 22 194 48 L194 80" fill="none" stroke="var(--cor)" stroke-width="2.5" opacity=".85"/>
  <path d="M44 86 L44 22 Q50 16 62 14 L62 86 Z" fill="url(#bt-ouro)"/>
  <path d="M158 86 L158 14 Q170 16 176 22 L176 86 Z" fill="url(#bt-ouro)"/>
  <path d="M14 86 L206 86 L206 76 L14 76 Z" fill="url(#bt-ouro)"/>
  <path d="M30 40 Q110 18 190 40" fill="none" stroke="#9fd8ff" stroke-width="2" opacity=".35"/>
</svg>`;
const SVG_CORPO = `<svg viewBox="0 0 220 120" aria-hidden="true">
  <defs>
    <linearGradient id="bc-metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#244c8c"/><stop offset="1" stop-color="#0a1830"/></linearGradient>
    <linearGradient id="bc-ouro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset=".5" stop-color="#ffc23d"/><stop offset="1" stop-color="#a85f00"/></linearGradient>
    <radialGradient id="bc-gema"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="var(--cor)"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient>
  </defs>
  <path d="M10 4 L210 4 L202 112 Q200 118 192 118 L28 118 Q20 118 18 112 Z" fill="url(#bc-metal)" stroke="#0a1630" stroke-width="3"/>
  <path d="M24 16 L196 16 L190 104 L30 104 Z" fill="none" stroke="var(--cor)" stroke-width="2.5" opacity=".8"/>
  <path d="M44 4 L62 4 L62 118 L46 118 Z" fill="url(#bc-ouro)"/>
  <path d="M158 4 L176 4 L174 118 L158 118 Z" fill="url(#bc-ouro)"/>
  <path d="M10 4 L210 4 L209 14 L11 14 Z" fill="url(#bc-ouro)"/>
  <path d="M86 0 L134 0 L134 44 L110 58 L86 44 Z" fill="url(#bc-ouro)" stroke="#6b3a00" stroke-width="2"/>
  <circle cx="110" cy="24" r="11" fill="url(#bc-gema)" stroke="#6b3a00" stroke-width="2"/>
</svg>`;

/**
 * Baú de recompensas animado (antes da tela de resultado): o baú cai na tela, treme cada vez mais,
 * a tampa abre com um feixe de luz na cor da raridade, moedas e faíscas voam e cada prêmio salta
 * para fora como um cartão. Toque acelera; abre sozinho se ninguém tocar.
 */
export function telaBau(rec: ConteudoBau, aoTerminar: () => void): HTMLElement {
  // cor do brilho: raridade do chip, se houver; senão azul-ciano
  const cor = rec.chip ? CHIP_RARIDADE_COR[rec.chip.raridade] : "#4fd6ff";
  const bau = h("div", { class: "bau3", style: `--cor:${cor}` },
    h("div", { class: "bau3-raios" }),
    h("div", { class: "bau3-sombra" }),
    h("div", { class: "bau3-luz" }),
    h("div", { class: "bau3-corpo", html: SVG_CORPO }),
    h("div", { class: "bau3-tampa", html: SVG_TAMPA }));
  const premios = h("div", { class: "bau3-premios" });
  const titulo = h("div", { class: "titulo bau3-titulo", text: rec.titulo ?? "RECOMPENSAS" });
  const dica = h("div", { class: "subtitulo bau-dica", text: "Toque para abrir" });
  const btn = h("button", { class: "btn primario oculto", html: `<span>Continuar</span>${ic("play")}`, onclick: (e: MouseEvent) => { e.stopPropagation(); aoTerminar(); } });
  const el = h("div", { class: "overlay bau bau-v3", style: `--cor:${cor}` }, titulo, bau, dica, premios, btn);

  const itens: { html: string; valor: number; rot: string }[] = [];
  if (rec.pontos) itens.push({ html: ic("estrela", "ic-estrela"), valor: rec.pontos, rot: "Pontos" });
  if (rec.creditos) itens.push({ html: ICONE_MOEDA.creditos, valor: rec.creditos, rot: "Créditos" });
  if (rec.nucleos) itens.push({ html: ICONE_MOEDA.nucleos, valor: rec.nucleos, rot: "Núcleos" });
  if (rec.cristais) itens.push({ html: ICONE_MOEDA.cristais, valor: rec.cristais, rot: "Cristais" });

  let fase = 0; // 0 = parado, 1 = tremendo, 2 = aberto
  const abrir = () => {
    if (fase === 2) return;
    fase = 2;
    el.classList.remove("tremendo");
    el.classList.add("aberto");
    dica.classList.add("oculto");
    audio.sfx("explosaoGrande");
    // moedas e faíscas saindo da boca do baú
    for (let i = 0; i < 22; i++) {
      const moeda = i % 3 !== 0;
      const m = h("span", { class: moeda ? "bau-moeda" : "bau3-faisca", html: moeda ? ICONE_MOEDA.creditos : "" });
      m.style.setProperty("--dx", `${(Math.random() - 0.5) * 340}px`);
      m.style.setProperty("--dy", `${-140 - Math.random() * 240}px`);
      m.style.animationDelay = `${Math.random() * 0.3}s`;
      bau.append(m);
    }
    itens.forEach((it, i) => {
      setTimeout(() => {
        const valor = h("b", { text: "+0" });
        premios.append(h("div", { class: "bau3-item" }, h("span", { class: "bau3-item-ic", html: it.html }), valor, h("small", { text: it.rot })));
        contar(valor, it.valor);
        audio.sfx("carta");
      }, 500 + i * 300);
    });
    const depois = 500 + itens.length * 300;
    if (rec.chip) {
      const c = rec.chip;
      setTimeout(() => {
        premios.append(h("div", { class: "bau-chip bau3-chip", style: `--cor:${CHIP_RARIDADE_COR[c.raridade]}` },
          h("span", { html: iconeImg(`chip_${c.set}`, ic("chip")) }),
          h("div", null,
            h("small", { text: `Chip ${CHIP_RARIDADES[c.raridade]}` }),
            h("b", { text: `${CHIP_SET_MAP[c.set]?.nome} · ${CHIP_SLOT_NOME[c.slot]}` }),
            h("div", { text: formatStat(c.principal.stat, c.principal.valor) }))));
        audio.sfx(c.raridade >= 2 ? "vitoria" : "nivel");
      }, depois + 250);
    }
    if (rec.novaPatente) {
      setTimeout(() => premios.append(h("div", { class: "bau-patente", html: `${ic("estrela", "ic-estrela")} Nova patente: <b>${rec.novaPatente}</b>` })), depois + 650);
    }
    setTimeout(() => btn.classList.remove("oculto"), depois + 700);
  };
  const tremer = () => {
    if (fase !== 0) return;
    fase = 1;
    el.classList.add("tremendo");
    audio.sfx("alerta");
    setTimeout(abrir, 750);
  };
  el.addEventListener("click", () => (fase === 0 ? tremer() : abrir()));
  setTimeout(tremer, 1500);
  return el;
}
