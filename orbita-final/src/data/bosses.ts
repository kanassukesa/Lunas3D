import type { BossDef } from "./types";

export const BOSSES: Record<string, BossDef> = {
  colosso_igneo: {
    id: "colosso_igneo", nome: "Colosso Ígneo",
    desc: "Planeta em chamas. Dispara leques de meteoros; abaixo de 50% gira atirando em espiral.",
    hp: 7000, raio: 120, cor: 0xff6a2c, forma: "planetaFogo", danoTiro: 45, dano: 600,
  },
  rainha_colmeia: {
    id: "rainha_colmeia", nome: "Rainha da Colmeia",
    desc: "Invoca enxames sem parar.",
    hp: 6300, raio: 110, cor: 0xffd04a, forma: "rainha", danoTiro: 30, dano: 600,
  },
  construtor_muros: {
    id: "construtor_muros", nome: "Construtor de Muros",
    desc: "Ergue barreiras que bloqueiam tiros. Perfuração ajuda.",
    hp: 7700, raio: 115, cor: 0x8fa3c4, forma: "construtor", danoTiro: 40, dano: 600,
  },
  eclipse: {
    id: "eclipse", nome: "Eclipse",
    desc: "Some por alguns segundos e reaparece em outro lugar.",
    hp: 6600, raio: 105, cor: 0xc28bff, forma: "eclipse", danoTiro: 40, dano: 600,
  },
  singularidade: {
    id: "singularidade", nome: "Singularidade",
    desc: "Em pulsos, puxa e engole os projéteis próximos.",
    hp: 8400, raio: 100, cor: 0x7a5cff, forma: "singularidade", danoTiro: 35, dano: 600,
  },
};
