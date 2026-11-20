# Órbita Final — lista de assets para gerar com IA

Arte original (não copiar nome, arte ou ícones de outros jogos). Prompts em inglês funcionam melhor nas IAs de imagem.

## Regras para TODOS os assets (para encaixar no código sem retrabalho)

1. **PNG com fundo transparente** (exceto fundos e ilustrações de carta, que são JPG/PNG cheios).
2. **Vista de cima (top-down), ortográfica.** Naves, sentinelas, mísseis e projéteis **apontando para a DIREITA** (o jogo gira o sprite pelo ângulo; 0° = direita).
3. **Centralizado**, com ~10% de margem vazia em volta. Sem sombra no chão, sem texto, sem logo, sem marca d'água.
4. **Mesmo estilo em tudo:** sci-fi semi-realista estilizado, cores saturadas, bordas bem definidas, brilho (emissive) nas partes que soltam luz.
5. **Nome do arquivo exatamente como na lista** — é assim que o jogo acha a imagem.
6. Se a IA não fizer fundo transparente, gere em **fundo preto liso** e remova depois (remove.bg, Photoshop, ou me mande que eu removo).

**Sufixo de estilo** (cole no fim de cada prompt de sprite):
> `, original design, stylized semi-realistic sci-fi game asset, top-down orthographic view, centered, clean readable silhouette, soft rim light, subtle emissive glow, isolated on transparent background, no text, no logo, no shadow on ground`

---

## 1. Planeta e escudo (prioridade alta)

| Arquivo | Tamanho | Prompt |
|---|---|---|
| `planeta.png` | 1024×1024 | `Earth-like ocean planet seen from space, blue oceans, green and sandy continents, swirling white clouds, thin glowing blue atmosphere rim, lit from the upper left with soft night side on the lower right, perfect sphere` + sufixo |
| `planeta_mapa.png` | 2048×1024 | `Seamless equirectangular texture map of an Earth-like alien planet surface, blue oceans, green and sandy continents, white cloud swirls, tileable left to right, flat map projection, no text` (fundo cheio, para girar o planeta) |
| `escudo.png` | 1024×1024 | `Translucent hexagonal energy shield bubble, honeycomb grid of thin cyan glowing lines, brighter rim, mostly transparent center, sci-fi force field, perfect circle` + sufixo |

## 2. Sentinelas (9) — 512×512 cada, apontando para a direita

Torres orbitais pequenas sobre base hexagonal, cada uma com cor própria.

| Arquivo | Prompt |
|---|---|
| `sentinela_canhao.png` | `Compact orbital defense turret on a hexagonal base, single heavy pulse cannon barrel pointing right, orange glowing energy coils (#ff9a3c), white and dark steel armor plates` |
| `sentinela_laser.png` | `Orbital laser turret on a hexagonal base, long focusing lens emitter pointing right, crimson red glowing crystal core (#ff4d6d), sleek white armor` |
| `sentinela_trilho.png` | `Orbital railgun turret on a hexagonal base, two long parallel magnetic rails pointing right, pale cyan electric glow between the rails (#b8f2ff), heavy capacitor blocks` |
| `sentinela_feixe.png` | `Orbital prism turret on a hexagonal base, floating triangular crystal prism pointing right, bright aqua light refracting inside (#7df9ff), small stabilizer fins` |
| `sentinela_missil.png` | `Orbital missile launcher pod on a hexagonal base, grid of six small missile tubes facing right, warm yellow warning lights (#ffd25e), armored box launcher` |
| `sentinela_gravidade.png` | `Orbital gravity generator on a hexagonal base, ring-shaped emitter with a tiny violet black-hole sphere in the middle (#a66bff), floating metal shards around it` |
| `sentinela_campo.png` | `Orbital tesla coil turret on a hexagonal base, dome with crackling green electric arcs (#5effa8), copper coils and white armor` |
| `sentinela_drone.png` | `Orbital drone hive platform on a hexagonal base, three docking bays with small drones, lime green lights (#9dff5e), hexagonal hatches` |
| `sentinela_gelo.png` | `Orbital cryo turret on a hexagonal base, frosty nozzle pointing right, icy blue crystals growing on the armor (#9fe8ff), cold mist` |

## 3. Inimigos — 256×256 cada, apontando para a direita (sentido do movimento)

| Arquivo | Prompt |
|---|---|
| `inimigo_batedor.png` | `Small fast alien scout fighter, sharp arrowhead shape, red-orange hull (#ff6b4a), single glowing engine at the back` |
| `inimigo_tanque.png` | `Large slow alien armored cruiser, thick hexagonal hull plates, purple metallic armor (#9b7bff), small glowing violet windows, heavy and bulky` |
| `inimigo_enxame.png` | `Tiny alien swarm drone, diamond-shaped insect-like body, yellow glowing wings (#ffd04a)` |
| `inimigo_atirador.png` | `Alien artillery ship, square boxy hull with a long forward cannon pointing right, hot pink lights (#ff4fa3)` |
| `inimigo_kamikaze.png` | `Alien comet bomber, elongated spear shape, cyan plasma core (#4fffe0) leaking glowing particles, built to ram` |
| `inimigo_divisor.png` | `Alien bio-organic cell creature, round translucent green membrane (#7dff6b) with three nuclei inside, slimy` |
| `inimigo_mitose_mini.png` | `Small alien bio cell fragment, round translucent light green membrane (#b5ff9e) with one nucleus` |
| `inimigo_escudeiro.png` | `Alien support ship, pentagonal hull, blue shield projector dish on top (#5ec8ff), faint hexagonal energy aura` |
| `inimigo_meteoro.png` | `Burning space meteor rock, cracked dark stone with glowing orange lava veins (#ff8a3c), irregular round shape` |
| `inimigo_muro.png` (512×256) | `Floating alien energy barrier segment, wide horizontal metal slab with steel-blue panels (#8fa3c4) and a glowing seam in the middle, seen from above` |

## 4. Chefes (5) — 1024×1024 cada

| Arquivo | Prompt |
|---|---|
| `chefe_colosso_igneo.png` | `Colossal molten planet monster, burning sphere covered in cracked lava crust, rivers of glowing magma, solar flares erupting from the surface, menacing` |
| `chefe_rainha_colmeia.png` | `Giant alien hive queen mothership, hexagonal golden honeycomb hull (#ffd04a), many small hatches releasing drones, organic and mechanical` |
| `chefe_construtor_muros.png` | `Massive alien construction fortress ship, octagonal steel-blue hull (#8fa3c4), cranes and building arms, glowing cyan core in the center` |
| `chefe_eclipse.png` | `Mysterious eclipse entity, black sphere covered by a dark disc with a bright violet corona ring (#c28bff), ghostly and elegant` |
| `chefe_singularidade.png` | `Living black hole boss, pitch black core with a swirling violet accretion disk (#7a5cff), gravitational lensing distortion, three tilted orbit rings` |

## 5. Projéteis e drones

| Arquivo | Tamanho | Prompt |
|---|---|---|
| `missil.png` | 512×128 | `Small guided missile pointing right, white and light gray body, red-orange nose cone, four tail fins, dark exhaust nozzle at the left end, no flame` + sufixo |
| `missil_chama.png` | 256×128 | `Rocket engine exhaust flame pointing left, white-hot core fading to yellow and orange, soft edges, additive glow` + sufixo |
| `bala_pulso.png` | 256×64 | `Glowing energy bolt pointing right, bright white core with orange glow, teardrop plasma shape with short tail` + sufixo |
| `trilho.png` | 512×64 | `Railgun slug streak pointing right, long thin pale cyan energy beam with bright white head, electric sparks` + sufixo |
| `gelo_tiro.png` | 256×64 | `Icy cryo projectile pointing right, sharp ice shard with frosty blue glow and cold mist trail` + sufixo |
| `drone.png` | 256×256 | `Tiny combat drone pointing right, arrowhead shape, lime green thrusters, small cannon` + sufixo |
| `tiro_inimigo.png` | 128×128 | `Enemy plasma ball, glowing red-orange energy orb with hot white center` + sufixo |

## 6. Efeitos (spritesheets)

| Arquivo | Tamanho | Prompt |
|---|---|---|
| `explosao_sheet.png` | 2048×256 (8 quadros de 256) | `Sprite sheet of a sci-fi explosion animation, 8 frames in a single horizontal row, from bright white flash to orange fireball to dark smoke dissipating, evenly spaced, transparent background` |
| `vortice.png` | 1024×1024 | `Top-down view of a swirling violet gravity vortex, spiral arms of purple light around a pitch black center, semi-transparent edges` + sufixo |
| `faisca.png` | 128×32 | `Single bright spark streak pointing right, white core with soft glow, motion blur` + sufixo |

## 7. Fundos — 1080×1920 (retrato), JPG

| Arquivo | Prompt |
|---|---|
| `fundo_1.jpg` | `Deep space vertical background, dark navy to near black (#05070f to #0b1630), soft teal and purple nebula clouds with low contrast, scattered small stars, no planets, calm, mobile game background, 9:16` |
| `fundo_2.jpg` | `Deep space vertical background, dark blue, faint orange and red nebula near the top, distant star cluster, subtle, mobile game background, 9:16` |
| `fundo_3.jpg` | `Deep space vertical background, near black, glowing violet and cyan galaxy band diagonally, sparse stars, subtle, mobile game background, 9:16` |
| `estrelas.png` | 1024×1024 | `Seamless tileable transparent star field, small white and pale blue dots of varied size, no nebula` |

## 8. Ilustrações das cartas — 600×480, JPG (fundo cheio)

**Prefixo de estilo das cartas** (cole no começo):
> `Sci-fi game card illustration, dramatic cinematic space scene, curved edge of a blue Earth-like planet in the lower left corner, dark starry space, vibrant glowing effects, painterly semi-realistic, no text, no frame, ` + o tema abaixo

**Sentinelas (usadas em "nova sentinela", "subir nível" e "mod")**

| Arquivo | Tema |
|---|---|
| `carta_canhao.jpg` | `an orbital turret firing a stream of orange plasma bolts at an alien fighter` |
| `carta_laser.jpg` | `an orbital turret slicing an alien cruiser with a thick crimson laser beam` |
| `carta_trilho.jpg` | `a railgun shot piercing through a line of alien ships, cyan shockwave rings` |
| `carta_feixe.jpg` | `a crystal prism shooting aqua lightning that chains between several alien drones` |
| `carta_missil.jpg` | `a volley of four guided missiles flying upward with long bright smoke trails` |
| `carta_gravidade.jpg` | `a violet gravity well pulling alien ships into a spinning black core` |
| `carta_campo.jpg` | `a green electric dome around the planet, lightning bolts striking enemies` |
| `carta_drone.jpg` | `a squad of small green combat drones hunting an alien fighter` |
| `carta_gelo.jpg` | `a giant glowing ice crystal freezing alien ships in blue frost` |

**Evoluções** (mesmo prefixo, com moldura dourada brilhante e luz dourada):

| Arquivo | Tema |
|---|---|
| `carta_evo_canhao.jpg` | `golden star cannon whose bolts explode into fiery novas` |
| `carta_evo_laser.jpg` | `three crimson laser beams fanning out from one turret` |
| `carta_evo_trilho.jpg` | `three huge blazing solar rails crossing the screen` |
| `carta_evo_feixe.jpg` | `infinite aqua lightning web connecting dozens of enemies` |
| `carta_evo_missil.jpg` | `rain of missiles falling from the top of the sky like shooting stars` |
| `carta_evo_gravidade.jpg` | `a massive black hole devouring small alien ships` |
| `carta_evo_campo.jpg` | `a storm of green lightning striking everywhere across space` |
| `carta_evo_drone.jpg` | `a queen hive releasing a huge swarm of glowing drones` |
| `carta_evo_gelo.jpg` | `an ice age wave freezing a whole enemy fleet` |

**Melhorias**

| Arquivo | Tema | Cartas que usam |
|---|---|---|
| `carta_dano.jpg` | `a blazing orange starburst of raw energy` | dano global |
| `carta_cadencia.jpg` | `dozens of parallel yellow plasma bolts firing rapidly` | cadência |
| `carta_crit.jpg` | `a red glowing targeting reticle locked on an alien ship` | crítico |
| `carta_radar.jpg` | `cyan radar waves expanding from the planet detecting distant ships` | alcance |
| `carta_velocidade.jpg` | `bright cyan speed streaks of projectiles` | velocidade de projétil |
| `carta_area.jpg` | `a huge orange shockwave explosion ring` | área |
| `carta_dados.jpg` | `a glowing purple data chip with circuits` | XP |
| `carta_vidro.jpg` | `a cracked glass cannon glowing with dangerous power` | canhão de vidro |
| `carta_hp.jpg` | `the planet surrounded by a green healing aura and a glowing heart` | HP / bastião |
| `carta_cura.jpg` | `green repair nanobots healing the planet surface` | cura / regeneração |
| `carta_escudo.jpg` | `a cyan hexagonal shield bubble deflecting enemy fire` | escudo |
| `carta_armadura.jpg` | `heavy metal armor plates locking around the planet` | armadura |
| `carta_espinhos.jpg` | `the shield reflecting spikes of blue energy back at enemies` | campo reativo |
| `carta_estilhaco.jpg` | `a plasma bolt hitting a ship and splitting into shards` | estilhaços |
| `carta_ricochete.jpg` | `a cyan bolt bouncing between three alien ships` | ricochete |
| `carta_queima.jpg` | `alien ships engulfed in orange plasma fire` | queimadura |
| `carta_veneno.jpg` | `toxic green nanovirus bubbles corroding an alien ship` | veneno |
| `carta_explosao.jpg` | `a chain reaction of exploding alien ships` | reação em cadeia |
| `carta_perfurante.jpg` | `a tungsten slug punching through two armored plates` | perfuração |
| `carta_executor.jpg` | `a red X strike finishing off a damaged alien ship` | executor |
| `carta_ultimate.jpg` | `a giant golden lightning bolt charging with energy` | ultimate |
| `carta_passiva.jpg` | `a floating glowing crystal gem radiating power` | passivas de evolução |

## 9. Interface

| Arquivo | Tamanho | Prompt |
|---|---|---|
| `icone_app.png` | 1024×1024 (fundo cheio) | `Mobile game app icon, a small blue planet with a glowing hexagonal shield and three orbiting turrets firing at an alien ship, dark space background, bold readable shapes, no text` |
| `logo.png` | 2048×512 | `Game logo text "ÓRBITA FINAL", bold futuristic metallic letters with cyan glow, small planet and orbit ring integrated in the letter O, transparent background` (IA costuma errar texto: confira a grafia e o acento) |
| `moeda_creditos.png` | 256×256 | `Golden sci-fi coin with an engraved orbit symbol, shiny` + sufixo |
| `moeda_nucleos.png` | 256×256 | `Glowing blue energy core crystal, octahedron shape` + sufixo |
| `moeda_cristais.png` | 256×256 | `Sparkling pink-violet premium gem, faceted diamond` + sufixo |
| `moeda_sucata.png` | 256×256 | `Small pile of metal scrap gears and bolts` + sufixo |
| `chip_supernova.png`, `chip_bastiao.png`, `chip_tempestade.png`, `chip_vortice.png` | 256×256 | `Square microchip module with a glowing [orange explosion / blue shield / cyan lightning / violet spiral] emblem in the center` + sufixo |
| `icone_ultimate.png` | 256×256 | `Golden lightning bolt emblem inside a glowing energy circle` + sufixo |

---

## Ordem sugerida (o que mais muda o visual)

1. `planeta.png`, `escudo.png`, `fundo_1.jpg`
2. As 9 sentinelas, `missil.png`, `missil_chama.png`
3. Os inimigos e os 5 chefes
4. As 9 cartas de sentinela
5. O resto (evoluções, melhorias, interface, efeitos)

## Como me mandar

Coloque tudo numa pasta com os nomes acima e me envie aqui na conversa (pode ser aos poucos). Eu ajusto tamanho, recorte e brilho, e ligo no jogo. Tudo que ainda não tiver imagem continua com a arte atual, então não precisa fazer tudo de uma vez.

> Nas seções 2, 3 e 4 o sufixo de estilo também vale (cole no fim de cada prompt). A página com botões de copiar já traz tudo junto.
