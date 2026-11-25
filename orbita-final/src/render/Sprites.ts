import { Assets, Texture } from "pixi.js";

/**
 * Arte final (WebP em src/assets/sprites; o processar_arte.py gera e o otimizar_sprites.py converte). O Vite descobre os arquivos sozinho: basta salvar
 * `<id>.png` com o mesmo ID da textura procedural (ex.: sentinela_canhao, planeta, escudo).
 * O que não existir continua com a arte gerada por código.
 */
const URLS_HD = import.meta.glob("../assets/sprites/*.{png,jpg,webp}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
/**
 * Arte nova em PIXEL ART (src/assets/pixel, PNG no tamanho nativo, limpo pelo scripts/pixelizar.py).
 * Tem prioridade sobre a arte antiga de mesmo nome e é ampliada sem suavizar (nearest).
 */
const URLS_PIXEL = import.meta.glob("../assets/pixel/*.png", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const nomeDe = (caminho: string) => caminho.split("/").pop()!.replace(/\.(png|jpg|webp)$/, "");
const IDS_PIXEL = new Set(Object.keys(URLS_PIXEL).map(nomeDe));
const URLS: Record<string, string> = {
  ...Object.fromEntries(Object.entries(URLS_HD).filter(([c]) => !IDS_PIXEL.has(nomeDe(c)))),
  ...URLS_PIXEL,
};

/** A textura é pixel art (amplia com "nearest", sem borrar). */
export function ehPixel(id: string): boolean {
  return IDS_PIXEL.has(id);
}

export const spritesReais = new Map<string, Texture>();

export async function carregarSprites(): Promise<void> {
  await Promise.all(
    Object.entries(URLS).map(async ([caminho, url]) => {
      const id = nomeDe(caminho);
      // elementos só de interface (DOM) não precisam virar textura do Pixi
      if (/^(carta_|moeda_|chip_|logo|icone_|tile_|avatar_|botao_|banner_|pedestal|premio_|loja_|patente_)/.test(id)) return;
      try {
        const t = (await Assets.load(url)) as Texture;
        t.source.scaleMode = IDS_PIXEL.has(id) ? "nearest" : "linear";
        spritesReais.set(id, t);
      } catch {
        /* se falhar, o jogo usa a arte procedural */
      }
    }),
  );
}

/** URLs de todas as imagens (ou só as cujo nome bate com `filtro`), para baixar com antecedência. */
export function listarArtes(filtro: RegExp | null): string[] {
  return Object.entries(URLS)
    .filter(([caminho]) => !filtro || filtro.test(caminho.split("/").pop() ?? ""))
    .map(([, url]) => url);
}

/** URL do PNG da arte final (para <img> na interface), ou null. */
export function urlArte(id: string): string | null {
  for (const [caminho, url] of Object.entries(URLS)) if (/\/([^/]+)\.(png|jpg|webp)$/.exec(caminho)?.[1] === id) return url;
  return null;
}

export function temArte(id: string): boolean {
  return spritesReais.has(id);
}
