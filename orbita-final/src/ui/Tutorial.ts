import { h } from "./dom";
import { ic } from "./Icones";

/**
 * Tutorial guiado ("coach"): escurece a tela, recorta um buraco iluminado em volta do alvo e mostra um balão.
 * - Sem `tocar`: o jogador lê e toca em "Continuar".
 * - Com `tocar`: só o botão destacado responde; ao tocar, o coach fecha e o clique vai para o botão de verdade.
 * Não tem botão de pular (o tutorial inicial é obrigatório).
 */
export interface PassoCoach {
  titulo?: string;
  texto: string;
  /** Seletor CSS do elemento destacado. */
  alvo?: string;
  /** O jogador precisa tocar no alvo para seguir. */
  tocar?: boolean;
}

export function criarCoach(p: PassoCoach, aoFim: () => void): HTMLElement {
  const el = h("div", { class: "coach" });
  const furo = h("div", { class: "coach-furo oculto" });
  const anel = h("div", { class: "coach-anel oculto" });
  const fantasma = h("button", { class: "coach-fantasma oculto", "aria-label": "Tocar aqui" });
  const balao = h("div", { class: "coach-balao" },
    p.titulo ? h("b", { class: "coach-tit", text: p.titulo }) : null,
    h("p", { text: p.texto }),
    p.tocar ? h("small", { class: "coach-dica", html: `${ic("play")} Toque no botão destacado` })
      : h("button", { class: "btn primario coach-ok", text: "Continuar", onclick: (e: MouseEvent) => { e.stopPropagation(); fechar(); } }));
  el.append(furo, anel, fantasma, balao);
  let fechado = false;
  const fechar = () => {
    if (fechado) return;
    fechado = true;
    el.remove();
    aoFim();
  };
  // cliques fora do alvo não fazem nada (não dá para pular)
  el.addEventListener("click", (e) => e.stopPropagation());

  const posicionar = () => {
    if (fechado || !el.isConnected) return;
    const alvo = p.alvo ? document.querySelector<HTMLElement>(p.alvo) : null;
    if (!alvo) {
      furo.classList.add("oculto");
      anel.classList.add("oculto");
      el.classList.add("sem-alvo");
      balao.style.top = "50%";
      balao.style.transform = "translate(-50%, -50%)";
      return;
    }
    el.classList.remove("sem-alvo");
    const r = alvo.getBoundingClientRect();
    const m = 8;
    const caixa = { left: r.left - m, top: r.top - m, width: r.width + m * 2, height: r.height + m * 2 };
    for (const x of [furo, anel, fantasma]) {
      x.classList.remove("oculto");
      Object.assign(x.style, { left: `${caixa.left}px`, top: `${caixa.top}px`, width: `${caixa.width}px`, height: `${caixa.height}px` });
    }
    fantasma.classList.toggle("oculto", !p.tocar);
    // balão acima ou abaixo do alvo, onde couber
    const embaixo = r.top + r.height / 2 < window.innerHeight * 0.55;
    balao.style.transform = "translateX(-50%)";
    if (embaixo) { balao.style.top = `${Math.min(window.innerHeight - 180, r.bottom + 18)}px`; balao.style.bottom = ""; }
    else { balao.style.bottom = `${Math.min(window.innerHeight - 180, window.innerHeight - r.top + 18)}px`; balao.style.top = ""; }
  };
  fantasma.addEventListener("click", (e) => {
    e.stopPropagation();
    const alvo = p.alvo ? document.querySelector<HTMLElement>(p.alvo) : null;
    fechar();
    alvo?.click();
  });
  // posiciona depois do layout; o alvo pode estar fora da tela (rola até ele)
  requestAnimationFrame(() => {
    const alvo = p.alvo ? document.querySelector<HTMLElement>(p.alvo) : null;
    alvo?.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior });
    requestAnimationFrame(posicionar);
    setTimeout(posicionar, 300);
  });
  window.addEventListener("resize", posicionar);
  return el;
}
