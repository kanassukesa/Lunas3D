import { Container, Sprite, TilingSprite } from "pixi.js";
import { tex } from "./Textures";

/** Fundo espacial: gradiente + nebulosa + 3 camadas de estrelas com parallax. */
export class Background {
  readonly layer = new Container();
  private neb: Sprite;
  private camadas: { s: TilingSprite; vel: number }[] = [];

  constructor() {
    this.neb = new Sprite(tex("nebulosa"));
    this.layer.addChild(this.neb);
    const ids: [string, number][] = [["estrelas1", 6], ["estrelas2", 16], ["estrelas3", 34]];
    for (const [id, vel] of ids) {
      const s = new TilingSprite({ texture: tex(id), width: 100, height: 100 });
      this.layer.addChild(s);
      this.camadas.push({ s, vel });
    }
  }

  resize(w: number, h: number): void {
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
