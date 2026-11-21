# Órbita Final

Roguelite + tower defense espacial para celular (retrato, PWA). Implementação do GDD de defesa planetária.
Projeto **independente** da loja Lunas 3D: tem seu próprio `package.json` e não entra no build do Next.

```bash
cd orbita-final
npm install
npm run dev        # http://localhost:5173 (use --host para abrir no celular na mesma rede)
npm run build      # typecheck + build em dist/
npm run sim -- 1-10 4 1   # simulador de balanceamento: fases, partidas por fase, nível do hangar
npx tsx scripts/simJornada.ts 4 10 radiacao,nevoa   # simula a Jornada (partidas, nível do hangar, efeitos)
```

## Stack
TypeScript + Vite + PixiJS v8. HUD e menus em DOM/CSS por cima do canvas. Áudio sintetizado (Web Audio).
Arte inicial gerada em Canvas2D (formas + brilho) com IDs de textura — a arte final pode substituir sem mexer na lógica.

## Estrutura
| Pasta | Conteúdo |
|---|---|
| `src/data` | **Todo o balanceamento**: `balance.ts`, `sentinels.ts`, `enemies.ts`, `bosses.ts`, `cards.ts`, `chips.ts`, `stages.ts`, `talents.ts`, `missions.ts`, `modes.ts` |
| `src/core` | Loop fixo 60 Hz (x1/x2), Pool, SpatialGrid (128 px), Rng com seed (mulberry32), Save (versão + migração), Áudio, `Game.ts` (máquina de estados) |
| `src/battle` | Lógica da partida **sem Pixi** (roda headless no simulador): Battle, Sentinel, Enemy, Boss, Spawner, CardSystem, StatSystem, Ultimate, Loadout |
| `src/render` | Texturas, fundo com parallax, planeta/escudo, renderer da batalha, partículas, números de dano, cena do hub |
| `src/ui` | HUD, level-up, painéis (build, pausa, resultado) e telas de meta (hub, fases, hangar, chips, planeta, missões, modos, config) |
| `scripts/sim.ts` | Bot que joga as fases para validar a curva de dificuldade |

StatSystem: `final = (base + Σaditivos) × (1 + Σpercentuais) × Πmultiplicadores`. Efeitos usam a convenção
`stat` (aditivo), `statPct` (percentual) e `statMult` (multiplicador) — vale para cartas, chips, traços e talentos.

## Conteúdo
- 9 sentinelas (todas com evolução e ultimate próprios), 8 inimigos + barreiras, 5 chefes, 10 fases (Normal + Difícil ×2,5 HP)
- 76 cartas (raridades 60/28/10/2, pilhas, requisitos, evoluções garantidas quando disponíveis, 5 cartas a cada 10 níveis)
- Meta: créditos/núcleos/cristais, hangar nv 1–30 com traço a cada 5 níveis, deck (base + 5), chips com 4 conjuntos e fusão 3→1,
  talentos do planeta, missões, desafio diário com seed, sobrevivência infinita, reviver 1x, tutorial na fase 1
- **Jornada da semana**: 5 etapas seguidas sem cura (build, nível e HP continuam), com 2 efeitos de campo sorteados
  pela semana ISO entre 6 (radiação, gravidade invertida, corrente rápida, tempestade solar, nebulosa, campo minado)
- Bloom real (`AdvancedBloomFilter` do pixi-filters) com opção de desligar; música procedural com progressão de acordes

## Curva de dificuldade (simulador)
Sem melhorias permanentes o bot vence as fases 1–5; da 6 em diante é preciso evoluir no hangar/planeta.

## Arte final
Imagens geradas por IA vão em `arte/original/<id>.jpg` (lista e prompts em `docs/`). Rode
`python3 scripts/processar_arte.py` para recortar o fundo e gerar `src/assets/sprites/<id>.png`.
O jogo carrega sozinho qualquer sprite com o mesmo ID da textura procedural; o resto continua procedural.

## Publicar (Vercel)
1. Em vercel.com → **Add New → Project** → importe o repositório `kanassukesa/Lunas3D`.
2. Em **Root Directory** escolha `orbita-final` (o resto é lido do `vercel.json`).
3. Deploy. No iPhone: abra o link no Safari → Compartilhar → **Adicionar à Tela de Início**.

## Pendências
- Arena assíncrona (precisa de backend)
- Arte final (sprites) e música composta; hoje tudo é procedural
