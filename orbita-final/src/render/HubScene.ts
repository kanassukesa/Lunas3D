import { Container, Graphics, Sprite } from "pixi.js";
import { BALANCE } from "../data/balance";
import { SENTINELS } from "../data/sentinels";
import type { SentinelId } from "../data/types";
import { PlanetView } from "./PlanetView";
import { tex } from "./Textures";
import { criarTorre } from "./Torre";

/** Vitrine do hub: planeta girando com as sentinelas do deck orbitando. */
export class HubScene {
  readonly layer = new Container();
  private planeta = new PlanetView();
  private sents: { s: Container; slot: number; cabeca: Sprite; fase: number }[] = [];
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
      g.alpha = 0.35;
      const t = criarTorre(id, SENTINELS[id].cor);
      c.addChild(g, t.root);
      this.layer.addChild(c);
      this.sents.push({ s: c, slot, cabeca: t.cabeca, fase: slot * 1.3 });
    });
  }

  resize(w: number, h: number): void {
    // cabe entre o logo e o botão de batalha (órbita externa + torres ≈ 340 de raio)
    const k = Math.min((w * 0.92) / 720, (h * 0.2) / 340);
    this.layer.scale.set(Math.max(0.28, k));
    this.layer.position.set(w / 2, h * 0.445);
  }

  update(dt: number): void {
    this.t += dt;
    this.planeta.update(dt, 1, this.t);
    for (const { s, slot, cabeca, fase } of this.sents) {
      const anel = slot < 3 ? 0 : 1;
      const cfg = BALANCE.aneis[anel];
      const a = ((slot % 3) / 3) * Math.PI * 2 + this.t * cfg.velAngular * 1.5 + (anel ? Math.PI / 3 : -Math.PI / 2);
      s.x = Math.cos(a) * cfg.raio;
      s.y = Math.sin(a) * cfg.raio;
      // na vitrine as cabeças "vigiam": apontam para fora e varrem de um lado para o outro
      cabeca.rotation = a + Math.sin(this.t * 0.9 + fase) * 0.6;
    }
  }

  destruir(): void {
    this.layer.destroy({ children: true });
  }
}
