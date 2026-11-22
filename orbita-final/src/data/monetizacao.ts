import type { Premio } from "./comandante";

/**
 * Produtos com dinheiro real. Preços em centavos (BRL). O servidor (supabase-orbita) tem a MESMA tabela
 * e é ele quem decide o preço cobrado e o que é entregue — o cliente só exibe.
 */
export interface Produto {
  id: string;
  nome: string;
  desc: string;
  centavos: number;
  /** Imagem (arte final) para a vitrine. */
  icone: string;
  premio?: Premio;
  /** Desbloqueios especiais. */
  especial?: "passe_premium" | "sem_anuncios";
  /** Só pode comprar uma vez por conta. */
  unico?: boolean;
  /** Selo de destaque na vitrine. */
  selo?: string;
  skin?: string;
}

export const PRODUTOS: Produto[] = [
  { id: "inicial", nome: "Pacote Inicial", desc: "300 cristais, 5.000 créditos, chip épico e o Escudo Aurora.", centavos: 990, icone: "banner_loja",
    premio: { cristais: 300, creditos: 5000, chip: 2 }, skin: "escudo_aurora", unico: true, selo: "OFERTA 1x" },
  { id: "cristais_60", nome: "Punhado de cristais", desc: "60 cristais.", centavos: 490, icone: "premio_cristais", premio: { cristais: 60 } },
  { id: "cristais_330", nome: "Bolsa de cristais", desc: "300 + 30 de bônus.", centavos: 1990, icone: "premio_cristais", premio: { cristais: 330 }, selo: "+10%" },
  { id: "cristais_900", nome: "Baú de cristais", desc: "750 + 150 de bônus.", centavos: 4990, icone: "premio_cristais", premio: { cristais: 900 }, selo: "MAIS VENDIDO" },
  { id: "cristais_2000", nome: "Cofre de cristais", desc: "1.600 + 400 de bônus.", centavos: 9990, icone: "premio_cristais", premio: { cristais: 2000 }, selo: "+25%" },
  { id: "passe_premium", nome: "Passe Premium", desc: "Libera a trilha premium da temporada atual (cristais, chips e skins exclusivas).", centavos: 1490,
    icone: "premio_chip", especial: "passe_premium", selo: "TEMPORADA" },
  { id: "sem_anuncios", nome: "Sem anúncios", desc: "Remove os anúncios entre partidas e libera as recompensas de vídeo sem assistir.", centavos: 1290,
    icone: "loja_gratis", especial: "sem_anuncios", unico: true },
];

export function precoBRL(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Trilha premium do passe (índice 0 = nível 1). */
export const PASSE_PREMIUM: (Premio & { skin?: string })[] = Array.from({ length: 60 }, (_, i) => {
  const n = i + 1;
  if (n === 1) return { cristais: 30 };
  if (n === 20) return { skin: "escudo_premium" };
  if (n === 40) return { skin: "planeta_premium_lava", cristais: 30 };
  if (n === 60) return { skin: "escudo_supernova", cristais: 60, chip: 3 };
  if (n % 10 === 0) return { chip: 2 };
  if (n % 2 === 0) return { cristais: 6 };
  return { creditos: 400 + n * 25, nucleos: 3 };
});

/** Anúncios com recompensa: onde aparecem e o limite diário de cada um. */
export const ANUNCIOS = {
  /** Mínimo de partidas entre anúncios intersticiais (e nunca no primeiro dia). */
  intersticialCadaPartidas: 3,
  intersticialMinSegundos: 240,
  recompensa: {
    dobrar: { limite: 5, nome: "Dobrar recompensa" },
    reviver: { limite: 3, nome: "Reviver" },
    rerrolar: { limite: 5, nome: "Rerrolar cartas" },
    bau: { limite: 3, nome: "Baú de anúncio", premio: { creditos: 200, cristais: 2 } as Premio },
  },
} as const;
export type MotivoAnuncio = keyof typeof ANUNCIOS.recompensa;
