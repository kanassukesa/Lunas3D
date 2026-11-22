/**
 * "Teve atualização": a cada versão publicada, coloque uma entrada NO TOPO desta lista.
 * Quando o jogador abre o jogo e a primeira versão daqui é diferente da última que ele viu,
 * aparece a janelinha com o resumo (uma vez só).
 */
export interface Novidade {
  versao: string;
  titulo: string;
  itens: string[];
}

export const NOVIDADES: Novidade[] = [
  {
    versao: "3.5",
    titulo: "Clã, missões e visual novo",
    itens: [
      "Clã: crie ou entre num clã, converse no chat e suba no ranking de clãs.",
      "Entre na sua conta com um código no e-mail, sem senha.",
      "Passe de Batalha com 60 níveis, que sobe com missões diárias e semanais.",
      "Telas novas de subir de nível, pausa, vitória e derrota.",
      "Topo da batalha e botões ajustados para celular, longe do planeta.",
      "Sons novos, mais limpos, e música espacial.",
    ],
  },
];

export const VERSAO_ATUAL = NOVIDADES[0].versao;
