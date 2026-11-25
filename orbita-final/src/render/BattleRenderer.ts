import { Container, Graphics, Rectangle, Sprite } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";
import type { Mina } from "../battle/Campo";
import type { Battle } from "../battle/Battle";
import type { Drone, Enemy, EnemyShot, Projectile, SentinelRun, Zone } from "../battle/types";
import { BALANCE } from "../data/balance";
import { audio } from "../core/Audio";
import { DamageNumbers } from "./DamageNumbers";
import { Particles } from "./Particles";
import { PlanetView } from "./PlanetView";
import { enemyTexKey, tex } from "./Textures";
import { ehPixel, temArte } from "./Sprites";
import larguraChefes from "../assets/pixel/chefes.json";
import { criarEfeito, quadrosEfeito, tocarEfeito, type QuadrosFx } from "./EfeitosFx";
import type { AnimatedSprite } from "pixi.js";

/**
 * Sopro de fogo (Pixel FX "fire/fire-breath") saindo da boca do chefe quando ele ataca enfurecido.
 * boca = posição da boca no desenho (em pixels, a partir do centro); origem = onde o jato nasce na folha do efeito.
 */
const SOPRO: Record<string, { boca: [number, number]; escala: number }> = {
  colosso_igneo: { boca: [0, 24], escala: 1.35 },
};

/**
 * Tiros em pixel art animada (Pixel FX): efeito e tamanho no mundo (escala do quadro).
 * Os quadros apontam para a DIREITA, como o ângulo do jogo; o pivô (ponta do tiro) vem do JSON.
 */
function fxDoTiro(p: Projectile): { nome: string; escala: number } | null {
  if (p.ult) return null;
  const arma = p.src?.def.id;
  if (p.kind === "bala" && arma === "plasma") return { nome: "tiro_plasma", escala: Math.max(1, p.r / 14) };
  if (p.kind === "bala" && arma === "canhao") return { nome: "tiro_canhao", escala: 1 };
  if (p.kind === "gelo") return { nome: "tiro_gelo", escala: 0.6 };
  if (p.kind === "trilho") return { nome: "tiro_trilho", escala: p.r > 30 ? 2 : 1.4 };
  if (p.kind === "drone") return { nome: "tiro_drone", escala: 0.55 };
  if (p.kind === "missil") return { nome: "tiro_missil", escala: 0.42 };
  return null;
}

/** Explosão do Pixel FX pela cor do inimigo/efeito: fogo (vermelho/laranja), verde ou roxo. */
function explosaoPorCor(cor: number): string {
  const r = (cor >> 16) & 255, g = (cor >> 8) & 255, b = cor & 255;
  if (g > r && g > b) return "expl_verde";
  if (r >= b && r > 150) return "expl_fogo";
  return "expl_roxo";
}
import { aplicarEstagio, criarTorre, estagioArma, GIRO_PIXEL, PIXEL, texEstagio, type TorreView } from "./Torre";
import { NO_PLANETA, posInstalacao } from "../battle/Sentinel";
import type { SentinelId } from "../data/types";

interface Freeable {
  free(): void;
}

/** Pool simples de views (Container/Sprite) reaproveitáveis. */
class ViewPool<V extends { root: Container } & Freeable> {
  private livres: V[] = [];
  constructor(private layer: Container, private make: (pool: ViewPool<V>) => V) {}
  get(): V {
    const v = this.livres.pop() ?? this.make(this);
    if (!v.root.parent) this.layer.addChild(v.root);
    v.root.visible = true;
    return v;
  }
  back(v: V): void {
    v.root.visible = false;
    this.livres.push(v);
  }
}

class EnemyView implements Freeable {
  root = new Container();
  body = new Sprite();
  shield = new Sprite(tex("anel"));
  bar = new Graphics();
  key = "";
  real = false;
  /** Arte em pixel art (escala fixa, frente para baixo). */
  pixel = false;
  constructor(private pool: ViewPool<EnemyView>) {
    this.body.anchor.set(0.5);
    this.shield.anchor.set(0.5);
    this.shield.blendMode = "add";
    this.shield.tint = 0x5ec8ff;
    this.root.addChild(this.body, this.shield, this.bar);
  }
  free(): void {
    this.pool.back(this);
  }
}

class SpriteView implements Freeable {
  root: Container;
  s: Sprite;
  halo: Sprite | null = null;
  /** Rastro (só mísseis): pares x,y do mais novo para o mais antigo. */
  trail: number[] = [];
  trailTick = 0;
  /** Quadros do tiro animado (Pixel FX), se for um. */
  fx: QuadrosFx | null = null;
  haloBase = 1;
  constructor(private pool: ViewPool<SpriteView>, texId: string, halo: boolean) {
    this.root = new Container();
    if (halo) {
      this.halo = new Sprite(tex("glow"));
      this.halo.anchor.set(0.5);
      this.halo.blendMode = "add";
      this.root.addChild(this.halo);
    }
    this.s = new Sprite(tex(texId));
    this.s.anchor.set(0.5);
    this.s.blendMode = "add";
    this.root.addChild(this.s);
  }
  free(): void {
    this.trail.length = 0;
    this.pool.back(this);
  }
}

class SentinelView implements Freeable {
  root = new Container();
  glow = new Sprite(tex("glow"));
  torre: TorreView;
  ring = new Sprite(tex("anel"));
  escalaCabeca: number;
  escalaBase: number;
  constructor(id: SentinelId, cor: number) {
    this.glow.anchor.set(0.5);
    this.glow.blendMode = "add";
    this.glow.tint = cor;
    this.glow.scale.set(1.6);
    this.torre = criarTorre(id, cor);
    this.glow.alpha = this.torre.dupla || temArte(`sentinela_${id}`) ? 0.3 : 0.6;
    this.escalaCabeca = this.torre.cabeca.scale.x;
    this.escalaBase = this.torre.base?.scale.x ?? 1;
    this.ring.anchor.set(0.5);
    this.ring.tint = 0xffc23d;
    this.ring.blendMode = "add";
    this.ring.scale.set(this.torre.dupla || temArte(`sentinela_${id}`) ? 1.15 : 0.62);
    this.ring.visible = false;
    this.root.addChild(this.glow, this.ring, this.torre.root);
    if (id === "campo") {
      // Domo Elétrico: em vez de torre, uma cúpula elétrica em volta do planeta
      this.torre.root.visible = false;
      this.glow.visible = false;
      const arte = temArte("domo_eletrico");
      this.domo = new Sprite(tex(arte ? "domo_eletrico" : "escudo"));
      this.domo.anchor.set(0.5);
      this.domo.blendMode = "add";
      this.domo.tint = arte ? 0xffffff : 0x5effa8;
      this.domo.scale.set((RAIO_DOMO * 2) / (this.domo.texture.width * 0.96));
      this.arcos = new Graphics();
      this.arcos.blendMode = "add";
      this.root.addChild(this.domo, this.arcos);
    }
  }
  domo: Sprite | null = null;
  arcos: Graphics | null = null;
  /** Arma do planeta (Domo, Serra, Colmeia): prédio em pixel art preso na borda do planeta. */
  inst: Sprite | null = null;
  instEstagio = 0;
  /** Lâminas animadas da Serra Orbital. */
  laminas: AnimatedSprite[] = [];
  arcoTick = -1;
  free(): void {
    this.inst?.destroy();
    for (const l of this.laminas) l.destroy();
    this.root.destroy({ children: true });
  }
}

const CORES_PROJ: Record<string, number> = { estilhaco: 0xffffff };
/** Raio visual do Domo Elétrico (um pouco além do escudo do planeta). */
const RAIO_DOMO = BALANCE.planeta.raioEscudo * 1.28;

export class BattleRenderer {
  readonly world = new Container();
  /** Camada que recebe bloom: só o que brilha (tiros, partículas, feixes). Planeta e inimigos ficam nítidos. */
  private brilhoL = new Container();
  private zonesL = new Container();
  private campoG = new Graphics();
  private minaPool: ViewPool<SpriteView>;
  private bloom: AdvancedBloomFilter | null = null;
  private orbitas = new Graphics();
  private planetL: PlanetView;
  private sentL = new Container();
  private enemyL = new Container();
  private bossL = new Container();
  private projL = new Container();
  private shotL = new Container();
  private beamsG = new Graphics();
  readonly particles = new Particles();
  readonly numeros = new DamageNumbers();

  private enemyPool: ViewPool<EnemyView>;
  private projPool: ViewPool<SpriteView>;
  private projHaloPool: ViewPool<SpriteView>;
  private missilPool: ViewPool<SpriteView>;
  private shotPool: ViewPool<SpriteView>;
  private dronePool: ViewPool<SpriteView>;
  private zonePool: ViewPool<SpriteView>;
  private bossSprite = new Sprite();
  private bossAura = new Sprite(tex("glowSoft"));
  private bossRing = new Sprite(tex("anelFino"));
  private bossReal = false;
  private bossPixel = false;
  /** Explosões animadas (Pixel FX) e faíscas de impacto. */
  private fxL = new Container();
  private faiscaL = new Container();
  private ultFaisca = 0;
  private bossQuadro = "";
  private sopro: AnimatedSprite | null = null;
  /** Segundos que o sopro de fogo ainda fica aceso. */
  private soproT = 0;
  private tempoAnt = 0;

  leve = false;
  brilho = true;
  tremor = 0;
  flash = 0;
  private tempo = 0;
  private dtFrame = 0;
  private trailTick = 0;

  constructor(private b: Battle) {
    this.planetL = new PlanetView();
    this.planetL.layer.position.set(BALANCE.planeta.x, BALANCE.planeta.y);
    this.beamsG.blendMode = "add";
    this.bossAura.anchor.set(0.5);
    this.bossAura.blendMode = "add";
    this.bossSprite.anchor.set(0.5);
    this.bossRing.anchor.set(0.5);
    this.bossRing.blendMode = "add";
    this.bossRing.tint = 0x9a7cff;
    this.bossL.addChild(this.bossAura, this.bossRing, this.bossSprite);
    this.bossL.visible = false;
    this.brilhoL.addChild(this.projL, this.particles.layer, this.beamsG);
    this.world.addChild(
      this.campoG, this.zonesL, this.orbitas, this.planetL.layer, this.enemyL, this.bossL, this.sentL, this.shotL, this.fxL, this.faiscaL,
      this.brilhoL, this.numeros.layer,
    );
    this.enemyPool = new ViewPool(this.enemyL, (p) => new EnemyView(p));
    this.projPool = new ViewPool(this.projL, (p) => new SpriteView(p, "bolt", false));
    this.projHaloPool = new ViewPool(this.projL, (p) => new SpriteView(p, "bolt", true));
    this.missilPool = new ViewPool(this.projL, (p) => {
      const v = new SpriteView(p, "missil", true);
      v.s.blendMode = "normal";
      const real = temArte("missil");
      v.s.scale.set(real ? 64 / (v.s.texture.width * 0.92) : 0.8);
      v.halo!.texture = tex(temArte("missil_chama") ? "missil_chama" : "chama");
      v.halo!.anchor.set(temArte("missil_chama") ? 0.95 : 1, 0.5);
      v.halo!.x = real ? -27 : -22;
      v.haloBase = temArte("missil_chama") ? 40 / (v.halo!.texture.width * 0.9) : 1;
      return v;
    });
    this.shotPool = new ViewPool(this.shotL, (p) => new SpriteView(p, "glow", false));
    this.dronePool = new ViewPool(this.projL, (p) => new SpriteView(p, "drone", false));
    this.zonePool = new ViewPool(this.zonesL, (p) => new SpriteView(p, "vortice", false));
    this.minaPool = new ViewPool(this.zonesL, (p) => new SpriteView(p, "glow", true));
    b.onRemove = (o) => (o.view as Freeable | undefined)?.free();
    this.desenharOrbitas();
  }

  private desenharOrbitas(): void {
    const g = this.orbitas;
    for (const a of BALANCE.aneis) g.circle(BALANCE.planeta.x, BALANCE.planeta.y, a.raio).stroke({ width: 2, color: 0x4fd6ff, alpha: 0.12 });
  }

  aplicarConfig(leve: boolean, brilho: boolean, numeros: boolean, bloom = true): void {
    const usar = bloom && !leve;
    if (usar && !this.bloom) {
      this.bloom = new AdvancedBloomFilter({ threshold: 0.25, bloomScale: 1.1, brightness: 1, blur: 6, quality: 3 });
      this.bloom.resolution = "inherit";
    }
    this.brilhoL.filters = usar && this.bloom ? [this.bloom] : [];
    this.leve = leve;
    this.brilho = brilho;
    this.particles.max = leve ? 250 : 900;
    this.numeros.ativo = numeros;
    this.numeros.max = leve ? 35 : 70;
  }

  /**
   * Área do filtro em coordenadas LOCAIS do mundo (cobre a tela inteira + margem do tremor),
   * para o bloom não recalcular limites a cada frame.
   */
  setTela(w: number, h: number, scale: number, ox: number, oy: number): void {
    const m = 60;
    this.brilhoL.filterArea = new Rectangle(-ox / scale - m, -oy / scale - m, w / scale + m * 2, h / scale + m * 2);
  }

  private desenharCampo(): void {
    const b = this.b;
    const g = this.campoG;
    g.clear();
    const c = b.campo;
    for (const z of c.radiacao) {
      const pulso = 0.12 + 0.05 * Math.sin(this.tempo * 3 + z.y);
      g.rect(-200, z.y - z.h / 2, 1480, z.h).fill({ color: 0x7dff5e, alpha: pulso });
      g.moveTo(-200, z.y - z.h / 2).lineTo(1280, z.y - z.h / 2).stroke({ width: 3, color: 0xb8ff9e, alpha: 0.5 });
      g.moveTo(-200, z.y + z.h / 2).lineTo(1280, z.y + z.h / 2).stroke({ width: 3, color: 0xb8ff9e, alpha: 0.5 });
    }
    if (c.erupcao > 0) g.rect(-300, b.vis.top - 100, 1700, 2400).fill({ color: 0xff9a2c, alpha: c.erupcao * 0.35 });
    for (const m of c.minas) this.syncMina(m);
  }

  private syncMina(m: Mina): void {
    let v = m.view as SpriteView | undefined;
    if (!m.alive) {
      if (v) {
        v.free();
        m.view = undefined;
      }
      return;
    }
    if (!v) {
      v = this.minaPool.get();
      m.view = v;
      v.s.tint = 0xff4d3c;
      if (v.halo) v.halo.tint = 0xff4d3c;
    }
    v.root.x = m.x;
    v.root.y = m.y;
    const k = 0.7 + 0.25 * Math.sin(this.tempo * 6 + m.x);
    v.s.scale.set(0.6 * k);
    if (v.halo) v.halo.scale.set(2.2 * k);
  }

  /** Consome eventos de FX da lógica. */
  private consumirFx(): void {
    const b = this.b;
    for (const f of b.fx) {
      switch (f.t) {
        case "dmg":
          this.numeros.add(f.x, f.y, f.v, f.crit ? "crit" : "normal");
          // faísca de impacto (no máximo uma a cada 40 ms, para não poluir)
          if (!this.leve && this.tempo - this.ultFaisca > 0.04) {
            this.ultFaisca = this.tempo;
            tocarEfeito(this.faiscaL, "faisca", f.x, f.y, { escala: f.crit ? 1.2 : 0.8, rot: Math.random() * Math.PI * 2, velocidade: 1.3, max: 16 });
          }
          break;
        case "dmgPlaneta":
          this.numeros.add(f.x, f.y - 30, f.v, "planeta");
          this.planetL.danoCasco();
          audio.sfx("dano");
          break;
        case "morte":
          // explosão animada do Pixel FX (no modo leve, as partículas simples de antes)
          if (this.leve || !tocarEfeito(this.fxL, explosaoPorCor(f.cor), f.x, f.y, { escala: Math.max(0.5, Math.min(2.2, (f.r * 4.5) / 150)), velocidade: 1.6 }))
            this.particles.morte(f.x, f.y, f.cor, f.r, this.leve);
          audio.sfx("morte");
          break;
        case "explosao":
          if (this.leve || !tocarEfeito(this.fxL, explosaoPorCor(f.cor), f.x, f.y, { escala: Math.max(0.5, Math.min(4, (Math.min(f.r, 600) * 2.2) / 150)), velocidade: 1.4 }))
            this.particles.explosao(f.x, f.y, Math.min(f.r, 600), f.cor, this.leve);
          if (f.r > 60) audio.sfx("explosao");
          break;
        case "portal":
          // portal se abrindo embaixo do alvo (Portal de Dobra)
          if (!this.leve) tocarEfeito(this.fxL, "portal", f.x, f.y + f.r * 0.2, { escala: Math.max(0.8, f.r / 70), velocidade: 2.6 });
          break;
        case "explosaoChefe":
          tocarEfeito(this.fxL, "expl_chefe", f.x, f.y, { escala: 2.4, velocidade: 1.3, max: 80 });
          break;
        case "escudo":
          this.planetL.impactoEscudo(f.ang);
          audio.sfx("escudo");
          break;
        case "tremor":
          this.tremor = Math.min(1, this.tremor + f.força / 30);
          break;
        case "flash":
          this.flash = Math.max(this.flash, f.força * (this.leve ? 0.4 : 0.8));
          break;
        case "som":
          audio.sfx(f.id);
          break;
        case "absorve":
          this.particles.emitir(f.x, f.y, { cor: 0xb59cff, vel: 50, vida: 0.3, s0: 0.5 });
          break;
      }
    }
    b.fx.length = 0;
  }

  render(dt: number): void {
    const b = this.b;
    this.tempo += dt;
    this.dtFrame = dt;
    this.consumirFx();
    this.trailTick += dt;
    const trail = !this.leve && this.trailTick > 1 / 30;
    if (trail) this.trailTick = 0;

    // planeta
    const pl = b.planet;
    this.planetL.update(dt, pl.escudoMax ? pl.escudo / pl.escudoMax : 0, this.tempo);

    // efeitos de campo + zonas
    this.desenharCampo();
    for (const z of b.zones) this.syncZone(z);

    // inimigos
    for (const e of b.enemies) {
      if (!e.alive) continue;
      if (e.boss) {
        this.syncBoss(e);
        continue;
      }
      this.syncEnemy(e, trail);
    }
    if (!b.boss || !b.boss.alive) this.bossL.visible = false;

    // sentinelas
    for (const s of b.sentinels) this.syncSentinel(b, s);

    // projéteis
    for (const p of b.projs) if (p.alive) this.syncProj(p, trail);
    for (const s of b.shots) if (s.alive) this.syncShot(s);
    for (const d of b.drones) if (d.alive) this.syncDrone(d);

    this.desenharFeixes();
    this.particles.update(dt);
    this.numeros.update(dt);

    // tremor de câmera
    this.tremor = Math.max(0, this.tremor - dt * 1.8);
    const t2 = this.tremor * this.tremor * (this.leve ? 8 : 22);
    this.world.pivot.set((Math.random() - 0.5) * t2, (Math.random() - 0.5) * t2);
    this.flash = Math.max(0, this.flash - dt * 2.5);
  }

  private syncZone(z: Zone): void {
    let v = z.view as SpriteView | undefined;
    if (!v) {
      v = this.zonePool.get();
      z.view = v;
    }
    v.root.x = z.x;
    v.root.y = z.y;
    v.s.alpha = Math.min(1, z.life * 2, (z.maxLife - z.life) * 4) * 0.9;
    // Poço Gravitacional: orbe de vazio animado; evoluído, buraco negro com disco (Pixel FX)
    const nomeFx = z.src?.def.id === "gravidade" ? (z.buracoNegro ? "zona_buraco" : "zona_poco") : null;
    const q = nomeFx ? quadrosEfeito(nomeFx) : null;
    if (q) {
      if (v.fx !== q) {
        v.fx = q;
        v.s.anchor.set(q.ancora[0], q.ancora[1]);
        v.s.blendMode = "normal";
        v.s.tint = 0xffffff;
        v.s.rotation = 0;
      }
      const i = Math.floor((this.tempo * 1000) / q.ms) % q.texs.length;
      v.s.texture = q.texs[i];
      // a parte visível do efeito ocupa ~60% (orbe) / ~80% (disco) do quadro
      v.s.scale.set((z.r * 2) / (v.s.texture.width * (z.buracoNegro ? 0.8 : 0.6)));
      return;
    }
    if (v.fx) {
      v.fx = null;
      v.s.texture = tex("vortice");
      v.s.anchor.set(0.5);
    }
    v.s.blendMode = z.src === null || z.buracoNegro ? "normal" : "add";
    // Nuvem Nano em rosa; o resto no lilás de antes
    v.s.tint = z.buracoNegro ? 0xffffff : z.src?.def.id === "nano" ? 0xff5ec8 : 0xc0a8ff;
    v.s.scale.set((z.r * 2.1) / v.s.texture.width);
    v.s.rotation -= 0.06 * (z.buracoNegro ? 2 : 1);
  }

  private syncEnemy(e: Enemy, trail: boolean): void {
    let v = e.view as EnemyView | undefined;
    if (!v) {
      v = this.enemyPool.get();
      e.view = v;
      const idArte = `inimigo_${e.def.id}`;
      v.real = temArte(idArte);
      const k = v.real ? idArte : enemyTexKey(e.def.forma, e.def.raio);
      if (v.key !== k) {
        v.body.texture = tex(k);
        v.key = k;
      }
      // inimigos ficam um pouco maiores que a hitbox para leitura em telas pequenas
      // (em pixel art o tamanho já vem certo do fatiar_folha: só amplia pelo tamanho do pixel)
      v.pixel = v.real && ehPixel(idArte);
      if (v.pixel) v.body.scale.set(PIXEL);
      else if (v.real) v.body.scale.set((e.def.raio * (e.def.raio < 16 ? 4.2 : 3.4)) / v.body.texture.width);
      else v.body.scale.set(e.def.raio < 16 ? 1.5 : 1.3);
      v.bar.clear();
    }
    v.root.x = e.x;
    v.root.y = e.y;
    // pixel art: desenhado com a frente para BAIXO (o ângulo do jogo começa na direita)
    // (a Barreira é exceção: o ângulo dela é só uma inclinação perto de 0, e o desenho já é deitado)
    v.body.rotation = v.pixel && e.def.comportamento !== "muro" ? e.rot - Math.PI / 2 : e.rot;
    // espectro invisível: quase transparente e tremulando
    v.root.alpha = e.def.comportamento === "espectro" && !e.alvoavel ? 0.12 + 0.08 * Math.sin(this.tempo * 20) : 1;
    const slowed = e.slowT > 0 && e.slowAmt > 0.3;
    if (v.real) v.body.tint = e.flash > 0 ? 0xff9090 : slowed ? 0xa8e8ff : 0xffffff;
    else v.body.tint = e.flash > 0 ? 0xffffff : slowed ? 0x9fe8ff : e.def.cor;
    v.shield.visible = e.escudo > 0;
    if (v.shield.visible) {
      v.shield.scale.set((e.r * 1.9) / 54);
      v.shield.alpha = 0.5 + 0.3 * Math.sin(this.tempo * 6);
    }
    // barra de HP só para inimigos grandes e feridos
    if (e.r >= 28 && e.hp < e.hpMax) {
      const w = e.r * 1.6;
      v.bar.clear();
      v.bar.rect(-w / 2, e.r + 8, w, 6).fill({ color: 0x000000, alpha: 0.6 });
      v.bar.rect(-w / 2, e.r + 8, (w * Math.max(0, e.hp)) / e.hpMax, 6).fill(0xff5a5a);
    }
    if (trail && e.def.comportamento === "meteoro") {
      this.particles.emitir(e.x, e.y, { cor: 0xff8a3c, vel: 30, vida: 0.5, s0: 0.9, s1: 0.1 });
    } else if (trail && e.def.comportamento === "kamikaze" && Math.hypot(e.vx, e.vy) > 200) {
      this.particles.emitir(e.x, e.y, { cor: e.def.cor, vel: 20, vida: 0.3, s0: 0.5, s1: 0 });
    }
  }

  private syncBoss(e: Enemy): void {
    const s = e.boss!;
    this.bossL.visible = true;
    if (!e.view) {
      e.view = { free: () => (this.bossL.visible = false) };
      this.bossSprite.texture = tex(`chefe_${s.def.id}`);
      this.bossAura.tint = s.def.cor;
      this.bossReal = temArte(`chefe_${s.def.id}`);
      this.bossPixel = this.bossReal && ehPixel(`chefe_${s.def.id}`);
      this.bossQuadro = "";
      this.soproT = 0;
      if (this.sopro) this.sopro.visible = false;
      // chefe (pixel art ou não) fica do tamanho da área dele; todos os quadros da animação usam a mesma escala
      // (pixel art: os quadros alinhados têm folga em volta; vale a largura do corpo, do alinhar_quadros.py)
      const larg = (this.bossPixel && (larguraChefes as Record<string, number>)[`chefe_${s.def.id}`]) || this.bossSprite.texture.width;
      this.bossSprite.scale.set(this.bossReal ? (s.def.raio * 3.1) / larg : 1);
    }
    if (this.bossPixel) this.animarChefePixel(e);
    this.bossL.x = this.bossPixel ? Math.round(e.x) : e.x;
    this.bossL.y = this.bossPixel ? Math.round(e.y) : e.y;
    // arte final: a nave aponta para o planeta (para baixo) e balança de leve; procedural gira
    // arte final já vem de frente para o planeta (para baixo): esferas giram, naves só balançam
    if (this.bossPixel) this.bossSprite.rotation = 0;
    else if (this.bossReal) {
      const gira = s.def.id === "colosso_igneo" || s.def.id === "singularidade";
      this.bossSprite.rotation = gira ? e.rot * 0.35 : Math.sin(this.tempo * 0.8) * 0.06 + (s.fase === 2 ? Math.sin(this.tempo * 6) * 0.03 : 0);
    }
    else this.bossSprite.rotation = s.def.id === "eclipse" || s.def.id === "construtor_muros" ? 0 : e.rot;
    this.bossSprite.tint = e.flash > 0 ? 0xffd0d0 : 0xffffff;
    const alvo = s.invisivel > 0 ? 0.12 : 1;
    this.bossL.alpha += (alvo - this.bossL.alpha) * 0.2;
    this.bossAura.scale.set((s.def.raio / 40) * (1 + 0.06 * Math.sin(this.tempo * 4)));
    this.bossAura.alpha = s.fase === 2 ? 0.9 : 0.55;
    this.bossRing.visible = s.campo > 0;
    if (this.bossRing.visible) {
      this.bossRing.scale.set((480 / 124) * (0.92 + 0.08 * Math.sin(this.tempo * 10)));
      this.bossRing.alpha = 0.5;
    }
    if (!this.leve && s.def.id === "colosso_igneo" && Math.random() < 0.5) {
      const a = Math.random() * Math.PI * 2;
      this.particles.emitir(e.x + Math.cos(a) * e.r * 0.9, e.y + Math.sin(a) * e.r * 0.9, { cor: 0xff7a2c, vel: 80, ang: a, vida: 0.6, s0: 1.2, s1: 0 });
    }
  }

  /**
   * Animação do chefe em pixel art, montada em código com poucos desenhos:
   *  - chefe_<id> / chefe_<id>_furia (abaixo de 50% de vida)
   *  - ..._piscar: olhos fechados por um instante a cada poucos segundos (enfurecido pisca mais)
   *  - ..._ataque: boca/canhão aberto logo depois de atirar, com um pequeno coice
   *  - flutua alguns pixels; enfurecido treme (sempre em pixels inteiros, para não borrar)
   */
  private animarChefePixel(e: Enemy): void {
    const s = e.boss!;
    const id = s.def.id;
    const furia = s.fase === 2 && temArte(`chefe_${id}_furia`) ? "_furia" : "";
    const base = `chefe_${id}${furia}`;
    const periodo = furia ? 2.1 : 3.6;
    const piscando = (this.tempo + (e.id % 5) * 0.7) % periodo < 0.13;
    const dt = Math.max(0, Math.min(0.1, this.tempo - this.tempoAnt));
    this.tempoAnt = this.tempo;
    const cfgSopro = furia ? SOPRO[id] : undefined;
    if (cfgSopro && (s.ataque ?? 0) > 0) this.soproT = Math.max(this.soproT, 0.9);
    this.soproT = Math.max(0, this.soproT - dt);
    // enquanto sopra fogo, a boca fica aberta
    const atacando = (s.ataque ?? 0) > 0 || (!!cfgSopro && this.soproT > 0);
    let quadro = base;
    if (atacando && temArte(`${base}_ataque`)) quadro = `${base}_ataque`;
    else if (piscando && temArte(`${base}_piscar`)) quadro = `${base}_piscar`;
    if (quadro !== this.bossQuadro) {
      this.bossQuadro = quadro;
      this.bossSprite.texture = tex(quadro);
    }
    // flutuar (2 pixels para cima e para baixo) + coice ao atirar + tremor quando enfurecido
    let dx = 0;
    let dy = Math.round(Math.sin(this.tempo * 1.7) * 2) * PIXEL;
    if (atacando) dy -= Math.round(((s.ataque ?? 0) / 0.35) * 3) * PIXEL;
    if (furia) {
      const passo = Math.floor(this.tempo * 18);
      dx = (((passo * 7) % 3) - 1) * PIXEL;
      dy += (((passo * 5) % 3) - 1) * PIXEL;
    }
    this.bossSprite.position.set(dx, dy);
    // sopro de fogo animado (Pixel FX), apontando para baixo a partir da boca
    if (cfgSopro && !this.sopro) {
      this.sopro = criarEfeito("fire-breath");
      if (this.sopro) {
        this.sopro.rotation = Math.PI / 2;
        this.sopro.blendMode = "normal";
        this.bossL.addChild(this.sopro);
      }
    }
    if (this.sopro) {
      const ligado = !!cfgSopro && this.soproT > 0;
      this.sopro.visible = ligado;
      if (ligado && cfgSopro) {
        const k = this.bossSprite.scale.x;
        this.sopro.scale.set(k * cfgSopro.escala);
        this.sopro.position.set(dx + cfgSopro.boca[0] * k, dy + cfgSopro.boca[1] * k);
        this.sopro.alpha = Math.min(1, this.soproT * 4);
      }
    }
  }

  /** Lâminas da Serra Orbital: discos de energia animados (Pixel FX) girando em volta do planeta, como na lógica. */
  private syncSerras(b: Battle, s: SentinelRun, v: SentinelView): void {
    if (this.leve || !quadrosEfeito("serra")) return;
    const st = s.stats;
    const aneis = s.evoluido ? [{ r: st.alcance, v: 1.6 }, { r: st.alcance * 0.72, v: -2.1 }] : [{ r: st.alcance, v: 1.6 }];
    const n = Math.max(1, Math.round(st.projeteis));
    let k = 0;
    for (const an of aneis) {
      for (let i = 0; i < n; i++, k++) {
        let lam = v.laminas[k];
        if (!lam) {
          lam = criarEfeito("serra")!;
          lam.blendMode = "add";
          this.sentL.addChild(lam);
          v.laminas[k] = lam;
        }
        const a = b.t * an.v + (i / n) * Math.PI * 2;
        lam.position.set(Math.round(b.planet.x + Math.cos(a) * an.r), Math.round(b.planet.y + Math.sin(a) * an.r));
        // o disco "voa" na direção do giro (o rastro fica para trás)
        lam.rotation = a + (an.v > 0 ? Math.PI / 2 : -Math.PI / 2);
        lam.scale.set((st.area * 2) / 40);
        lam.visible = true;
      }
    }
    for (; k < v.laminas.length; k++) v.laminas[k].visible = false;
  }

  /** Instalação no planeta (arma que não atira): em pé na borda, apontando para fora; muda de desenho a cada estágio. */
  private syncInstalacao(b: Battle, s: SentinelRun, v: SentinelView, estagio: number): void {
    const idTex = texEstagio(`instalacao_${s.def.id}`, estagio);
    if (!idTex) return;
    if (!v.inst) {
      v.inst = new Sprite(tex(idTex));
      // o chão (morrinho) fica embaixo do desenho: âncora quase na base, para o prédio "sair" do planeta
      v.inst.anchor.set(0.5, 0.9);
      v.inst.scale.set(PIXEL);
      // fica atrás das torres, mas na frente do planeta
      this.sentL.addChildAt(v.inst, 0);
      v.torre.root.visible = false;
      v.glow.visible = false;
    }
    if (v.instEstagio !== estagio) {
      v.instEstagio = estagio;
      v.inst.texture = tex(idTex);
    }
    const p = posInstalacao(b, s);
    v.inst.position.set(Math.round(p.x), Math.round(p.y));
    v.inst.rotation = p.ang + GIRO_PIXEL;
  }

  private syncSentinel(b: Battle, s: SentinelRun): void {
    let v = s.view as SentinelView | undefined;
    if (!v) {
      v = new SentinelView(s.def.id, s.def.cor);
      s.view = v;
      this.sentL.addChild(v.root);
    }
    v.root.x = s.x;
    v.root.y = s.y;
    const estagio = estagioArma(s.nivel, s.evoluido);
    if (NO_PLANETA.has(s.def.id)) this.syncInstalacao(b, s, v, estagio);
    if (s.def.id === "serra") this.syncSerras(b, s, v);
    if (v.domo && v.arcos) {
      // a cúpula tem o tamanho REAL da área do Domo (cresce com as melhorias); respira,
      // acende logo após cada pulso e solta arcos elétricos pela borda
      const R = Math.max(RAIO_DOMO, s.stats.area);
      const desde = 1 / Math.max(0.01, s.stats.cadencia) - Math.max(0, s.cd);
      const pulso = Math.max(0, 1 - desde * 3);
      v.domo.alpha = 0.14 + 0.04 * Math.sin(this.tempo * 4) + 0.35 * pulso + (s.evoluido ? 0.08 : 0);
      v.domo.rotation = this.tempo * 0.1;
      const k = (R * 2) / (v.domo.texture.width * 0.96);
      v.domo.scale.set(k * (1 + 0.03 * pulso));
      if (Math.floor(this.tempo * 20) !== v.arcoTick) {
        v.arcoTick = Math.floor(this.tempo * 20);
        const g = v.arcos;
        g.clear();
        // borda da área (sempre visível) + preenchimento bem leve
        g.circle(0, 0, R).fill({ color: 0x5effa8, alpha: 0.04 + 0.06 * pulso });
        g.circle(0, 0, R).stroke({ width: 3, color: 0x5effa8, alpha: 0.45 + 0.4 * pulso });
        g.circle(0, 0, R - 8).stroke({ width: 1, color: 0xc8ffe4, alpha: 0.25 });
        const n = (s.evoluido ? 7 : 4) + Math.round(pulso * 5);
        for (let i = 0; i < n; i++) {
          let a = Math.random() * Math.PI * 2;
          g.moveTo(Math.cos(a) * R, Math.sin(a) * R);
          for (let j = 0; j < 5; j++) {
            a += (0.07 + Math.random() * 0.06) * (RAIO_DOMO / R + 0.4);
            const r = R * (0.95 + Math.random() * 0.1);
            g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
        }
        g.stroke({ width: 2.2, color: 0xc8ffe4, alpha: 0.85 });
      }
      return;
    }
    if (v.inst) {
      // arma do planeta já desenhada como instalação: sem anel/brilho de torre
      v.ring.visible = false;
      v.glow.visible = false;
      return;
    }
    // a cabeça gira para mirar; a base acompanha a órbita devagar
    v.torre.cabeca.rotation = (s.def.id === "laser" && s.raios[0] ? s.raios[0].ang : s.ang) + (v.torre.pixel ? GIRO_PIXEL : 0);
    if (v.torre.pixel) {
      // pixel art: troca o desenho conforme o estágio (sem crescer/girar a base, para não borrar os pixels)
      aplicarEstagio(v.torre, s.def.id, estagio);
      v.root.x = Math.round(s.x);
      v.root.y = Math.round(s.y);
      v.ring.visible = false;
      v.glow.visible = !this.leve && s.evoluido;
      return;
    }
    if (v.torre.base) v.torre.base.rotation = this.tempo * 0.15;
    v.ring.visible = s.evoluido;
    if (s.evoluido) v.ring.rotation += 0.03;
    v.glow.visible = !this.leve;
    const k = 1.0 + 0.05 * (s.nivel - 1);
    v.torre.cabeca.scale.set(v.escalaCabeca * k);
    if (v.torre.base) v.torre.base.scale.set(v.escalaBase * k);
  }

  private syncProj(p: Projectile, trail: boolean): void {
    let v = p.view as SpriteView | undefined;
    // míssil: se houver o foguete animado do Pixel FX (com a própria fumaça), vai como tiro animado
    const missil = p.kind === "missil" && !quadrosEfeito("tiro_missil");
    if (!v) {
      const halo = this.brilho && !this.leve;
      v = missil ? this.missilPool.get() : halo && p.kind !== "estilhaco" ? this.projHaloPool.get() : this.projPool.get();
      p.view = v;
      v.fx = null;
      v.s.anchor.set(0.5);
      v.s.blendMode = "add";
      const fx = missil ? null : fxDoTiro(p);
      const q = fx ? quadrosEfeito(fx.nome) : null;
      if (missil) {
        v.trail.length = 0;
        v.trailTick = 0;
      } else if (fx && q) {
        // tiro animado do Pixel FX
        v.fx = q;
        v.s.texture = q.texs[0];
        v.s.anchor.set(q.ancora[0], q.ancora[1]);
        v.s.tint = 0xffffff;
        v.s.blendMode = "normal";
        v.s.scale.set(fx.escala);
        if (v.halo) v.halo.visible = false;
      } else {
        const cor = CORES_PROJ[p.kind] ?? p.cor;
        // arte final por tipo de tiro (comprimento no mundo); o resto usa o "bolt" colorido
        const arte = p.ult ? null
          : p.kind === "trilho" && temArte("trilho") ? { id: "trilho", L: p.r > 30 ? 300 : 190, larg: p.r > 30 ? 1.6 : 1 }
          : p.kind === "gelo" && temArte("gelo_tiro") ? { id: "gelo_tiro", L: 62, larg: 1 }
          : p.kind === "bala" && p.src?.def.id === "canhao" && temArte("bala_pulso") ? { id: "bala_pulso", L: 60, larg: 1 }
          : null;
        if (arte) {
          v.s.texture = tex(arte.id);
          v.s.tint = 0xffffff;
          const k = arte.L / (v.s.texture.width * 0.92);
          v.s.scale.set(k, k * arte.larg);
          if (v.halo) {
            v.halo.tint = cor;
            v.halo.alpha = 0.35;
            v.halo.scale.set(p.kind === "trilho" ? 1.6 : 0.8);
            v.halo.visible = this.brilho && !this.leve;
          }
        } else {
          v.s.texture = tex("bolt");
          v.s.tint = cor;
          if (v.halo) {
            v.halo.tint = cor;
            v.halo.alpha = 0.55;
            v.halo.visible = this.brilho && !this.leve;
          }
          const plasmaR = p.src?.def.id === "plasma" ? p.r / 14 : 0;
          const sc = plasmaR || (p.kind === "trilho" ? (p.r > 30 ? 2.6 : 1.7) : p.kind === "estilhaco" ? 0.4 : p.kind === "drone" ? 0.5 : 0.8);
          v.s.scale.set(sc, p.kind === "trilho" ? sc * 1.1 : sc);
          if (v.halo) v.halo.scale.set(p.kind === "trilho" ? 2.2 : 1);
        }
      }
    }
    v.root.x = p.x;
    v.root.y = p.y;
    v.root.rotation = Math.atan2(p.vy, p.vx);
    if (v.fx) {
      const n = v.fx.texs.length;
      const i = Math.floor((this.tempo * 1000) / v.fx.ms + p.id) % n;
      if (v.s.texture !== v.fx.texs[i]) v.s.texture = v.fx.texs[i];
    }
    if (missil) {
      // chama tremulando + ponto do rastro a cada 2 frames (≈ 0,6 s de rastro)
      v.halo!.scale.set(v.haloBase * (0.9 + Math.random() * 0.5), v.haloBase * (0.8 + Math.random() * 0.3));
      if (this.dtFrame > 0 && ++v.trailTick % 2 === 0) {
        const a = v.root.rotation;
        v.trail.unshift(p.x - Math.cos(a) * 26, p.y - Math.sin(a) * 26);
        const max = this.leve ? 20 : 36;
        if (v.trail.length > max) v.trail.length = max;
      }
    } else if (trail && p.kind === "trilho") {
      this.particles.emitir(p.x, p.y, { cor: p.cor, vel: 10, vida: 0.35, s0: 1.1, s1: 0 });
    }
  }

  /** Rastros finos e brilhantes dos mísseis, afinando e sumindo para trás. */
  private desenharRastros(g: Graphics): void {
    for (const p of this.b.projs) {
      if (!p.alive || p.kind !== "missil") continue;
      const v = p.view as SpriteView | undefined;
      const t = v?.trail;
      if (!t || t.length < 4) continue;
      const n = t.length / 2;
      const partes = 4;
      for (let k = 0; k < partes; k++) {
        const i0 = Math.floor((k * (n - 1)) / partes);
        const i1 = Math.floor(((k + 1) * (n - 1)) / partes);
        if (i1 <= i0) continue;
        const f = 1 - k / partes;
        g.moveTo(t[i0 * 2], t[i0 * 2 + 1]);
        for (let i = i0 + 1; i <= i1; i++) g.lineTo(t[i * 2], t[i * 2 + 1]);
        g.stroke({ width: 9 * f + 2, color: 0xffb347, alpha: 0.16 * f });
        g.moveTo(t[i0 * 2], t[i0 * 2 + 1]);
        for (let i = i0 + 1; i <= i1; i++) g.lineTo(t[i * 2], t[i * 2 + 1]);
        g.stroke({ width: 2.6 * f + 0.8, color: 0xfff3c8, alpha: 0.85 * f });
      }
    }
  }

  private syncShot(s: EnemyShot): void {
    let v = s.view as SpriteView | undefined;
    if (!v) {
      v = this.shotPool.get();
      s.view = v;
      const r = (s.cor >> 16) & 255, g = (s.cor >> 8) & 255;
      v.s.blendMode = "add";
      // bola de plasma da arte final para tiros vermelho/laranja; outras cores seguem o brilho colorido
      if (s.arte && ehPixel(s.arte)) {
        // tiro do chefe em pixel art (desenhado apontando para baixo)
        v.s.texture = tex(s.arte);
        v.s.tint = 0xffffff;
        v.s.blendMode = "normal";
        v.s.scale.set(PIXEL);
      } else if (temArte("tiro_inimigo") && r > 200 && g < 190) {
        v.s.texture = tex("tiro_inimigo");
        v.s.tint = 0xffffff;
        v.s.scale.set((s.r * 4.2) / (v.s.texture.width * 0.92));
      } else {
        v.s.texture = tex("glow");
        v.s.tint = s.cor;
        v.s.scale.set(s.r / 14);
      }
    }
    v.root.x = s.x;
    v.root.y = s.y;
    v.root.rotation = Math.atan2(s.vy, s.vx) - (s.arte && v.s.blendMode === "normal" ? Math.PI / 2 : 0);
  }

  private syncDrone(d: Drone): void {
    let v = d.view as SpriteView | undefined;
    const idPixel = texEstagio("drone_colmeia", d.dono ? estagioArma(d.dono.nivel, d.dono.evoluido) : 1);
    if (idPixel) {
      // drone em pixel art (muda junto com o estágio da Colmeia)
      if (!v) {
        v = this.dronePool.get();
        d.view = v;
      }
      const t = tex(idPixel);
      if (v.s.texture !== t) v.s.texture = t;
      v.s.blendMode = "normal";
      v.s.tint = d.temp > 0 ? 0xffe070 : 0xffffff;
      v.s.scale.set(PIXEL);
      v.root.x = Math.round(d.x);
      v.root.y = Math.round(d.y);
      v.root.rotation = d.ang + GIRO_PIXEL;
      return;
    }
    if (!v) {
      v = this.dronePool.get();
      d.view = v;
      if (temArte("drone")) {
        v.s.blendMode = "normal";
        v.s.tint = d.temp > 0 ? 0xffe070 : 0xffffff;
        v.s.scale.set(38 / (v.s.texture.width * 0.92));
      } else {
        v.s.tint = d.temp > 0 ? 0xffe86b : 0x9dff5e;
        v.s.scale.set(0.8);
      }
    }
    v.root.x = d.x;
    v.root.y = d.y;
    v.root.rotation = d.ang;
  }

  private raio(g: Graphics, x1: number, y1: number, x2: number, y2: number, cor: number, w: number, alpha: number): void {
    const n = Math.max(3, Math.round(Math.hypot(x2 - x1, y2 - y1) / 40));
    const nx = -(y2 - y1);
    const ny = x2 - x1;
    const len = Math.hypot(nx, ny) || 1;
    g.moveTo(x1, y1);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const j = (Math.random() - 0.5) * 36;
      g.lineTo(x1 + (x2 - x1) * t + (nx / len) * j, y1 + (y2 - y1) * t + (ny / len) * j);
    }
    g.lineTo(x2, y2);
    g.stroke({ width: w * 2.5, color: cor, alpha: alpha * 0.35 });
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke({ width: w * 0.5, color: 0xffffff, alpha: alpha * 0.8 });
  }

  private desenharFeixes(): void {
    const g = this.beamsG;
    const b = this.b;
    g.clear();
    this.desenharRastros(g);
    // lasers contínuos
    for (const s of b.sentinels) {
      if (s.def.id !== "laser") continue;
      for (const r of s.raios) {
        if (!r.alvo) continue;
        const w = r.ativo ? 1 : 0.3;
        const pulse = 1 + 0.25 * Math.sin(this.tempo * 40);
        g.moveTo(s.x, s.y).lineTo(r.x2, r.y2).stroke({ width: 18 * w * pulse, color: s.def.cor, alpha: 0.3 });
        g.moveTo(s.x, s.y).lineTo(r.x2, r.y2).stroke({ width: 6 * w, color: 0xffd0da, alpha: 0.9 });
        if (r.ativo && Math.random() < 0.5) this.particles.emitir(r.x2, r.y2, { tex: "spark", cor: s.def.cor, vel: 260, vida: 0.25, s0: 0.8, stretch: true });
      }
    }
    for (const bm of b.beams) {
      const a = Math.max(0, bm.life / bm.maxLife);
      if (bm.kind === "raio") this.raio(g, bm.x1, bm.y1, bm.x2, bm.y2, bm.cor, bm.w, a);
      else if (bm.kind === "onda") this.onda(g, bm, a);
      else if (bm.kind === "pulso") {
        const r = bm.x2 * (0.55 + 0.45 * (1 - a));
        g.circle(bm.x1, bm.y1, r).stroke({ width: bm.w * 2, color: bm.cor, alpha: a * 0.35 });
        g.circle(bm.x1, bm.y1, r).stroke({ width: bm.w * 0.4, color: 0xffffff, alpha: a * 0.7 });
      } else {
        g.moveTo(bm.x1, bm.y1).lineTo(bm.x2, bm.y2).stroke({ width: bm.w, color: bm.cor, alpha: a * 0.45 });
        g.moveTo(bm.x1, bm.y1).lineTo(bm.x2, bm.y2).stroke({ width: bm.w * 0.3, color: 0xffffff, alpha: a * 0.9 });
      }
    }
  }

  private ondasVistas = new WeakSet<object>();

  /** Onda de choque: disco que acende, anel principal com núcleo branco, anel de rastro, crepitar elétrico e faíscas no início. */
  private onda(g: Graphics, bm: { x1: number; y1: number; x2: number; cor: number; w: number }, a: number): void {
    const R = bm.x2;
    const p = 1 - a;
    const e = 1 - Math.pow(1 - p, 3);
    const r = Math.max(4, R * e);
    if (!this.ondasVistas.has(bm)) {
      this.ondasVistas.add(bm);
      const n = this.leve ? 10 : 26;
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2 + Math.random() * 0.2;
        this.particles.emitir(bm.x1 + Math.cos(ang) * 40, bm.y1 + Math.sin(ang) * 40, { tex: "spark", cor: bm.cor, vel: R * 2.4, ang, spread: 0.15, vida: 0.45, s0: 1.2, s1: 0.1, stretch: true, drag: 3 });
      }
      this.particles.emitir(bm.x1, bm.y1, { tex: "glowSoft", cor: bm.cor, vel: 0, vida: 0.3, s0: R / 60, s1: R / 25, alpha: 0.45 });
    }
    g.circle(bm.x1, bm.y1, r).fill({ color: bm.cor, alpha: 0.12 * a });
    g.circle(bm.x1, bm.y1, r).stroke({ width: bm.w * 3.2 * (1 - p * 0.5), color: bm.cor, alpha: a * 0.22 });
    g.circle(bm.x1, bm.y1, r).stroke({ width: bm.w * 1.2, color: bm.cor, alpha: a * 0.85 });
    g.circle(bm.x1, bm.y1, r).stroke({ width: bm.w * 0.35, color: 0xffffff, alpha: a });
    g.circle(bm.x1, bm.y1, r * 0.8).stroke({ width: bm.w * 0.6, color: bm.cor, alpha: a * 0.35 });
    // crepitar elétrico: pequenos raios em zigue-zague correndo pelo anel
    const n = this.leve ? 3 : 7;
    for (let i = 0; i < n; i++) {
      let ang = Math.random() * Math.PI * 2;
      g.moveTo(bm.x1 + Math.cos(ang) * r, bm.y1 + Math.sin(ang) * r);
      for (let j = 0; j < 4; j++) {
        ang += 0.05 + Math.random() * 0.06;
        const rr = r + (Math.random() - 0.5) * bm.w * 3;
        g.lineTo(bm.x1 + Math.cos(ang) * rr, bm.y1 + Math.sin(ang) * rr);
      }
    }
    g.stroke({ width: 2, color: 0xffffff, alpha: a * 0.8 });
  }

  destruir(): void {
    this.b.destruir();
    this.particles.limpar();
    this.numeros.limpar();
    this.world.destroy({ children: true });
  }
}
