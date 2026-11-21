import { Container, Sprite, TilingSprite } from "pixi.js";
import { tex } from "./Textures";
import { temArte } from "./Sprites";

/** Fundo espacial: gradiente + nebulosa + 3 camadas de estrelas com parallax. */
export class Background {
  readonly layer = new Container();
  private neb: Sprite;
  private camadas: { s: TilingSprite; vel: number }[] = [];
  private img: Sprite | null = null;
  private w = 1;
  private h = 1;

  constructor() {
    this.neb = new Sprite(tex("nebulosa"));
    this.layer.addChild(this.neb);
    this.img = new Sprite();
    this.img.anchor.set(0.5);
    this.img.visible = false;
    this.layer.addChild(this.img);
    const ids: [string, number][] = [["estrelas1", 6], ["estrelas2", 16], ["estrelas3", 34]];
    for (const [id, vel] of ids) {
      const s = new TilingSprite({ texture: tex(id), width: 100, height: 100 });
      this.layer.addChild(s);
      this.camadas.push({ s, vel });
    }
    this.setFundo(1);
  }

  /** Troca a imagem de fundo (fundo_1..3 da arte final). */
  setFundo(n: number): void {
    const id = `fundo_${n}`;
    if (!this.img || !temArte(id)) return;
    this.img.texture = tex(id);
    this.img.visible = true;
    // as estrelas procedurais ficam por cima, mais discretas, só para dar o parallax
    this.camadas.forEach((c, i) => (c.s.alpha = 0.35 + i * 0.2));
    this.ajustarImg();
  }

  private ajustarImg(): void {
    const im = this.img;
    if (!im || !im.visible) return;
    const k = Math.max(this.w / im.texture.width, this.h / im.texture.height);
    im.scale.set(k);
    im.position.set(this.w / 2, this.h / 2);
  }

  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
    this.ajustarImg();
    this.neb.width = w;
    this.neb.height = h;
    const k = Math.max(w / 540, h / 960);
    for (const c of this.camadas) {
      c.s.width = w;
      c.s.height = h;
      c.s.tileScale.set(Math.max(1, k * 0.6));
    }
  }

  update(dt: number, mult = 1): void {
    for (const c of this.camadas) c.s.tilePosition.y += c.vel * dt * mult;
  }
}
