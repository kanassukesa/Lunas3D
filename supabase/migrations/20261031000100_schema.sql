-- =============================================================================
-- Lunas 3D — Migration 0001: schema base (tipos, tabelas, índices, triggers utilitários)
-- =============================================================================
-- Convenções:
--   * Todas as tabelas ficam no schema "public" e têm RLS ativado (migration 0003).
--   * Valores monetários em numeric(10,2) (reais).
--   * Peso em gramas e dimensões em centímetros (formato usado pelo Melhor Envio).
--   * Pedidos e orçamentos guardam "fotografias" (snapshots) dos dados no momento
--     da compra — se o produto mudar de preço depois, o pedido antigo não muda.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- -----------------------------------------------------------------------------
-- Tipos enumerados
-- -----------------------------------------------------------------------------
create type public.user_role as enum ('customer', 'admin');

create type public.product_status as enum ('draft', 'active', 'archived');

create type public.stock_mode as enum ('in_stock', 'made_to_order');

create type public.order_status as enum (
  'awaiting_payment',  -- aguardando pagamento
  'paid',              -- pago
  'in_production',     -- em produção
  'ready_for_pickup',  -- pronto para retirada
  'shipped',           -- enviado (com código de rastreio)
  'delivered',         -- entregue
  'cancelled'          -- cancelado
);

create type public.delivery_method as enum ('pickup', 'shipping');

create type public.order_origin as enum ('catalog', 'custom');

create type public.custom_request_status as enum (
  'pending',    -- aguardando análise do admin
  'quoted',     -- orçamento enviado ao cliente
  'approved',   -- cliente aprovou
  'rejected',   -- cliente recusou
  'converted',  -- virou pedido
  'cancelled'   -- cancelado
);

-- -----------------------------------------------------------------------------
-- Função utilitária: mantém updated_at atualizado
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles: 1 linha por usuário do Supabase Auth
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text,
  phone       text,
  avatar_url  text,
  role        public.user_role not null default 'customer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.profiles is 'Dados do cliente/admin. Criado automaticamente pelo trigger on_auth_user_created.';

-- -----------------------------------------------------------------------------
-- categories
-- -----------------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  image_path  text,                       -- caminho no bucket "products" (opcional)
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- colors: paleta geral de filamentos
-- -----------------------------------------------------------------------------
create table public.colors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (length(trim(name)) > 0),
  hex         text not null check (hex ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- products
-- -----------------------------------------------------------------------------
create table public.products (
  id                uuid primary key default gen_random_uuid(),
  category_id       uuid references public.categories (id) on delete set null,
  name              text not null check (length(trim(name)) > 0),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_description text,
  description       text,
  price             numeric(10,2) not null check (price >= 0),
  promo_price       numeric(10,2) check (promo_price is null or (promo_price >= 0 and promo_price < price)),
  promo_ends_at     timestamptz,          -- opcional: promoção expira sozinha
  stock_mode        public.stock_mode not null default 'in_stock',
  stock_quantity    integer not null default 0 check (stock_quantity >= 0),
  production_days   integer check (production_days is null or production_days >= 0), -- prazo quando "sob encomenda"
  weight_grams      integer not null default 100 check (weight_grams > 0),
  length_cm         numeric(6,1) not null default 10 check (length_cm > 0),
  width_cm          numeric(6,1) not null default 10 check (width_cm > 0),
  height_cm         numeric(6,1) not null default 10 check (height_cm > 0),
  status            public.product_status not null default 'draft',
  is_featured       boolean not null default false,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
create index products_status_idx on public.products (status);
-- Busca textual simples (nome + descrição curta), em português
create index products_search_idx on public.products
  using gin (to_tsvector('portuguese', coalesce(name, '') || ' ' || coalesce(short_description, '')));

-- -----------------------------------------------------------------------------
-- product_images: várias fotos por produto, com ordem e capa
-- -----------------------------------------------------------------------------
create table public.product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products (id) on delete cascade,
  storage_path  text not null,           -- caminho no bucket público "products"
  alt           text,
  sort_order    integer not null default 0,
  is_cover      boolean not null default false,
  created_at    timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, sort_order);
-- No máximo UMA capa por produto
create unique index product_images_one_cover_idx on public.product_images (product_id) where is_cover;

-- -----------------------------------------------------------------------------
-- product_colors: quais cores cada produto aceita (+ acréscimo opcional)
-- -----------------------------------------------------------------------------
create table public.product_colors (
  product_id    uuid not null references public.products (id) on delete cascade,
  color_id      uuid not null references public.colors (id) on delete cascade,
  price_delta   numeric(10,2) not null default 0 check (price_delta >= 0),
  is_available  boolean not null default true,
  primary key (product_id, color_id)
);
create index product_colors_color_idx on public.product_colors (color_id);

-- -----------------------------------------------------------------------------
-- addresses: endereços salvos do cliente
-- -----------------------------------------------------------------------------
create table public.addresses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  label           text,                   -- "Casa", "Trabalho"...
  recipient_name  text not null,
  phone           text,
  cep             text not null check (cep ~ '^[0-9]{8}$'),
  street          text not null,
  number          text not null,
  complement      text,
  neighborhood    text not null,
  city            text not null,
  state           char(2) not null check (state ~ '^[A-Z]{2}$'),
  is_default      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (user_id);
create unique index addresses_one_default_idx on public.addresses (user_id) where is_default;

-- -----------------------------------------------------------------------------
-- custom_requests: pedidos personalizados (orçamentos)
-- (criada antes de orders porque orders referencia custom_requests)
-- -----------------------------------------------------------------------------
create table public.custom_requests (
  id                uuid primary key default gen_random_uuid(),
  request_number    bigint generated always as identity (start with 5001) unique,
  user_id           uuid not null references public.profiles (id) on delete cascade,
  status            public.custom_request_status not null default 'pending',

  -- Dados enviados pelo cliente
  description       text not null check (length(trim(description)) >= 10),
  dimensions        text,                 -- "aprox. 15 x 10 x 5 cm"
  desired_colors    text,
  quantity          integer not null default 1 check (quantity between 1 and 10000),
  desired_deadline  date,
  purpose           text,                 -- presente, decoração, peça técnica...
  notes             text,
  delivery_method   public.delivery_method not null default 'pickup',
  shipping_address  jsonb,                -- snapshot do endereço, se envio

  -- Resposta do admin (orçamento)
  quoted_price          numeric(10,2) check (quoted_price is null or quoted_price >= 0),
  quoted_shipping_cost  numeric(10,2) check (quoted_shipping_cost is null or quoted_shipping_cost >= 0),
  quoted_deadline_days  integer check (quoted_deadline_days is null or quoted_deadline_days >= 0),
  admin_message         text,
  quoted_at             timestamptz,
  customer_responded_at timestamptz,

  order_id          uuid,                 -- preenchido quando vira pedido (FK adicionada abaixo)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index custom_requests_user_idx on public.custom_requests (user_id, created_at desc);
create index custom_requests_status_idx on public.custom_requests (status);

create table public.custom_request_images (
  id                uuid primary key default gen_random_uuid(),
  custom_request_id uuid not null references public.custom_requests (id) on delete cascade,
  storage_path      text not null,        -- caminho no bucket PRIVADO "references"
  file_name         text,
  mime_type         text check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes        integer check (size_bytes > 0 and size_bytes <= 10485760),
  created_at        timestamptz not null default now()
);
create index custom_request_images_request_idx on public.custom_request_images (custom_request_id);

-- Linha do tempo do orçamento (o cliente vê)
create table public.custom_request_status_history (
  id                uuid primary key default gen_random_uuid(),
  custom_request_id uuid not null references public.custom_requests (id) on delete cascade,
  status            public.custom_request_status not null,
  note              text,
  created_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now()
);
create index custom_request_history_idx on public.custom_request_status_history (custom_request_id, created_at);

-- -----------------------------------------------------------------------------
-- orders
-- -----------------------------------------------------------------------------
create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        bigint generated always as identity (start with 1001) unique,
  user_id             uuid not null references public.profiles (id) on delete restrict,
  origin              public.order_origin not null default 'catalog',
  custom_request_id   uuid references public.custom_requests (id) on delete set null,
  status              public.order_status not null default 'awaiting_payment',

  -- Snapshot do cliente
  customer_name       text not null,
  customer_email      text not null,
  customer_phone      text,

  -- Entrega
  delivery_method     public.delivery_method not null,
  shipping_address    jsonb,              -- snapshot do endereço (se envio)
  shipping_service    text,               -- ex.: "Correios PAC"
  shipping_service_id text,               -- id do serviço no Melhor Envio
  shipping_days       integer,
  shipping_cost       numeric(10,2) not null default 0 check (shipping_cost >= 0),
  tracking_code       text,

  -- Valores
  subtotal            numeric(10,2) not null check (subtotal >= 0),
  discount            numeric(10,2) not null default 0 check (discount >= 0),
  total               numeric(10,2) not null check (total >= 0),

  customer_notes      text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint orders_shipping_address_required
    check (delivery_method = 'pickup' or shipping_address is not null)
);
create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);

alter table public.custom_requests
  add constraint custom_requests_order_fk
  foreign key (order_id) references public.orders (id) on delete set null;

create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  product_id    uuid references public.products (id) on delete set null,
  product_name  text not null,
  product_slug  text,
  image_path    text,
  color_id      uuid references public.colors (id) on delete set null,
  color_name    text,
  color_hex     text,
  unit_price    numeric(10,2) not null check (unit_price >= 0),
  quantity      integer not null check (quantity > 0),
  line_total    numeric(10,2) generated always as (unit_price * quantity) stored,
  created_at    timestamptz not null default now()
);
create index order_items_order_idx on public.order_items (order_id);

create table public.order_status_history (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  status        public.order_status not null,
  note          text,
  tracking_code text,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index order_status_history_idx on public.order_status_history (order_id, created_at);

-- -----------------------------------------------------------------------------
-- site_settings: conteúdo editável pelo painel (chave → valor JSON)
-- -----------------------------------------------------------------------------
create table public.site_settings (
  key         text primary key check (key ~ '^[a-z0-9_]+$'),
  value       jsonb not null,
  is_public   boolean not null default true, -- false = só admin lê
  description text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles (id) on delete set null
);

-- -----------------------------------------------------------------------------
-- Triggers de updated_at
-- -----------------------------------------------------------------------------
create trigger set_updated_at before update on public.profiles        for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.categories      for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.colors          for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.products        for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.addresses       for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.custom_requests for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.orders          for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.site_settings   for each row execute function public.set_updated_at();
