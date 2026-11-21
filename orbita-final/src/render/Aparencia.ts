import { SKINS } from "../data/comandante";

/** Aparência escolhida pelo jogador (skins). O Game atualiza antes de criar as cenas. */
export const aparencia = { planeta: "planeta_terra", escudo: "escudo_azul" };

export function corEscudo(): number {
  return SKINS.find((s) => s.id === aparencia.escudo)?.cor ?? 0xffffff;
}
