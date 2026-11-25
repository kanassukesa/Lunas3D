# Órbita Final em PIXEL ART · Parte 2: skins dos planetas

Continue no **mesmo chat do ChatGPT** da Parte 1 (o que já recebeu a Mensagem 0 com o manual do estilo). Assim o estilo fica igual.

São **5 skins**, e cada uma tem **2 imagens**: 10 imagens no total.
- **Mapa:** a superfície "aberta" do planeta, igual ao da Terra da Parte 1.
- **Atmosfera:** a camada que gira por cima, separada do mapa. Pode ser fumaça, neve, poeira ou esporos. No jogo ela gira numa velocidade diferente da superfície. A cor do brilho na borda do planeta (laranja na lava, azul-gelo no gelo...) eu faço no código.

Mande **um pedido por mensagem** e salve cada imagem com o nome indicado. No final, mande tudo num zip.

Se precisar, lembre o ChatGPT: *"mesmo estilo do manual, pixels quadrados nítidos, sem suavização"*.

---

## Antes de tudo (mande uma vez)

```
Agora vamos fazer as SKINS do planeta do jogador. Cada skin tem 2 imagens:
1) MAPA: igual ao planeta_mapa que você já fez. Mapa-múndi aberto (projeção equirretangular), 2:1, desenhado em 256x128 pixels e ampliado com pixels nítidos. Ocupa a imagem inteira, sem fundo preto e sem curvatura. A borda da ESQUERDA tem que continuar perfeitamente na borda da DIREITA.
2) ATMOSFERA: igual ao planeta_nuvens. Mesmo formato 2:1 em 256x128, só a camada de cima (fumaça, neve, poeira etc.) sobre FUNDO PRETO PURO #000000, cobrindo uns 25-35% da imagem. Bordas esquerda/direita também se continuam.
Mantenha o estilo do manual: contorno e sombreamento em 3-4 tons, paleta limitada, nada borrado.
Responda só "ok".
```

---

## 2A · Mundo de Lava

```
Pedido 2A-1: MAPA, Mundo de Lava.
Planeta vulcânico: crosta de rocha preta e cinza-escura (#141A3A, #3A4258) rachada em placas, com rios e lagos de lava brilhando entre as placas (#E0394B, #FF7A3C, #FFD04A no miolo mais quente). Alguns vulcões com crateras acesas. Sem oceano azul e sem polos de gelo.
Nome do arquivo: planeta_mapa_lava.png
```

```
Pedido 2A-2: ATMOSFERA, Mundo de Lava.
Nuvens de fumaça e cinzas vulcânicas, cinza-escuro e marrom-avermelhado (não brancas), em faixas grossas e algumas colunas saindo dos vulcões. Fundo preto puro #000000.
Nome do arquivo: planeta_nuvens_lava.png
```

---

## 2B · Mundo Congelado

```
Pedido 2B-1: MAPA, Mundo Congelado.
Planeta de gelo: quase todo coberto de neve e geleiras em branco e azul-gelo (#F4F8FF, #C9D2E6, #9FF0FF), com rachaduras azuis profundas (#2A6FD6) e alguns mares congelados azul-escuros (#1E2A5C) com placas de gelo boiando. Picos de montanhas com sombra azul. Clima frio e limpo.
Nome do arquivo: planeta_mapa_gelo.png
```

```
Pedido 2B-2: ATMOSFERA, Mundo Congelado.
Nevascas e nuvens de neve brancas com sombra azul clara, em redemoinhos e faixas finas e longas. Fundo preto puro #000000.
Nome do arquivo: planeta_nuvens_gelo.png
```

---

## 2C · Mundo Desértico

```
Pedido 2C-1: MAPA, Mundo Desértico.
Planeta de deserto: dunas e planaltos em areia, laranja e terracota (#E8D9A8, #FFC23D, #FF7A3C, #A86A00), cânions escuros serpenteando, algumas crateras e pouquíssimos oásis pequenos azul-esverdeados. Sem oceanos grandes.
Nome do arquivo: planeta_mapa_deserto.png
```

```
Pedido 2C-2: ATMOSFERA, Mundo Desértico.
Tempestades de areia e poeira em bege e laranja-claro (não brancas), faixas largas e onduladas, uma grande tempestade em espiral. Fundo preto puro #000000.
Nome do arquivo: planeta_nuvens_deserto.png
```

---

## 2D · Mundo Alienígena

```
Pedido 2D-1: MAPA, Mundo Alienígena.
Planeta alienígena estranho e bonito: continentes roxos e magenta (#4A2F7A, #D94FD0) com florestas bioluminescentes verde-limão (#7DFF6B), mares de líquido turquesa (#3FD0FF) e alguns cristais gigantes brilhando. Cores fortes mas organizadas, silhuetas claras.
Nome do arquivo: planeta_mapa_alien.png
```

```
Pedido 2D-2: ATMOSFERA, Mundo Alienígena.
Nuvens de esporos e névoa tóxica verde-limão e rosa-claro, em manchas e espirais, com alguns pontinhos brilhantes. Fundo preto puro #000000.
Nome do arquivo: planeta_nuvens_alien.png
```

---

## 2E · Lava Premium (a skin mais rara)

Essa é a skin especial (dourada/ELITE): precisa parecer **mais rica e caprichada** que a lava comum.

```
Pedido 2E-1: MAPA, Lava Premium.
Versão LENDÁRIA do mundo de lava: crosta de obsidiana preta-arroxeada polida (#05070F, #2D1F4F) em placas hexagonais, separadas por rios de lava DOURADA e branca-quente (#A86A00, #FFC23D, #FFE7A0), com alguns veios magenta (#D94FD0) e grandes lagos de ouro derretido. Deve parecer valioso e raro.
Nome do arquivo: planeta_mapa_premium_lava.png
```

```
Pedido 2E-2: ATMOSFERA, Lava Premium.
Fumaça escura arroxeada com faíscas e brasas douradas espalhadas (pixels amarelos e brancos), em faixas elegantes. Fundo preto puro #000000.
Nome do arquivo: planeta_nuvens_premium_lava.png
```

---

## O que vem depois

| Parte | Conteúdo |
|---|---|
| **3** | As 15 armas (torre completa + cabeça que gira de cada uma) |
| **4** | Inimigos comuns (14) |
| **5** | **Chefes**, um de cada vez e bem caprichados |
| **6** | Tiros, explosões e efeitos (feitos aqui com o Pixel FX) |
| **7** | HUD e botões da batalha |
| **8** | Cartas, telas e menus |
