import { BALANCE, DIFICULDADES, xpParaNivel } from "../data/balance";
import { ENEMIES } from "../data/enemies";
import { SENTINELS } from "../data/sentinels";
import type { SentinelId } from "../data/types";
import { Pool } from "../core/Pool";
import { Rng } from "../core/Rng";
import { SpatialGrid } from "../core/SpatialGrid";
import { Mods, statAdd, statFinal } from "./StatSystem";
import type {
  Beam, Drone, Enemy, EnemyShot, FxEvent, ProjKind, Projectile, RunConfig, SentinelRun, SentinelStats, Visivel, Zone,
} from "./types";
import { CardSystem } from "./CardSystem";
import { Spawner } from "./Spawner";
import { updateEnemies } from "./Enemy";
import { updateBoss } from "./Boss";
import { updateSentinels, updateDrones, updateZones, syncDrones } from "./Sentinel";
import { Ultimate } from "./Ultimate";
import { Campo } from "./Campo";
import { CAMPOS, JORNADA } from "../data/journey";

const P = BALANCE.planeta;
const STAT_KEYS = ["dano", "cadencia", "alcance", "velProj", "perfuracao", "area", "projeteis", "cadeia", "duracao", "lentidao"] as const;

export interface PlanetState {
  hp: number;
  hpMax: number;
  escudo: number;
  escudoMax: number;
  escudoRegen: number;
  armadura: number;
  regen: number;
  semDano: number;
  espinhos: number;
  espinhosCd: number;
  x: number;
  y: number;
}

export interface BattleResult {
  vitoria: boolean;
  tempo: number;
  abates: number;
  nivel: number;
  estrelas: number;
  chefeDerrotado: boolean;
  evolucoes: number;
  /** Etapas da Jornada concluídas. */
  etapas: number;
}

/** Estado e regras de uma partida. Sem dependência de render (roda headless no simulador). */
export class Battle {
  readonly rng: Rng;
  vis: Visivel = { left: 0, right: BALANCE.mundo.largura, top: 0, bottom: BALANCE.mundo.altura };
  t = 0;
  enemies: Enemy[] = [];
  projs: Projectile[] = [];
  shots: EnemyShot[] = [];
  drones: Drone[] = [];
  zones: Zone[] = [];
  beams: Beam[] = [];
  fx: FxEvent[] = [];
  sentinels: SentinelRun[] = [];
  grid = new SpatialGrid<Enemy>(128);
  globais: Mods;
  planet: PlanetState;
  nivel = 1;
  xp = 0;
  xpNext = xpParaNivel(1);
  pendentes = 0;
  abates = 0;
  sucata = 0;
  boss: Enemy | null = null;
  chefeDerrotado = false;
  avisoChefe = false;
  focoChefe = true;
  fim: BattleResult | null = null;
  reviveu = false;
  /** O jogador desistiu pela pausa (recompensa reduzida). */
  desistiu = false;
  evolucoes = 0;
  chefesMortos = 0;
  /** Combo de abates seguidos. */
  combo = 0;
  comboT = 0;
  melhorCombo = 0;
  pontosCombo = 0;
  /** Recarga da habilidade ativa (onda de choque), em segundos. */
  habilidadeCd = BALANCE.habilidade.recarga;
  habilidadeUsos = 0;
  /** Tempo total da partida (na Jornada, soma das etapas). */
  tTotal = 0;
  etapa = 0;
  etapasConcluidas = 0;
  /** Contagem regressiva entre etapas da Jornada. */
  transicao = 0;
  campo: Campo;
  private campoVel = 1;
  private campoXp = 1;
  private campoHp = 1;
  cards: CardSystem;
  spawner: Spawner;
  ult: Ultimate;
  /** Chamado quando uma entidade com `view` sai do jogo (render libera o sprite). */
  onRemove: (o: { view?: unknown }) => void = () => {};

  private nextId = 1;
  private explosoes: { x: number; y: number; r: number; dano: number }[] = [];
  readonly tmp: Enemy[] = [];
  readonly tmp2: Enemy[] = [];

  private enemyPool = new Pool<Enemy>(() => ({}) as Enemy);
  private projPool = new Pool<Projectile>(() => ({ hits: [] as number[] }) as Projectile);
  private shotPool = new Pool<EnemyShot>(() => ({}) as EnemyShot);

  constructor(public cfg: RunConfig) {
    this.rng = new Rng(cfg.seed);
    this.globais = cfg.globais.clone();
    this.planet = {
      hp: 0, hpMax: 0, escudo: 0, escudoMax: 0, escudoRegen: 0, armadura: 0, regen: 0,
      semDano: 99, espinhos: 0, espinhosCd: 0, x: P.x, y: P.y,
    };
    this.recalcPlaneta(true);
    this.campo = new Campo(this, cfg.campos ?? []);
    for (const id of cfg.campos ?? []) {
      const c = CAMPOS.find((x) => x.id === id);
      if (!c) continue;
      this.campoVel *= c.velInimigoMult ?? 1;
      this.campoXp *= c.xpMult ?? 1;
    }
    if (this.campo.tem("campo_minado")) this.campoHp = 1.2;
    this.cards = new CardSystem(this);
    this.spawner = new Spawner(this);
    this.ult = new Ultimate(this);
    this.addSentinel(cfg.base);
  }

  // ------------------------------------------------------------------ atributos

  g(key: string, base = 0): number {
    return statFinal(base, key, this.globais);
  }
  gAdd(key: string): number {
    return statAdd(key, this.globais);
  }

  recalcPlaneta(inicial = false): void {
    const p = this.planet;
    const oldMax = p.hpMax;
    const oldEsc = p.escudoMax;
    p.hpMax = Math.max(1, Math.round(this.g("hpMax", P.hp)));
    p.escudoMax = Math.max(0, Math.round(this.g("escudoMax", P.escudo)));
    p.escudoRegen = this.g("escudoRegen", P.escudoRegen);
    p.armadura = this.g("armadura", P.armadura);
    p.regen = this.g("regenHp", 0);
    p.espinhos = this.gAdd("espinhos");
    if (inicial) {
      p.hp = p.hpMax;
      p.escudo = p.escudoMax;
    } else {
      if (p.hpMax > oldMax) p.hp += p.hpMax - oldMax;
      if (p.escudoMax > oldEsc) p.escudo += p.escudoMax - oldEsc;
      p.hp = Math.min(p.hp, p.hpMax);
      p.escudo = Math.min(p.escudo, p.escudoMax);
    }
  }

  recalcSentinel(s: SentinelRun): void {
    const perm = this.cfg.perm[s.def.id] ?? new Mods();
    const st = {} as SentinelStats;
    for (const k of STAT_KEYS) st[k] = statFinal(s.def.base[k], k, this.globais, perm, s.run);
    st.critChance = statFinal(BALANCE.critBase.chance + s.def.base.critChance, "critChance", this.globais, perm, s.run);
    st.critDano = statFinal(BALANCE.critBase.dano + s.def.base.critDano, "critDano", this.globais, perm, s.run);
    st.tiroDuplo = statAdd("tiroDuplo", perm, s.run);
    st.giro = 5 * (1 + (perm.pct.giro ?? 0));
    st.projeteis = Math.max(1, Math.round(st.projeteis));
    st.perfuracao = Math.round(st.perfuracao);
    st.cadeia = Math.round(st.cadeia);
    st.lentidao = Math.min(0.85, st.lentidao);
    s.stats = st;
  }

  recalcTudo(): void {
    this.recalcPlaneta();
    for (const s of this.sentinels) this.recalcSentinel(s);
    syncDrones(this);
  }

  /** Slots da partida = sentinelas disponíveis no deck (base + pool), no máximo 6. */
  slots(): number {
    return Math.max(1, Math.min(BALANCE.maxSlots, new Set([this.cfg.base, ...this.cfg.pool]).size));
  }

  addSentinel(id: SentinelId): SentinelRun | null {
    const existente = this.getSentinel(id);
    if (existente) return existente;
    if (this.sentinels.length >= BALANCE.maxSlots) return null;
    const def = SENTINELS[id];
    const s: SentinelRun = {
      def, slot: this.sentinels.length, nivel: 1, evoluido: false, run: new Mods(), stats: {} as SentinelStats,
      x: P.x, y: P.y, ang: -Math.PI / 2, cd: 0.3, retarget: 0, alvo: null, raios: [], modoAlvo: def.alvoPadrao, danoCausado: 0,
    };
    this.sentinels.push(s);
    this.recalcSentinel(s);
    syncDrones(this);
    return s;
  }

  getSentinel(id: SentinelId): SentinelRun | undefined {
    return this.sentinels.find((s) => s.def.id === id);
  }

  /** Multiplicador de dificuldade efetivo neste instante. */
  multDificuldade(): number {
    return this.spawner.multAtual();
  }

  // ------------------------------------------------------------------ spawn de entidades

  spawnEnemy(tipo: string, x: number, y: number, opts?: { hpMult?: number }): Enemy {
    const def = ENEMIES[tipo];
    const e = this.enemyPool.get();
    const onda = Math.floor(this.t / BALANCE.duracaoOnda);
    const mult = this.multDificuldade();
    const hpScale = (1 + BALANCE.escalaOnda * onda) * mult * DIFICULDADES[this.cfg.dif].hpMult * (this.cfg.daily?.hpInimigoMult ?? 1) * this.campoHp;
    const danoScale = (1 + 0.04 * onda) * Math.sqrt(mult) * DIFICULDADES[this.cfg.dif].danoMult;
    e.id = this.nextId++;
    e.alive = true;
    e.def = def;
    e.x = x;
    e.y = y;
    e.vx = 0;
    e.vy = 0;
    e.r = def.raio;
    e.hpMax = e.hp = Math.max(1, Math.round(def.hp * hpScale * (opts?.hpMult ?? 1)));
    e.escudo = 0;
    e.dano = def.dano * danoScale;
    e.vel = def.vel * (this.cfg.daily?.velInimigoMult ?? 1) * this.campoVel * this.rng.range(0.92, 1.08);
    e.xp = def.xp;
    e.idade = 0;
    e.rot = 0;
    e.flash = 0;
    e.slowT = 0;
    e.slowAmt = 0;
    e.gravSlow = 0;
    e.burnDps = 0;
    e.burnT = 0;
    e.poisonDps = 0;
    e.poisonT = 0;
    e.dotTick = 0;
    e.fireT = this.rng.range(0.5, 1.5);
    e.alvoavel = true;
    e.boss = null;
    e.view = undefined;
    this.enemies.push(e);
    return e;
  }

  spawnProj(kind: ProjKind, x: number, y: number, ang: number, vel: number, dano: number, src: SentinelRun | null, cor: number): Projectile {
    const p = this.projPool.get();
    p.id = this.nextId++;
    p.alive = true;
    p.kind = kind;
    p.x = x;
    p.y = y;
    p.vel = vel;
    p.vx = Math.cos(ang) * vel;
    p.vy = Math.sin(ang) * vel;
    p.r = kind === "trilho" ? 22 : kind === "missil" ? 10 : kind === "estilhaco" ? 6 : kind === "drone" ? 6 : 9;
    p.dano = dano;
    p.pierce = 0;
    p.hits.length = 0;
    p.life = 3;
    p.cor = cor;
    p.alvo = null;
    p.alvoId = 0;
    p.area = 0;
    p.ricochete = 0;
    p.profundidade = 0;
    p.src = src;
    p.ult = false;
    p.view = undefined;
    this.projs.push(p);
    return p;
  }

  spawnShot(x: number, y: number, ang: number, vel: number, dano: number, cor = 0xff5a3c, r = 12): EnemyShot {
    const s = this.shotPool.get();
    s.alive = true;
    s.x = x;
    s.y = y;
    s.vx = Math.cos(ang) * vel;
    s.vy = Math.sin(ang) * vel;
    s.r = r;
    s.dano = dano;
    s.cor = cor;
    s.life = 9;
    s.view = undefined;
    this.shots.push(s);
    return s;
  }

  beam(kind: Beam["kind"], x1: number, y1: number, x2: number, y2: number, cor: number, life: number, w: number): void {
    if (this.beams.length > 400) return;
    this.beams.push({ kind, x1, y1, x2, y2, cor, life, maxLife: life, w });
  }

  // ------------------------------------------------------------------ dano

  /** Aplica dano a um inimigo. Retorna o dano efetivo. */
  hitEnemy(e: Enemy, dano: number, src: SentinelRun | null, opts?: { dot?: boolean; semCrit?: boolean; semMods?: boolean; ult?: boolean }): number {
    if (!e.alive || (!e.alvoavel && !opts?.dot)) return 0;
    if (opts?.ult && e.boss) {
      // o ultimate não pode apagar o chefe: dano reduzido e teto por ativação
      const U = BALANCE.ultimate;
      const resta = Math.max(0, e.hpMax * U.limiteChefe - this.ult.danoChefe);
      dano = Math.min(dano * U.fatorChefe, resta);
      this.ult.danoChefe += dano;
      if (dano <= 0) return 0;
    }
    let crit = false;
    if (src && !opts?.semCrit && !opts?.dot) {
      crit = this.rng.next() < src.stats.critChance;
      if (crit) dano *= src.stats.critDano;
    }
    if (e.escudo > 0) {
      const abs = Math.min(e.escudo, dano);
      e.escudo -= abs;
      dano -= abs;
    }
    e.hp -= dano;
    if (!opts?.dot) e.flash = 0.05;
    if (src) src.danoCausado += dano;
    if (dano >= 1) this.fx.push({ t: "dmg", x: e.x, y: e.y - e.r, v: dano, crit });

    if (src && !opts?.dot && !opts?.semMods) {
      const queima = this.gAdd("queima");
      if (queima > 0) {
        e.burnDps = Math.max(e.burnDps, dano * queima);
        e.burnT = 3;
      }
      const veneno = this.gAdd("veneno");
      if (veneno > 0) {
        e.poisonDps = Math.min(e.poisonDps + dano * veneno, e.hpMax * 0.4);
        e.poisonT = 4;
      }
      const exec = this.gAdd("executar");
      if (exec > 0 && !e.boss && e.def.comportamento !== "muro" && e.hp > 0 && e.hp < e.hpMax * exec) e.hp = 0;
    }
    if (e.hp <= 0) this.killEnemy(e, true);
    return dano;
  }

  /** Dano em área (agenda para evitar recursão profunda em reações em cadeia). */
  explodir(x: number, y: number, r: number, dano: number, src: SentinelRun | null, cor = 0xffa040, imediato = false, ult = false): void {
    this.fx.push({ t: "explosao", x, y, r, cor });
    if (imediato) {
      const list = this.grid.query(x, y, r, this.tmp2);
      for (let i = list.length - 1; i >= 0; i--) this.hitEnemy(list[i], dano, src, ult ? { semMods: true, ult: true } : undefined);
    } else {
      this.explosoes.push({ x, y, r, dano });
    }
  }

  killEnemy(e: Enemy, recompensa: boolean): void {
    if (!e.alive) return;
    e.alive = false;
    this.fx.push({ t: "morte", x: e.x, y: e.y, cor: e.def.cor, r: e.r });
    if (!recompensa) return;
    this.abates++;
    this.combo++;
    this.comboT = BALANCE.combo.janela;
    if (this.combo > this.melhorCombo) this.melhorCombo = this.combo;
    const mult = this.multCombo();
    this.pontosCombo += BALANCE.combo.pontosPorAbate * (mult - 1) * 10;
    this.sucata += BALANCE.recompensas.sucataPorAbate * mult;
    this.ganharXp(e.xp);
    this.ult.aoAbater();
    const explo = this.gAdd("explosaoAoMatar");
    if (explo > 0 && !e.boss) this.explosoes.push({ x: e.x, y: e.y, r: 110 + e.r, dano: e.hpMax * explo });
    if (e.def.comportamento === "divisor") {
      const n = Number(e.def.params?.filhos ?? 2);
      const tipo = String(e.def.params?.tipoFilho ?? "mitose_mini");
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        this.spawnEnemy(tipo, e.x + Math.cos(a) * 26, e.y + Math.sin(a) * 26);
      }
    }
    if (e.boss) this.onChefeDerrotado(e);
  }

  multCombo(): number {
    const C = BALANCE.combo;
    return Math.min(C.max, 1 + Math.floor(this.combo / C.passo) * C.bonus);
  }

  habilidadePronta(): boolean {
    return this.habilidadeCd <= 0 && !this.fim;
  }

  /** Onda de choque: empurra e fere os inimigos perto do planeta e recarrega parte do escudo. */
  usarHabilidade(): boolean {
    if (!this.habilidadePronta()) return false;
    const H = BALANCE.habilidade;
    this.habilidadeCd = H.recarga;
    this.habilidadeUsos++;
    const p = this.planet;
    const dano = H.dano * this.ult.poder();
    for (const e of this.enemies) {
      if (!e.alive || !e.alvoavel) continue;
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > H.raio) continue;
      if (!e.boss && e.def.comportamento !== "muro") {
        const f = H.empurrao * (1 - d / H.raio * 0.5);
        e.x += (dx / d) * f;
        e.y += (dy / d) * f;
        e.slowAmt = Math.max(e.slowAmt, 0.5);
        e.slowT = Math.max(e.slowT, 1.2);
      }
      this.hitEnemy(e, dano, null, { semMods: true });
    }
    for (const s of this.shots) if (s.alive && Math.hypot(s.x - p.x, s.y - p.y) < H.raio) s.alive = false;
    p.escudo = Math.min(p.escudoMax, p.escudo + p.escudoMax * H.escudoPct);
    this.beam("pulso", p.x, p.y, H.raio, 0, 0x7df9ff, 0.6, 26);
    this.fx.push({ t: "tremor", força: 12 });
    this.fx.push({ t: "flash", força: 0.35 });
    this.fx.push({ t: "som", id: "pulso" });
    return true;
  }

  danoPlaneta(v: number, x: number, y: number): void {
    if (this.fim) return;
    this.combo = 0; // tomar dano quebra o combo
    const p = this.planet;
    const orig = v;
    v = Math.max(1, v - p.armadura);
    p.semDano = 0;
    const ang = Math.atan2(y - p.y, x - p.x);
    if (p.escudo > 0) {
      const abs = Math.min(p.escudo, v);
      p.escudo -= abs;
      v -= abs;
      this.fx.push({ t: "escudo", ang });
    }
    if (v > 0) {
      p.hp -= v;
      this.fx.push({ t: "dmgPlaneta", x: p.x + Math.cos(ang) * P.raio, y: p.y + Math.sin(ang) * P.raio, v });
      this.fx.push({ t: "tremor", força: Math.min(14, 3 + v / 25) });
    }
    if (p.espinhos > 0 && p.espinhosCd <= 0) {
      p.espinhosCd = 0.4;
      this.explodir(p.x, p.y, 430, orig * p.espinhos, null, 0x5ec8ff);
    }
    if (p.hp <= 0) {
      p.hp = 0;
      this.terminar(false);
    }
  }

  curar(v: number): void {
    this.planet.hp = Math.min(this.planet.hpMax, this.planet.hp + v);
  }

  ganharXp(v: number): void {
    this.xp += v * (1 + (this.globais.pct.xp ?? 0) + (this.globais.add.xp ?? 0)) * this.campoXp;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.nivel++;
      this.pendentes++;
      this.xpNext = xpParaNivel(this.nivel);
      this.fx.push({ t: "som", id: "nivel" });
    }
  }

  // ------------------------------------------------------------------ chefe / fim

  onChefeDerrotado(e: Enemy): void {
    this.fx.push({ t: "tremor", força: 30 });
    this.fx.push({ t: "flash", força: 1 });
    this.fx.push({ t: "som", id: "explosaoGrande" });
    for (let i = 0; i < 8; i++) {
      this.fx.push({ t: "explosao", x: e.x + this.rng.range(-120, 120), y: e.y + this.rng.range(-120, 120), r: 140, cor: e.boss!.def.cor });
    }
    if (this.boss === e) this.boss = null;
    this.chefeDerrotado = true;
    this.chefesMortos++;
    // limpa barreiras
    for (const o of this.enemies) if (o.alive && o.def.comportamento === "muro") this.killEnemy(o, false);
    if (this.cfg.modo === "sobrevivencia") this.spawner.chefeMorto();
    else if (this.cfg.modo === "jornada" && this.etapa + 1 < (this.cfg.etapas?.length ?? 1)) {
      this.etapasConcluidas++;
      this.transicao = 4;
      for (const s of this.shots) s.alive = false;
    } else {
      if (this.cfg.modo === "jornada") this.etapasConcluidas++;
      this.terminar(true);
    }
  }

  terminar(vitoria: boolean): void {
    if (this.fim) return;
    const ratio = this.planet.hp / this.planet.hpMax;
    let estrelas = 0;
    if (vitoria) {
      estrelas = 1;
      if (ratio > BALANCE.estrelas.hp2) estrelas++;
      if (ratio > BALANCE.estrelas.hp3) estrelas++;
    }
    this.fim = {
      vitoria, tempo: this.t, abates: this.abates, nivel: this.nivel, estrelas,
      chefeDerrotado: this.chefeDerrotado, evolucoes: this.evolucoes, etapas: this.etapasConcluidas,
    };
    this.fim.tempo = this.tTotal;
    this.fx.push({ t: "som", id: vitoria ? "vitoria" : "derrota" });
  }

  /** Jornada: avança para a próxima etapa mantendo build, nível e HP (sem cura). */
  proximaEtapa(): void {
    const etapas = this.cfg.etapas;
    if (!etapas) return;
    this.etapa++;
    this.cfg.stage = etapas[this.etapa];
    this.t = 0;
    this.avisoChefe = false;
    this.boss = null;
    this.spawner = new Spawner(this);
    this.fx.push({ t: "som", id: "alerta" });
  }

  /** Momento em que o chefe entra (a Jornada usa etapas mais curtas). */
  entradaChefe(): number {
    return this.cfg.modo === "jornada" ? JORNADA.entradaChefe : BALANCE.entradaChefe;
  }

  reviver(): void {
    this.fim = null;
    this.reviveu = true;
    this.planet.hp = this.planet.hpMax * 0.5;
    this.planet.escudo = this.planet.escudoMax;
    this.explodir(this.planet.x, this.planet.y, 2400, 1e9, null, 0xffffff, true);
    for (const s of this.shots) s.alive = false;
    this.fx.push({ t: "flash", força: 1 });
  }

  // ------------------------------------------------------------------ passo de simulação

  step(dt: number): void {
    if (this.fim) return;
    this.tTotal += dt;
    if (this.transicao > 0) {
      this.transicao -= dt;
      if (this.transicao <= 0) this.proximaEtapa();
    } else this.t += dt;
    const p = this.planet;

    // planeta
    p.semDano += dt;
    p.espinhosCd -= dt;
    if (p.semDano >= P.escudoAtraso && p.escudo < p.escudoMax && this.campo.semRegen <= 0) p.escudo = Math.min(p.escudoMax, p.escudo + p.escudoRegen * dt);
    if (p.regen > 0) this.curar(p.regen * dt);

    if (this.transicao <= 0) this.spawner.step(dt);
    this.campo.step(dt);

    updateEnemies(this, dt);
    if (this.boss && this.boss.alive) updateBoss(this, this.boss, dt);

    // grid de colisão
    this.grid.clear();
    for (const e of this.enemies) if (e.alive && e.alvoavel) this.grid.insert(e);

    this.ult.step(dt);
    if (this.habilidadeCd > 0) this.habilidadeCd -= dt;
    if (this.comboT > 0) {
      this.comboT -= dt;
      if (this.comboT <= 0) this.combo = 0;
    }
    updateSentinels(this, dt);
    updateDrones(this, dt);
    updateZones(this, dt);
    this.updateProjs(dt);
    this.updateShots(dt);

    // explosões agendadas (reações em cadeia limitadas por passo)
    let n = 0;
    while (this.explosoes.length && n < 40) {
      const ex = this.explosoes.shift()!;
      this.fx.push({ t: "explosao", x: ex.x, y: ex.y, r: ex.r, cor: 0xffa040 });
      const list = this.grid.query(ex.x, ex.y, ex.r, this.tmp);
      for (let i = list.length - 1; i >= 0; i--) this.hitEnemy(list[i], ex.dano, null, { semMods: true });
      n++;
    }

    for (const b of this.beams) b.life -= dt;
    this.compactar();
  }

  private updateProjs(dt: number): void {
    const v = this.vis;
    const boss = this.boss;
    const singular = boss && boss.alive && boss.boss!.def.id === "singularidade" && boss.boss!.campo > 0 ? boss : null;
    for (const p of this.projs) {
      if (!p.alive) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.alive = false;
        continue;
      }
      if (p.kind === "missil") this.guiarMissil(p, dt);
      if (singular && !p.ult) {
        const dx = singular.x - p.x;
        const dy = singular.y - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 480 * 480) {
          const d = Math.sqrt(d2) || 1;
          const f = 2200 * dt;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
          if (d < singular.r * 0.7) {
            p.alive = false;
            this.fx.push({ t: "absorve", x: p.x, y: p.y });
            continue;
          }
        }
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < v.left - 200 || p.x > v.right + 200 || p.y < v.top - 300 || p.y > v.bottom + 200) {
        p.alive = false;
        continue;
      }
      const list = this.grid.query(p.x, p.y, p.r, this.tmp);
      for (let i = 0; i < list.length && p.alive; i++) {
        const e = list[i];
        if (!e.alive || !e.alvoavel || p.hits.includes(e.id)) continue;
        this.projHit(p, e);
      }
    }
  }

  private guiarMissil(p: Projectile, dt: number): void {
    let a = p.alvo;
    if (!a || !a.alive || a.id !== p.alvoId || !a.alvoavel) {
      a = this.inimigoAleatorio(p.x, p.y, 900);
      p.alvo = a;
      p.alvoId = a ? a.id : 0;
    }
    const cur = Math.atan2(p.vy, p.vx);
    let ang = cur;
    if (a) {
      const want = Math.atan2(a.y - p.y, a.x - p.x);
      let d = want - cur;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      const turn = 7 * dt;
      ang = cur + Math.max(-turn, Math.min(turn, d));
    }
    p.vel = Math.min(p.vel + 900 * dt, (p.src?.stats.velProj ?? 700) * 1.6);
    p.vx = Math.cos(ang) * p.vel;
    p.vy = Math.sin(ang) * p.vel;
  }

  private projHit(p: Projectile, e: Enemy): void {
    const src = p.src;
    if (p.kind === "missil") {
      p.alive = false;
      this.explodir(p.x, p.y, p.area, p.dano, src, 0xffc040, true, p.ult);
      return;
    }
    this.hitEnemy(e, p.dano, src, { semMods: p.ult, ult: p.ult });
    p.hits.push(e.id);

    if (src && !p.ult) {
      const id = src.def.id;
      if (id === "gelo" || p.kind === "gelo") {
        if (e.alive) {
          e.slowAmt = Math.max(e.slowT > 0 ? e.slowAmt : 0, src.stats.lentidao);
          e.slowT = Math.max(e.slowT, src.stats.duracao);
        }
        if (src.evoluido) {
          this.fx.push({ t: "explosao", x: p.x, y: p.y, r: 120, cor: 0x9fe8ff });
          const list = this.grid.query(p.x, p.y, 120, this.tmp2);
          for (let i = list.length - 1; i >= 0; i--) {
            const o = list[i];
            o.slowAmt = 0.9;
            o.slowT = Math.max(o.slowT, 1);
            if (o !== e) this.hitEnemy(o, p.dano * 0.5, src, { semMods: true });
          }
        }
      } else if (id === "canhao" && src.evoluido && p.kind === "bala") {
        this.explodir(p.x, p.y, 95, p.dano * 0.6, src, 0xff9a3c, true);
      }
      // estilhaços
      const split = this.gAdd("split");
      if (split > 0 && p.profundidade === 0 && p.kind !== "trilho") {
        const pct = this.gAdd("splitDanoPct") || 0.3;
        const base = Math.atan2(p.vy, p.vx);
        for (let i = 0; i < split; i++) {
          const a = base + this.rng.range(-1.1, 1.1);
          const s = this.spawnProj("estilhaco", p.x, p.y, a, 900, p.dano * pct, src, p.cor);
          s.life = 0.45;
          s.profundidade = 1;
          s.hits.push(e.id);
        }
      }
    }

    if (p.pierce > 0) {
      p.pierce--;
      return;
    }
    if (p.ricochete > 0) {
      p.ricochete--;
      const alvo = this.maisProximo(p.x, p.y, 450, p.hits);
      if (alvo) {
        const a = Math.atan2(alvo.y - p.y, alvo.x - p.x);
        p.vx = Math.cos(a) * p.vel;
        p.vy = Math.sin(a) * p.vel;
        p.life = Math.max(p.life, 0.8);
        return;
      }
    }
    p.alive = false;
  }

  private updateShots(dt: number): void {
    const pl = this.planet;
    const v = this.vis;
    for (const s of this.shots) {
      if (!s.alive) continue;
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const dx = s.x - pl.x;
      const dy = s.y - pl.y;
      const rr = (pl.escudo > 0 ? P.raioEscudo : P.raio) + s.r;
      if (dx * dx + dy * dy < rr * rr) {
        s.alive = false;
        this.danoPlaneta(s.dano, s.x, s.y);
        continue;
      }
      if (s.life <= 0 || s.x < v.left - 200 || s.x > v.right + 200 || s.y < v.top - 400 || s.y > v.bottom + 200) s.alive = false;
    }
  }

  // ------------------------------------------------------------------ consultas

  maisProximo(x: number, y: number, raio: number, excluir?: number[]): Enemy | null {
    let best: Enemy | null = null;
    let bd = raio * raio;
    for (const e of this.enemies) {
      if (!e.alive || !e.alvoavel) continue;
      if (excluir && excluir.includes(e.id)) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      const d = dx * dx + dy * dy;
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  inimigoAleatorio(x: number, y: number, raio: number): Enemy | null {
    let pick: Enemy | null = null;
    let n = 0;
    const r2 = raio * raio;
    for (const e of this.enemies) {
      if (!e.alive || !e.alvoavel || !this.naTela(e)) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      if (dx * dx + dy * dy > r2) continue;
      n++;
      if (this.rng.next() * n < 1) pick = e;
    }
    return pick;
  }

  naTela(e: { x: number; y: number }): boolean {
    const v = this.vis;
    return e.x > v.left - 20 && e.x < v.right + 20 && e.y > v.top - 20 && e.y < v.bottom;
  }

  inimigosVivos(): number {
    let n = 0;
    for (const e of this.enemies) if (e.alive) n++;
    return n;
  }

  // ------------------------------------------------------------------ limpeza

  private compactar(): void {
    this.enemies = this.filtrar(this.enemies, this.enemyPool);
    this.projs = this.filtrar(this.projs, this.projPool);
    this.shots = this.filtrar(this.shots, this.shotPool);
    this.drones = this.filtrar(this.drones, null);
    this.zones = this.filtrar(this.zones, null);
    if (this.beams.length) {
      let j = 0;
      for (const b of this.beams) if (b.life > 0) this.beams[j++] = b;
      this.beams.length = j;
    }
  }

  private filtrar<T extends { alive: boolean; view?: unknown }>(arr: T[], pool: Pool<T> | null): T[] {
    let j = 0;
    for (let i = 0; i < arr.length; i++) {
      const o = arr[i];
      if (o.alive) arr[j++] = o;
      else {
        if (o.view !== undefined) this.onRemove(o);
        o.view = undefined;
        pool?.release(o);
      }
    }
    arr.length = j;
    return arr;
  }

  /** Remove tudo (fim de partida) liberando sprites. */
  destruir(): void {
    for (const arr of [this.enemies, this.projs, this.shots, this.drones, this.zones] as { alive: boolean; view?: unknown }[][]) {
      for (const o of arr) if (o.view !== undefined) this.onRemove(o);
    }
    for (const s of this.sentinels) if (s.view !== undefined) this.onRemove(s as { view?: unknown });
  }
}
