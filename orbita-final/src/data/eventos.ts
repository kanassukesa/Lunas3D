import type { Premio } from "./comandante";

/**
 * EVENTOS especiais com data marcada (lançamento, temporadas, datas comemorativas).
 * Os modos fixos (Desafio Diário, Jornada da Semana, Sobrevivência) ficam em MODOS, não aqui.
 *
 * Para criar um evento, adicione um item com início, fim e metas; ele aparece sozinho na tela
 * Eventos (e acende o "!" no botão) só enquanto estiver no período. As metas contam só o que o
 * jogador fizer DURANTE o evento (mesmas estatísticas das missões: partidas, abates, chefes,
 * vitorias, ultimates, evolucoes, pontos).
 */
export interface MetaEvento {
  id: string;
  texto: string;
  stat: string;
  meta: number;
  premio: Premio;
}

export interface EventoDef {
  id: string;
  nome: string;
  desc: string;
  /** Ícone (nome do ícone em ui/Icones). */
  icone: string;
  /** Cor de destaque do cartão. */
  cor: string;
  /** Datas no formato "AAAA-MM-DD" (fim inclusivo, horário do aparelho). */
  inicio: string;
  fim: string;
  metas: MetaEvento[];
}

export const EVENTOS: EventoDef[] = [
  {
    id: "lancamento_pixel",
    nome: "Evento de Lançamento",
    desc: "O Órbita Final ganhou visual novo em pixel art! Complete as metas até o fim do evento e garanta prêmios de lançamento.",
    icone: "estrela",
    cor: "#ffc23d",
    inicio: "2026-11-25",
    fim: "2026-12-09",
    metas: [
      { id: "partidas", texto: "Jogue 3 partidas", stat: "partidas", meta: 3, premio: { creditos: 500 } },
      { id: "abates", texto: "Derrote 200 inimigos", stat: "abates", meta: 200, premio: { nucleos: 10 } },
      { id: "chefes", texto: "Derrote 3 chefes", stat: "chefes", meta: 3, premio: { cristais: 15 } },
      { id: "vitorias", texto: "Vença 5 fases", stat: "vitorias", meta: 5, premio: { chip: 1 } },
      { id: "ultimates", texto: "Use a ULTIMATE 10 vezes", stat: "ultimates", meta: 10, premio: { creditos: 1000, cristais: 5 } },
    ],
  },
];

/** Data de hoje no aparelho ("AAAA-MM-DD"). */
function hoje(agora: Date): string {
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
}

/** Eventos ativos agora. */
export function eventosAtivos(agora = new Date()): EventoDef[] {
  const d = hoje(agora);
  return EVENTOS.filter((e) => e.inicio <= d && d <= e.fim);
}
