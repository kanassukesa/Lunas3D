-- Órbita Final: progresso na nuvem e compras com dinheiro real.
-- Regras: o jogador só LÊ as próprias compras; quem grava é o servidor (Edge Functions com service role).

create table if not exists public.saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  dados jsonb not null,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.compras (
  id text primary key,                         -- id do pagamento no Mercado Pago (ou da preferência enquanto pendente)
  user_id uuid not null references auth.users (id) on delete cascade,
  produto text not null,
  centavos integer not null,
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'recusado', 'estornado')),
  preferencia text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists compras_user_idx on public.compras (user_id, status);

alter table public.saves enable row level security;
alter table public.compras enable row level security;

drop policy if exists "saves: dono lê" on public.saves;
drop policy if exists "saves: dono grava" on public.saves;
drop policy if exists "saves: dono atualiza" on public.saves;
create policy "saves: dono lê" on public.saves for select using (auth.uid() = user_id);
create policy "saves: dono grava" on public.saves for insert with check (auth.uid() = user_id);
create policy "saves: dono atualiza" on public.saves for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "compras: dono lê" on public.compras;
create policy "compras: dono lê" on public.compras for select using (auth.uid() = user_id);
-- sem policy de insert/update: só o service role (Edge Functions) grava compras
