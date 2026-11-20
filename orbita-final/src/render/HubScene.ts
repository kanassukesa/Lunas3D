import { Container, Graphics, Sprite } from "pixi.js";
import { BALANCE } from "../data/balance";
import { SENTINELS } from "../data/sentinels";
import type { SentinelId } from "../data/types";
import { PlanetView } from "./PlanetView";
import { tex } from "./Textures";

/** Vitrine do hub: planeta girando com as sentinelas do deck orbitando. */
export class HubScene {
  readonly layer = new Container();
  private planeta = new PlanetView();
  private sents: { s: Container; slot: number }[] = [];
  private t = 0;

  constructor(deck: SentinelId[]) {
    const orb = new Graphics();
    for (const a of BALANCE.aneis) orb.circle(0, 0, a.raio).stroke({ width: 2, color: 0x4fd6ff, alpha: 0.18 });
    this.layer.addChild(orb, this.planeta.layer);
    deck.slice(0, BALANCE.maxSlots).forEach((id, slot) => {
      const c = new Container();
      const g = new Sprite(tex("glow"));
      g.anchor.set(0.5);
      g.blendMode = "add";
      g.tint = SENTINELS[id].cor;
      g.scale.set(1.6);
      g.alpha = 0.6;
      const b = new Sprite(tex(`sentinela_${id}`));
      b.anchor.set(0.5);
      b.tint = SENTINELS[id].cor;
      c.addChild(g, b);
      this.layer.addChild(c);
      this.sents.push({ s: c, slot });
    });
  }

  resize(w: number, h: number): void {
    const k = Math.min(w, h * 0.8) / 720;
    this.layer.scale.set(Math.max(0.35, k));
    this.layer.position.set(w / 2, h * 0.43);
  }

  update(dt: number): void {
    this.t += dt;
    this.planeta.update(dt, 1, this.t);
    for (const { s, slot } of this.sents) {
      const anel = slot < 3 ? 0 : 1;
      const cfg = BALANCE.aneis[anel];
      const a = ((slot % 3) / 3) * Math.PI * 2 + this.t * cfg.velAngular * 1.5 + (anel ? Math.PI / 3 : -Math.PI / 2);
      s.x = Math.cos(a) * cfg.raio;
      s.y = Math.sin(a) * cfg.raio;
      s.rotation = a + Math.PI / 2 * (anel ? -1 : 1);
    }
  }

  destruir(): void {
    this.layer.destroy({ children: true });
  }
}
