# Órbita Final: TODAS as imagens que faltam (uma imagem por mensagem)

Este arquivo junta tudo o que ainda falta no jogo:
- **Lote 1:** 6 armas novas (24 imagens).
- **Lote 2:** 3 comandantes.
- **Lote 3:** 7 escudos.
- **Lote 4:** 2 peças novas, o emblema da pausa e o domo elétrico.

O resto da interface nova (molduras, botões e faixas) eu já fiz direto no jogo, então não precisa de imagem.

Abra um chat novo e mande a **Mensagem 0** uma vez. Depois, uma mensagem por imagem.
Se ele misturar coisas, abra outro chat e mande a Mensagem 0 de novo.

## Mensagem 0 (configuração)

```
Vou te pedir várias imagens para o meu jogo mobile "Órbita Final" (defesa planetária sci-fi), UMA POR MENSAGEM.
Regras para TODAS: gere exatamente UMA imagem por pedido, só com o que eu descrever. Nunca faça grade, colagem ou várias artes juntas.
Estilo fixo: arte digital de jogo mobile premium, 3D pintado semi-realista, polido, iluminação dramática, metal prateado e azul com luzes neon e detalhes dourados.
Sem texto, sem letras, sem números, sem logotipo, sem interface. Arte original.
Responda "ok" e espere o primeiro pedido.
```

---

## Lote 1: armas novas (6 armas × 4 imagens)

Para cada arma são 4 imagens. Os modelos de pedido estão logo abaixo:
- **sentinela_ID**: a torre inteira vista de cima.
- **cabeca_ID**: só a cabeça que gira.
- **carta_ID**: a carta da habilidade.
- **carta_evo_ID**: a carta da evolução, ou seja, o Supremo.

Modelos de pedido (troque o que está entre colchetes):

```
TORRE: Gere UMA imagem quadrada 1:1 em FUNDO PRETO PURO (#000000), liso: torre de defesa sci-fi vista DE CIMA (top-down), base hexagonal metálica prateada com luzes [COR], e a arma montada em cima APONTANDO PARA A DIREITA: [DESCRIÇÃO DA ARMA]. Objeto único, centralizado e inteiro, com margem. Nome do arquivo: sentinela_[ID].png
```
```
CABEÇA: Gere UMA imagem quadrada 1:1 em FUNDO PRETO PURO (#000000): SÓ a cabeça/canhão da mesma torre, vista DE CIMA (top-down), sem a base, APONTANDO PARA A DIREITA: [DESCRIÇÃO DA ARMA]. Luzes [COR]. Objeto único, centralizado e inteiro. Nome do arquivo: cabeca_[ID].png
```
```
CARTA: Gere UMA imagem paisagem 3:2: cena de ação no espaço, a torre [NOME] em cima de um planeta azul, [EFEITO EM AÇÃO] atingindo naves alienígenas, luzes [COR]. Nome do arquivo: carta_[ID].png
```
```
SUPREMO: Gere UMA imagem paisagem 3:2: a versão SUPREMA e dourada da torre [NOME] em cima de um planeta, [EFEITO SUPREMO], moldura dourada ornamentada nas bordas, brilho épico. Nome do arquivo: carta_evo_[ID].png
```

| ID | Nome | Cor | Arma (torre e cabeça) | Efeito na carta | Efeito no Supremo |
|---|---|---|---|---|---|
| fornalha | Fornalha Solar | laranja e vermelho | bocal largo de lança-chamas com tanques de combustível incandescentes | um jato de fogo em cone | um tornado de fogo solar girando em volta do planeta |
| serra | Serra Orbital | ciano | disco-serra de energia com 3 lâminas giratórias | lâminas de energia girando em órbita e cortando inimigos | um anel com 6 serras gigantes em volta do planeta |
| plasma | Canhão de Plasma | verde-ácido | canhão grosso com câmara de plasma verde brilhante | uma esfera enorme de plasma verde atravessando uma fileira de naves | um sol de plasma verde que explode em ondas |
| nano | Nuvem Nano | prata e magenta | emissor de colmeia com pequenos nanorrobôs saindo | uma nuvem de nanorrobôs prateados corroendo naves | uma tempestade de nanorrobôs cobrindo metade do céu |
| espelho | Espelho Prismático | branco e arco-íris | prisma de cristal facetado sobre um suporte | tiros inimigos refletindo no prisma e voltando como raios coloridos | um escudo de cristal gigante refletindo raios arco-íris para todos os lados |
| portal | Portal de Dobra | roxo e azul elétrico | anel de portal com núcleo de energia espiral | inimigos sendo sugados por um portal e jogados para longe | vários portais abertos no céu engolindo uma frota inteira |

---

## Lote 2: três comandantes novos (avatar quadrado 1:1)

Cada um vai carregar uma ultimate. Busto de frente, olhando para a câmera, armadura sci-fi, fundo escuro com um brilho na cor dele.

```
Gere UMA imagem quadrada 1:1: retrato (busto, de frente) de uma comandante espacial com armadura azul-gelo e branca, cristais de gelo nos ombros, respiração gelada, olhos azul-claros. Fundo escuro com neve cósmica azul. Nome do arquivo: avatar_10.png
```
```
Gere UMA imagem quadrada 1:1: retrato (busto, de frente) de um comandante espacial veterano com armadura verde-musgo e preta, cicatriz no rosto, visor tático vermelho levantado, vários drones pequenos flutuando atrás dele. Nome do arquivo: avatar_11.png
```
```
Gere UMA imagem quadrada 1:1: retrato (busto, de frente) de uma comandante espacial jovem com armadura laranja e grafite, cabelo curto raspado na lateral, braço mecânico com mísseis, expressão determinada. Fundo escuro com rastros de mísseis. Nome do arquivo: avatar_12.png
```

---

## Lote 3: skins de escudo (7 imagens)

O escudo do jogo é uma **bolha de energia hexagonal em volta do planeta**. Precisa ser um **círculo visto de frente, com o centro vazio e escuro**, em **fundo preto puro**. Só a casca de energia brilha. O jogo usa o preto como transparente.

Modelo:
```
Gere UMA imagem quadrada 1:1 em FUNDO PRETO PURO (#000000): uma bolha/esfera de escudo de energia vista de frente, perfeitamente circular e centralizada, formada por [PADRÃO], brilho neon [COR] mais forte nas bordas, centro escuro e transparente (só a casca brilha). Sem planeta dentro. Nome do arquivo: escudo_[ID].png
```

| ID | Nome | Padrão | Cor |
|---|---|---|---|
| verde | Escudo Esmeralda | hexágonos com pequenas folhas de cristal | verde-esmeralda |
| vermelho | Escudo Rubi | hexágonos facetados como joia | vermelho-rubi |
| roxo | Escudo Nebulosa | hexágonos com nebulosa roxa fluindo por dentro | roxo e rosa |
| dourado | Escudo Solar | placas douradas com raios de sol | dourado e laranja |
| aurora | Escudo Aurora | faixas onduladas de aurora boreal | verde-água, azul e rosa |
| premium | Escudo Cobalto | grade de circuitos azul-cobalto | azul-cobalto e branco |
| supernova | Escudo Supernova | explosão estelar com rachaduras de energia | laranja, branco e magenta |

---

---

## Lote 4: peças novas desta versão

**Emblema da pausa** (fica no topo da janela PAUSADO):
```
Gere UMA imagem paisagem 2:1 em FUNDO PRETO PURO (#000000): emblema de jogo com um pequeno planeta Terra azul e verde brilhante no centro, cercado por uma coroa de louros dourada e duas asas douradas metálicas abertas para os lados, ornamento sci-fi com detalhes neon ciano. Objeto único, centralizado e inteiro. Nome do arquivo: emblema_pausa.png
```

**Domo elétrico** (a cúpula que fica em volta do planeta quando você tem o Domo Elétrico):
```
Gere UMA imagem quadrada 1:1 em FUNDO PRETO PURO (#000000): uma cúpula/bolha de energia elétrica vista de frente, perfeitamente circular e centralizada, feita de uma malha hexagonal VERDE-NEON com pequenos raios elétricos correndo pela superfície, brilho mais forte nas bordas, centro escuro e transparente (só a casca brilha). Sem planeta dentro. Nome do arquivo: domo_eletrico.png
```

---

**Total:** 24 + 3 + 7 + 2 = **36 imagens**. Pode me mandar por lotes ou tudo num ZIP. Cada nome de arquivo acima já tem lugar certo no jogo, e as imagens entram assim que chegarem.
