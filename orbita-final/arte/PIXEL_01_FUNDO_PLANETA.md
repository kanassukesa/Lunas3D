# Órbita Final em PIXEL ART · Parte 1: fundos e planeta

Estilo escolhido: **Estilo 4, pixel art moderno (16-bit HD)**.
Vamos refazer o jogo **por partes**. Esta é a Parte 1. Quando terminar, me mande as 5 imagens (pode ser zip). Eu limpo o pixel art (grade de pixels certinha e só as cores da paleta), confiro e coloco no jogo, e aí mando a Parte 2.

**Como usar no ChatGPT:**
1. Abra um chat NOVO só para o pixel art e mande a **Mensagem 0** (o "manual do estilo"). Use esse mesmo chat para todas as partes, assim o estilo fica igual em tudo.
2. Mande **um pedido por mensagem**, na ordem.
3. Se uma imagem sair borrada, com pixels tortos ou com fundo que não é preto puro, peça: *"refaça com pixels quadrados nítidos, sem suavização, fundo #000000"*.
4. Salve cada imagem com o **nome de arquivo** indicado. O nome é o que faz ela entrar no lugar certo do jogo.

---

## Mensagem 0 · Manual do estilo (mande uma vez, no começo)

```
Vou te pedir as imagens do meu jogo mobile "Órbita Final" (defesa planetária no espaço, celular em pé), UMA POR MENSAGEM.
Todas no MESMO estilo, que é este manual:

ESTILO: pixel art moderno 16-bit HD, como os melhores jogos indie atuais.
- Pixels quadrados, NÍTIDOS, todos do mesmo tamanho. Desenhe em baixa resolução e amplie sem suavização (nearest neighbor). Nada de anti-aliasing, desfoque, gradiente liso ou textura de pintura.
- Contorno escuro de 1 pixel nos objetos (azul-marinho bem escuro, não preto puro).
- Luz sempre vindo de CIMA À ESQUERDA. Sombreamento com 3 a 4 tons por cor; pouquíssimo dithering.
- Brilhos (tiros, energia, luzes) feitos com pixels claros e um halo de 1-2 pixels, sem "glow" borrado.
- Visual limpo: silhuetas fáceis de ler, poucos detalhes por área, nada de poluição.

PALETA (use estas cores como base):
- Espaço: #05070F #0B0E1F #141A3A #1E2A5C #2D1F4F #4A2F7A
- Jogador / energia: #2A6FD6 #3FD0FF #9FF0FF #F4F8FF
- Metal: #3A4258 #5B6582 #8F9BB8 #C9D2E6
- Natureza: #1F6B3A #4CD96A #2B4FB8 (oceano) #E8D9A8 (areia)
- Inimigos: #E0394B #FF7A3C #FFD04A #D94FD0 #7DFF6B
- Ouro (raro / ELITE): #A86A00 #FFC23D #FFE7A0

REGRAS TÉCNICAS:
- Objetos soltos (planeta, torres, inimigos, chefes, efeitos) em FUNDO PRETO PURO #000000, liso, sem sombra no chão, sem moldura, objeto inteiro e centralizado com margem.
- Sem texto, sem letras, sem números, sem logotipo, sem marca d'água (a não ser que eu peça).
- Uma imagem por pedido, nunca grade nem colagem.
- Arte original.
Responda só "ok" e espere o primeiro pedido.
```

---

## 1A · Fundos da batalha (3 imagens)

O fundo fica atrás de tudo, então precisa ser **calmo e escuro**, para as torres e os inimigos aparecerem bem. Escuro no meio, detalhes só nas bordas.

```
Pedido 1A-1: FUNDO DA BATALHA, setor azul.
Imagem vertical 9:16, desenhada em 180x320 pixels e ampliada (pixels nítidos). É o fundo do espaço atrás do jogo.
Quase todo azul-marinho bem escuro (#05070F a #141A3A), com estrelas pequenas de 1 pixel espalhadas (algumas de 2x2 piscando), uma nebulosa azul bem suave só no canto de cima à direita e uma lua pequena e distante no canto de baixo à esquerda.
O CENTRO precisa ficar vazio e escuro (é onde acontece a batalha). Baixo contraste, nada chamativo.
Nome do arquivo: fundo_1.png
```

```
Pedido 1A-2: FUNDO DA BATALHA, setor roxo.
Mesma composição e mesmas regras do fundo_1, mas com tons roxos (#141A3A, #2D1F4F, #4A2F7A): nebulosa roxa e rosa suave no canto de cima à esquerda, um anel de asteroides bem distante e fininho atravessando o canto de baixo. Centro vazio e escuro.
Nome do arquivo: fundo_2.png
```

```
Pedido 1A-3: FUNDO DA BATALHA, fronteira vermelha (setor 2).
Mesma composição e regras, mas com clima mais perigoso: céu escuro com toque vermelho-escuro, uma nebulosa laranja e vermelha apagada no topo, poucas estrelas e um planeta gigante em chamas bem distante, cortado na borda direita. Centro vazio e escuro.
Nome do arquivo: fundo_3.png
```

---

## 1B · Planeta do jogador (2 imagens)

No jogo o planeta é uma **bola 3D que gira**. Para isso, o jogo precisa do **mapa "aberto"** do planeta (igual a um mapa-múndi), que ele embrulha na esfera. Por isso o pedido é diferente.

```
Pedido 1B-1: MAPA DA SUPERFÍCIE DO PLANETA (para embrulhar numa esfera).
Imagem retangular 2:1 (deitada), desenhada em 256x128 pixels e ampliada (pixels nítidos). É um mapa-múndi plano (projeção equirretangular) de um planeta tipo a Terra, visto todo aberto, SEM curvatura e SEM fundo preto (o mapa ocupa a imagem inteira).
Oceanos em azul (#1E2A5C, #2B4FB8, #3FD0FF nas praias), continentes verdes com montanhas marrons e alguns desertos de areia, calotas polares brancas no topo e embaixo.
IMPORTANTE: a borda da ESQUERDA tem que continuar perfeitamente na borda da DIREITA (o mapa dá a volta no planeta).
Nome do arquivo: planeta_mapa.png
```

```
Pedido 1B-2: NUVENS DO PLANETA.
Imagem retangular 2:1 (deitada), 256x128 pixels ampliada. Mesmo formato de mapa-múndi do pedido anterior, mas só com NUVENS brancas em pixel art (faixas e redemoinhos, cobrindo uns 30% da imagem) sobre FUNDO PRETO PURO #000000.
A borda da esquerda continua na da direita.
Nome do arquivo: planeta_nuvens.png
```

---

## Escudo do planeta

Não precisa pedir: o escudo vai ser **feito em código, já em pixel art e animado** (o anel e os hexágonos brilham e reagem quando o planeta toma dano).

---

## O que vem depois (para você já saber)

| Parte | Conteúdo |
|---|---|
| **2** | Skins dos planetas (lava, gelo, deserto, alienígena, lava premium) |
| **3** | As 15 armas (torre completa + cabeça que gira de cada uma) |
| **4** | Inimigos comuns (14) |
| **5** | **Chefes**, um de cada vez e bem caprichados: o chefe, a versão "enfurecida" abaixo de 50% de vida, os tiros dele e o retrato para o alerta de chegada |
| **6** | Tiros, explosões e efeitos: **feitos aqui com o Pixel FX** (nada para pedir ao ChatGPT) |
| **7** | HUD e botões da batalha |
| **8** | Cartas, telas (subir de nível, pausa, vitória) e menus |
