import type { EnemyDef } from "./types";

export const ENEMIES: Record<string, EnemyDef> = {
  batedor: { id: "batedor", nome: "Batedor", hp: 30, vel: 120, dano: 40, xp: 1, raio: 20, cor: 0xff6b4a, forma: "tri", comportamento: "reto" },
  tanque: { id: "tanque", nome: "Couraçado", hp: 400, vel: 45, dano: 200, xp: 8, raio: 42, cor: 0x9b7bff, forma: "hex", comportamento: "reto" },
  enxame: { id: "enxame", nome: "Enxame", hp: 8, vel: 150, dano: 10, xp: 0.35, raio: 10, cor: 0xffd04a, forma: "diamante", comportamento: "reto", grupo: 12 },
  atirador: {
    id: "atirador", nome: "Artilheiro", hp: 90, vel: 90, dano: 40, xp: 3, raio: 24, cor: 0xff4fa3, forma: "quadrado", comportamento: "atirador",
    params: { distancia: 640, recarga: 2.2, danoTiro: 25, velTiro: 360 },
  },
  kamikaze: {
    id: "kamikaze", nome: "Cometa", hp: 45, vel: 85, dano: 120, xp: 2, raio: 18, cor: 0x4fffe0, forma: "seta", comportamento: "kamikaze",
    params: { distancia: 650, velMax: 420 },
  },
  divisor: {
    id: "divisor", nome: "Mitose", hp: 120, vel: 70, dano: 60, xp: 3, raio: 28, cor: 0x7dff6b, forma: "celula", comportamento: "divisor",
    params: { filhos: 3, tipoFilho: "mitose_mini" },
  },
  mitose_mini: { id: "mitose_mini", nome: "Fragmento", hp: 28, vel: 115, dano: 20, xp: 0.5, raio: 14, cor: 0xb5ff9e, forma: "celula", comportamento: "reto" },
  escudeiro: {
    id: "escudeiro", nome: "Bastião", hp: 160, vel: 60, dano: 60, xp: 4, raio: 28, cor: 0x5ec8ff, forma: "penta", comportamento: "escudeiro",
    params: { raioAura: 230, escudo: 40, escudoMax: 90, recarga: 3 },
  },
  meteoro: { id: "meteoro", nome: "Meteoro", hp: 60, vel: 210, dano: 80, xp: 1, raio: 26, cor: 0xff8a3c, forma: "rocha", comportamento: "meteoro" },
  muro: { id: "muro", nome: "Barreira", hp: 700, vel: 0, dano: 0, xp: 0.5, raio: 58, cor: 0x8fa3c4, forma: "muro", comportamento: "muro" },
};
