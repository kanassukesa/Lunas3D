# Órbita Final em PIXEL ART · Parte 7: HUD da batalha

Continue no **mesmo chat do ChatGPT** (o do manual do estilo).

O HUD é tudo o que fica **por cima da batalha**: a vida e o escudo do planeta, os botões de pausar/velocidade/cartas, o tempo, o nível, a barra de experiência, os botões CHOQUE e ULTIMATE e a barra do chefe.

O ChatGPT desenha só as **peças vazias** (molduras, botões, barras e ícones). Os números e textos eu escrevo por cima no código, com uma **fonte pixel**, e as barras eu estico no tamanho certo sem borrar.

São **4 folhas**. Eu separo cada peça aqui.

---

## Antes de tudo (mande uma vez)

```
Agora vamos fazer o HUD (interface) da batalha em pixel art. Vou pedir FOLHAS com várias peças de interface separadas, em grade. Regras para todas:
- Pixel art nítida, no mesmo estilo do jogo: metal escuro azulado (#141A3A, #3A4258, #5B6582) com bordas e detalhes em ciano (#3FD0FF, #9FF0FF), cantos chanfrados (cortados em diagonal), contorno escuro de 1 pixel.
- FUNDO PRETO PURO #000000, cada peça inteira e centralizada no próprio quadro, sem encostar na vizinha. Sem linhas de grade.
- Peças VAZIAS: SEM texto, SEM números, SEM letras (eu escrevo por cima depois).
- Visual limpo e legível no celular, nada poluído.
Responda só "ok".
```

---

## 7A · Molduras do topo

```
Folha 7A: MOLDURAS DO TOPO DO HUD, grade 2x2, fundo preto puro.
Em cima à esquerda: MOLDURA REDONDA para o ícone do planeta: um anel de metal com 4 rebites e brilho ciano, com o MEIO VAZIO (preto).
Em cima à direita: PLACA DO TEMPO: placa retangular deitada (uns 3 de largura para 1 de altura), metal escuro com borda ciano e cantos chanfrados, meio liso e escuro (vai o cronômetro em cima).
Embaixo à esquerda: SELO DO NÍVEL: um hexágono roxo (#4A2F7A, #D94FD0) com borda brilhante, meio liso (vai "LV 7" em cima).
Embaixo à direita: PLACA DA FASE: faixa bem comprida e fina deitada (uns 6 de largura para 1 de altura), metal escuro com pontas em seta, meio liso (vai "NORMAL - FASE 1" em cima).
Nome do arquivo: hud_molduras.png
```

---

## 7B · Botões

```
Folha 7B: BOTÕES DO HUD, grade 2x2, fundo preto puro, todos com o MEIO VAZIO (sem ícone, eu coloco depois).
Em cima à esquerda: BOTÃO PEQUENO HEXAGONAL de metal escuro com borda ciano (para pausar, velocidade e cartas).
Em cima à direita: BOTÃO REDONDO "CHOQUE": botão redondo médio com aro de metal e anel ciano brilhante, meio escuro.
Embaixo à esquerda: BOTÃO REDONDO "ULTIMATE": botão redondo GRANDE com aro DOURADO (#A86A00, #FFC23D, #FFE7A0) e brilho laranja, meio escuro. Mais imponente que o do choque.
Embaixo à direita: BOTÃO RETANGULAR deitado (uns 4 de largura para 1 de altura), metal escuro com borda ciano e cantos chanfrados (para "Mira no chefe").
Nome do arquivo: hud_botoes.png
```

---

## 7C · Barras

As barras precisam ser **retas e uniformes no meio** (só as pontas têm detalhe), porque o jogo estica o meio para o tamanho da tela.

```
Folha 7C: BARRAS DO HUD, grade 2x2, fundo preto puro. Todas BEM COMPRIDAS e deitadas (umas 8 vezes mais largas que altas), com o MEIO RETO E UNIFORME (todo igual, sem desenhos no meio), só as duas PONTAS com detalhe.
Em cima à esquerda: TRILHO VAZIO de barra: moldura de metal escuro com borda ciano e o meio preto-azulado vazio.
Em cima à direita: PREENCHIMENTO DE VIDA: só o "líquido" da barra, verde (#1F6B3A, #4CD96A, verde-claro no topo) com brilho de 1 pixel em cima, pontas retas.
Embaixo à esquerda: PREENCHIMENTO DE ESCUDO: igual, mas azul-ciano (#2A6FD6, #3FD0FF, #9FF0FF), pontas retas.
Embaixo à direita: BARRA DO CHEFE: trilho comprido de metal escuro com borda VERMELHA (#E0394B) e uma pequena CAVEIRA de metal na ponta esquerda, meio vazio.
Nome do arquivo: hud_barras.png
```

---

## 7D · Ícones

```
Folha 7D: ÍCONES DO HUD em pixel art, grade 3x3 (9 quadros), fundo preto puro, cada ícone simples, grosso e bem legível, centralizado no próprio quadro, sem moldura em volta.
Linha de cima: PAUSAR (duas barras verticais brancas), VELOCIDADE (duas setas para a direita, ciano), CARTAS (duas cartinhas sobrepostas, ciano e branco).
Linha do meio: CORAÇÃO (vermelho, para a vida), ESCUDO (escudo azul-ciano), RAIO (raio dourado, para a ultimate).
Linha de baixo: CHOQUE (símbolo de onda de choque/radiação ciano), MIRA (alvo de mira vermelho), CAVEIRA (caveira de metal com olhos vermelhos, para o chefe).
Nome do arquivo: hud_icones.png
```

---

## O que vem depois

**Parte 8**: cartas, telas (subir de nível, pausa, vitória) e menus.
