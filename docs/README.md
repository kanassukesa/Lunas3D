# Lunas 3D — documentação do projeto

Loja online da **Lunas 3D** (impressão 3D, Fortaleza-CE): vitrine de peças prontas + pedidos
personalizados com orçamento. Sem pagamento online — o pagamento é combinado pelo WhatsApp.

- [Checklist das etapas](#checklist-das-etapas)
- [Como rodar no seu computador (Windows)](#como-rodar-no-seu-computador-windows)
- [Configurar o Supabase](#configurar-o-supabase-passo-a-passo)
- [Como se tornar admin](#como-se-tornar-admin)
- [Arquitetura](#arquitetura)
- [Banco de dados](#banco-de-dados)
- [Identidade visual](./identidade-visual.md)

---

## Checklist das etapas

- [x] **Etapa 1 — Fundação**: projeto Next.js, identidade visual, banco (migrations + RLS + storage + seed), layout base, home provisória
- [ ] **Etapa 2 — Vitrine**: listagem com filtros/busca, página do produto (fotos, cor, quantidade), carrinho (localStorage)
- [ ] **Etapa 3 — Contas e checkout**: login Google + e-mail, Minha Conta, endereços, checkout (retirada ou frete Melhor Envio), confirmação + WhatsApp
- [ ] **Etapa 4 — Pedido personalizado**: formulário com upload de fotos, fluxo de orçamento e aprovação
- [ ] **Etapa 5 — Painel admin**: dashboard, produtos, cores, categorias, pedidos, orçamentos, conteúdo do site
- [ ] **Etapa 6 — Qualidade**: e-mails (Resend), SEO, performance, acessibilidade e testes
- [ ] **Etapa 7 — Deploy** na Vercel

---

## Como rodar no seu computador (Windows)

### 1. Ferramentas necessárias

Abra o **PowerShell** (menu Iniciar → digite "PowerShell") e rode, um por vez:

```powershell
node -v          # mostra a versão do Node.js — precisa ser 20.9 ou maior (recomendado: 22 ou 24 LTS)
npm -v           # mostra a versão do npm (vem junto com o Node)
git --version    # mostra a versão do Git
```

Se algum comando der erro "não é reconhecido":

| Falta | Como instalar |
|---|---|
| Node.js + npm | Baixe a versão **LTS** em <https://nodejs.org> → instale com as opções padrão → **feche e abra** o PowerShell |
| Git | Baixe em <https://git-scm.com/download/win> → instale com as opções padrão → feche e abra o PowerShell |

Recomendado: editor **VS Code** (<https://code.visualstudio.com>) com as extensões *ESLint*, *Tailwind CSS IntelliSense* e *PostgreSQL* (opcional).

### 2. Baixar o projeto

```powershell
cd $HOME\Documents                                       # entra na pasta Documentos
git clone https://github.com/kanassukesa/Lunas3D.git     # baixa o projeto do GitHub
cd Lunas3D                                               # entra na pasta do projeto
git checkout claude/lunas-3d-foundation-ophf4v           # muda para o branch da Etapa 1
npm install                                              # instala as dependências (cria a pasta node_modules)
```

### 3. Variáveis de ambiente

```powershell
Copy-Item .env.example .env.local     # cria o seu arquivo de configuração (nunca vai para o Git)
code .env.local                       # abre no VS Code para preencher (ou use o Bloco de Notas)
```

Preencha conforme a seção [Configurar o Supabase](#configurar-o-supabase-passo-a-passo).

> O site **abre mesmo sem o Supabase configurado** (mostra um aviso amarelo e textos padrão),
> então você já pode rodar o passo 4 para ver o layout.

### 4. Rodar

```powershell
npm run dev       # inicia o site em modo desenvolvimento → abra http://localhost:3000
```

Para parar: `Ctrl + C` no PowerShell.

### Comandos úteis

| Comando | O que faz |
|---|---|
| `npm run dev` | Site local com recarregamento automático |
| `npm run build` | Gera a versão de produção (o mesmo que a Vercel fará) — bom para achar erros |
| `npm run start` | Roda a versão gerada pelo build |
| `npm run lint` | Verifica problemas no código (ESLint) |
| `npm run typecheck` | Verifica os tipos TypeScript |
| `npm run check` | lint + typecheck |
| `npm run db:link` | Liga a pasta ao seu projeto Supabase (uma vez) |
| `npm run db:push` | Aplica as migrations novas no banco do Supabase |
| `npm run db:types` | Regenera `src/types/database.ts` a partir do banco |

---

## Configurar o Supabase (passo a passo)

### 1. Criar o projeto

1. Acesse <https://supabase.com> → **Start your project** → entre com sua conta do GitHub (ou e-mail).
2. Clique em **New project**.
   - **Organization**: a sua (crie uma se pedir — plano *Free*).
   - **Project name**: `lunas3d`.
   - **Database password**: clique em *Generate a password* e **guarde essa senha** num lugar seguro (vai precisar no passo 3).
   - **Region**: *South America (São Paulo)* — mais perto de Fortaleza = mais rápido.
3. Clique em **Create new project** e espere 1–2 minutos.

### 2. Copiar as chaves para o `.env.local`

1. No painel do projeto, clique em **Project Settings** (engrenagem, no canto inferior esquerdo).
2. **Data API** (ou **API**): copie a **Project URL** → cole em `NEXT_PUBLIC_SUPABASE_URL`.
3. **API Keys**:
   - **Publishable key** (`sb_publishable_...`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **Secret key** (`sb_secret_...`, clique em *Reveal*) → `SUPABASE_SECRET_KEY`
   - Se o seu painel só mostrar as chaves antigas (aba *Legacy API keys*): use a `anon` em
     `NEXT_PUBLIC_SUPABASE_ANON_KEY` e a `service_role` em `SUPABASE_SERVICE_ROLE_KEY`.

> 🔒 A **secret key** dá acesso total ao banco. Nunca a coloque em variável `NEXT_PUBLIC_`,
> nunca mande em print ou mensagem e nunca faça commit dela.

### 3. Criar as tabelas (migrations)

**Opção A — pelo terminal (recomendada, mantém o histórico de versões):**

```powershell
npx supabase login                                  # abre o navegador para autorizar o Supabase CLI
npx supabase link --project-ref SEU_PROJECT_REF     # liga a pasta ao projeto; pede a senha do banco (passo 1)
npx supabase db push                                # cria tabelas, RLS, buckets e configurações padrão
```

O `SEU_PROJECT_REF` é o código do projeto: o trecho `abcdefghijklmno` da URL
`https://abcdefghijklmno.supabase.co` (também aparece em *Project Settings → General → Project ID*).
O `db push` lista as migrations e pergunta se pode aplicar — responda `Y`.

**Opção B — pelo navegador (SQL Editor):**
No painel, **SQL Editor → New query**. Abra cada arquivo de `supabase/migrations/` **na ordem do nome**
(`...000100`, `...000200`, ... `...000500`), copie todo o conteúdo, cole e clique em **Run**.

### 4. Dados de exemplo (seed)

No painel: **SQL Editor → New query** → cole todo o conteúdo de `supabase/seed.sql` → **Run**.
Isso cria 3 categorias, 6 cores e 4 produtos. Pode rodar de novo sem duplicar.

Confira em **Table Editor**: as tabelas `categories`, `colors`, `products` e `site_settings` devem ter dados.
Em **Storage** devem aparecer os buckets `products` (público) e `references` (privado).

### 5. Configurar a URL do site no Auth

**Authentication → URL Configuration**:
- **Site URL**: `http://localhost:3000`
- **Redirect URLs** → *Add URL*: `http://localhost:3000/**`

(O login com Google — Google Cloud Console — será configurado passo a passo na **Etapa 3**.)

### 6. Testar

Reinicie o `npm run dev` (`Ctrl + C` e rode de novo). A home deve mostrar as categorias e os 4 produtos,
sem o aviso amarelo, e o rodapé deve exibir WhatsApp, e-mail, Instagram e horário vindos da tabela `site_settings`.
Experimente: no **Table Editor → site_settings**, edite o valor de `business_hours` e recarregue a página.

---

## Como se tornar admin

Todo cadastro novo entra como `customer`. Para virar `admin`:

1. **Crie seu usuário.** A tela de login chega na Etapa 3; por enquanto, pelo painel:
   **Authentication → Users → Add user → Create new user** → seu e-mail e uma senha →
   marque **Auto Confirm User** → **Create user**.
   (O trigger `on_auth_user_created` cria automaticamente sua linha em `profiles`.)
2. **SQL Editor → New query**, cole e rode (troque pelo seu e-mail):

   ```sql
   update public.profiles
      set role = 'admin'
    where email = 'seu-email@gmail.com';
   ```

3. Confira: `select email, role from public.profiles;`

Depois que você entrar com o Google na Etapa 3, se usar o **mesmo e-mail**, o Supabase vincula
as duas formas de login à mesma conta. Por segurança, um cliente **não consegue** mudar o próprio
`role` pelo site — o banco bloqueia (trigger `protect_profile_role`); só o SQL Editor ou outro admin.

---

## Arquitetura

```
Navegador (celular/desktop)
   │  HTML gerado no servidor + componentes interativos (React)
   ▼
Next.js 16 (App Router)  ── src/proxy.ts renova a sessão do Supabase a cada requisição
   │   Server Components / Server Actions  → @supabase/ssr com o login do usuário (RLS vale)
   │   Operações sensíveis (criar pedido)   → cliente "admin" com a secret key, só no servidor
   ▼
Supabase
   ├─ Postgres  (tabelas + Row Level Security em todas)
   ├─ Auth      (Google + e-mail/senha) → trigger cria o profile
   └─ Storage   products (público) · references (privado, URLs assinadas)
Serviços externos: Resend (e-mails) · Melhor Envio (frete) · wa.me (WhatsApp, sem API paga)
```

### Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) + React 19 + TypeScript |
| Estilo | Tailwind CSS v4 (tema em `globals.css`) + componentes no padrão shadcn/ui (Radix UI) |
| Banco/Auth/Arquivos | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) |
| Formulários/validação | React Hook Form + Zod |
| E-mail / frete | Resend / Melhor Envio (a partir das Etapas 3 e 6) |

**Decisão:** o recurso *Cache Components* do Next 16 está **desligado** (`next.config.ts`). Quase todas
as páginas dependem de login, carrinho ou conteúdo editado no painel; o modelo "dinâmico por padrão" é
mais simples e previsível. Pode ser religado na Etapa 6 para otimizar páginas públicas.

### Estrutura de pastas

```
├─ docs/                       documentação (este arquivo, identidade visual)
├─ logo.png                    logo original
├─ public/brand/logo.png       logo recortada (fundo transparente) usada no site
├─ supabase/
│  ├─ config.toml              configuração do Supabase CLI
│  ├─ migrations/              SQL versionado (aplicado em ordem pelo nome)
│  └─ seed.sql                 dados de exemplo
├─ src/
│  ├─ proxy.ts                 roda antes de cada página (sessão + proteção de /conta e /admin)
│  ├─ app/
│  │  ├─ layout.tsx            HTML raiz, fontes, metadados
│  │  ├─ globals.css           design tokens (cores, raios, sombras)
│  │  ├─ not-found.tsx         página 404
│  │  └─ (store)/              páginas públicas da loja (com header/footer)
│  │     ├─ layout.tsx
│  │     └─ page.tsx           home
│  ├─ components/
│  │  ├─ ui/                   botões, inputs, cards... (shadcn/ui)
│  │  ├─ layout/               header, footer, busca, carrinho, menu mobile
│  │  ├─ product/              card de produto, preço
│  │  └─ brand/                logo e ícones
│  ├─ lib/
│  │  ├─ supabase/             client.ts (navegador) · server.ts · admin.ts (secret) · proxy.ts
│  │  ├─ site-settings.ts      lê o conteúdo editável (com padrões e validação Zod)
│  │  ├─ catalog.ts            consultas de produtos e categorias
│  │  ├─ cart/storage.ts       carrinho no localStorage
│  │  ├─ format.ts             R$, CEP, telefone, link do WhatsApp
│  │  └─ env.ts / storage.ts / utils.ts
│  └─ types/database.ts        tipos gerados do banco (npm run db:types)
└─ .env.example                modelo das variáveis de ambiente
```

---

## Banco de dados

| Tabela | Para quê |
|---|---|
| `profiles` | 1 por usuário (nome, telefone, `role`: customer/admin). Criada pelo trigger ao cadastrar |
| `categories` | Categorias da vitrine |
| `colors` | Paleta geral de filamentos (nome + hex) |
| `products` | Produtos: preço, promoção (com validade opcional), estoque ou sob encomenda, peso/dimensões, status (rascunho/ativo/arquivado) |
| `product_images` | Fotos (ordem + uma capa por produto) — bucket `products` |
| `product_colors` | Cores disponíveis por produto + acréscimo de preço opcional |
| `addresses` | Endereços salvos do cliente (um padrão) |
| `orders` | Pedidos (número a partir de 1001), entrega, frete, rastreio, totais e *snapshot* dos dados do cliente |
| `order_items` | Itens com *snapshot* de nome, cor e preço no momento da compra |
| `order_status_history` | Linha do tempo do pedido — preenchida **automaticamente** por trigger a cada mudança de status |
| `custom_requests` | Pedidos personalizados/orçamentos (número a partir de 5001) + resposta do admin |
| `custom_request_images` | Fotos de referência — bucket privado `references` |
| `custom_request_status_history` | Linha do tempo do orçamento (tabela extra, para o cliente acompanhar) |
| `site_settings` | Conteúdo editável do site (chave → JSON). `is_public = false` esconde do público |

**Funções do banco**

- `is_admin()` — usada pelas políticas RLS.
- `admin_set_order_status(pedido, status, nota, rastreio)` — admin muda o status com observação; a nota vai para a linha do tempo.
- `respond_to_quote(orçamento, aprovar)` — cliente aprova/recusa um orçamento respondido.
- Regras automáticas: código de rastreio obrigatório para "enviado" (Correios); "pronto para retirada" só para retirada;
  cliente não consegue preencher preço/status ao criar orçamento.

**Segurança (RLS)** — visitante vê só produtos ativos e configurações públicas; cliente vê só os próprios
perfis, endereços, pedidos e orçamentos; admin vê tudo. Pedidos **não** podem ser criados direto pelo
navegador: o servidor recalcula preços e frete e grava com a secret key (Etapa 3), evitando que alguém
altere o total. No Storage, cada cliente só envia/lê fotos na pasta `references/{seu-id}/...`.

As políticas foram testadas localmente simulando visitante, dois clientes e um admin.

### Criando novas migrations

Nunca edite uma migration já aplicada. Crie uma nova:

```powershell
npx supabase migration new nome_da_mudanca   # cria supabase/migrations/<data>_nome_da_mudanca.sql
# escreva o SQL no arquivo, depois:
npm run db:push
npm run db:types                              # atualiza os tipos TypeScript
```
