/**
 * Compara as sentinelas: cada uma sozinha no deck (base + só ela), mesma fase e hangar.
 * Uso: npx tsx scripts/simArmas.ts [fase=4] [runs=4] [hangar=8]
 */
declare const process: { argv: string[] };
import { Battle } from "../src/battle/Battle";
import { montarRun } from "../src/battle/Loadout";
import { STAGES } from "../src/data/stages";
import { SENTINEL_IDS } from "../src/data/sentinels";
import { Rng } from "../src/core/Rng";
const [faseA = "4", runsA = "4", nvA = "8"] = process.argv.slice(2);
const linhas: string[] = [];
for (const id of SENTINEL_IDS) {
  let vit = 0, tempo = 0, hp = 0, dps = 0, nivel = 0, t5 = 0, tBoss = 0, nBoss = 0;
  const R = Number(runsA);
  for (let r = 0; r < R; r++) {
    const cfg = montarRun({ modo: "campanha", stage: STAGES[Number(faseA) - 1], dif: 0, seed: 77 + r * 31,
      meta: { niveis: { [id]: Number(nvA) }, talentos: {}, chipsEquipados: [], base: id, pool: [id] } });
    const b = new Battle(cfg);
    const rng = new Rng(5 + r);
    let tNivel5 = 0, tChefe = 0;
    while (!b.fim && b.t < 600) {
      b.step(1 / 60); b.fx.length = 0;
      while (b.pendentes > 0) {
        const o = b.cards.sortear(b.cards.numeroDeCartas());
        const pr = (t: string) => ({ evolucao: 6, sentinela_nivel: 5, passiva: 4, sentinela_mod: 3, global: 2, mod_tiro: 2 } as Record<string, number>)[t] ?? 1;
        o.sort((x, y) => pr(y.card.tipo) - pr(x.card.tipo) + (rng.next() - 0.5));
        b.cards.aplicar(o[0].card);
      }
      if (b.ult.pronto()) b.ult.ativar();
      if (!tNivel5 && b.nivel >= 5) tNivel5 = b.t;
      if (b.boss && !tChefe) tChefe = b.t;
    }
    if (b.fim?.vitoria) { vit++; tBoss += b.t - tChefe; nBoss++; }
    tempo += b.t; hp += b.planet.hp / b.planet.hpMax; nivel += b.nivel; t5 += tNivel5;
    dps += b.sentinels[0].danoCausado / b.t;
  }
  linhas.push(`${id.padEnd(10)} vit ${vit}/${R}  sobreviveu ${(tempo / R).toFixed(0)}s  hp ${Math.round((100 * hp) / R)}%  dps ${(dps / R).toFixed(0)}  chefe ${nBoss ? (tBoss / nBoss).toFixed(0) + "s" : "-"}  nível final ${(nivel / R).toFixed(1)}  nv5 aos ${(t5 / R).toFixed(0)}s`);
}
console.log(`fase ${faseA}, hangar ${nvA}`);
console.log(linhas.join("\n"));
