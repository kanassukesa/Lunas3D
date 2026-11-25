# Órbita Final em PIXEL ART · Parte 5: os chefes (um de cada vez)

Continue no **mesmo chat do ChatGPT** (o do manual do estilo).

São **5 chefes**. Vamos fazer **um de cada vez**, bem caprichado: você manda, eu confiro e coloco no jogo, e só depois vem o próximo.

## O que cada chefe tem (uma folha 2x2)

| Quadro | O que é | Onde aparece |
|---|---|---|
| **em cima à esquerda** | o chefe **normal** | batalha, vida acima de 50% |
| **em cima à direita** | o chefe **ENFURECIDO** | batalha, vida abaixo de 50% (troca na hora) |
| **embaixo à esquerda** | o **tiro** do chefe | os projéteis que ele dispara |
| **embaixo à direita** | o **retrato** (rosto/frente de perto) | faixa de ALERTA quando ele chega e tela antes da fase |

O normal e o enfurecido têm que ser **o mesmo chefe na mesma posição**, só mais destruído, mais aceso e mais ameaçador. Assim a troca no meio da luta fica natural.

## Animação (uma 2ª folha por chefe)

O chefe ganha vida no jogo com uma **2ª folha** de 4 quadros, que são o mesmo desenho com pequenas mudanças. O jogo monta a animação sozinho:

| Quadro | O que é | Animação no jogo |
|---|---|---|
| **em cima à esquerda** | normal de **olhos fechados** | pisca a cada poucos segundos |
| **em cima à direita** | enfurecido de **olhos fechados** | pisca mais rápido, nervoso |
| **embaixo à esquerda** | normal **atacando** (boca/canhão aberto e brilhando) | aparece quando ele atira, com um coice |
| **embaixo à direita** | enfurecido **atacando** | igual, na fase enfurecida |

O código também faz o chefe **flutuar**, **tremer** quando está enfurecido e **piscar em branco** quando toma dano.

---

## Antes de tudo (mande uma vez)

```
Agora vamos fazer os CHEFES do jogo, UM POR VEZ, bem detalhados e caprichados. Cada chefe é UMA FOLHA quadrada em grade 2x2, com FUNDO PRETO PURO #000000, sem linhas de grade, sem texto e sem números:
- Em cima à esquerda: o CHEFE NORMAL, visto de CIMA (top-down), inteiro, centralizado e GRANDE no quadro, com a frente (boca, canhões, olho) apontando para BAIXO.
- Em cima à direita: o MESMO chefe ENFURECIDO, na MESMA posição e tamanho: rachado, soltando energia, luzes mais fortes e vermelhas, partes abertas mostrando o núcleo. Tem que dar para ver que é o mesmo chefe, só que muito mais perigoso.
- Embaixo à esquerda: o TIRO do chefe, um projétil só, pequeno no centro do quadro, apontando para BAIXO.
- Embaixo à direita: o RETRATO do chefe: a "cara" dele bem de perto, de FRENTE, ocupando o quadro, intimidador, para aparecer na faixa de alerta.
Chefes são o ponto alto do jogo: muito detalhe, silhueta marcante, contorno escuro de 1 pixel, luz de cima à esquerda, 3-4 tons, brilhos fortes. Mantenha o manual do estilo.
Responda só "ok".
```

---

## Chefe 1 · COLOSSO ÍGNEO (chefe da Fase 1)

Um **planeta vivo em chamas**. No jogo ele gira devagar e dispara **leques de meteoros** em direção ao seu planeta. Abaixo de 50% de vida ele **gira rápido atirando em espiral**.

```
Chefe 1: COLOSSO ÍGNEO.
É um PLANETA VIVO feito de rocha vulcânica e magma, redondo, maior e mais ameaçador que qualquer inimigo. Crosta de placas de rocha escura (#141A3A, #3A4258, marrom) com rachaduras de lava brilhando (#E0394B, #FF7A3C, #FFD04A). Na parte de baixo (a frente), uma enorme BOCA/CRATERA de lava com "dentes" de rocha, de onde saem os meteoros. Dois olhos de fogo acima da boca. Anel de rochas pequenas flutuando em volta e labaredas saindo da superfície.
Em cima à esquerda, NORMAL: rachaduras finas, fogo controlado, olhos laranja.
Em cima à direita, ENFURECIDO: a mesma forma e posição, mas a crosta RACHADA ao meio mostrando um núcleo branco-amarelo, labaredas enormes em volta, olhos brancos e vermelhos, pedaços de rocha se soltando.
Embaixo à esquerda, TIRO: um meteoro pequeno pegando fogo, rocha com chama para TRÁS (para cima), apontando para baixo.
Embaixo à direita, RETRATO: o rosto do Colosso de frente e de perto: a boca de lava aberta e os dois olhos de fogo, ocupando o quadro.
Nome do arquivo: chefe_colosso_igneo.png
```

Depois que a folha acima ficar boa, mande no **mesmo chat** a folha de animação:

```
Agora a FOLHA DE ANIMAÇÃO do Colosso Ígneo: os MESMOS desenhos que você acabou de fazer, com o MESMO tamanho, posição, cores e detalhes, mudando SÓ o que eu disser. Grade 2x2, fundo preto puro #000000.
Em cima à esquerda: o Colosso NORMAL com os dois olhos FECHADOS (pálpebras de rocha fechadas, só uma linha de fogo fininha).
Em cima à direita: o Colosso ENFURECIDO com os olhos FECHADOS do mesmo jeito.
Embaixo à esquerda: o Colosso NORMAL ATACANDO: a boca de lava BEM ABERTA, brilhando branco-amarelo no fundo, com um meteoro saindo.
Embaixo à direita: o Colosso ENFURECIDO ATACANDO: a boca escancarada soltando um jato de fogo.
Nome do arquivo: chefe_colosso_igneo_animacao.png
```

---

## Chefe 2 · RAINHA DA COLMEIA (chefe da Fase 2)

A **mãe do Enxame** (aqueles insetos-robô amarelos de olho vermelho). No jogo ela **solta bandos de 14 insetos** de dentro do abdômen, chama Batedores e cospe um **leque de ferrões** amarelos. Abaixo de 50% de vida ela fica enfurecida e solta os bandos mais rápido.

**Dica:** mande junto a imagem da folha 4A (a do Enxame) para o ChatGPT manter a mesma família de inseto.

```
Chefe 2: RAINHA DA COLMEIA.
Uma RAINHA inseto-robô gigante, mãe dos insetos amarelos do Enxame (mesmo estilo: carapaça amarela #FFD04A e laranja #FF7A3C com metal escuro #141A3A, olhos vermelhos #E0394B). Vista de CIMA, cabeça e mandíbulas apontando para BAIXO. Cabeça com uma COROA de espinhos dourados e VÁRIOS olhos vermelhos brilhando. Quatro asas grandes translúcidas abertas para os lados, com nervuras. Corpo segmentado e um ABDÔMEN enorme atrás (em cima), em forma de colmeia com favos hexagonais brilhando, de onde saem os insetos. Patas mecânicas finas e duas mandíbulas afiadas na frente.
Em cima à esquerda, NORMAL: carapaça inteira e brilhante, olhos vermelhos, favos do abdômen com luz amarela suave.
Em cima à direita, ENFURECIDA: mesma forma e posição, mas carapaça RACHADA, asas rasgadas soltando faíscas, olhos brancos-vermelhos muito acesos, favos do abdômen pulsando vermelho e laranja.
Embaixo à esquerda, TIRO: um FERRÃO amarelo brilhante com ponta afiada apontando para BAIXO e um rastro curto.
Embaixo à direita, RETRATO: o rosto da Rainha de frente e de perto: a coroa, os muitos olhos vermelhos e as mandíbulas abertas, ocupando o quadro.
Nome do arquivo: chefe_rainha_colmeia.png
```

Depois que a folha acima ficar boa, mande no **mesmo chat** (de preferência anexando a folha que saiu) a folha de animação:

```
Use EXATAMENTE esta Rainha da Colmeia da imagem. Faça a FOLHA DE ANIMAÇÃO dela, grade 2x2, fundo preto puro #000000, com o MESMO desenho, MESMO tamanho, MESMA posição, MESMAS asas e cores, mudando SÓ isto:
Em cima à esquerda: a Rainha NORMAL com TODOS os olhos FECHADOS (pálpebras de carapaça escura cobrindo os olhos).
Em cima à direita: a Rainha ENFURECIDA com os olhos FECHADOS do mesmo jeito.
Embaixo à esquerda: a Rainha NORMAL ATACANDO: mandíbulas BEM ABERTAS e o abdômen com os favos ABERTOS e muito brilhantes (de onde saem os insetos). NÃO desenhe insetos voando fora do corpo.
Embaixo à direita: a Rainha ENFURECIDA ATACANDO, do mesmo jeito, com os favos brilhando vermelho.
NÃO mude o formato nem o tamanho do corpo. Nada saindo para fora do quadro.
Nome do arquivo: chefe_rainha_colmeia_animacao.png
```

---

## Chefe 3 · CONSTRUTOR DE MUROS (chefe da Fase 3)

Uma **fortaleza-robô engenheira**. No jogo ela **ergue 3 Barreiras** (aqueles muros de energia vermelha da Parte 4) entre ela e o seu planeta, bloqueando os tiros, e dispara **rebites de aço** em leque. Ela tem **um olho só** (um visor grande), que fecha com uma persiana de metal quando pisca.

**Dica:** mande junto a imagem da folha 4D (a da Barreira) para os campos de força saírem iguais.

```
Chefe 3: CONSTRUTOR DE MUROS.
Uma FORTALEZA-ROBÔ engenheira gigante, larga e pesada, vista de CIMA, com a frente apontando para BAIXO. Corpo blindado de placas de aço grossas cinza-azulado (#3A4258, #5B6582, #8F9BB8) com faixas de aviso amarelas e pretas e rebites. No centro da frente, UM ÚNICO OLHO gigante: um visor redondo vermelho (#E0394B) brilhando, como de um ciclope. Dos lados, DOIS BRAÇOS-GUINDASTE mecânicos que terminam em PROJETORES de campo de força com luz vermelha (é com eles que ela ergue as barreiras). Atrás (em cima), chaminés e um reator.
Em cima à esquerda, NORMAL: blindagem inteira, olho vermelho firme, projetores com luz vermelha fraca.
Em cima à direita, ENFURECIDO: mesma forma e posição, mas placas de blindagem soltas e amassadas, faíscas, fumaça saindo das chaminés, o reator exposto brilhando laranja, olho muito aceso com rachadura.
Embaixo à esquerda, TIRO: um REBITE/parafuso de aço grosso com a ponta vermelha incandescente, apontando para BAIXO, com rastro curto.
Embaixo à direita, RETRATO: o olho único do Construtor de frente e de perto, cercado pela blindagem e pelas faixas de aviso, ocupando o quadro.
Nome do arquivo: chefe_construtor_muros.png
```

Depois que a folha acima ficar boa, mande no **mesmo chat** (anexando a folha que saiu) a folha de animação:

```
Use EXATAMENTE este Construtor de Muros da imagem. Faça a FOLHA DE ANIMAÇÃO dele, grade 2x2, fundo preto puro #000000, com o MESMO desenho, MESMO tamanho, MESMA posição e MESMAS cores, mudando SÓ isto:
Em cima à esquerda: o Construtor NORMAL com o OLHO FECHADO (uma persiana de placas de metal fechada por cima do visor).
Em cima à direita: o Construtor ENFURECIDO com o OLHO FECHADO do mesmo jeito.
Embaixo à esquerda: o Construtor NORMAL ATACANDO: os dois braços-guindaste abertos para os lados e os projetores BEM ACESOS em vermelho, com o olho brilhando mais forte. NÃO desenhe muros nem raios saindo para fora do corpo.
Embaixo à direita: o Construtor ENFURECIDO ATACANDO, do mesmo jeito.
NÃO mude o formato nem o tamanho do corpo. Nada saindo para fora do quadro.
Nome do arquivo: chefe_construtor_muros_animacao.png
```

---

## Chefe 4 · ECLIPSE (chefe da Fase 4)

Uma **entidade de sombra** em forma de eclipse: um disco negro tapando uma luz roxa. No jogo ela **some por alguns segundos e reaparece em outro lugar** com um clarão, e dispara **luas crescentes** roxas. Ela tem **um olho gigante** no meio do disco escuro.

```
Chefe 4: ECLIPSE.
Uma ENTIDADE CÓSMICA de sombra em forma de ECLIPSE, vista de FRENTE/CIMA, redonda e simétrica: um DISCO NEGRO perfeito (#05070F, #141A3A) tapando uma luz, com uma COROA de energia roxa e lilás (#4A2F7A, #D94FD0, lilás claro) brilhando em volta da borda, com labaredas e raios finos saindo como num eclipse solar. No centro do disco negro, UM OLHO gigante, alongado e misterioso, com íris roxa brilhante e pupila em fenda. Em volta, 3 ou 4 LUAS CRESCENTES pequenas orbitando, e fiapos de sombra escorrendo para baixo.
Em cima à esquerda, NORMAL: coroa roxa calma e regular, olho roxo sereno.
Em cima à direita, ENFURECIDO: mesma forma e posição, mas o disco RACHADO com luz branca e vermelha vazando pelas rachaduras, coroa irregular e agitada em roxo e vermelho, olho vermelho arregalado.
Embaixo à esquerda, TIRO: uma LUA CRESCENTE roxa brilhante, afiada como uma lâmina, com a ponta curva virada para BAIXO e um rastro curto.
Embaixo à direita, RETRATO: o olho do Eclipse de frente e de perto, com a coroa roxa em volta, ocupando o quadro.
Nome do arquivo: chefe_eclipse.png
```

Depois que a folha acima ficar boa, mande no **mesmo chat** (anexando a folha que saiu) a folha de animação:

```
Use EXATAMENTE este Eclipse da imagem. Faça a FOLHA DE ANIMAÇÃO dele, grade 2x2, fundo preto puro #000000, com o MESMO desenho, MESMO tamanho, MESMA posição, MESMA coroa e MESMAS luas, mudando SÓ isto:
Em cima à esquerda: o Eclipse NORMAL com o OLHO FECHADO (pálpebra de sombra fechada, só uma linha fina de luz roxa).
Em cima à direita: o Eclipse ENFURECIDO com o OLHO FECHADO do mesmo jeito.
Embaixo à esquerda: o Eclipse NORMAL ATACANDO: o olho BEM ARREGALADO e brilhando muito, e a coroa com labaredas mais compridas (mas sem sair do quadro).
Embaixo à direita: o Eclipse ENFURECIDO ATACANDO, do mesmo jeito.
NÃO mude o formato nem o tamanho do disco. Nada saindo para fora do quadro.
Nome do arquivo: chefe_eclipse_animacao.png
```

---

## Chefe 5 · SINGULARIDADE (chefe da Fase 5, o último)

Um **buraco negro preso dentro de uma máquina alienígena**. No jogo ele **liga um campo** que puxa e engole os seus tiros, e solta **anéis de 14 orbes** em todas as direções. Para não repetir o olho do Eclipse, ele tem **três sensores** brilhando na armação, que apagam quando ele "pisca".

```
Chefe 5: SINGULARIDADE.
Um BURACO NEGRO aprisionado dentro de uma MÁQUINA ALIENÍGENA gigante, vista de CIMA, simétrica, com a frente apontando para BAIXO. No centro, uma ESFERA perfeitamente preta (o buraco negro) com um DISCO DE ACREÇÃO girando em volta dela: um anel achatado de luz azul-violeta e lilás (#4A2F7A, #7A5CFF, lilás claro e branco no brilho mais forte) em espiral. Segurando tudo, uma ARMAÇÃO de metal escuro alienígena (#141A3A, #3A4258) em forma de anel com QUATRO GARRAS curvas que prendem o buraco negro, cheia de runas tecnológicas violeta. Na parte de baixo da armação, TRÊS SENSORES redondos violeta brilhando, como três olhos em fila.
Em cima à esquerda, NORMAL: disco de acreção calmo e regular, sensores violeta acesos, garras fechadas.
Em cima à direita, ENFURECIDO: mesma forma e posição, mas a armação RACHADA, uma garra quebrada, o disco de acreção instável e torto em violeta e vermelho, raios saindo da esfera, sensores vermelhos.
Embaixo à esquerda, TIRO: um ORBE pequeno de energia violeta com um miolo preto e um redemoinho em volta, com rastro curto para cima.
Embaixo à direita, RETRATO: o buraco negro e os três sensores de frente e de perto, com o disco de acreção em volta, ocupando o quadro.
Nome do arquivo: chefe_singularidade.png
```

Depois que a folha acima ficar boa, mande no **mesmo chat** (anexando a folha que saiu) a folha de animação:

```
Use EXATAMENTE esta Singularidade da imagem. Faça a FOLHA DE ANIMAÇÃO dela, grade 2x2, fundo preto puro #000000, com o MESMO desenho, MESMO tamanho, MESMA posição, MESMA armação e MESMO disco, mudando SÓ isto:
Em cima à esquerda: a Singularidade NORMAL com os TRÊS SENSORES APAGADOS (escuros, sem brilho).
Em cima à direita: a Singularidade ENFURECIDA com os TRÊS SENSORES APAGADOS do mesmo jeito.
Embaixo à esquerda: a Singularidade NORMAL ATACANDO: as quatro garras um pouco mais ABERTAS e o disco de acreção BEM MAIS BRILHANTE, quase branco, com a esfera pulsando. Nada saindo para fora do quadro.
Embaixo à direita: a Singularidade ENFURECIDA ATACANDO, do mesmo jeito.
NÃO mude o formato nem o tamanho. Nada saindo para fora do quadro.
Nome do arquivo: chefe_singularidade_animacao.png
```

---

## Depois dos chefes

**Parte 6** (tiros, explosões e efeitos com o Pixel FX, feita aqui), **Parte 7** (HUD da batalha) e **Parte 8** (cartas, telas e menus).
