import { Container, Graphics, Sprite } from "pixi.js";
import { BALANCE } from "../data/balance";
import { SENTINELS } from "../data/sentinels";
import type { SentinelId } from "../data/types";
import { NO_PLANETA } from "../battle/Sentinel";
import { PlanetView } from "./PlanetView";
import { tex } from "./Textures";
import { aplicarEstagio, criarTorre, GIRO_PIXEL, PIXEL, texEstagio } from "./Torre";

/** Arma da vitrine: id + nível no Hangar (o nível decide o estágio visual). */
export interface ArmaVitrine {
  id: SentinelId;
  nivel: number;
}

/** Estágio visual pelo nível do Hangar (1-30): 1-9, 10-19, 20-29 e 30 (dourada). */
export function estagioHangar(nivel: number): number {
  return nivel >= 30 ? 4 : nivel >= 20 ? 3 : nivel >= 10 ? 2 : 1;
}

/** Mesmos ângulos da batalha para as armas instaladas no planeta (topo, depois esquerda e direita). */
const ANG_INSTALACAO = [-Math.PI / 2, -Math.PI / 2 - 0.95, -Math.PI / 2 + 0.95];

/**
 * Vitrine do hub: o planeta girando com TODAS as armas liberadas no Hangar.
 * As que atiram orbitam nos dois anéis (divididas por igual); Domo, Serra e Colmeia ficam
 * instalados na borda do planeta, como na batalha. Cada uma aparece no estágio do nível dela.
 */
export class HubScene {
  readonly layer = new Container();
  private planeta = new PlanetView();
  private sents: { s: Container; anel: number; idx: number; n: number; cabeca: Sprite; fase: number; giro: number }[] = [];
  private t = 0;

  constructor(armas: ArmaVitrine[]) {
    const orb = new Graphics();
    for (const a of BALANCE.aneis) orb.circle(0, 0, a.raio).stroke({ width: 2, color: 0x4fd6ff, alpha: 0.18 });
    this.layer.addChild(orb, this.planeta.layer);

    // instalações no planeta
    const noPlaneta = armas.filter((a) => NO_PLANETA.has(a.id));
    noPlaneta.slice(0, ANG_INSTALACAO.length).forEach((a, i) => {
      const id = texEstagio(`instalacao_${a.id}`, estagioHangar(a.nivel));
      if (!id) return;
      const sp = new Sprite(tex(id));
      sp.anchor.set(0.5, 0.9);
      sp.scale.set(PIXEL);
      const ang = ANG_INSTALACAO[i];
      const r = BALANCE.planeta.raio * 0.97;
      sp.position.set(Math.round(Math.cos(ang) * r), Math.round(Math.sin(ang) * r));
      sp.rotation = ang + GIRO_PIXEL;
      this.layer.addChild(sp);
    });

    // torres em órbita: anel de dentro com ~40%, o resto no de fora
    const orbitam = armas.filter((a) => !NO_PLANETA.has(a.id));
    const nDentro = orbitam.length <= 4 ? orbitam.length : Math.ceil(orbitam.length * 0.4);
    orbitam.forEach((a, k) => {
      const anel = k < nDentro ? 0 : 1;
      const idx = anel ? k - nDentro : k;
      const n = anel ? orbitam.length - nDentro : nDentro;
      const c = new Container();
      const g = new Sprite(tex("glow"));
      g.anchor.set(0.5);
      g.blendMode = "add";
      g.tint = SENTINELS[a.id].cor;
      g.scale.set(1.6);
      g.alpha = 0.3;
      const t = criarTorre(a.id, SENTINELS[a.id].cor);
      aplicarEstagio(t, a.id, estagioHangar(a.nivel));
      c.addChild(g, t.root);
      // com muitas armas a vitrine fica cheia: torres um pouco menores
      if (orbitam.length > 6) c.scale.set(orbitam.length > 9 ? 0.78 : 0.88);
      this.layer.addChild(c);
      this.sents.push({ s: c, anel, idx, n, cabeca: t.cabeca, fase: k * 1.3, giro: t.pixel ? GIRO_PIXEL : 0 });
    });
  }

  /** Posiciona a vitrine num espaço da tela (centro e raio em pixels CSS). */
  encaixar(cx: number, cy: number, raio: number): void {
    const k = Math.max(0.22, raio / 330);
    this.layer.scale.set(k);
    this.layer.position.set(cx, cy);
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
    for (const { s, anel, idx, n, cabeca, fase, giro } of this.sents) {
      const cfg = BALANCE.aneis[anel];
      const a = (idx / Math.max(1, n)) * Math.PI * 2 + this.t * cfg.velAngular * 1.5 + (anel ? Math.PI / 3 : -Math.PI / 2);
      s.x = Math.cos(a) * cfg.raio;
      s.y = Math.sin(a) * cfg.raio;
      // na vitrine as cabeças "vigiam": apontam para fora e varrem de um lado para o outro
      cabeca.rotation = a + Math.sin(this.t * 0.9 + fase) * 0.6 + giro;
    }
  }

  destruir(): void {
    this.layer.destroy({ children: true });
  }
}
