# Identidade visual — Lunas 3D

Paleta, tipografia e estilo extraídos da logo oficial (`./logo.png`).

## Conceito

A logo é **divertida, colorida e "inflada"**: letras rosas brilhantes, o "3D" em azul, contorno
amarelo, estrelinhas e linhas tracejadas como uma órbita, tudo sobre um fundo azul-céu.
O site leva essa personalidade para a interface (cantos bem arredondados, botões com cara de
"botão 3D", estrelas como elemento gráfico) sem atrapalhar o principal: **as fotos dos produtos**
ficam em cards brancos e limpos.

O toque "maker/tecnológico" vem de dois padrões sutis:

- **Grade de mesa de impressão** (`.bg-print-grid` para fundos claros, `.bg-print-grid-light` para fundos coloridos)
- **Linhas de camada** (`.bg-layer-lines`): listras horizontais finíssimas, como as camadas de uma peça impressa

## Arquivos da marca

| Arquivo | O que é |
|---|---|
| `logo.png` (raiz) | Original enviado (1280×720, fundo azul-céu). Guardado como fonte |
| `public/brand/logo.png` | Versão para o site: recortada, **fundo transparente**, 900 px de largura. Funciona em fundo claro e escuro |
| `src/app/icon.png`, `src/app/apple-icon.png` | Ícone da aba do navegador e da tela inicial do celular: o "3D" sobre fundo rosa |

## Paleta

Cores medidas direto nos pixels da logo:

| Papel | Nome | Hex | Na logo | Uso no site |
|---|---|---|---|---|
| **Primária** | Rosa Lunas | `#FF4C74` | letras "Lunas" | Decoração, estrelas, ilustrações |
| Primária (ação) | Rosa Lunas escuro | `#D81E50` (hover `#B8173F`) | sombra das letras | **Botões principais**, faixa do aviso no topo, badge de promoção |
| **Secundária** | Azul 3D | `#3FA9F5` / `#4BC7FD` | "3D" e estrelas azuis | Foco, ícones, detalhes |
| Secundária (texto) | Azul 3D escuro | `#1A6FC2` | — | Links, categoria no card, badge "sob encomenda" |
| **Destaque** | Amarelo Estrela | `#FFD84D` | contorno e estrelas | Botão de conversão especial, estrelas, títulos do rodapé |
| Base escura | Azul Profundo | `#0B2A4A` | contorno do "3D" | Textos, rodapé |
| Texto sobre amarelo | Vinho | `#46111C` | contorno do "Lunas" | Texto de botões amarelos |
| Fundo da marca | Azul Céu | `#D5ECFC` | fundo da logo | Hero, cor do tema no celular |
| Neutros | — | `#FFFFFF`, `#EEF7FE`, `#F2F6FA`, `#DDE7F0`, `#4F5D70` | — | Fundos, seções alternadas, bordas, texto secundário |

### Acessibilidade (contraste WCAG AA, mínimo de 4,5:1)

| Combinação | Contraste |
|---|---|
| Branco sobre Rosa escuro `#D81E50` | 4,97 ✅ |
| Vinho sobre Amarelo `#FFD84D` | ≈ 12 ✅ |
| Azul Profundo sobre branco | ≈ 14 ✅ |
| Azul Profundo sobre Azul Céu | ≈ 12 ✅ |
| Azul escuro `#1A6FC2` sobre branco | 5,1 ✅ |
| Branco sobre Rosa claro `#FF4C74` | 3,2 ❌ |

O rosa e o azul claros da logo **não** levam texto branco por cima. Eles ficam para decoração;
botões e textos usam as versões escuras.

## Tipografia (Google Fonts)

| Uso | Fonte | Por quê |
|---|---|---|
| Títulos, botões, preços, menu | **Fredoka** | Arredondada e "fofinha", conversa com as letras infladas da logo |
| Textos e formulários | **Nunito** | Também arredondada, muito legível em telas pequenas |

Classes: `font-display` (Fredoka) e `font-sans` (Nunito, padrão do `body`). Os títulos `h1`–`h4` já usam Fredoka.
As fontes são baixadas pelo `next/font` no build e servidas pelo próprio site.

## Componentes

**Botões** (`src/components/ui/button.tsx`): formato de pílula (`rounded-full`), texto em Fredoka,
altura mínima de 44 px e uma **sombra sólida embaixo** que "afunda" ao tocar, imitando o volume da logo.

| Variante | Quando usar |
|---|---|
| `default` (rosa) | Ação principal: "Ver produtos", "Adicionar ao carrinho", "Finalizar pedido" |
| `accent` (amarelo) | Conversão especial em fundo colorido: "Pedir orçamento" |
| `outline` / `secondary` / `ghost` | Ações secundárias |
| `whatsapp` (verde) | Qualquer botão que abre o WhatsApp |

**Cards**: fundo branco, borda azul bem clara, cantos de 24 px (`rounded-3xl`) e sombra azulada
(`shadow-card`) que cresce no hover. No card de produto ficam a foto quadrada, os badges
(promoção em rosa, "sob encomenda" em azul), a categoria em azul, o nome, as bolinhas de cor e o preço em Fredoka.

**Badges**: pílulas em Fredoka. **Inputs**: 44 px de altura, busca em pílula, texto de 16 px no celular
(evita o zoom automático do iPhone).

**Estrelas** (`src/components/brand/sparkle.tsx`): estrela de 4 pontas tirada da logo, usada em amarelo,
azul ou rosa para decorar hero e faixas. Use com moderação, 2 a 4 por seção.

## Mobile-first

- Layout pensado primeiro para ~390 px de largura.
- Header: menu (gaveta lateral), logo no centro e carrinho; a busca fica sempre visível na linha de baixo.
- Vitrine com 2 colunas no celular, 3 no tablet e 4 no desktop.
- Botão flutuante de WhatsApp sempre à mão.

## Onde está cada coisa

| O quê | Arquivo |
|---|---|
| Cores, raios, sombras, padrões | `src/app/globals.css`. No Tailwind v4 o tema fica no CSS; não existe `tailwind.config.ts` |
| Fontes | `src/app/layout.tsx` |
| Logo (componente) | `src/components/brand/logo.tsx` |
| Componentes base (shadcn/ui) | `src/components/ui/` |
