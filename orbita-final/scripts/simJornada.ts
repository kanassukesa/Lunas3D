/** Simula a Jornada da semana. Uso: npx tsx scripts/simJornada.ts [runs=4] [nivelHangar=1] */
declare const process: { argv: string[] };
import { Battle } from "../src/battle/Battle";
import { montarRun } from "../src/battle/Loadout";
import { jornadaDaSemana } from "../src/meta/Meta";
import type { SentinelId } from "../src/data/types";

const [runsArg = "4", nivelArg = "1", camposArg = ""] = process.argv.slice(2);
const nivel = Number(nivelArg);
const j = jornadaDaSemana();
if (camposArg) j.campos = camposArg.split(",").map((id) => ({ id }) as (typeof j.campos)[number]);
console.log("Campos:", j.campos.map((c) => c.id).join(", "), "| Etapas:", j.etapas.map((e) => e.nome).join(" / "));
const pool: SentinelId[] = ["canhao", "laser", "missil", "feixe", "campo"];
for (let r = 0; r < Number(runsArg); r++) {
  const cfg = montarRun({
    modo: "jornada", stage: { ...j.etapas[0] }, dif: 0, seed: 500 + r, campos: j.campos.map((c) => c.id), etapas: j.etapas.map((e) => ({ ...e })),
    meta: { niveis: Object.fromEntries(pool.map((p) => [p, nivel])), talentos: { dano: Math.floor(nivel / 2), hp: Math.floor(nivel / 2) }, chipsEquipados: [], base: "canhao", pool },
  });
  const b = new Battle(cfg);
  const hpEtapa: number[] = [];
  let ultimaEtapa = 0;
  while (!b.fim && b.tTotal < 1500) {
    b.step(1 / 60);
    b.fx.length = 0;
    while (b.pendentes > 0) {
      const o = b.cards.sortear(b.cards.numeroDeCartas());
      const prio = (t: string) => ({ evolucao: 5, nova_sentinela: 4, sentinela_nivel: 3 } as Record<string, number>)[t] ?? 1;
      o.sort((x, y) => prio(y.card.tipo) - prio(x.card.tipo) + (Math.random() - 0.5));
      b.cards.aplicar(o[0].card);
    }
    if (b.ult.pronto()) b.ult.ativar();
    if (b.etapasConcluidas !== ultimaEtapa) {
      ultimaEtapa = b.etapasConcluidas;
      hpEtapa.push(Math.round((100 * b.planet.hp) / b.planet.hpMax));
    }
  }
  console.log(`${b.fim?.vitoria ? "V" : "D"} etapas=${b.etapasConcluidas}/5 tempo=${b.tTotal.toFixed(0)}s lv=${b.nivel} hp ao fim de cada etapa=${hpEtapa.join("%,")}%`);
}
