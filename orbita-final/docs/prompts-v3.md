# Prompts v3 para o ChatGPT — por lote

Use o ChatGPT normal (não o Codex). Uma conversa NOVA por lote. Um pedido por mensagem.

## Mensagem de estilo (início de cada conversa de sprites)

```
Você vai criar a arte do meu jogo mobile ÓRBITA FINAL (tower defense espacial: um planeta azul com escudo hexagonal, cercado por torres orbitais que atiram sozinhas em naves alienígenas). Arte 100% ORIGINAL.

ESTILO (vale para tudo nesta conversa):
- Pintura digital de jogo mobile premium: formas grossas e chanfradas, contorno escuro fino, luz de recorte branca nas quinas, luz principal vinda de CIMA À ESQUERDA, sombras internas profundas.
- Energia em neon com brilho forte, UMA cor principal por objeto.
- Silhueta simples e reconhecível em 40 pixels.

REGRAS:
1. Uma imagem por resposta. Nunca faça folha, grade, colagem ou prévia com vários itens.
2. Nada de texto, número, nome ou marca d'água na imagem.
3. Sprites: fundo PRETO LISO (#000000), sem xadrez, sem chão, objeto centralizado ocupando ~80%, quadrado 1024×1024, vista de CIMA (câmera olhando reto para baixo), apontando para a DIREITA.
4. Cada pedido é um objeto DIFERENTE: nunca reaproveite o desenho anterior mudando só a cor. Siga a forma descrita em cada pedido.
5. Depois de cada imagem, escreva só o nome do arquivo e espere o próximo pedido.

Responda apenas "ok" e espere o primeiro pedido.
```

## 1. Planeta 3D (o jogo enrola o mapa numa esfera e gira)

Este lote NÃO usa a mensagem de estilo de sprite. Abra uma conversa nova e mande direto os dois pedidos.

**planeta_mapa.jpg**
```
Crie uma textura de mapa de planeta em projeção EQUIRRETANGULAR (como um mapa-múndi aberto), formato paisagem 1536×1024, imagem cheia sem bordas. Planeta tipo Terra porém ORIGINAL (continentes inventados, nada de continentes reais): oceanos azul-profundo com áreas rasas turquesa perto da costa, 4 a 6 continentes de formatos variados com florestas verdes, desertos areia, montanhas marrons com neve no topo e calotas de gelo brancas no topo e na base do mapa. SEM nuvens, SEM sombra, SEM iluminação (luz chapada, igual a um mapa). A borda esquerda deve continuar exatamente na borda direita (textura sem emenda). Visual pintado e saturado de jogo, não foto de satélite. Arquivo: planeta_mapa.jpg
```

**planeta_nuvens.jpg**
```
Agora crie a camada de NUVENS do mesmo planeta, também em projeção equirretangular 1536×1024: nuvens BRANCAS sobre fundo PRETO puro, com faixas e redemoinhos (um ciclone grande em espiral, outros menores), mais nuvens perto do equador e dos polos, uns 35% da área coberta. Sem continentes, só as nuvens brancas no preto. Borda esquerda continua na direita (sem emenda). Arquivo: planeta_nuvens.jpg
```

## 2. Torres em 2 partes (base parada + cabeça que gira para mirar)

Conversa nova: mande a mensagem de estilo e depois estes pedidos, um por vez.

**torre_base.png**
```
Base de torre orbital vista de cima: plataforma HEXAGONAL de metal branco-acinzentado e aço azul-escuro, listras de aviso amarelas e pretas em dois lados, 6 luzes brancas nas quinas, um soquete circular vazio e escuro no centro (onde vai encaixar a cabeça da torre). Sem canhão, só a base. Simétrica. Arquivo: torre_base.png
```

**cabeca_canhao.png**
```
SÓ a cabeça giratória de uma torre (sem base), vista de cima, apontando para a direita: corpo oval compacto de metal branco com um único cano grosso e curto, bobinas de energia LARANJA (#ff9a3c) brilhando no cano. Forma: ovo achatado + cano reto. Arquivo: cabeca_canhao.png
```

**cabeca_laser.png**
```
SÓ a cabeça giratória de uma torre (sem base), vista de cima, apontando para a direita: núcleo de cristal VERMELHO em forma de losango (#ff4d6d) dentro de uma carcaça em formato de 'C', com um emissor fino e longo de lente na frente. Forma: anel aberto + agulha. Arquivo: cabeca_laser.png
```

**cabeca_trilho.png**
```
SÓ a cabeça giratória de uma torre (sem base), vista de cima, apontando para a direita: dois trilhos magnéticos LONGOS e paralelos (o mais comprido de todas as torres) com raios elétricos CIANO-CLARO (#b8f2ff) entre eles, blocos de capacitor atrás. Forma: garfo de dois dentes compridos. Arquivo: cabeca_trilho.png
```

**cabeca_prisma.png**
```
SÓ a cabeça giratória de uma torre (sem base), vista de cima: um PRISMA TRIANGULAR de cristal ÁGUA-MARINHA (#7df9ff) flutuando, preso por três garras finas de metal, com uma ponta do triângulo virada para a direita. Forma: triângulo de cristal. Arquivo: cabeca_prisma.png
```

**cabeca_missil.png**
```
SÓ a cabeça giratória de uma torre (sem base), vista de cima, apontando para a direita: casulo lançador quadrado e robusto com 6 bocas de míssil (2 fileiras de 3) e pontas de míssil vermelhas aparecendo, luzes AMARELAS (#ffd25e). Forma: caixa quadrada com furos. Arquivo: cabeca_missil.png
```

**cabeca_gravidade.png**
```
SÓ a cabeça giratória de uma torre (sem base), vista de cima: anel metálico grosso com uma minúscula ESFERA DE BURACO NEGRO no centro, disco de luz VIOLETA (#a66bff) girando em volta e pedrinhas orbitando. Forma: rosquinha com bola preta no meio. Arquivo: cabeca_gravidade.png
```

**cabeca_domo.png**
```
SÓ a cabeça de uma torre (sem base), vista de cima: CÚPULA de vidro redonda com uma bobina tesla dentro soltando raios VERDES (#5effa8) para quatro pinos de cobre ao redor. Forma: círculo de vidro com 4 pontas. Arquivo: cabeca_domo.png
```

**cabeca_colmeia.png**
```
SÓ a cabeça de uma torre (sem base), vista de cima: hangar com TRÊS baias hexagonais lado a lado em triângulo, cada uma com um mini drone em forma de seta com luz VERDE-LIMÃO (#9dff5e). Forma: trevo de 3 hexágonos. Arquivo: cabeca_colmeia.png
```

**cabeca_gelo.png**
```
SÓ a cabeça giratória de uma torre (sem base), vista de cima, apontando para a direita: canhão criogênico com bocal LARGO em forma de funil, cristais de gelo AZUL-CLARO (#9fe8ff) crescendo nas laterais e névoa fria saindo. Forma: funil + cristais. Arquivo: cabeca_gelo.png
```

## 3. Inimigos (cada um de uma 'família' diferente)

Conversa nova: mensagem de estilo + estes pedidos. Inimigos são ALIENÍGENAS: casco orgânico tipo carapaça com veias brilhantes, bem diferentes das torres de metal.

**inimigo_batedor.png**
```
Inimigo pequeno e rápido, vista de cima, apontando para a direita: forma de DARDO / libélula — corpo fino e comprido com duas asas estreitas puxadas para trás. Carapaça vermelho-escura, veias e motor LARANJA (#ff6b4a). Arquivo: inimigo_batedor.png
```

**inimigo_tanque.png**
```
Inimigo grande e lento, vista de cima, apontando para a direita: forma de BESOURO / tartaruga blindada — corpo largo e arredondado coberto de placas hexagonais grossas, patas curtas recolhidas. Casco ROXO metálico (#9b7bff) com frestas violeta brilhando. Arquivo: inimigo_tanque.png
```

**inimigo_enxame.png**
```
Inimigo minúsculo, vista de cima, apontando para a direita: VESPA alienígena de corpo em losango com listras, quatro asas translúcidas AMARELAS (#ffd04a) brilhando. Arquivo: inimigo_enxame.png
```

**inimigo_atirador.png**
```
Inimigo de artilharia, vista de cima, apontando para a direita: forma de TUBARÃO-MARTELO — cabeça larga em T com um canhão orgânico longo saindo do meio, corpo curto. Carapaça grafite com veias e boca do canhão ROSA-CHOQUE (#ff4fa3). Arquivo: inimigo_atirador.png
```

**inimigo_kamikaze.png**
```
Inimigo suicida, vista de cima, apontando para a direita: forma de LANÇA / cometa — ponta afiada enorme na frente, corpo que afina para trás, núcleo de plasma CIANO (#4fffe0) vazando faíscas e um rastro de energia atrás. Arquivo: inimigo_kamikaze.png
```

**inimigo_divisor.png**
```
Inimigo biológico, vista de cima: CÉLULA / ameba redonda e gelatinosa, membrana VERDE translúcida (#7dff6b) com três núcleos brilhantes dentro e pequenos cílios na borda. Nada de metal. Arquivo: inimigo_divisor.png
```

**inimigo_mitose_mini.png**
```
Inimigo biológico pequeno, vista de cima: uma GOTA de célula verde-clara (#b5ff9e) com um único núcleo brilhante e borda gelatinosa. Arquivo: inimigo_mitose_mini.png
```

**inimigo_escudeiro.png**
```
Inimigo de suporte, vista de cima, apontando para a direita: forma de ARRAIA (manta) com asas largas e lisas, um disco projetor no dorso emitindo uma bolha de escudo hexagonal AZUL (#5ec8ff) translúcida em volta do corpo. Arquivo: inimigo_escudeiro.png
```

**inimigo_meteoro.png**
```
Meteoro em chamas, vista de cima, indo para a direita: rocha escura irregular e rachada com veios de lava LARANJA (#ff8a3c) e uma cauda de fogo saindo para a esquerda. Arquivo: inimigo_meteoro.png
```

**inimigo_muro.png**
```
Barreira alienígena, vista de cima: placa blindada LARGA e baixa (bem mais larga que alta), azul-aço (#8fa3c4), com uma fenda de energia ciano no meio e dois emissores nas pontas. Formato paisagem 1536×1024. Arquivo: inimigo_muro.png
```

## 4. Chefes (grandes, cada um com um formato único)

Conversa nova: mensagem de estilo + estes pedidos. Chefes são vistos de cima, APONTANDO PARA BAIXO (vão descer em direção ao planeta), ocupando o quadro todo.

**chefe_colosso_igneo.png**
```
Chefe: PLANETA-MONSTRO de lava visto de cima — esfera de rocha negra rachada com rios de magma laranja, erupções solares saindo da borda e um grande olho de fogo no centro. Redondo. Arquivo: chefe_colosso_igneo.png
```

**chefe_rainha_colmeia.png**
```
Chefe: NAVE-MÃE RAINHA inseto, vista de cima, apontando para baixo — abdômen gigante em favo de mel DOURADO (#ffd04a), cabeça de vespa com mandíbulas, dezenas de escotilhas hexagonais brilhando de onde saem drones. Arquivo: chefe_rainha_colmeia.png
```

**chefe_construtor_muros.png**
```
Chefe: FORTALEZA OCTOGONAL de construção, vista de cima, apontando para baixo — corpo de aço azul com quatro BRAÇOS-GUINDASTE segurando placas de barreira e um núcleo CIANO pulsando no centro. Arquivo: chefe_construtor_muros.png
```

**chefe_eclipse.png**
```
Chefe: ECLIPSE VIVO visto de cima — esfera negra perfeita com uma coroa de fogo VIOLETA (#c28bff) em volta, dois anéis finos de energia cruzados e um olho branco estreito no centro. Arquivo: chefe_eclipse.png
```

**chefe_singularidade.png**
```
Chefe: BURACO NEGRO VIVO visto de cima — centro preto absoluto, disco de acreção VIOLETA (#7a5cff) em espiral com distorção de lente, três anéis metálicos inclinados orbitando com garras. Arquivo: chefe_singularidade.png
```

## 5. Projéteis e efeitos

Conversa nova: mensagem de estilo + estes pedidos (todos apontando para a DIREITA).

**missil.png**
```
Míssil guiado visto de cima, apontando para a direita: corpo cilíndrico BRANCO com uma faixa vermelha, ponta vermelho-laranja, 4 aletas cinza na traseira, bocal escuro na esquerda, SEM chama. Formato paisagem 1536×1024, míssil ocupando a largura. Arquivo: missil.png
```

**missil_chama.png**
```
Só a CHAMA de motor de foguete, apontando para a ESQUERDA: núcleo branco quente, depois amarelo, laranja e ponta translúcida. Formato paisagem 1536×1024. Arquivo: missil_chama.png
```

**bala_pulso.png**
```
Projétil de plasma em GOTA alongada apontando para a direita, núcleo branco e brilho LARANJA. Formato paisagem 1536×1024. Arquivo: bala_pulso.png
```

**trilho.png**
```
Rastro de RAILGUN: feixe muito longo e fino CIANO-CLARO com cabeça branca brilhante na direita e faíscas elétricas. Formato paisagem 1536×1024. Arquivo: trilho.png
```

**gelo_tiro.png**
```
ESTILHAÇO DE GELO afiado azul-claro apontando para a direita, com névoa fria atrás. Formato paisagem 1536×1024. Arquivo: gelo_tiro.png
```

**drone.png**
```
MINI DRONE de combate em forma de seta, visto de cima, apontando para a direita, dois propulsores VERDE-LIMÃO atrás. Arquivo: drone.png
```

**tiro_inimigo.png**
```
BOLA DE PLASMA alienígena vermelho-laranja com centro branco e anel de energia em volta. Arquivo: tiro_inimigo.png
```

**explosao_sheet.png**
```
Animação de EXPLOSÃO em 8 quadros, grade 4 colunas × 2 linhas, quadros do mesmo tamanho e bem separados: 1 flash branco, 2-4 bola de fogo laranja crescendo, 5-6 fogo se abrindo em fumaça, 7-8 fumaça escura sumindo. (Única imagem com vários quadros.) Arquivo: explosao_sheet.png
```

**vortice.png**
```
VÓRTICE gravitacional visto de cima: espiral de luz violeta em volta de um centro preto absoluto, bordas se dissolvendo. Arquivo: vortice.png
```

## 6a. Cartas: sentinelas e evoluções

Conversa nova SEM a mensagem de estilo de sprite. Mande primeiro: "Vou pedir ilustrações de cartas de habilidade para um jogo espacial. Regras: formato paisagem 1536×1024, imagem cheia, pintura digital cinematográfica de jogo mobile premium, luz neon forte, a borda curva de um planeta azul no canto inferior esquerdo, assunto principal grande no centro-direita, SEM texto e SEM moldura (exceto quando eu pedir moldura dourada). Cada carta tem composição, ângulo e cor DIFERENTES da anterior. Responda ok."

**carta_canhao.jpg**
```
Carta: uma torre orbital de canhão disparando uma rajada de projéteis de plasma LARANJA em um caça alienígena vermelho que explode. Ângulo de baixo para cima. Arquivo: carta_canhao.jpg
```

**carta_laser.jpg**
```
Carta: uma torre orbital cortando um cruzador alienígena roxo AO MEIO com um feixe de laser VERMELHO grosso, faíscas no corte. Ângulo lateral. Arquivo: carta_laser.jpg
```

**carta_trilho.jpg**
```
Carta: tiro de railgun CIANO atravessando uma fila de três naves alienígenas em linha reta, anéis de choque em volta do tiro. Ângulo em diagonal. Arquivo: carta_trilho.jpg
```

**carta_feixe.jpg**
```
Carta: prisma de cristal ÁGUA-MARINHA disparando um raio que salta em zigue-zague entre quatro drones alienígenas. Arquivo: carta_feixe.jpg
```

**carta_missil.jpg**
```
Carta: salva de quatro mísseis brancos subindo em diagonal com RASTROS longos e brilhantes de fumaça clara. Arquivo: carta_missil.jpg
```

**carta_gravidade.jpg**
```
Carta: poço gravitacional VIOLETA sugando naves alienígenas em espiral para um centro preto. Arquivo: carta_gravidade.jpg
```

**carta_campo.jpg**
```
Carta: cúpula elétrica VERDE sobre o planeta com raios atingindo naves que se aproximam. Arquivo: carta_campo.jpg
```

**carta_drone.jpg**
```
Carta: esquadrão de cinco drones VERDE-LIMÃO em formação perseguindo um caça alienígena vermelho. Arquivo: carta_drone.jpg
```

**carta_gelo.jpg**
```
Carta: cristal de gelo gigante AZUL-CLARO congelando duas naves alienígenas, geada se espalhando. Arquivo: carta_gelo.jpg
```

**carta_evo_canhao.jpg**
```
Carta de EVOLUÇÃO com moldura DOURADA ornamentada e partículas douradas: canhão dourado cujos tiros explodem em pequenas supernovas. Arquivo: carta_evo_canhao.jpg
```

**carta_evo_laser.jpg**
```
Carta de EVOLUÇÃO com moldura dourada: TRÊS lasers vermelhos em leque saindo de uma torre dourada. Arquivo: carta_evo_laser.jpg
```

**carta_evo_trilho.jpg**
```
Carta de EVOLUÇÃO com moldura dourada: três trilhos solares gigantes em chamas brancas e douradas atravessando o espaço. Arquivo: carta_evo_trilho.jpg
```

**carta_evo_feixe.jpg**
```
Carta de EVOLUÇÃO com moldura dourada: uma TEIA de raios água-marinha ligando dezenas de inimigos ao mesmo tempo. Arquivo: carta_evo_feixe.jpg
```

**carta_evo_missil.jpg**
```
Carta de EVOLUÇÃO com moldura dourada: CHUVA de mísseis caindo do alto como estrelas cadentes. Arquivo: carta_evo_missil.jpg
```

**carta_evo_gravidade.jpg**
```
Carta de EVOLUÇÃO com moldura dourada: BURACO NEGRO enorme devorando uma frota inteira. Arquivo: carta_evo_gravidade.jpg
```

**carta_evo_campo.jpg**
```
Carta de EVOLUÇÃO com moldura dourada: TEMPESTADE de raios verdes caindo por todo o espaço. Arquivo: carta_evo_campo.jpg
```

**carta_evo_drone.jpg**
```
Carta de EVOLUÇÃO com moldura dourada: colmeia rainha soltando um ENXAME gigante de drones brilhantes. Arquivo: carta_evo_drone.jpg
```

**carta_evo_gelo.jpg**
```
Carta de EVOLUÇÃO com moldura dourada: ONDA de gelo congelando uma frota inteira de naves. Arquivo: carta_evo_gelo.jpg
```

## 6b. Cartas: melhorias

Continue na mesma conversa das cartas (ou abra outra e repita a mensagem de regras das cartas).

**carta_dano.jpg**
```
Carta: explosão estelar LARANJA de energia pura irradiando raios em todas as direções. Arquivo: carta_dano.jpg
```

**carta_cadencia.jpg**
```
Carta: dezenas de projéteis AMARELOS paralelos disparando em altíssima velocidade. Arquivo: carta_cadencia.jpg
```

**carta_crit.jpg**
```
Carta: mira holográfica VERMELHA travada numa nave alienígena, com um impacto crítico brilhante. Arquivo: carta_crit.jpg
```

**carta_radar.jpg**
```
Carta: ondas de radar CIANO saindo do planeta e marcando naves distantes com pontos vermelhos. Arquivo: carta_radar.jpg
```

**carta_velocidade.jpg**
```
Carta: projéteis CIANO com rastros de velocidade bem esticados, sensação de movimento. Arquivo: carta_velocidade.jpg
```

**carta_area.jpg**
```
Carta: anel de onda de choque LARANJA enorme se expandindo e empurrando naves. Arquivo: carta_area.jpg
```

**carta_dados.jpg**
```
Carta: chip de dados ROXO holográfico flutuando com circuitos brilhando. Arquivo: carta_dados.jpg
```

**carta_vidro.jpg**
```
Carta: canhão feito de CRISTAL rachado brilhando com energia branca perigosa. Arquivo: carta_vidro.jpg
```

**carta_hp.jpg**
```
Carta: planeta envolto em aura VERDE de vida com um coração de energia na frente. Arquivo: carta_hp.jpg
```

**carta_cura.jpg**
```
Carta: nanorrobôs VERDES consertando a superfície do planeta, faíscas de reparo. Arquivo: carta_cura.jpg
```

**carta_escudo.jpg**
```
Carta: bolha de escudo hexagonal CIANO desviando tiros inimigos vermelhos. Arquivo: carta_escudo.jpg
```

**carta_armadura.jpg**
```
Carta: placas de ARMADURA metálica grossas se fechando em volta do planeta. Arquivo: carta_armadura.jpg
```

**carta_espinhos.jpg**
```
Carta: escudo refletindo ESPINHOS de energia azul de volta nos inimigos. Arquivo: carta_espinhos.jpg
```

**carta_estilhaco.jpg**
```
Carta: projétil acertando uma nave e se partindo em TRÊS estilhaços brilhantes. Arquivo: carta_estilhaco.jpg
```

**carta_ricochete.jpg**
```
Carta: projétil CIANO ricocheteando em zigue-zague entre três naves. Arquivo: carta_ricochete.jpg
```

**carta_queima.jpg**
```
Carta: naves alienígenas envoltas em FOGO de plasma laranja. Arquivo: carta_queima.jpg
```

**carta_veneno.jpg**
```
Carta: nuvem de nanovírus VERDE tóxico corroendo uma nave alienígena. Arquivo: carta_veneno.jpg
```

**carta_explosao.jpg**
```
Carta: reação em CADEIA, várias naves explodindo uma após a outra. Arquivo: carta_explosao.jpg
```

**carta_perfurante.jpg**
```
Carta: projétil de tungstênio FURANDO duas placas blindadas em sequência. Arquivo: carta_perfurante.jpg
```

**carta_executor.jpg**
```
Carta: golpe em X VERMELHO finalizando uma nave alienígena danificada. Arquivo: carta_executor.jpg
```

**carta_ultimate.jpg**
```
Carta: RAIO DOURADO gigante carregado de energia saindo do planeta. Arquivo: carta_ultimate.jpg
```

**carta_passiva.jpg**
```
Carta: GEMA de cristal flutuando e irradiando poder em várias cores. Arquivo: carta_passiva.jpg
```

## 7. Fundos e interface

Conversa nova: mensagem de estilo + estes pedidos.

**fundo_1.jpg**
```
Fundo de espaço em RETRATO 1024×1536, imagem cheia, sem planetas e sem naves, pouco contraste: azul-marinho quase preto, nebulosa azul-petróleo e roxa suave, poeira estelar fina. Arquivo: fundo_1.jpg
```

**fundo_2.jpg**
```
Fundo de espaço em RETRATO 1024×1536, imagem cheia, sem planetas: azul escuro, nebulosa laranja e vermelha fraca perto do topo, aglomerado de estrelas distante. Arquivo: fundo_2.jpg
```

**fundo_3.jpg**
```
Fundo de espaço em RETRATO 1024×1536, imagem cheia, sem planetas: quase preto, faixa de galáxia violeta e ciano na diagonal, poucas estrelas. Arquivo: fundo_3.jpg
```

**icone_app.png**
```
Ícone de app QUADRADO com fundo cheio (não preto): planeta azul com escudo hexagonal e três torres em órbita atirando numa nave alienígena, espaço escuro, formas grandes, sem texto. Arquivo: icone_app.png
```

**logo.png**
```
Logo com o texto exatamente "ÓRBITA FINAL" (com acento agudo no Ó), letras grossas futuristas de metal cromado com brilho ciano, um pequeno planeta com anel de órbita no lugar do "O", fundo preto, formato paisagem 1536×1024. Arquivo: logo.png
```

**moeda_creditos.png**
```
Moeda DOURADA grossa sci-fi com símbolo de órbita gravado, vista de frente. Arquivo: moeda_creditos.png
```

**moeda_nucleos.png**
```
Cristal OCTAÉDRICO azul de energia com brilho interno. Arquivo: moeda_nucleos.png
```

**moeda_cristais.png**
```
Gema lapidada ROSA-VIOLETA brilhante. Arquivo: moeda_cristais.png
```

**moeda_sucata.png**
```
Pequena pilha de ENGRENAGENS e parafusos metálicos. Arquivo: moeda_sucata.png
```

**chip_supernova.png**
```
Microchip quadrado metálico com emblema de EXPLOSÃO laranja brilhando no centro. Arquivo: chip_supernova.png
```

**chip_bastiao.png**
```
O mesmo estilo de microchip com emblema de ESCUDO azul. Arquivo: chip_bastiao.png
```

**chip_tempestade.png**
```
O mesmo estilo de microchip com emblema de RAIO ciano. Arquivo: chip_tempestade.png
```

**chip_vortice.png**
```
O mesmo estilo de microchip com emblema de ESPIRAL violeta. Arquivo: chip_vortice.png
```

**icone_ultimate.png**
```
Emblema de RAIO dourado dentro de um anel de energia. Arquivo: icone_ultimate.png
```
