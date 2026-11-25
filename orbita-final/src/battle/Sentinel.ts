import { BALANCE } from "../data/balance";
import type { Battle } from "./Battle";
import type { Drone, Enemy, SentinelRun } from "./types";

const TAU = Math.PI * 2;

function angDiff(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI) d -= TAU;
  while (d < -Math.PI) d += TAU;
  return d;
}

/** Escolhe alvo dentro do alcance seguindo o modo de mira (e a prioridade de chefe). */
export function acharAlvo(b: Battle, x: number, y: number, alcance: number, modo: SentinelRun["modoAlvo"], excluir?: Enemy[]): Enemy | null {
  const boss = b.boss;
  if (boss && boss.alive && boss.alvoavel && (b.focoChefe || modo === "chefe") && !excluir?.includes(boss)) {
    if (Math.hypot(boss.x - x, boss.y - y) <= alcance + boss.r) return boss;
  }
  const pl = b.planet;
  const a2 = alcance * alcance;
  let best: Enemy | null = null;
  let bestV = -Infinity;
  let n = 0;
  for (const e of b.enemies) {
    if (!e.alive || !e.alvoavel) continue;
    if (excluir && excluir.includes(e)) continue;
    const dx = e.x - x;
    const dy = e.y - y;
    const d2 = dx * dx + dy * dy;
    if (d2 > a2 || !b.naTela(e)) continue;
    let v: number;
    if (modo === "maisHp") v = e.hp;
    else if (modo === "aleatorio") {
      n++;
      if (b.rng.next() * n < 1) best = e;
      continue;
    } else {
      const px = e.x - pl.x;
      const py = e.y - pl.y;
      v = -(px * px + py * py);
    }
    if (v > bestV) {
      bestV = v;
      best = e;
    }
  }
  return best;
}

/** Armas que não atiram: não orbitam, ficam instaladas na superfície do planeta. */
export const NO_PLANETA: ReadonlySet<string> = new Set(["campo", "serra", "drone"]);
/** Ângulos (na borda do planeta) das instalações: topo, depois esquerda e direita do topo. */
const ANG_INSTALACAO = [-Math.PI / 2, -Math.PI / 2 - 0.95, -Math.PI / 2 + 0.95];

/** Onde fica a instalação de uma arma do planeta: ponto na borda e ângulo (para fora). */
export function posInstalacao(b: Battle, s: SentinelRun): { x: number; y: number; ang: number } {
  const lista = b.sentinels.filter((o) => NO_PLANETA.has(o.def.id));
  const ang = ANG_INSTALACAO[Math.max(0, lista.indexOf(s)) % ANG_INSTALACAO.length];
  const r = BALANCE.planeta.raio * 0.97;
  return { x: b.planet.x + Math.cos(ang) * r, y: b.planet.y + Math.sin(ang) * r, ang };
}

function posicionar(b: Battle, s: SentinelRun): void {
  if (NO_PLANETA.has(s.def.id)) {
    // o Domo pulsa do centro do planeta; Serra e Colmeia saem da própria instalação
    if (s.def.id === "campo") {
      s.x = b.planet.x;
      s.y = b.planet.y;
    } else {
      const p = posInstalacao(b, s);
      s.x = p.x;
      s.y = p.y;
    }
    return;
  }
  // só as armas que atiram orbitam, distribuídas por igual nos anéis
  const orbita = b.sentinels.filter((o) => !NO_PLANETA.has(o.def.id));
  const ordem = Math.max(0, orbita.indexOf(s));
  const anel = ordem < 3 ? 0 : 1;
  const cfg = BALANCE.aneis[anel];
  const noAnel = Math.min(cfg.slots, Math.max(1, anel ? orbita.length - 3 : Math.min(3, orbita.length)));
  const idx = ordem % 3;
  const a = (idx / noAnel) * TAU + b.t * cfg.velAngular + (anel ? Math.PI / 3 : -Math.PI / 2);
  s.x = b.planet.x + Math.cos(a) * cfg.raio;
  s.y = b.planet.y + Math.sin(a) * cfg.raio;
}

export function updateSentinels(b: Battle, dt: number): void {
  for (const s of b.sentinels) {
    posicionar(b, s);
    const st = s.stats;
    s.retarget -= dt;
    if (s.retarget <= 0 || !s.alvo || !s.alvo.alive || !s.alvo.alvoavel) {
      s.retarget = BALANCE.retargetIntervalo;
      s.alvo = acharAlvo(b, s.x, s.y, st.alcance, s.modoAlvo);
    }
    const alvo = s.alvo;
    if (alvo) s.ang += angDiff(s.ang, Math.atan2(alvo.y - s.y, alvo.x - s.x)) * Math.min(1, dt * 12);

    if (s.def.id === "laser") {
      laser(b, s, dt);
      continue;
    }
    if (s.def.id === "drone") continue; // drones agem sozinhos
    if (s.def.id === "serra") {
      serras(b, s, dt);
      continue;
    }
    if (s.def.id === "espelho") refletir(b, s);

    s.cd -= dt;
    if (s.cd > 0) continue;
    const id = s.def.id;
    if (id === "campo") {
      pulso(b, s);
      s.cd = 1 / st.cadencia;
      continue;
    }
    if (!alvo) {
      s.cd = 0.05;
      continue;
    }
    s.cd = 1 / st.cadencia;
    switch (id) {
      case "canhao":
      case "gelo":
        disparar(b, s, alvo);
        if (st.tiroDuplo > 0 && b.rng.chance(st.tiroDuplo)) disparar(b, s, alvo, 0.06);
        break;
      case "trilho":
        trilho(b, s, alvo);
        break;
      case "feixe":
        corrente(b, s, alvo);
        break;
      case "missil":
        misseis(b, s);
        break;
      case "gravidade":
        poco(b, s, alvo);
        break;
      case "fornalha":
        chamas(b, s, alvo);
        break;
      case "plasma":
        plasma(b, s, alvo);
        break;
      case "nano":
        nuvem(b, s, alvo);
        break;
      case "espelho":
        prisma(b, s, alvo);
        break;
      case "portal":
        portal(b, s, alvo);
        break;
    }
  }
}

function disparar(b: Battle, s: SentinelRun, alvo: Enemy, desvio = 0): void {
  const st = s.stats;
  const n = st.projeteis;
  const base = Math.atan2(alvo.y - s.y, alvo.x - s.x) + desvio;
  const kind = s.def.id === "gelo" ? "gelo" : "bala";
  for (let i = 0; i < n; i++) {
    const a = base + (n === 1 ? 0 : (i - (n - 1) / 2) * 0.09);
    const p = b.spawnProj(kind, s.x, s.y, a, st.velProj, st.dano, s, s.def.cor);
    p.pierce = st.perfuracao;
    p.ricochete = Math.round(b.gAdd("ricochete"));
    p.life = st.alcance / st.velProj + 0.4;
  }
  b.fx.push({ t: "som", id: kind === "gelo" ? "gelo" : "tiro" });
}

function trilho(b: Battle, s: SentinelRun, alvo: Enemy): void {
  const st = s.stats;
  const n = s.evoluido ? Math.max(3, st.projeteis + 2) : st.projeteis;
  const base = Math.atan2(alvo.y - s.y, alvo.x - s.x);
  for (let i = 0; i < n; i++) {
    const a = base + (n === 1 ? 0 : (i - (n - 1) / 2) * 0.12);
    const p = b.spawnProj("trilho", s.x, s.y, a, st.velProj, st.dano, s, s.def.cor);
    p.pierce = 999;
    p.life = 1.4;
    if (s.evoluido) p.r = 40;
  }
  b.fx.push({ t: "som", id: "trilho" });
}

function corrente(b: Battle, s: SentinelRun, alvo: Enemy): void {
  const st = s.stats;
  const saltos = s.evoluido ? Math.max(12, st.cadeia) : st.cadeia;
  const queda = s.evoluido ? 1 : 0.85;
  const atingidos: Enemy[] = [];
  let x = s.x;
  let y = s.y;
  let atual: Enemy | null = alvo;
  let dano = st.dano;
  for (let i = 0; i <= saltos && atual; i++) {
    b.beam("raio", x, y, atual.x, atual.y, s.def.cor, 0.16, s.evoluido ? 6 : 4);
    atingidos.push(atual);
    x = atual.x;
    y = atual.y;
    b.hitEnemy(atual, dano, s);
    dano *= queda;
    atual = proximoNaoAtingido(b, x, y, st.area, atingidos);
  }
  b.fx.push({ t: "som", id: "raio" });
}

function proximoNaoAtingido(b: Battle, x: number, y: number, raio: number, excluir: Enemy[]): Enemy | null {
  let best: Enemy | null = null;
  let bd = raio * raio;
  for (const e of b.enemies) {
    if (!e.alive || !e.alvoavel || excluir.includes(e)) continue;
    const d = (e.x - x) ** 2 + (e.y - y) ** 2;
    if (d < bd) {
      bd = d;
      best = e;
    }
  }
  return best;
}

function misseis(b: Battle, s: SentinelRun): void {
  const st = s.stats;
  if (s.evoluido) {
    // Chuva Estelar: salva de mísseis que sai da sentinela, sobe em leque e cai em alvos de qualquer lugar
    const n = st.projeteis + 4;
    const saida = Math.atan2(s.y - b.planet.y, s.x - b.planet.x);
    for (let i = 0; i < n; i++) {
      const alvo = b.inimigoAleatorio(b.planet.x, b.planet.y, 5000);
      const a = saida + (i / Math.max(1, n - 1) - 0.5) * 1.6;
      const p = b.spawnProj("missil", s.x, s.y, a, st.velProj * 0.5, st.dano * 1.2, s, s.def.cor);
      p.alvo = alvo;
      p.alvoId = alvo ? alvo.id : 0;
      p.area = st.area * 1.3;
      p.life = 4;
    }
  } else {
    for (let i = 0; i < st.projeteis; i++) {
      const alvo = acharAlvo(b, s.x, s.y, st.alcance, "aleatorio");
      const a = -Math.PI / 2 + b.rng.range(-1.2, 1.2);
      const p = b.spawnProj("missil", s.x, s.y, a, st.velProj * 0.4, st.dano, s, s.def.cor);
      p.alvo = alvo;
      p.alvoId = alvo ? alvo.id : 0;
      p.area = st.area;
      p.life = 4;
    }
  }
  b.fx.push({ t: "som", id: "missil" });
}

// ---------------------------------------------------------------- armas da progressão

/** Fornalha: cone de fogo (dano direto + queimadura). Evoluída: anel de fogo em volta do planeta. */
function chamas(b: Battle, s: SentinelRun, alvo: Enemy): void {
  const st = s.stats;
  const base = Math.atan2(alvo.y - s.y, alvo.x - s.x);
  const meia = Math.min(1.2, st.area);
  for (const k of [-1, 0, 1]) {
    const a = base + k * meia * 0.6;
    b.beam("linha", s.x, s.y, s.x + Math.cos(a) * st.alcance, s.y + Math.sin(a) * st.alcance, k ? 0xffb04a : s.def.cor, 0.1, k ? 10 : 16);
  }
  const queimar = (e: Enemy) => {
    b.hitEnemy(e, st.dano, s);
    if (e.alive) {
      e.burnDps = Math.max(e.burnDps, st.dano * 1.6);
      e.burnT = Math.max(e.burnT, st.duracao);
    }
  };
  for (const e of b.grid.query(s.x, s.y, st.alcance, b.tmp).slice()) {
    if (!e.alive) continue;
    const a = Math.atan2(e.y - s.y, e.x - s.x);
    if (Math.abs(angDiff(base, a)) <= meia) queimar(e);
  }
  if (s.evoluido) {
    const pl = b.planet;
    const raio = 300;
    if (b.rng.chance(0.25)) b.beam("pulso", pl.x, pl.y, raio, 0, 0xff7a2e, 0.25, 12);
    for (const e of b.grid.query(pl.x, pl.y, raio, b.tmp).slice()) if (e.alive) queimar(e);
  }
}

/** Serra Orbital: lâminas girando em volta do planeta; cada uma corta quem encosta (a cada 1/cadência por inimigo). */
function serras(b: Battle, s: SentinelRun, dt: number): void {
  const st = s.stats;
  const pl = b.planet;
  const aneis = s.evoluido ? [{ r: st.alcance, v: 1.6 }, { r: st.alcance * 0.72, v: -2.1 }] : [{ r: st.alcance, v: 1.6 }];
  const n = Math.max(1, Math.round(st.projeteis));
  s.cd -= dt;
  const corta = s.cd <= 0;
  if (corta) s.cd = 1 / st.cadencia;
  for (const an of aneis) {
    for (let i = 0; i < n; i++) {
      const a = b.t * an.v + (i / n) * Math.PI * 2;
      const x = pl.x + Math.cos(a) * an.r;
      const y = pl.y + Math.sin(a) * an.r;
      b.beam("pulso", x, y, st.area, 0, s.def.cor, dt * 1.6, 5);
      if (!corta) continue;
      for (const e of b.grid.query(x, y, st.area + 20, b.tmp).slice()) if (e.alive) b.hitEnemy(e, st.dano, s);
    }
  }
}

/** Plasma: esfera lenta e grande que atravessa tudo. Evoluída: explode em ondas no fim do trajeto. */
function plasma(b: Battle, s: SentinelRun, alvo: Enemy): void {
  const st = s.stats;
  const n = st.projeteis;
  const base = Math.atan2(alvo.y - s.y, alvo.x - s.x);
  for (let i = 0; i < n; i++) {
    const a = base + (n === 1 ? 0 : (i - (n - 1) / 2) * 0.18);
    const p = b.spawnProj("bala", s.x, s.y, a, st.velProj, st.dano, s, s.def.cor);
    p.pierce = 999;
    p.r = st.area;
    p.life = st.alcance / st.velProj;
    if (s.evoluido) p.area = st.area * 4;
  }
  b.fx.push({ t: "som", id: "trilho" });
}

/** Nuvem Nano: zona que corrói (sem puxar). Evoluída: maior e no inimigo mais forte. */
function nuvem(b: Battle, s: SentinelRun, alvo: Enemy): void {
  const st = s.stats;
  const t = s.evoluido ? acharAlvo(b, s.x, s.y, st.alcance, "maisHp") ?? alvo : alvo;
  const k = s.evoluido ? 1.5 : 1;
  b.zones.push({
    alive: true, x: t.x, y: t.y, r: st.area * k, life: st.duracao * k, maxLife: st.duracao * k,
    dano: st.dano * k, tick: 0, lentidao: st.lentidao, puxao: 0, buracoNegro: false, src: s,
  });
  b.fx.push({ t: "som", id: "gravidade" });
}

/** Espelho: a cada quadro destrói tiros inimigos no alcance e devolve o dano num raio. */
function refletir(b: Battle, s: SentinelRun): void {
  const st = s.stats;
  const raio = s.evoluido ? 5000 : st.alcance;
  for (const sh of b.shots) {
    if (!sh.alive || Math.hypot(sh.x - s.x, sh.y - s.y) > raio) continue;
    sh.alive = false;
    const e = acharAlvo(b, sh.x, sh.y, 900, "proximo");
    if (!e) continue;
    b.beam("raio", sh.x, sh.y, e.x, e.y, 0xf4f0ff, 0.18, 4);
    b.hitEnemy(e, st.dano + sh.dano * 2, s);
  }
}

/** Espelho (disparo normal): raio prismático que salta `cadeia` vezes (evoluído: muito mais saltos). */
function prisma(b: Battle, s: SentinelRun, alvo: Enemy): void {
  const st = s.stats;
  const saltos = s.evoluido ? st.cadeia + 4 : st.cadeia;
  const atingidos: Enemy[] = [];
  let x = s.x;
  let y = s.y;
  let atual: Enemy | null = alvo;
  const cores = [0xff6b6b, 0xffd24a, 0x6bff9b, 0x6bd6ff, 0xb36bff];
  for (let i = 0; i <= saltos && atual; i++) {
    b.beam("raio", x, y, atual.x, atual.y, cores[i % cores.length], 0.16, 4);
    atingidos.push(atual);
    x = atual.x;
    y = atual.y;
    b.hitEnemy(atual, st.dano, s);
    atual = proximoNaoAtingido(b, x, y, 260, atingidos);
  }
  b.fx.push({ t: "som", id: "raio" });
}

/** Portal: fere e joga de volta ao topo os inimigos (não chefes) perto do alvo. */
function portal(b: Battle, s: SentinelRun, alvo: Enemy): void {
  const st = s.stats;
  const portais = s.evoluido ? 3 : 1;
  const dano = st.dano * (s.evoluido ? 2 : 1);
  const usados: Enemy[] = [];
  for (let k = 0; k < portais; k++) {
    const c = k === 0 ? alvo : acharAlvo(b, s.x, s.y, st.alcance, "aleatorio", usados);
    if (!c) break;
    b.beam("pulso", c.x, c.y, st.area, 0, s.def.cor, 0.45, 14);
    b.fx.push({ t: "portal", x: c.x, y: c.y, r: st.area });
    let enviados = 0;
    for (const e of b.grid.query(c.x, c.y, st.area, b.tmp).slice()) {
      if (!e.alive) continue;
      usados.push(e);
      b.hitEnemy(e, dano, s);
      if (!e.alive || e.boss || enviados >= st.projeteis) continue;
      enviados++;
      e.x = b.vis.left + b.rng.range(0.1, 0.9) * (b.vis.right - b.vis.left);
      e.y = b.vis.top - 40;
      b.beam("pulso", e.x, e.y + 60, 50, 0, s.def.cor, 0.4, 8);
    }
  }
  b.fx.push({ t: "som", id: "gravidade" });
}

function poco(b: Battle, s: SentinelRun, alvo: Enemy): void {
  const st = s.stats;
  const buraco = s.evoluido;
  b.zones.push({
    alive: true, x: alvo.x, y: alvo.y - 40, r: st.area * (buraco ? 1.3 : 1), life: st.duracao, maxLife: st.duracao,
    dano: st.dano * (buraco ? 1.5 : 1), tick: 0, lentidao: st.lentidao, puxao: buraco ? 230 : 95, buracoNegro: buraco, src: s,
  });
  b.fx.push({ t: "som", id: "gravidade" });
}

function pulso(b: Battle, s: SentinelRun): void {
  const st = s.stats;
  const pl = b.planet;
  b.beam("onda", pl.x, pl.y, st.area, 0, s.def.cor, 0.55, s.evoluido ? 14 : 10);
  const list = b.grid.query(pl.x, pl.y, st.area, b.tmp);
  for (let i = list.length - 1; i >= 0; i--) {
    const e = list[i];
    if (st.lentidao > 0 && e.alive) {
      e.slowAmt = Math.max(e.slowT > 0 ? e.slowAmt : 0, st.lentidao);
      e.slowT = Math.max(e.slowT, st.duracao || 1);
    }
    b.hitEnemy(e, st.dano, s);
  }
  if (s.evoluido) {
    // Tempestade: raios aleatórios na tela toda
    for (let i = 0; i < 6; i++) {
      const e = b.inimigoAleatorio(pl.x, pl.y, 5000);
      if (!e) break;
      b.beam("raio", e.x + b.rng.range(-60, 60), b.vis.top - 20, e.x, e.y, 0xd8fff0, 0.2, 5);
      b.explodir(e.x, e.y, 80, st.dano * 1.5, s, 0x5effa8, true);
    }
  }
  b.fx.push({ t: "som", id: "pulso" });
}

function laser(b: Battle, s: SentinelRun, dt: number): void {
  const st = s.stats;
  const n = s.evoluido ? 3 : 1;
  while (s.raios.length < n) s.raios.push({ alvo: null, ang: s.ang, tick: 0, ativo: false, x2: s.x, y2: s.y });
  const usados: Enemy[] = [];
  for (let i = 0; i < n; i++) {
    const r = s.raios[i];
    if (i === 0) r.alvo = s.alvo;
    else if (!r.alvo || !r.alvo.alive || !r.alvo.alvoavel || usados.includes(r.alvo) || Math.hypot(r.alvo.x - s.x, r.alvo.y - s.y) > st.alcance) {
      r.alvo = acharAlvo(b, s.x, s.y, st.alcance, "proximo", usados);
    }
    const a = r.alvo;
    r.ativo = false;
    if (!a) continue;
    usados.push(a);
    const want = Math.atan2(a.y - s.y, a.x - s.x);
    const d = angDiff(r.ang, want);
    const giro = st.giro * dt;
    r.ang += Math.max(-giro, Math.min(giro, d));
    if (Math.abs(angDiff(r.ang, want)) < 0.12) {
      r.ativo = true;
      r.x2 = a.x;
      r.y2 = a.y;
      r.tick -= dt;
      if (r.tick <= 0) {
        r.tick += 1 / st.cadencia;
        if (r.tick < 0) r.tick = 0;
        b.hitEnemy(a, st.dano, s);
      }
    } else {
      r.tick = 0;
      r.x2 = s.x + Math.cos(r.ang) * 200;
      r.y2 = s.y + Math.sin(r.ang) * 200;
    }
  }
}

// -------------------------------------------------------------------- drones

export function syncDrones(b: Battle): void {
  for (const s of b.sentinels) {
    if (s.def.id !== "drone") continue;
    const alvo = s.stats.projeteis * (s.evoluido ? 2 : 1);
    const meus = b.drones.filter((d) => d.alive && d.dono === s && d.temp <= 0);
    for (let i = meus.length; i < alvo; i++) b.drones.push(novoDrone(s.x, s.y, s, 0));
    for (let i = alvo; i < meus.length; i++) meus[i].alive = false;
  }
}

export function novoDrone(x: number, y: number, dono: SentinelRun | null, temp: number): Drone {
  return { alive: true, x, y, vx: 0, vy: 0, alvo: null, cd: Math.random() * 0.4, retarget: 0, dono, temp, ang: 0 };
}

export function updateDrones(b: Battle, dt: number): void {
  const pl = b.planet;
  const ultDano = b.ult.poder();
  for (const d of b.drones) {
    if (!d.alive) continue;
    if (d.temp > 0) {
      d.temp -= dt;
      if (d.temp <= 0) {
        d.alive = false;
        continue;
      }
    }
    const s = d.dono;
    const st = s?.stats;
    d.retarget -= dt;
    if (d.retarget <= 0 || !d.alvo || !d.alvo.alive || !d.alvo.alvoavel) {
      d.retarget = 0.3;
      d.alvo = acharAlvo(b, d.x, d.y, st?.alcance ?? 1200, "proximo");
    }
    let tx: number;
    let ty: number;
    if (d.alvo) {
      const a = Math.atan2(d.y - d.alvo.y, d.x - d.alvo.x);
      tx = d.alvo.x + Math.cos(a) * 170;
      ty = d.alvo.y + Math.sin(a) * 170;
    } else {
      const a = b.t * 1.5 + (b.drones.indexOf(d) * TAU) / Math.max(1, b.drones.length);
      tx = pl.x + Math.cos(a) * 320;
      ty = pl.y + Math.sin(a) * 320;
    }
    const ax = tx - d.x;
    const ay = ty - d.y;
    const dist = Math.hypot(ax, ay) || 1;
    const vmax = 480;
    d.vx += ((ax / dist) * vmax - d.vx) * Math.min(1, dt * 3);
    d.vy += ((ay / dist) * vmax - d.vy) * Math.min(1, dt * 3);
    const sp = Math.min(dist * 4, vmax);
    const cur = Math.hypot(d.vx, d.vy) || 1;
    d.x += (d.vx / cur) * sp * dt;
    d.y += (d.vy / cur) * sp * dt;
    // nunca fica longe demais do planeta
    if (d.y < b.vis.top + 30) d.y = b.vis.top + 30;

    d.cd -= dt;
    if (d.alvo) {
      d.ang = Math.atan2(d.alvo.y - d.y, d.alvo.x - d.x);
      if (d.cd <= 0 && Math.hypot(d.alvo.x - d.x, d.alvo.y - d.y) < 420) {
        const cad = st?.cadencia ?? 3;
        d.cd = 1 / cad;
        const dano = d.temp > 0 ? 25 * ultDano : (st?.dano ?? 8) * (s?.evoluido ? 2 : 1);
        const p = b.spawnProj("drone", d.x, d.y, d.ang, st?.velProj ?? 1100, dano, s, 0x9dff5e);
        p.life = 0.6;
        p.ult = d.temp > 0;
        p.ricochete = d.temp > 0 ? 0 : Math.round(b.gAdd("ricochete"));
        p.pierce = st ? st.perfuracao : 0;
      }
    }
  }
}

// -------------------------------------------------------------------- zonas gravitacionais

export function updateZones(b: Battle, dt: number): void {
  for (const z of b.zones) {
    if (!z.alive) continue;
    z.life -= dt;
    if (z.life <= 0) {
      z.alive = false;
      continue;
    }
    z.tick -= dt;
    const doTick = z.tick <= 0;
    if (doTick) z.tick = 0.25;
    const list = b.grid.query(z.x, z.y, z.r, b.tmp);
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i];
      if (!e.alive) continue;
      const dx = z.x - e.x;
      const dy = z.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      if (!e.boss && e.def.comportamento !== "muro") {
        const f = z.puxao * (0.4 + 0.6 * (1 - d / z.r)) * dt;
        const mv = Math.min(f, d);
        e.x += (dx / d) * mv;
        e.y += (dy / d) * mv;
        e.gravSlow = Math.max(e.gravSlow, z.lentidao);
        if (z.buracoNegro && d < 45 && e.r <= 30) {
          b.hitEnemy(e, e.hp + e.escudo + 1, z.src, { semCrit: true, semMods: true });
          continue;
        }
      }
      if (doTick) b.hitEnemy(e, z.dano, z.src, z.src ? undefined : { semMods: true, ult: true });
    }
  }
}
