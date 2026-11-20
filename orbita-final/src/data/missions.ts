/** Missões permanentes (conquistas) com recompensa. Os contadores ficam em save.estatisticas. */
export interface MissionDef {
  id: string;
  texto: string;
  stat: string;
  meta: number;
  recompensa: { creditos?: number; nucleos?: number; cristais?: number };
}

const serie = (base: string, stat: string, texto: (n: number) => string, metas: number[], rec: (i: number) => MissionDef["recompensa"]): MissionDef[] =>
  metas.map((meta, i) => ({ id: `${base}_${i}`, texto: texto(meta), stat, meta, recompensa: rec(i) }));

export const MISSIONS: MissionDef[] = [
  ...serie("abates", "abates", (n) => `Destrua ${n.toLocaleString("pt-BR")} inimigos`, [500, 2500, 10000, 40000], (i) => ({ creditos: 200 * (i + 1), nucleos: 5 * (i + 1) })),
  ...serie("chefes", "chefes", (n) => `Derrote ${n} chefe${n > 1 ? "s" : ""}`, [1, 5, 15, 40], (i) => ({ nucleos: 8 * (i + 1) })),
  ...serie("evolucoes", "evolucoes", (n) => `Evolua sentinelas ${n} vez${n > 1 ? "es" : ""}`, [1, 5, 20], (i) => ({ nucleos: 10 * (i + 1), cristais: 5 })),
  ...serie("estrelas", "estrelas", (n) => `Junte ${n} estrelas na campanha`, [5, 15, 30, 60], (i) => ({ creditos: 300 * (i + 1), nucleos: 6 * (i + 1) })),
  ...serie("partidas", "partidas", (n) => `Jogue ${n} partidas`, [3, 15, 50], (i) => ({ creditos: 250 * (i + 1) })),
  ...serie("jornadas", "jornadas", (n) => `Complete ${n} Jornada${n > 1 ? "s" : ""}`, [1, 4, 12], (i) => ({ nucleos: 15 * (i + 1), cristais: 10 })),
  ...serie("diarios", "diarios", (n) => `Complete ${n} desafio${n > 1 ? "s" : ""} diário${n > 1 ? "s" : ""}`, [1, 7, 30], (i) => ({ nucleos: 10 * (i + 1), cristais: 10 })),
];
