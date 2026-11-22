/**
 * Simulador headless de balanceamento: um bot joga as fases escolhendo cartas e usando o ultimate.
 * Uso: npm run sim -- [fases=1-10] [runs=4] [nivelHangar=1]
 */
declare const process: { argv: string[] };
import { Battle } from "../src/battle/Battle";
import { montarRun } from "../src/battle/Loadout";
import { STAGES } from "../src/data/stages";
import type { SentinelId } from "../src/data/types";

const [faixa = "1-10", runsArg = "4", nivelArg = "1", modo = "campanha"] = process.argv.slice(2);
const [a, z] = faixa.split("-").map(Number);
const runs = Number(runsArg);
const nivel = Number(nivelArg);

function bot(b: Battle): void {
  const ofs = b.cards.sortear(b.cards.numeroDeCartas());
  // heurística simples: evolução > nova sentinela > nível > o resto
  const prio = (t: string) => ({ evolucao: 5, nova_sentinela: 4, sentinela_nivel: 3, passiva: 2.5, mod_tiro: 2, global: 2 } as Record<string, number>)[t] ?? 1;
  ofs.sort((x, y) => prio(y.card.tipo) - prio(x.card.tipo) + (Math.random() - 0.5) * 1.5);
  b.cards.aplicar(ofs[0].card);
}

const pool: SentinelId[] = ["canhao", "laser", "missil", "feixe", "campo"];
for (let s = a; s <= (z || a); s++) {
  const stage = STAGES[s - 1];
  const res: string[] = [];
  let vit = 0;
  for (let r = 0; r < runs; r++) {
    const niveis = Object.fromEntries(pool.map((p) => [p, nivel]));
    const cfg = montarRun({
      modo: modo as "campanha", stage, dificil: false, seed: 1000 + r * 77 + s, campos: stage.campos,
      meta: { niveis, talentos: { dano: Math.min(10, Math.floor(nivel / 2)), hp: Math.min(10, Math.floor(nivel / 2)), escudo: Math.min(10, Math.floor(nivel / 3)) }, chipsEquipados: [], base: "canhao", pool },
    });
    const b = new Battle(cfg);
    let maxInim = 0;
    let maxProj = 0;
    let pico = "";
    const t0 = performance.now();
    while (!b.fim && b.t < 600) {
      b.step(1 / 60);
      b.fx.length = 0;
      while (b.pendentes > 0) bot(b);
      if (b.ult.pronto()) b.ult.ativar();
      const vivos = b.inimigosVivos();
      if (vivos > maxInim) {
        maxInim = vivos;
        const comp: Record<string, number> = {};
        for (const e of b.enemies) if (e.alive) comp[e.def.id] = (comp[e.def.id] ?? 0) + 1;
        pico = `@${b.t.toFixed(0)}s ` + Object.entries(comp).map(([k, v]) => k + ":" + v).join(" ");
      }
      maxProj = Math.max(maxProj, b.projs.length);
    }
    const ms = performance.now() - t0;
    if (b.fim?.vitoria) vit++;
    const hp = Math.round((100 * b.planet.hp) / b.planet.hpMax);
    res.push(
      `${b.fim?.vitoria ? "V" : "D"} t=${b.t.toFixed(0)}s lv=${b.nivel} hp=${hp}% abates=${b.abates} maxInim=${maxInim} maxProj=${maxProj} sent=${b.sentinels.map((x) => x.def.id + x.nivel + (x.evoluido ? "*" : "")).join(",")} bossHp=${b.boss ? Math.round((100 * b.boss.hp) / b.boss.hpMax) + "%" : "-"} (${(ms / 1000).toFixed(1)}s cpu) pico[${pico}]`,
    );
  }
  console.log(`\n== Fase ${s} (${stage.nome}) vitórias ${vit}/${runs}`);
  for (const l of res) console.log("  " + l);
}
