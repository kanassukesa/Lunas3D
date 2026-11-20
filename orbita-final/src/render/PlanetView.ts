import { Container, Graphics, Sprite, TilingSprite } from "pixi.js";
import { BALANCE } from "../data/balance";
import { tex } from "./Textures";

const P = BALANCE.planeta;

/** Planeta com continentes girando, sombra, atmosfera e escudo hexagonal que acende no impacto. */
export class PlanetView {
  readonly layer = new Container();
  private terra: TilingSprite;
  private escudo: Sprite;
  private hits: { s: Sprite; life: number }[] = [];
  private escudoBrilho = 0;
  private dano = 0;
  private base: Sprite;

  constructor() {
    const atm = new Sprite(tex("atmosfera"));
    atm.anchor.set(0.5);
    atm.blendMode = "add";
    atm.alpha = 0.8;
    this.layer.addChild(atm);

    this.base = new Sprite(tex("planeta"));
    this.base.anchor.set(0.5);
    this.layer.addChild(this.base);

    this.terra = new TilingSprite({ texture: tex("planetaTerra"), width: P.raio * 2, height: P.raio * 2 });
    this.terra.anchor.set(0.5);
    const mask = new Graphics().circle(0, 0, P.raio - 1).fill(0xffffff);
    this.layer.addChild(mask);
    this.terra.mask = mask;
    this.layer.addChild(this.terra);

    const sombra = new Sprite(tex("planetaSombra"));
    sombra.anchor.set(0.5);
    this.layer.addChild(sombra);

    this.escudo = new Sprite(tex("escudo"));
    this.escudo.anchor.set(0.5);
    this.escudo.blendMode = "add";
    this.layer.addChild(this.escudo);

    for (let i = 0; i < 8; i++) {
      const s = new Sprite(tex("escudoHit"));
      s.anchor.set(0.5, 1);
      s.blendMode = "add";
      s.visible = false;
      this.layer.addChild(s);
      this.hits.push({ s, life: 0 });
    }
  }

  impactoEscudo(ang: number): void {
    const h = this.hits.find((x) => x.life <= 0) ?? this.hits[0];
    h.life = 0.35;
    h.s.visible = true;
    h.s.rotation = ang + Math.PI / 2;
    h.s.x = Math.cos(ang) * P.raioEscudo;
    h.s.y = Math.sin(ang) * P.raioEscudo;
    this.escudoBrilho = 1;
  }

  danoCasco(): void {
    this.dano = 1;
  }

  update(dt: number, escudoFrac: number, tempo: number): void {
    this.terra.tilePosition.x -= dt * 9;
    this.escudoBrilho = Math.max(0, this.escudoBrilho - dt * 3);
    this.dano = Math.max(0, this.dano - dt * 4);
    const temEscudo = escudoFrac > 0.001;
    this.escudo.visible = temEscudo;
    this.escudo.alpha = (0.12 + 0.22 * escudoFrac + 0.55 * this.escudoBrilho) * (0.92 + 0.08 * Math.sin(tempo * 3));
    this.escudo.rotation += dt * 0.05;
    this.base.tint = this.dano > 0 ? 0xff8080 : 0xffffff;
    for (const h of this.hits) {
      if (h.life <= 0) continue;
      h.life -= dt;
      h.s.alpha = Math.max(0, h.life / 0.35);
      h.s.scale.set(1 + (1 - h.life / 0.35) * 0.5, 1);
      if (h.life <= 0) h.s.visible = false;
    }
  }
}
