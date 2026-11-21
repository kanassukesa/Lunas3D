import type { Premio } from "../data/comandante";
import type { Chip } from "../data/types";
import { audio } from "../core/Audio";
import { fmtInt, h, ICONE_MOEDA } from "./dom";
import { telaBau } from "./Bau";

type Moeda = "creditos" | "nucleos" | "cristais";
const MOEDAS: Moeda[] = ["creditos", "nucleos", "cristais"];

/**
 * Animação de prêmio: moedas saem do botão e voam até o contador do topo, que sobe contando.
 * Prêmios grandes (chip ou muitos cristais) abrem antes o baú animado.
 * Chame DEPOIS de redesenhar a tela (os contadores já mostram o valor novo).
 */
export function celebrar(root: HTMLElement, origem: DOMRect | null, p: Premio, chip: Chip | null = null, titulo = "RECOMPENSA"): void {
  const grande = !!chip || (p.cristais ?? 0) >= 30 || (p.creditos ?? 0) >= 3000;
  if (grande) {
    const el = telaBau({ creditos: p.creditos ?? 0, nucleos: p.nucleos ?? 0, cristais: p.cristais ?? 0, chip, titulo }, () => {
      el.remove();
      voar(root, null, p);
    });
    root.append(el);
    return;
  }
  voar(root, origem, p);
}

function voar(root: HTMLElement, origem: DOMRect | null, p: Premio): void {
  const de = origem ?? new DOMRect(innerWidth / 2 - 20, innerHeight / 2 - 20, 40, 40);
  let algum = false;
  MOEDAS.forEach((m, k) => {
    const v = p[m] ?? 0;
    if (!v) return;
    algum = true;
    const alvo = root.querySelector<HTMLElement>(`.pilula[data-moeda="${m}"]`);
    if (!alvo) return;
    const ar = alvo.getBoundingClientRect();
    const num = alvo.querySelector<HTMLElement>(".pil-num");
    const final = Number(alvo.dataset.valor ?? 0);
    if (num) num.textContent = fmtInt(final - v);
    const n = Math.min(10, 3 + Math.round(Math.log10(v + 1) * 2));
    for (let i = 0; i < n; i++) {
      const ico = h("span", { class: "voo-moeda", html: ICONE_MOEDA[m] });
      ico.style.left = `${de.left + de.width / 2 - 14}px`;
      ico.style.top = `${de.top + de.height / 2 - 14}px`;
      root.append(ico);
      const dx = ar.left + 10 - (de.left + de.width / 2 - 14);
      const dy = ar.top + ar.height / 2 - 14 - (de.top + de.height / 2 - 14);
      const sx = (Math.random() - 0.5) * 120;
      const sy = -40 - Math.random() * 70;
      const atraso = k * 160 + i * 55;
      const a = ico.animate(
        [
          { transform: "translate(0,0) scale(0.4)", opacity: 0 },
          { transform: `translate(${sx}px,${sy}px) scale(1.15)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${dx}px,${dy}px) scale(0.7)`, opacity: 1 },
        ],
        { duration: 750, delay: atraso, easing: "cubic-bezier(.3,.1,.3,1)", fill: "both" },
      );
      a.onfinish = () => {
        ico.remove();
        alvo.classList.remove("pulso");
        void alvo.offsetWidth;
        alvo.classList.add("pulso");
        if (num) num.textContent = fmtInt(final - v + Math.round((v * (i + 1)) / n));
        if (i % 2 === 0) audio.sfx("carta");
      };
    }
  });
  if (algum) audio.sfx("nivel");
}
