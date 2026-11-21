import { Container, Sprite } from "pixi.js";
import { BALANCE } from "../data/balance";
import { PlanetSphere } from "./PlanetSphere";
import { temArte } from "./Sprites";
import { tex } from "./Textures";
import { aparencia, corEscudo } from "./Aparencia";

const P = BALANCE.planeta;

/**
 * Planeta 3D girando (shader de esfera) + escudo hexagonal em duas camadas que giram em sentidos opostos
 * e acendem no ponto do impacto.
 */
export class PlanetView {
  readonly layer = new Container();
  private esfera: PlanetSphere;
  private escudo: Sprite;
  private escudo2: Sprite;
  private hits: { s: Sprite; life: number }[] = [];
  private escudoBrilho = 0;
  private dano = 0;

  constructor() {
    const atm = new Sprite(tex("atmosfera"));
    atm.anchor.set(0.5);
    atm.blendMode = "add";
    atm.alpha = 0.6;
    this.layer.addChild(atm);

    this.esfera = new PlanetSphere(P.raio, aparencia.planeta);
    this.layer.addChild(this.esfera.mesh);

    const escala = temArte("escudo") ? (P.raioEscudo * 2) / (tex("escudo").width * 0.96) : 1;
    this.escudo = new Sprite(tex("escudo"));
    this.escudo.anchor.set(0.5);
    this.escudo.scale.set(escala);
    this.escudo.blendMode = "add";
    // segunda camada um pouco maior girando ao contrário: dá volume ao campo de força
    this.escudo2 = new Sprite(tex("escudo"));
    this.escudo2.anchor.set(0.5);
    this.escudo2.scale.set(escala * 1.035);
    this.escudo2.blendMode = "add";
    this.escudo2.rotation = 0.5;
    this.escudo.tint = this.escudo2.tint = corEscudo();
    this.layer.addChild(this.escudo2, this.escudo);

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
    this.escudoBrilho = Math.max(0, this.escudoBrilho - dt * 3);
    this.dano = Math.max(0, this.dano - dt * 4);
    this.esfera.update(tempo, this.dano);

    const temEscudo = escudoFrac > 0.001;
    this.escudo.visible = this.escudo2.visible = temEscudo;
    const base = (0.14 + 0.24 * escudoFrac + 0.55 * this.escudoBrilho) * (0.9 + 0.1 * Math.sin(tempo * 3));
    this.escudo.alpha = base;
    this.escudo2.alpha = base * 0.45;
    this.escudo.rotation += dt * 0.22;
    this.escudo2.rotation -= dt * 0.15;

    for (const h of this.hits) {
      if (h.life <= 0) continue;
      h.life -= dt;
      h.s.alpha = Math.max(0, h.life / 0.35);
      h.s.scale.set(1 + (1 - h.life / 0.35) * 0.5, 1);
      if (h.life <= 0) h.s.visible = false;
    }
  }
}
