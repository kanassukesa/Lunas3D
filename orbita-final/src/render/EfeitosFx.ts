import { AnimatedSprite, Assets, Container, Rectangle, Texture } from "pixi.js";

/**
 * Efeitos animados do Pixel FX (MIT, github.com/patch-gg/pixelfx): folhas em src/assets/fx/<nome>.webp + <nome>.json,
 * geradas com `node tools/render.mjs <id> --sheet --bg none --opts '{"palette":[...]}'` e convertidas para WebP sem perda.
 * Os quadros são pixel art (ampliados com "nearest"); o pivô do efeito vem no JSON (meta.pixelfx.pivot).
 */
const IMGS = import.meta.glob("../assets/fx/*.{png,webp}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const JSONS = import.meta.glob("../assets/fx/*.json", { eager: true, import: "default" }) as Record<string, FolhaFx>;

interface FolhaFx {
  frames: { frame: { x: number; y: number; w: number; h: number }; duration: number }[];
  meta?: { pixelfx?: { pivot?: [number, number]; frameSize?: [number, number]; loop?: boolean } };
}

export interface QuadrosFx {
  texs: Texture[];
  /** Duração de cada quadro (ms). */
  ms: number;
  /** Pivô do efeito (0..1), ex.: a ponta do tiro ou o centro da explosão. */
  ancora: [number, number];
}

const quadros = new Map<string, QuadrosFx>();

/** Carrega todas as folhas de efeito (chamar junto com os sprites). */
export async function carregarFx(): Promise<void> {
  await Promise.all(
    Object.entries(IMGS).map(async ([caminho, url]) => {
      const nome = caminho.split("/").pop()!.replace(/\.(png|webp)$/, "");
      const dados = JSONS[caminho.replace(/\.(png|webp)$/, ".json")];
      if (!dados) return;
      try {
        const base = (await Assets.load(url)) as Texture;
        base.source.scaleMode = "nearest";
        const texs = dados.frames.map((f) => new Texture({ source: base.source, frame: new Rectangle(f.frame.x, f.frame.y, f.frame.w, f.frame.h) }));
        const px = dados.meta?.pixelfx;
        const [w, h] = px?.frameSize ?? [dados.frames[0].frame.w, dados.frames[0].frame.h];
        const [pxv, pyv] = px?.pivot ?? [w / 2, h / 2];
        quadros.set(nome, { texs, ms: dados.frames[0]?.duration ?? 83, ancora: [pxv / w, pyv / h] });
      } catch {
        /* sem o efeito, o jogo segue sem ele */
      }
    }),
  );
}

/** Quadros do efeito (para sprites que trocam o quadro na mão, como os tiros em pool). */
export function quadrosEfeito(nome: string): QuadrosFx | null {
  return quadros.get(nome) ?? null;
}

/** Sprite animado do efeito em loop, ou null se a folha não existir. */
export function criarEfeito(nome: string): AnimatedSprite | null {
  const q = quadros.get(nome);
  if (!q) return null;
  const s = new AnimatedSprite(q.texs);
  s.anchor.set(q.ancora[0], q.ancora[1]);
  // AnimatedSprite anda "animationSpeed" quadros por tick de 60 fps
  s.animationSpeed = 1000 / 60 / q.ms;
  s.play();
  return s;
}

/**
 * Toca um efeito UMA vez (explosão, faísca) e some sozinho ao terminar.
 * Limita quantos ficam ao mesmo tempo na camada (celular fraco não engasga em chuva de explosões).
 */
export function tocarEfeito(
  camada: Container, nome: string, x: number, y: number,
  o: { escala?: number; rot?: number; velocidade?: number; max?: number; alpha?: number } = {},
): boolean {
  if (camada.children.length >= (o.max ?? 40)) return false;
  const s = criarEfeito(nome);
  if (!s) return false;
  s.loop = false;
  s.animationSpeed *= o.velocidade ?? 1;
  s.position.set(Math.round(x), Math.round(y));
  s.scale.set(o.escala ?? 1);
  s.rotation = o.rot ?? 0;
  s.alpha = o.alpha ?? 1;
  s.onComplete = () => s.destroy();
  camada.addChild(s);
  s.gotoAndPlay(0);
  return true;
}
