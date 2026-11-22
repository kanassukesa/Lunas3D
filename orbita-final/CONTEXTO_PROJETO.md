# Órbita Final: contexto do projeto (passagem de bastão para o próximo chat)

> Leia isto primeiro. Resume tudo o que foi feito até a **versão 3.3** e o que falta.
> O dono do projeto conversa em **português (BR)**, testa no **iPhone** (link web) e no **Android** (APK). Ele manda imagens geradas no ChatGPT para entrarem no jogo.

## 1. O que é

Jogo mobile **roguelite de defesa planetária** (tela em pé):
- Um planeta no centro com **sentinelas** em órbita que atiram sozinhas.
- Inimigos chegam em ondas.
- A cada nível o jogador escolhe uma **carta** (nova sentinela, nível ou bônus).
- No fim de cada fase vem um **chefe**.

Meta-progressão: hangar, talentos do planeta, chips, comandantes, patentes, passe, loja, skins e ranking.

**Stack:** TypeScript + Vite + **PixiJS v8** (WebGL), PWA, **Capacitor 7** para o Android.
- Pasta do jogo: `orbita-final/`.
- Branch de trabalho: **`claude/new-session-yhq3l8`** (repositório `kanassukesa/Lunas3D`).

## 2. Rodar, compilar e publicar

```bash
cd orbita-final
npm install
npm run dev            # testar no navegador
npm run build          # gera dist/
npx tsc --noEmit -p .  # checar tipos
```

**APK Android:**
- Precisa do Android SDK (platforms;android-35, build-tools;35.0.0).
- Comandos:
  ```bash
  npx cap sync android
  cd android
  ANDROID_HOME=<sdk> ORBITA_CHAVE=<caminho>/chave.properties ./gradlew assembleRelease
  # saída: android/app/build/outputs/apk/release/app-release.apk
  ```
- A cada versão, suba o `versionCode` e o `versionName` em `android/app/build.gradle`. Hoje: **versionCode 24 / "3.3"**.
- **A chave de assinatura (`orbita-final.jks` + `chave.properties`) NÃO fica no GitHub.** O dono tem o zip `chave-android-orbita.zip`.
  - Ajuste o caminho do `.jks` dentro do `chave.properties`.
  - Sem essa chave, os APKs novos não instalam por cima dos antigos.
- App id: `com.orbitafinal.jogo`.

**Web:**
- Havia um link de teste publicado como Artifact do Claude, só para o iPhone: https://claude.ai/artifact/Tz9Sy6qbQaaYCEJKnfeA5a.
- Esse link só é atualizável pela sessão da nuvem.
- Para o público, o plano é a **Vercel** (já existe `vercel.json`). Ligar o repositório na Vercel faz cada push atualizar o site.

**Simulações de balanceamento** (bot joga sozinho):
- `npx tsx scripts/sim.ts <fases ex. 1-10> <runs> <nivelHangar>`. Use `DIF=0..3` para a dificuldade.
- `SO=fornalha,serra npx tsx scripts/simArmas.ts <fase> <runs> <hangar>`: compara armas sozinhas.
- Também existem `simJornada.ts` e `simBalanco.ts`.

## 3. Estrutura do código (principais arquivos)

- `src/data/`: **todos os números de balanceamento.**
  - `balance.ts`: XP, ultimate, combo, choque, hangar (nível máx. **40**), **DIFICULDADES** (Normal, Difícil, Pesadelo, Apocalipse) e recompensas.
  - `sentinels.ts`: **15 armas**. As 9 originais e mais 6 da progressão (fornalha, serra, plasma, nano, espelho, portal), que têm `libera` (marco ou cristais).
  - `stages.ts`: **20 fases**. O Setor 1 vai da 1 à 10. O Setor 2 vai da 11 à 20, tem `campos` (efeitos de campo) e densidade reduzida.
  - `enemies.ts`: inclui os novos espectro, medico, bombardeiro e mina.
  - `bosses.ts`: 5 chefes.
  - `cards.ts`: cartas e passivas de evolução ("Supremo").
  - `comandante.ts`: **PATENTES** (pontos + fase exigida), **ULTIMATES** (12) e **AVATARES** (comandantes: 9 normais + 3 Elite), além de login diário, missões, loja, correio, **SKINS** e **PASSE**.
  - `monetizacao.ts`: produtos em BRL e trilha **PASSE_PREMIUM**.
  - `journey.ts`: Jornada da semana e CAMPOS.
  - `missions.ts`: conquistas.
  - `chips.ts` e `talents.ts`.
- `src/battle/`: lógica pura.
  - `Battle.ts`.
  - `Sentinel.ts`: comportamento de cada arma. O Domo (`campo`) fica no centro do planeta.
  - `Enemy.ts`.
  - `Ultimate.ts`: ultimate vem do **comandante** (`cfg.ult`).
  - `Loadout.ts`, `CardSystem.ts` e `Spawner.ts`.
- `src/render/`:
  - `BattleRenderer.ts`: onda de choque "onda" e cúpula do Domo com área real.
  - `DamageNumbers.ts`: números de dano.
  - `PlanetView.ts`: skins de planeta e escudo.
  - `HubScene.ts` e `Torre.ts`.
- `src/ui/`:
  - `Hud.ts`.
  - `Panels.ts`: pausa, build, resultado, `botao3` e `faixaTitulo`.
  - `LevelUpScreen.ts`.
  - `Bau.ts`: baú animado com 3 quadros de arte.
  - `Promocao.ts`: cerimônia de patente.
  - `PreviaUlt.ts`: prévia animada de cada ultimate em canvas.
  - `Tutorial.ts`: "coach" do tutorial guiado.
  - `meta/Hub.ts`: QG, login, loja, passe, ranking, comandantes, skins e progresso.
  - `meta/Paineis.ts`: fases, briefing, planeta, chips, modos e hangar.
  - `meta/Screens.ts`.
- `src/core/`:
  - `Game.ts`: roteamento de telas, batalha, tutorial obrigatório (`ONB_BATALHA`, `ONB_MENU`) e velocidade.
  - `Save.ts`: localStorage, migração e **reset único de teste `RESET_TESTE`**. Esse reset foi colocado na 3.3 só para o dono testar o tutorial; dá para remover depois.
  - `Nuvem.ts`: Supabase opcional, ranking.
  - `Audio.ts`: sons **sintetizados** por Web Audio. Pausa ao minimizar.
- `src/style.css`: grande. Os padrões visuais mais novos estão no final do arquivo (seções "v3", "BATALHA v3", "COACH", "BRIEFING" e outras).
- `supabase-orbita/`: migrations (saves, compras, **ranking** + view `ranking_publico` com selo ELITE vindo das compras) e Edge Functions (checkout e webhook do Mercado Pago).
- `scripts/processar_arte.py`: pipeline de arte (veja a seção 5).

## 4. Decisões de design já tomadas (não mudar sem perguntar)

**Visual e textos**
- **Sem emojis** na interface. Ícones são SVG (`ui/Icones.ts`).
- Padrão visual: painéis neon chanfrados, **botões de cantos retos**, botões grandes chanfrados (`bt3` laranja, azul, vermelho e ouro) e faixa de título com asas douradas.
- O nome do jogador aparece **sem "Cmd."**. O **nick é definitivo** depois de criado. O comandante pode ser trocado na tela **Comandantes**, que tem prévia animada da ultimate.

**Comandantes e ultimates**
- A **ultimate vem do comandante**, não da sentinela.
- 9 comandantes normais liberam com fases ou patente.
- **3 Elite (Passe Premium)** têm ultimates **exclusivas e mais fortes** (Supernova, Chuva de Cristal, Colapso do Vazio). O dono escolheu assim. Se o passe expirar, o jogador volta para o Bombardeio Orbital.

**Passe Premium**
- Dá o visual ELITE: moldura animada, nome dourado e selo.
- Dá velocidade **x3**.

**Armas, fases e dificuldade**
- **Armas novas** liberam por marco (fases 6, 9, 12, 15 e 20, ou patente Coronel), ou antes, pagando **cristais**, que se ganham jogando.
- **Estrelas:** 1 por vencer, 2 se terminar com mais de 50% de vida, 3 se terminar com mais de 90%. O **briefing** antes de cada fase mostra isso, o chefe, os inimigos e os efeitos de campo.
- **Dificuldades:** cada uma libera ao vencer a fase 10 da anterior. Os prêmios são ×1, ×2, ×3,5 e ×6.

**Contas e progresso**
- **Desistir** tem penalidade: fica com só 40% dos créditos e pontos, e perde os núcleos e o chip. A prévia aparece antes de confirmar.
- **Patentes** exigem pontos e uma fase vencida. A promoção tem uma cerimônia animada.

**Tutorial obrigatório**
- Etapas no save: `onboarding` 0 = batalha 1, 1 = tour do menu, 2 = batalha 2, 3 = concluído.
- O tutorial não pode ser pulado e o planeta não cai abaixo de 30% de vida durante ele.
- Quem já jogava antes dele pula direto para o concluído.

## 5. Pipeline de arte (quando o dono mandar imagens)

1. Coloque as imagens em `orbita-final/arte/original/` com o **nome exato** (o prefixo define o tratamento).
2. Rode `python3 scripts/processar_arte.py nome1.png nome2.png …`.
3. A saída vai para `src/assets/sprites/`, e o jogo acha sozinho (`import.meta.glob`).

Tratamento por prefixo:
- **Cortadas no conteúdo, sem o preto do fundo (modo "recorte"):** `banner_`, `patente_`, `loja_`, `premio_`, `emblema_`.
- **Sem o preto do fundo, quadradas:** `inimigo_` e `sentinela_`.
- **Cartas em JPG:** `carta_`, `tile_`, `fase_` e `modo_`.
- **`cabeca_`:** cabeça da torre que gira. Gera os dados em `cabecas.json`.
- **`talento_`:** ícones.
- **`avatar_`:** cortado em quadrado.
- **`bau_`:** os 3 quadros cortados no **mesmo enquadramento**.
- **`escudo_<cor>` e `domo_eletrico`:** brilho com o preto virando transparente.

Orientação dos sprites: **inimigos e cabeças apontam para a DIREITA**. Se vierem de outro jeito, gire antes de processar, como foi feito com o bombardeiro e o espectro.

O dono prefere prompts **uma mensagem por imagem**, com uma "Mensagem 0" de estilo (o ChatGPT junta tudo numa imagem só quando recebe a lista inteira).

## 6. Imagens e sons que FALTAM (prompts prontos)

- `arte/PROMPTS_TUDO_QUE_FALTA.md`: **36 imagens**.
  - 6 armas × (`sentinela_`, `cabeca_`, `carta_` e `carta_evo_`) para fornalha, serra, plasma, nano, espelho e portal.
  - Comandantes `avatar_10`, `avatar_11` e `avatar_12`.
  - 7 escudos: `escudo_verde`, `escudo_vermelho`, `escudo_roxo`, `escudo_dourado`, `escudo_aurora`, `escudo_premium` e `escudo_supernova`.
  - `emblema_pausa` e `domo_eletrico`.
- **Atenção ao ligar a arte:** em `Torre.ts` a cabeça das armas novas usa o nome do próprio id (`cabeca_fornalha` etc.).
- `arte/PROMPTS_SONS.md`: 23 efeitos sonoros (MP3, nomes = ids do `Audio.ts`, como `tiro`, `explosao`, `nivel`) e 3 músicas.
- **Os sons ainda não têm suporte a arquivos.** Hoje são sintetizados. Quando chegarem os MP3, carregue com `import.meta.glob` + `decodeAudioData` em `Audio.ts`, toque pelo buffer com pitch aleatório e mantenha a síntese como reserva.
- O dono queria usar o "Voice Studio" do PC dele para os sons. A sessão da nuvem não alcançava o PC.

## 7. PENDENTE (pedido do dono, ainda não feito)

1. **HUD:**
   - Barra de vida e de escudo mais bonitas.
   - Na **bolinha azul** do canto, mostrar o **planeta atual** (a skin, se houver, senão o planeta normal).
   - **Barra de nível** mais visível.
2. **Menos vida no planeta** no começo, rebalanceando a vida do planeta (`balance.ts`, em `planeta`). Confira nas simulações.
3. **Tempo limite para escolher carta** no subir de nível. Por exemplo, cerca de 15 s com contagem visível. Ao zerar, escolhe sozinho.
4. **Passe:**
   - Está fácil demais: o dono chegou ao nível 10 só com o tutorial.
   - Mudar para **60 níveis**, calculado para cerca de **1 mês** jogando.
   - Hoje `PASSE.pontosPorNivel = 1200` e as trilhas (`PASSE_PREMIOS` e `PASSE_PREMIUM`) têm 30 níveis. Elas precisam ser refeitas com 60.
   - Uma partida rende cerca de 4 a 10 mil pontos. Algo como 25 mil por nível dá cerca de 1,5 milhão no total, umas 250 partidas.
5. **Velocidade:**
   - O **x2** só libera depois de **terminar o primeiro mapa** (vencer as fases 1 a 10 no Normal).
   - O **x3** continua só para quem tem o Passe Premium. O código fica em `Game.ts`, no `velocidade:`.
6. **Testar o tutorial completo.** A batalha 1 foi testada até a ultimate. O tour do menu e a batalha 2 ainda não foram testados.
7. **Sons** (seção 6).
8. **Supabase:**
   - O dono precisa criar o projeto e passar a URL e a anon key. Elas vão em `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
   - Rodar as migrations de `supabase-orbita/migrations/`, configurar os secrets do Mercado Pago nas Edge Functions e ligar `VITE_PAGAMENTOS=mercadopago`.
   - Com isso ligam o ranking online, o login e as compras reais.
9. **Vercel** para publicar a versão web. Depois, Google Play e App Store.

## 8. Histórico resumido de versões

| Versão | O que entrou |
|---|---|
| 1.x | Base do jogo, menus neon, monetização em modo teste, APK |
| 1.3 | Balanceamento das armas e do XP |
| 1.4 | Patentes mais difíceis e cerimônia de promoção |
| 1.5 | Artes novas; o choque começa vazio |
| 1.6 | Skins e penalidade ao desistir |
| 1.7 | Áudio pausa ao minimizar |
| 1.8 e 1.9 | Padrão visual único com cantos retos |
| 2.0 e 2.1 | Baú novo com arte em 3 quadros |
| 2.2 | Setor 2 (fases 11 a 20) |
| 2.3 | 4 dificuldades |
| 2.4 e 2.5 | Elite e ranking |
| 2.6 | Inimigos novos e arte do Setor 2 |
| 2.7 | 6 armas novas, ultimates por comandante e escudos |
| 2.8 | Nick fixo e prévia das ultimates |
| 2.9 | Pausa, subir de nível, build e HUD no estilo dos mockups; o Domo fica no planeta |
| 3.0 | Área do Domo, onda de choque, aviso do chefe, números de dano e estrelas corretas |
| 3.1 e 3.2 | Briefing antes da fase |
| 3.3 | Tutorial obrigatório, x3 do Passe e reset único de teste |

## 9. Como o dono gosta de trabalhar

- Respostas em português simples, dizendo **o que mudou** em listas curtas.
- A cada versão: publicar o link web, gerar o APK novo (subindo o versionCode) e mandar uma foto de como ficou.
- Testar no navegador com o Playwright (perfil iPhone 13) antes de entregar.
- Quando ele pedir ideias, dar propostas concretas e perguntar com opções antes de construir algo grande.
