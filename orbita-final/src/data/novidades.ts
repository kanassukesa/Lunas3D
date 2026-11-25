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
    versao: "3.10",
    titulo: "Visual novo em pixel art",
    itens: [
      "O jogo inteiro foi redesenhado em pixel art: fundos, planeta e skins, armas, inimigos, chefes, HUD, cartas e menus.",
      "As armas mudam de visual a cada upgrade (nível 3, nível 5 e evoluída).",
      "Domo Elétrico, Serra e Colmeia agora ficam instalados no planeta.",
      "Chefes animados: piscam, abrem a boca para atacar e ficam enfurecidos abaixo de 50% de vida.",
      "Tiros, explosões e efeitos novos, e fogos de artifício na vitória.",
    ],
  },
  {
    versao: "3.9",
    titulo: "Perfil dos jogadores e selo ELITE",
    itens: [
      "Quem tem o Passe Premium aparece com moldura dourada e o selo ELITE no chat, no clã, nos amigos e no ranking.",
      "Toque em qualquer jogador para ver o perfil: patente, clã, comandante, progresso, estatísticas e skins.",
      "Pelo perfil dá para adicionar amigo ou abrir a conversa.",
    ],
  },
  {
    versao: "3.8",
    titulo: "Jogo mais leve e rápido",
    itens: [
      "Imagens até 3x mais leves: o jogo baixa 13 MB em vez de 31 MB.",
      "As fotos das cartas já ficam salvas no aparelho; no app, todas as imagens.",
      "Se uma imagem falhar, o jogo tenta de novo sozinho.",
      "Aviso no topo quando sair uma atualização nova.",
    ],
  },
  {
    versao: "3.7",
    titulo: "Balanceamento",
    itens: [
      "O escudo do planeta recarrega mais devagar (35 por segundo) e espera 4 s sem dano para começar.",
      "A Rainha da Colmeia ficou mais perigosa: leque de 7 tiros mais fortes e mais enxames.",
    ],
  },
  {
    versao: "3.6",
    titulo: "Amigos, chat e Chefe do Clã",
    itens: [
      "Amigos: procure pelo nome do comandante, adicione e veja quem está online.",
      "Chat global para falar com todo mundo, e chat privado com os seus amigos.",
      "Chefe do Clã: um chefe gigante por semana; o dano de todo o clã soma e todo mundo ganha prêmio.",
      "Clã: criar custa 50 diamantes e os membros entram por convite.",
      "Conta: entre com e-mail e senha, crie uma conta ou jogue como convidado.",
    ],
  },
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
