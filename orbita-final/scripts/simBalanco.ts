/** Mede o ultimate contra chefes e a força do Domo. Uso: npx tsx scripts/simBalanco.ts [fase] [runs] [foco=campo|nenhum] [hangar] */
declare const process: { argv: string[] };
import { Battle } from "../src/battle/Battle";
import { montarRun } from "../src/battle/Loadout";
import { STAGES } from "../src/data/stages";
import type { SentinelId } from "../src/data/types";
const [faseA = "5", runsA = "3", foco = "nenhum", nivelA = "1"] = process.argv.slice(2);
const pool: SentinelId[] = ["canhao", "laser", "missil", "feixe", "campo"];
for (let r = 0; r < Number(runsA); r++) {
  const n = Number(nivelA);
  const base: SentinelId = foco === "campo" ? "campo" : "canhao";
  const cfg = montarRun({ modo: "campanha", stage: STAGES[Number(faseA) - 1], dif: 0, seed: 900 + r,
    meta: { niveis: Object.fromEntries(pool.map((p) => [p, n])), talentos: {}, chipsEquipados: [], base, pool } });
  const b = new Battle(cfg);
  let usos = 0, danoUltChefe = 0, hpMin = 1, tChefe = 0, bossHp0 = 0;
  const hit = b.hitEnemy.bind(b);
  b.hitEnemy = (e, d, src, o) => { const v = hit(e, d, src, o); if (e.boss && b.ult.ativo > 0 && !src) danoUltChefe += v; return v; };
  while (!b.fim && b.t < 600) {
    b.step(1 / 60); b.fx.length = 0;
    while (b.pendentes > 0) {
      const o = b.cards.sortear(b.cards.numeroDeCartas());
      const pr = (c: (typeof o)[0]["card"]) => (foco === "campo" && c.alvo === "campo" ? 10 : 0) + (({ evolucao: 5, nova_sentinela: 4, sentinela_nivel: 3 } as Record<string, number>)[c.tipo] ?? 1);
      o.sort((x, y) => pr(y.card) - pr(x.card) + (Math.random() - 0.5));
      b.cards.aplicar(o[0].card);
    }
    if (b.ult.pronto()) { b.ult.ativar(); usos++; }
    if (b.boss && !bossHp0) { bossHp0 = b.boss.hpMax; tChefe = b.t; }
    hpMin = Math.min(hpMin, b.planet.hp / b.planet.hpMax);
  }
  const campo = b.getSentinel("campo");
  console.log(`${b.fim?.vitoria ? "V" : "D"} lv=${b.nivel} ults=${usos} (${(b.t / Math.max(1, usos)).toFixed(0)}s/ult) chefe morreu em ${(b.t - tChefe).toFixed(1)}s, ult fez ${Math.round((100 * danoUltChefe) / Math.max(1, bossHp0))}% do HP do chefe; HP mínimo ${Math.round(hpMin * 100)}%  domo=${campo ? "nv" + campo.nivel + (campo.evoluido ? "*" : "") : "-"}`);
}
