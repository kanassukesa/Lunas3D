import { Container, Sprite } from "pixi.js";
import type { SentinelId } from "../data/types";
import metaCabecas from "../assets/sprites/cabecas.json";
import { temArte } from "./Sprites";
import { tex } from "./Textures";

/** Nome da cabeça na arte final para cada sentinela. */
const CABECA: Record<SentinelId, string> = {
  canhao: "canhao", laser: "laser", trilho: "trilho", feixe: "prisma", missil: "missil",
  gravidade: "gravidade", campo: "domo", drone: "colmeia", gelo: "gelo",
  fornalha: "fornalha", serra: "serra", plasma: "plasma", nano: "nano", espelho: "espelho", portal: "portal",
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
  /** true = pixel art com 4 estágios (arma_<id>_1..4 + torre_base_1..4). */
  pixel: boolean;
  /** Estágio visual mostrado agora (1..4). */
  estagio: number;
}

/**
 * Tamanho do pixel das armas no mundo. O fundo usa 3 unidades por pixel; as armas têm o dobro de
 * detalhe (1,5), como nos jogos de pixel art HD (cenário mais "grosso", personagens mais finos).
 */
export const PIXEL = 1.5;
/** A cabeça em pixel art aponta para CIMA; o jogo mede o ângulo a partir da direita. */
export const GIRO_PIXEL = Math.PI / 2;

/**
 * Estágio visual da arma na partida: 1 (nível 1-2), 2 (nível 3-4), 3 (nível 5) e 4 (evoluída).
 * Cada estágio é um desenho diferente (ex.: o canhão ganha o 2º cano no nível 3, junto com o +1 projétil).
 */
export function estagioArma(nivel: number, evoluido: boolean): number {
  return evoluido ? 4 : nivel >= 5 ? 3 : nivel >= 3 ? 2 : 1;
}

/** Textura do estágio (cai para o estágio anterior se faltar algum desenho). */
export function texEstagio(prefixo: string, n: number): string | null {
  for (let i = n; i >= 1; i--) if (temArte(`${prefixo}_${i}`)) return `${prefixo}_${i}`;
  return null;
}

/** Troca os desenhos da torre em pixel art para o estágio pedido. */
export function aplicarEstagio(t: TorreView, id: SentinelId, n: number): void {
  if (!t.pixel || t.estagio === n) return;
  t.estagio = n;
  const cab = texEstagio(`arma_${id}`, n);
  if (cab) t.cabeca.texture = tex(cab);
  const base = texEstagio("torre_base", n);
  if (base && t.base) t.base.texture = tex(base);
}

/**
 * Torre em duas partes (base parada + cabeça que gira para mirar) quando a arte existe.
 * Sem ela, cai para o sprite inteiro `sentinela_<id>` ou para a textura procedural.
 */
export function criarTorre(id: SentinelId, cor: number): TorreView {
  const root = new Container();
  if (temArte(`arma_${id}_1`)) {
    // pixel art: base parada + cabeça que gira, sem redimensionar (cada pixel = PIXEL unidades)
    const idBase = texEstagio("torre_base", 1);
    const base = idBase ? new Sprite(tex(idBase)) : null;
    if (base) {
      base.anchor.set(0.5);
      base.scale.set(PIXEL);
      root.addChild(base);
    }
    const cabeca = new Sprite(tex(`arma_${id}_1`));
    cabeca.anchor.set(0.5);
    cabeca.scale.set(PIXEL);
    root.addChild(cabeca);
    return { root, cabeca, base, dupla: true, pixel: true, estagio: 1 };
  }
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
    return { root, cabeca, base, dupla: true, pixel: false, estagio: 1 };
  }
  const cabeca = new Sprite(tex(`sentinela_${id}`));
  cabeca.anchor.set(0.5);
  if (temArte(`sentinela_${id}`)) cabeca.scale.set(112 / cabeca.texture.width);
  else cabeca.tint = cor;
  root.addChild(cabeca);
  return { root, cabeca, base: null, dupla: false, pixel: false, estagio: 1 };
}
