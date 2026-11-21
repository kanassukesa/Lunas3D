import { Container, Sprite } from "pixi.js";
import type { SentinelId } from "../data/types";
import metaCabecas from "../assets/sprites/cabecas.json";
import { temArte } from "./Sprites";
import { tex } from "./Textures";

/** Nome da cabeça na arte final para cada sentinela. */
const CABECA: Record<SentinelId, string> = {
  canhao: "canhao", laser: "laser", trilho: "trilho", feixe: "prisma", missil: "missil",
  gravidade: "gravidade", campo: "domo", drone: "colmeia", gelo: "gelo",
};

/** Raio da base no mundo e raio do "corpo" da cabeça (o cano pode passar da base). */
const RAIO_BASE = 54;
const RAIO_CORPO = 37;

export interface TorreView {
  root: Container;
  /** Parte que gira para mirar. */
  cabeca: Sprite;
  base: Sprite | null;
  /** true = arte final em duas partes. */
  dupla: boolean;
}

/**
 * Torre em duas partes (base parada + cabeça que gira para mirar) quando a arte existe.
 * Sem ela, cai para o sprite inteiro `sentinela_<id>` ou para a textura procedural.
 */
export function criarTorre(id: SentinelId, cor: number): TorreView {
  const root = new Container();
  const nomeCab = `cabeca_${CABECA[id]}`;
  if (temArte("torre_base") && temArte(nomeCab)) {
    const base = new Sprite(tex("torre_base"));
    base.anchor.set(0.5);
    base.scale.set((RAIO_BASE * 2) / base.texture.width);
    const cabeca = new Sprite(tex(nomeCab));
    cabeca.anchor.set(0.5);
    const k = (metaCabecas as Record<string, number>)[CABECA[id]] ?? 0.8;
    cabeca.scale.set(((RAIO_CORPO / k) * 2) / cabeca.texture.width);
    root.addChild(base, cabeca);
    return { root, cabeca, base, dupla: true };
  }
  const cabeca = new Sprite(tex(`sentinela_${id}`));
  cabeca.anchor.set(0.5);
  if (temArte(`sentinela_${id}`)) cabeca.scale.set(112 / cabeca.texture.width);
  else cabeca.tint = cor;
  root.addChild(cabeca);
  return { root, cabeca, base: null, dupla: false };
}
