import { Assets, Texture } from "pixi.js";

/**
 * Arte final (PNG em src/assets/sprites). O Vite descobre os arquivos sozinho: basta salvar
 * `<id>.png` com o mesmo ID da textura procedural (ex.: sentinela_canhao, planeta, escudo).
 * O que não existir continua com a arte gerada por código.
 */
const URLS = import.meta.glob("../assets/sprites/*.png", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

export const spritesReais = new Map<string, Texture>();

export async function carregarSprites(): Promise<void> {
  await Promise.all(
    Object.entries(URLS).map(async ([caminho, url]) => {
      const id = caminho.split("/").pop()!.replace(/\.png$/, "");
      try {
        const t = (await Assets.load(url)) as Texture;
        t.source.scaleMode = "linear";
        spritesReais.set(id, t);
      } catch {
        /* se falhar, o jogo usa a arte procedural */
      }
    }),
  );
}

export function temArte(id: string): boolean {
  return spritesReais.has(id);
}
