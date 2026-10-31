# Identidade visual — Lunas 3D

> ⚠️ **Paleta provisória.** O arquivo `logo.png` não estava no repositório quando a Etapa 1 foi feita,
> então a paleta abaixo foi criada a partir do nome e do conceito da marca (lua + camadas de impressão 3D).
> Assim que a logo oficial for adicionada na raiz do projeto, a paleta é extraída dela e ajustada
> **em um único lugar**: as variáveis de `:root` em `src/app/globals.css`. Nenhum componente precisa mudar.

## Conceito

**"Ideias que ganham forma, camada por camada."**
A lua (Lunas) encontra o universo maker: fundo azul-noite, um índigo vibrante como cor de ação e um
laranja "filamento" para chamar atenção. As fotos dos produtos são as protagonistas: cards brancos,
bordas suaves e fundos neutros para as peças coloridas se destacarem.

Dois elementos gráficos reforçam o tema:

- **Grade de mesa de impressão** (`.bg-print-grid`) — usada em fundos escuros (hero, CTA).
- **Linhas de camada** (`.bg-layer-lines`) — listras horizontais finíssimas, como as camadas de uma peça impressa.
  Usadas em seções claras e no espaço reservado da foto do produto.

## Paleta

| Papel | Nome | Hex | Uso |
|---|---|---|---|
| Primária | Índigo Lunar | `#4338CA` (hover `#3730A3`) | Botões principais, links, foco |
| Secundária | Lilás Nebulosa | `#A5B4FC` / fundo `#EEF0FF` | Ícones, detalhes, botões secundários |
| Destaque | Laranja Filamento | `#FF7A1A` (hover `#E8650A`) | Promoções, badges, CTA de conversão |
| Base escura | Azul Noite | `#141A3C` | Textos, header do aviso, hero, footer |
| Fundo quente | Branco Lua | `#F4F1EA` | Seções alternadas, fundo das fotos |
| Neutros | — | `#FFFFFF`, `#F3F4F7`, `#E4E6EE`, `#5B6178` | Fundo, superfícies, bordas, texto secundário |
| Estados | — | sucesso `#15803D`, aviso `#B45309`, erro `#DC2626` | Mensagens e status |

**Contraste (WCAG):** branco sobre Índigo Lunar ≈ 7,6:1 · Azul Noite sobre branco ≈ 16:1 ·
texto secundário `#5B6178` sobre branco ≈ 6:1 · texto escuro sobre Laranja Filamento ≈ 8:1.
Todos passam no nível AA (o laranja **não** é usado com texto branco).

## Tipografia (Google Fonts)

| Uso | Fonte | Pesos |
|---|---|---|
| Títulos, preços, logo | **Space Grotesk** — geométrica, com cara de tecnologia | 500, 600, 700 |
| Textos e interface | **Inter** — altíssima legibilidade em telas pequenas | variável |

Classes: `font-display` (Space Grotesk) e `font-sans` (Inter, padrão do `body`).
`h1`–`h4` usam `font-display` automaticamente. As fontes são baixadas pelo `next/font` no build
e servidas pelo próprio site (rápido e sem depender do Google no navegador do cliente).

## Componentes

**Botões** (`src/components/ui/button.tsx`) — cantos arredondados (`rounded-xl`), peso semibold,
altura mínima de 44 px (área de toque confortável no celular) e leve "afundar" ao tocar.

| Variante | Quando usar |
|---|---|
| `default` (índigo) | Ação principal da tela |
| `accent` (laranja) | Conversão: "Ver produtos", "Pedir orçamento", "Adicionar ao carrinho" |
| `secondary` / `outline` / `ghost` | Ações secundárias |
| `whatsapp` (verde) | Qualquer botão que abre o WhatsApp |

**Cards** — fundo branco, borda `#E4E6EE`, raio de 22 px (`rounded-2xl`), sombra suave
(`shadow-card`) que cresce no hover (`shadow-card-hover`). Card de produto: foto quadrada no topo,
badges no canto (promoção em laranja, "sob encomenda" em azul-noite), categoria em caixa alta índigo,
nome, bolinhas das cores disponíveis e preço em Space Grotesk.

**Raio padrão:** `--radius: 0.875rem` (14 px). **Inputs:** 44 px de altura, texto 16 px no celular
(evita o zoom automático do iPhone).

## Mobile-first

- Layout pensado primeiro para ~390 px de largura; telas maiores ganham colunas extras.
- Header: menu (gaveta lateral) · logo central · carrinho, com a busca sempre visível na linha de baixo.
- Vitrine com 2 colunas no celular, 3 no tablet, 4 no desktop.
- Botão flutuante de WhatsApp sempre acessível.

## Onde está cada coisa

| O quê | Arquivo |
|---|---|
| Cores, raios, sombras, utilitários | `src/app/globals.css` (Tailwind v4 — o tema fica no CSS, não existe `tailwind.config.ts`) |
| Fontes | `src/app/layout.tsx` |
| Logo (componente) | `src/components/brand/logo.tsx` |
| Símbolo provisório / favicon | `public/brand/logo-mark.svg`, `src/app/icon.svg` |
| Componentes base (shadcn/ui) | `src/components/ui/` |
