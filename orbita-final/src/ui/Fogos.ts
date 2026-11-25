import { h } from "./dom";
import { audio } from "../core/Audio";
import rosa from "../assets/fx/fogos_rosa.webp?url";
import ciano from "../assets/fx/fogos_ciano.webp?url";
import ouro from "../assets/fx/fogos_ouro.webp?url";

/**
 * Fogos de artifício animados atrás da tela de VITÓRIA (Pixel FX "explosions/firework-burst").
 * Cada fogo é uma tira de 37 quadros (240x248) animada por CSS (steps); a cada estouro ele troca de
 * lugar, de cor e de tamanho, e faz um "pum" baixinho.
 */
const CORES = [rosa, ciano, ouro];
/** Duração de um estouro (s); a animação em si está no CSS (.fogo, 37 quadros de 240x248). */
const DURACAO = 3.6;

export function fogosDeArtificio(qtd = 4): HTMLElement {
  const camada = h("div", { class: "fogos" });
  for (let i = 0; i < qtd; i++) {
    const f = h("i", { class: "fogo" });
    const sortear = () => {
      f.style.backgroundImage = `url('${CORES[Math.floor(Math.random() * CORES.length)]}')`;
      f.style.left = `${5 + Math.random() * 70}%`;
      f.style.top = `${-4 + Math.random() * 34}%`;
      f.style.setProperty("--k", (0.7 + Math.random() * 0.7).toFixed(2));
    };
    sortear();
    f.style.animationDelay = `${(i * DURACAO) / qtd + Math.random() * 0.4}s`;
    // a cada volta: novo lugar/cor + "pum" (só quando a tela está à mostra)
    f.addEventListener("animationiteration", () => {
      sortear();
      if (camada.isConnected && document.visibilityState === "visible") audio.sfx("explosao");
    });
    camada.append(f);
  }
  return camada;
}
