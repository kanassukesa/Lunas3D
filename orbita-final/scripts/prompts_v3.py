"""Gera docs/prompts-v3.md e a página com botões de copiar (prompts por lote para o ChatGPT)."""
import html, json, sys

ESTILO = """Você vai criar a arte do meu jogo mobile ÓRBITA FINAL (tower defense espacial: um planeta azul com escudo hexagonal, cercado por torres orbitais que atiram sozinhas em naves alienígenas). Arte 100% ORIGINAL.

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

Responda apenas "ok" e espere o primeiro pedido."""

LOTES = [
 ("1. Planeta 3D (o jogo enrola o mapa numa esfera e gira)", "Este lote NÃO usa a mensagem de estilo de sprite. Abra uma conversa nova e mande direto os dois pedidos.", [
  ("planeta_mapa.jpg", "Crie uma textura de mapa de planeta em projeção EQUIRRETANGULAR (como um mapa-múndi aberto), formato paisagem 1536×1024, imagem cheia sem bordas. Planeta tipo Terra porém ORIGINAL (continentes inventados, nada de continentes reais): oceanos azul-profundo com áreas rasas turquesa perto da costa, 4 a 6 continentes de formatos variados com florestas verdes, desertos areia, montanhas marrons com neve no topo e calotas de gelo brancas no topo e na base do mapa. SEM nuvens, SEM sombra, SEM iluminação (luz chapada, igual a um mapa). A borda esquerda deve continuar exatamente na borda direita (textura sem emenda). Visual pintado e saturado de jogo, não foto de satélite."),
  ("planeta_nuvens.jpg", "Agora crie a camada de NUVENS do mesmo planeta, também em projeção equirretangular 1536×1024: nuvens BRANCAS sobre fundo PRETO puro, com faixas e redemoinhos (um ciclone grande em espiral, outros menores), mais nuvens perto do equador e dos polos, uns 35% da área coberta. Sem continentes, só as nuvens brancas no preto. Borda esquerda continua na direita (sem emenda)."),
 ]),
 ("2. Torres em 2 partes (base parada + cabeça que gira para mirar)", "Conversa nova: mande a mensagem de estilo e depois estes pedidos, um por vez.", [
  ("torre_base.png", "Base de torre orbital vista de cima: plataforma HEXAGONAL de metal branco-acinzentado e aço azul-escuro, listras de aviso amarelas e pretas em dois lados, 6 luzes brancas nas quinas, um soquete circular vazio e escuro no centro (onde vai encaixar a cabeça da torre). Sem canhão, só a base. Simétrica."),
  ("cabeca_canhao.png", "SÓ a cabeça giratória de uma torre (sem base), vista de cima, apontando para a direita: corpo oval compacto de metal branco com um único cano grosso e curto, bobinas de energia LARANJA (#ff9a3c) brilhando no cano. Forma: ovo achatado + cano reto."),
  ("cabeca_laser.png", "SÓ a cabeça giratória de uma torre (sem base), vista de cima, apontando para a direita: núcleo de cristal VERMELHO em forma de losango (#ff4d6d) dentro de uma carcaça em formato de 'C', com um emissor fino e longo de lente na frente. Forma: anel aberto + agulha."),
  ("cabeca_trilho.png", "SÓ a cabeça giratória de uma torre (sem base), vista de cima, apontando para a direita: dois trilhos magnéticos LONGOS e paralelos (o mais comprido de todas as torres) com raios elétricos CIANO-CLARO (#b8f2ff) entre eles, blocos de capacitor atrás. Forma: garfo de dois dentes compridos."),
  ("cabeca_prisma.png", "SÓ a cabeça giratória de uma torre (sem base), vista de cima: um PRISMA TRIANGULAR de cristal ÁGUA-MARINHA (#7df9ff) flutuando, preso por três garras finas de metal, com uma ponta do triângulo virada para a direita. Forma: triângulo de cristal."),
  ("cabeca_missil.png", "SÓ a cabeça giratória de uma torre (sem base), vista de cima, apontando para a direita: casulo lançador quadrado e robusto com 6 bocas de míssil (2 fileiras de 3) e pontas de míssil vermelhas aparecendo, luzes AMARELAS (#ffd25e). Forma: caixa quadrada com furos."),
  ("cabeca_gravidade.png", "SÓ a cabeça giratória de uma torre (sem base), vista de cima: anel metálico grosso com uma minúscula ESFERA DE BURACO NEGRO no centro, disco de luz VIOLETA (#a66bff) girando em volta e pedrinhas orbitando. Forma: rosquinha com bola preta no meio."),
  ("cabeca_domo.png", "SÓ a cabeça de uma torre (sem base), vista de cima: CÚPULA de vidro redonda com uma bobina tesla dentro soltando raios VERDES (#5effa8) para quatro pinos de cobre ao redor. Forma: círculo de vidro com 4 pontas."),
  ("cabeca_colmeia.png", "SÓ a cabeça de uma torre (sem base), vista de cima: hangar com TRÊS baias hexagonais lado a lado em triângulo, cada uma com um mini drone em forma de seta com luz VERDE-LIMÃO (#9dff5e). Forma: trevo de 3 hexágonos."),
  ("cabeca_gelo.png", "SÓ a cabeça giratória de uma torre (sem base), vista de cima, apontando para a direita: canhão criogênico com bocal LARGO em forma de funil, cristais de gelo AZUL-CLARO (#9fe8ff) crescendo nas laterais e névoa fria saindo. Forma: funil + cristais."),
 ]),
 ("3. Inimigos (cada um de uma 'família' diferente)", "Conversa nova: mensagem de estilo + estes pedidos. Inimigos são ALIENÍGENAS: casco orgânico tipo carapaça com veias brilhantes, bem diferentes das torres de metal.", [
  ("inimigo_batedor.png", "Inimigo pequeno e rápido, vista de cima, apontando para a direita: forma de DARDO / libélula — corpo fino e comprido com duas asas estreitas puxadas para trás. Carapaça vermelho-escura, veias e motor LARANJA (#ff6b4a)."),
  ("inimigo_tanque.png", "Inimigo grande e lento, vista de cima, apontando para a direita: forma de BESOURO / tartaruga blindada — corpo largo e arredondado coberto de placas hexagonais grossas, patas curtas recolhidas. Casco ROXO metálico (#9b7bff) com frestas violeta brilhando."),
  ("inimigo_enxame.png", "Inimigo minúsculo, vista de cima, apontando para a direita: VESPA alienígena de corpo em losango com listras, quatro asas translúcidas AMARELAS (#ffd04a) brilhando."),
  ("inimigo_atirador.png", "Inimigo de artilharia, vista de cima, apontando para a direita: forma de TUBARÃO-MARTELO — cabeça larga em T com um canhão orgânico longo saindo do meio, corpo curto. Carapaça grafite com veias e boca do canhão ROSA-CHOQUE (#ff4fa3)."),
  ("inimigo_kamikaze.png", "Inimigo suicida, vista de cima, apontando para a direita: forma de LANÇA / cometa — ponta afiada enorme na frente, corpo que afina para trás, núcleo de plasma CIANO (#4fffe0) vazando faíscas e um rastro de energia atrás."),
  ("inimigo_divisor.png", "Inimigo biológico, vista de cima: CÉLULA / ameba redonda e gelatinosa, membrana VERDE translúcida (#7dff6b) com três núcleos brilhantes dentro e pequenos cílios na borda. Nada de metal."),
  ("inimigo_mitose_mini.png", "Inimigo biológico pequeno, vista de cima: uma GOTA de célula verde-clara (#b5ff9e) com um único núcleo brilhante e borda gelatinosa."),
  ("inimigo_escudeiro.png", "Inimigo de suporte, vista de cima, apontando para a direita: forma de ARRAIA (manta) com asas largas e lisas, um disco projetor no dorso emitindo uma bolha de escudo hexagonal AZUL (#5ec8ff) translúcida em volta do corpo."),
  ("inimigo_meteoro.png", "Meteoro em chamas, vista de cima, indo para a direita: rocha escura irregular e rachada com veios de lava LARANJA (#ff8a3c) e uma cauda de fogo saindo para a esquerda."),
  ("inimigo_muro.png", "Barreira alienígena, vista de cima: placa blindada LARGA e baixa (bem mais larga que alta), azul-aço (#8fa3c4), com uma fenda de energia ciano no meio e dois emissores nas pontas. Formato paisagem 1536×1024."),
 ]),
 ("4. Chefes (grandes, cada um com um formato único)", "Conversa nova: mensagem de estilo + estes pedidos. Chefes são vistos de cima, APONTANDO PARA BAIXO (vão descer em direção ao planeta), ocupando o quadro todo.", [
  ("chefe_colosso_igneo.png", "Chefe: PLANETA-MONSTRO de lava visto de cima — esfera de rocha negra rachada com rios de magma laranja, erupções solares saindo da borda e um grande olho de fogo no centro. Redondo."),
  ("chefe_rainha_colmeia.png", "Chefe: NAVE-MÃE RAINHA inseto, vista de cima, apontando para baixo — abdômen gigante em favo de mel DOURADO (#ffd04a), cabeça de vespa com mandíbulas, dezenas de escotilhas hexagonais brilhando de onde saem drones."),
  ("chefe_construtor_muros.png", "Chefe: FORTALEZA OCTOGONAL de construção, vista de cima, apontando para baixo — corpo de aço azul com quatro BRAÇOS-GUINDASTE segurando placas de barreira e um núcleo CIANO pulsando no centro."),
  ("chefe_eclipse.png", "Chefe: ECLIPSE VIVO visto de cima — esfera negra perfeita com uma coroa de fogo VIOLETA (#c28bff) em volta, dois anéis finos de energia cruzados e um olho branco estreito no centro."),
  ("chefe_singularidade.png", "Chefe: BURACO NEGRO VIVO visto de cima — centro preto absoluto, disco de acreção VIOLETA (#7a5cff) em espiral com distorção de lente, três anéis metálicos inclinados orbitando com garras."),
 ]),
 ("5. Projéteis e efeitos", "Conversa nova: mensagem de estilo + estes pedidos (todos apontando para a DIREITA).", [
  ("missil.png", "Míssil guiado visto de cima, apontando para a direita: corpo cilíndrico BRANCO com uma faixa vermelha, ponta vermelho-laranja, 4 aletas cinza na traseira, bocal escuro na esquerda, SEM chama. Formato paisagem 1536×1024, míssil ocupando a largura."),
  ("missil_chama.png", "Só a CHAMA de motor de foguete, apontando para a ESQUERDA: núcleo branco quente, depois amarelo, laranja e ponta translúcida. Formato paisagem 1536×1024."),
  ("bala_pulso.png", "Projétil de plasma em GOTA alongada apontando para a direita, núcleo branco e brilho LARANJA. Formato paisagem 1536×1024."),
  ("trilho.png", "Rastro de RAILGUN: feixe muito longo e fino CIANO-CLARO com cabeça branca brilhante na direita e faíscas elétricas. Formato paisagem 1536×1024."),
  ("gelo_tiro.png", "ESTILHAÇO DE GELO afiado azul-claro apontando para a direita, com névoa fria atrás. Formato paisagem 1536×1024."),
  ("drone.png", "MINI DRONE de combate em forma de seta, visto de cima, apontando para a direita, dois propulsores VERDE-LIMÃO atrás."),
  ("tiro_inimigo.png", "BOLA DE PLASMA alienígena vermelho-laranja com centro branco e anel de energia em volta."),
  ("explosao_sheet.png", "Animação de EXPLOSÃO em 8 quadros, grade 4 colunas × 2 linhas, quadros do mesmo tamanho e bem separados: 1 flash branco, 2-4 bola de fogo laranja crescendo, 5-6 fogo se abrindo em fumaça, 7-8 fumaça escura sumindo. (Única imagem com vários quadros.)"),
  ("vortice.png", "VÓRTICE gravitacional visto de cima: espiral de luz violeta em volta de um centro preto absoluto, bordas se dissolvendo."),
 ]),
 ("6a. Cartas: sentinelas e evoluções", "Conversa nova SEM a mensagem de estilo de sprite. Mande primeiro: \"Vou pedir ilustrações de cartas de habilidade para um jogo espacial. Regras: formato paisagem 1536×1024, imagem cheia, pintura digital cinematográfica de jogo mobile premium, luz neon forte, a borda curva de um planeta azul no canto inferior esquerdo, assunto principal grande no centro-direita, SEM texto e SEM moldura (exceto quando eu pedir moldura dourada). Cada carta tem composição, ângulo e cor DIFERENTES da anterior. Responda ok.\"", [
  ("carta_canhao.jpg", "Carta: uma torre orbital de canhão disparando uma rajada de projéteis de plasma LARANJA em um caça alienígena vermelho que explode. Ângulo de baixo para cima."),
  ("carta_laser.jpg", "Carta: uma torre orbital cortando um cruzador alienígena roxo AO MEIO com um feixe de laser VERMELHO grosso, faíscas no corte. Ângulo lateral."),
  ("carta_trilho.jpg", "Carta: tiro de railgun CIANO atravessando uma fila de três naves alienígenas em linha reta, anéis de choque em volta do tiro. Ângulo em diagonal."),
  ("carta_feixe.jpg", "Carta: prisma de cristal ÁGUA-MARINHA disparando um raio que salta em zigue-zague entre quatro drones alienígenas."),
  ("carta_missil.jpg", "Carta: salva de quatro mísseis brancos subindo em diagonal com RASTROS longos e brilhantes de fumaça clara."),
  ("carta_gravidade.jpg", "Carta: poço gravitacional VIOLETA sugando naves alienígenas em espiral para um centro preto."),
  ("carta_campo.jpg", "Carta: cúpula elétrica VERDE sobre o planeta com raios atingindo naves que se aproximam."),
  ("carta_drone.jpg", "Carta: esquadrão de cinco drones VERDE-LIMÃO em formação perseguindo um caça alienígena vermelho."),
  ("carta_gelo.jpg", "Carta: cristal de gelo gigante AZUL-CLARO congelando duas naves alienígenas, geada se espalhando."),
  ("carta_evo_canhao.jpg", "Carta de EVOLUÇÃO com moldura DOURADA ornamentada e partículas douradas: canhão dourado cujos tiros explodem em pequenas supernovas."),
  ("carta_evo_laser.jpg", "Carta de EVOLUÇÃO com moldura dourada: TRÊS lasers vermelhos em leque saindo de uma torre dourada."),
  ("carta_evo_trilho.jpg", "Carta de EVOLUÇÃO com moldura dourada: três trilhos solares gigantes em chamas brancas e douradas atravessando o espaço."),
  ("carta_evo_feixe.jpg", "Carta de EVOLUÇÃO com moldura dourada: uma TEIA de raios água-marinha ligando dezenas de inimigos ao mesmo tempo."),
  ("carta_evo_missil.jpg", "Carta de EVOLUÇÃO com moldura dourada: CHUVA de mísseis caindo do alto como estrelas cadentes."),
  ("carta_evo_gravidade.jpg", "Carta de EVOLUÇÃO com moldura dourada: BURACO NEGRO enorme devorando uma frota inteira."),
  ("carta_evo_campo.jpg", "Carta de EVOLUÇÃO com moldura dourada: TEMPESTADE de raios verdes caindo por todo o espaço."),
  ("carta_evo_drone.jpg", "Carta de EVOLUÇÃO com moldura dourada: colmeia rainha soltando um ENXAME gigante de drones brilhantes."),
  ("carta_evo_gelo.jpg", "Carta de EVOLUÇÃO com moldura dourada: ONDA de gelo congelando uma frota inteira de naves."),
 ]),
 ("6b. Cartas: melhorias", "Continue na mesma conversa das cartas (ou abra outra e repita a mensagem de regras das cartas).", [
  ("carta_dano.jpg", "Carta: explosão estelar LARANJA de energia pura irradiando raios em todas as direções."),
  ("carta_cadencia.jpg", "Carta: dezenas de projéteis AMARELOS paralelos disparando em altíssima velocidade."),
  ("carta_crit.jpg", "Carta: mira holográfica VERMELHA travada numa nave alienígena, com um impacto crítico brilhante."),
  ("carta_radar.jpg", "Carta: ondas de radar CIANO saindo do planeta e marcando naves distantes com pontos vermelhos."),
  ("carta_velocidade.jpg", "Carta: projéteis CIANO com rastros de velocidade bem esticados, sensação de movimento."),
  ("carta_area.jpg", "Carta: anel de onda de choque LARANJA enorme se expandindo e empurrando naves."),
  ("carta_dados.jpg", "Carta: chip de dados ROXO holográfico flutuando com circuitos brilhando."),
  ("carta_vidro.jpg", "Carta: canhão feito de CRISTAL rachado brilhando com energia branca perigosa."),
  ("carta_hp.jpg", "Carta: planeta envolto em aura VERDE de vida com um coração de energia na frente."),
  ("carta_cura.jpg", "Carta: nanorrobôs VERDES consertando a superfície do planeta, faíscas de reparo."),
  ("carta_escudo.jpg", "Carta: bolha de escudo hexagonal CIANO desviando tiros inimigos vermelhos."),
  ("carta_armadura.jpg", "Carta: placas de ARMADURA metálica grossas se fechando em volta do planeta."),
  ("carta_espinhos.jpg", "Carta: escudo refletindo ESPINHOS de energia azul de volta nos inimigos."),
  ("carta_estilhaco.jpg", "Carta: projétil acertando uma nave e se partindo em TRÊS estilhaços brilhantes."),
  ("carta_ricochete.jpg", "Carta: projétil CIANO ricocheteando em zigue-zague entre três naves."),
  ("carta_queima.jpg", "Carta: naves alienígenas envoltas em FOGO de plasma laranja."),
  ("carta_veneno.jpg", "Carta: nuvem de nanovírus VERDE tóxico corroendo uma nave alienígena."),
  ("carta_explosao.jpg", "Carta: reação em CADEIA, várias naves explodindo uma após a outra."),
  ("carta_perfurante.jpg", "Carta: projétil de tungstênio FURANDO duas placas blindadas em sequência."),
  ("carta_executor.jpg", "Carta: golpe em X VERMELHO finalizando uma nave alienígena danificada."),
  ("carta_ultimate.jpg", "Carta: RAIO DOURADO gigante carregado de energia saindo do planeta."),
  ("carta_passiva.jpg", "Carta: GEMA de cristal flutuando e irradiando poder em várias cores."),
 ]),
 ("7. Fundos e interface", "Conversa nova: mensagem de estilo + estes pedidos.", [
  ("fundo_1.jpg", "Fundo de espaço em RETRATO 1024×1536, imagem cheia, sem planetas e sem naves, pouco contraste: azul-marinho quase preto, nebulosa azul-petróleo e roxa suave, poeira estelar fina."),
  ("fundo_2.jpg", "Fundo de espaço em RETRATO 1024×1536, imagem cheia, sem planetas: azul escuro, nebulosa laranja e vermelha fraca perto do topo, aglomerado de estrelas distante."),
  ("fundo_3.jpg", "Fundo de espaço em RETRATO 1024×1536, imagem cheia, sem planetas: quase preto, faixa de galáxia violeta e ciano na diagonal, poucas estrelas."),
  ("icone_app.png", "Ícone de app QUADRADO com fundo cheio (não preto): planeta azul com escudo hexagonal e três torres em órbita atirando numa nave alienígena, espaço escuro, formas grandes, sem texto."),
  ("logo.png", "Logo com o texto exatamente \"ÓRBITA FINAL\" (com acento agudo no Ó), letras grossas futuristas de metal cromado com brilho ciano, um pequeno planeta com anel de órbita no lugar do \"O\", fundo preto, formato paisagem 1536×1024."),
  ("moeda_creditos.png", "Moeda DOURADA grossa sci-fi com símbolo de órbita gravado, vista de frente."),
  ("moeda_nucleos.png", "Cristal OCTAÉDRICO azul de energia com brilho interno."),
  ("moeda_cristais.png", "Gema lapidada ROSA-VIOLETA brilhante."),
  ("moeda_sucata.png", "Pequena pilha de ENGRENAGENS e parafusos metálicos."),
  ("chip_supernova.png", "Microchip quadrado metálico com emblema de EXPLOSÃO laranja brilhando no centro."),
  ("chip_bastiao.png", "O mesmo estilo de microchip com emblema de ESCUDO azul."),
  ("chip_tempestade.png", "O mesmo estilo de microchip com emblema de RAIO ciano."),
  ("chip_vortice.png", "O mesmo estilo de microchip com emblema de ESPIRAL violeta."),
  ("icone_ultimate.png", "Emblema de RAIO dourado dentro de um anel de energia."),
 ]),
]

def md():
    out = ["# Prompts v3 para o ChatGPT — por lote\n",
           "Use o ChatGPT normal (não o Codex). Uma conversa NOVA por lote. Um pedido por mensagem.\n",
           "## Mensagem de estilo (início de cada conversa de sprites)\n", "```\n" + ESTILO + "\n```\n"]
    for titulo, nota, itens in LOTES:
        out.append(f"## {titulo}\n\n{nota}\n")
        for nome, p in itens:
            out.append(f"**{nome}**\n```\n{p} Arquivo: {nome}\n```\n")
    return "\n".join(out)

def pagina():
    e = lambda s: html.escape(s, quote=True)
    total = sum(len(i) for _, _, i in LOTES)
    def item(nome, p, destaque=False):
        texto = p if destaque else f"{p} Arquivo: {nome}"
        return f'<article class="item{" destaque" if destaque else ""}"><div class="cab"><code>{e(nome)}</code></div><p class="prompt">{e(texto)}</p><button type="button" class="copiar" data-p="{e(texto)}">Copiar</button></article>'
    secs = []
    for titulo, nota, itens in LOTES:
        secs.append(f'<section><h2>{e(titulo)}</h2><p class="nota">{e(nota)}</p>' + "".join(item(n, p) for n, p in itens) + "</section>")
    return f'''<title>Prompts do Órbita Final</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;600&family=JetBrains+Mono:wght@500&display=swap">
<style>
/* Layout: coluna única; passo a passo no topo, mensagem de estilo destacada, depois um cartão por pedido agrupado por lote */
:root {{ color-scheme: dark; --bg:#070b18; --painel:#0f1a30; --painel2:#13223e; --linha:#22385c; --texto:#e6eefc; --suave:#93a7c8; --ciano:#4fd6ff; --laranja:#ff9a3c; --ok:#49e07a;
  --f-titulo:"Space Grotesk",system-ui,sans-serif; --f-texto:"Inter",system-ui,sans-serif; --f-mono:"JetBrains Mono",ui-monospace,monospace; }}
body {{ background:var(--bg); color:var(--texto); font-family:var(--f-texto); font-size:15px; line-height:1.5; padding-left:max(16px,env(safe-area-inset-left,0px)); padding-right:max(16px,env(safe-area-inset-right,0px)); padding-block:20px 60px; }}
main {{ max-width:720px; margin:0 auto; display:flex; flex-direction:column; gap:22px; }}
h1 {{ font-family:var(--f-titulo); font-size:clamp(26px,7vw,36px); margin:0; text-wrap:balance; }} h1 span {{ color:var(--ciano); }}
h2 {{ font-family:var(--f-titulo); font-size:19px; margin:0; color:var(--laranja); text-wrap:balance; }}
.intro, .nota {{ color:var(--suave); margin:0; max-width:64ch; }}
.passos {{ background:var(--painel); border:1px solid var(--linha); border-radius:14px; padding:14px 16px; }}
.passos ol {{ margin:0; padding-left:20px; display:flex; flex-direction:column; gap:6px; }} .passos b {{ color:var(--ciano); font-weight:600; }}
section {{ display:flex; flex-direction:column; gap:10px; }}
.item {{ background:var(--painel); border:1px solid var(--linha); border-radius:12px; padding:12px 14px; display:flex; flex-direction:column; gap:8px; min-width:0; }}
.item.destaque {{ border:2px solid var(--ciano); }}
.cab code {{ font-family:var(--f-mono); font-size:13.5px; color:var(--ciano); word-break:break-all; }}
.prompt {{ margin:0; font-family:var(--f-mono); font-size:12.5px; line-height:1.55; background:var(--painel2); border-radius:8px; padding:10px; color:#d3def2; white-space:pre-wrap; word-break:break-word; user-select:text; -webkit-user-select:text; }}
.copiar {{ align-self:flex-start; font:600 14px var(--f-texto); color:#061020; background:var(--ciano); border:0; border-radius:9px; padding:9px 16px; min-height:40px; cursor:pointer; }}
.copiar.ok {{ background:var(--ok); }} .copiar:focus-visible {{ outline:2px solid #fff; outline-offset:2px; }}
</style>
<main>
<header><h1>Prompts do <span>Órbita Final</span></h1>
<p class="intro">{total} imagens divididas em lotes. Um pedido por mensagem, cada um com forma e cor próprias, para o ChatGPT não repetir o mesmo desenho.</p></header>
<div class="passos"><ol>
<li>Use o <b>ChatGPT normal</b> (o Codex não gera imagem).</li>
<li>Abra uma <b>conversa nova para cada lote</b>.</li>
<li>Nos lotes 2, 3, 4, 5 e 7, mande primeiro a <b>mensagem de estilo</b>. Se quiser, anexe as torres que você aprovou como referência.</li>
<li>Depois cole <b>um pedido por vez</b>. Se ele errar, responda "refaz" e diga o que mudar.</li>
<li>Salve cada imagem com o <b>nome do arquivo</b> e me mande (pode ser em ZIP).</li>
</ol></div>
<section><h2>Mensagem de estilo</h2>{item("mensagem de estilo (início da conversa)", ESTILO, True)}</section>
{"".join(secs)}
</main>
<script>
document.addEventListener("click", async (ev) => {{
  const b = ev.target.closest(".copiar"); if (!b) return;
  try {{ await navigator.clipboard.writeText(b.dataset.p); }}
  catch {{ const p = b.parentElement.querySelector(".prompt"); const r = document.createRange(); r.selectNodeContents(p); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }}
  b.textContent = "Copiado ✓"; b.classList.add("ok"); setTimeout(() => {{ b.textContent = "Copiar"; b.classList.remove("ok"); }}, 1600);
}});
</script>
'''

if __name__ == "__main__":
    open("docs/prompts-v3.md", "w").write(md())
    open(sys.argv[1], "w").write(pagina())
    print(sum(len(i) for _, _, i in LOTES), "pedidos")
