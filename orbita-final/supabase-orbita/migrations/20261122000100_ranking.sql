-- Órbita Final: ranking global por modo (Elo/patente, Campanha, Sobrevivência, Jornada da semana, Desafio do dia).
-- Cada jogador grava só a PRÓPRIA linha; todo mundo lê o ranking pela view pública.
-- O selo ELITE (Passe Premium) NÃO vem do cliente: a view calcula a partir das compras aprovadas (gravadas só pelo servidor).

create table if not exists public.ranking (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 3 and 14),
  avatar smallint not null default 1 check (avatar between 1 and 9),
  patente smallint not null default 0 check (patente between 0 and 9),
  pontos bigint not null default 0 check (pontos between 0 and 100000000),
  estrelas integer not null default 0 check (estrelas between 0 and 240),
  sobrevivencia integer not null default 0 check (sobrevivencia between 0 and 86400),
  jornada_semana text not null default '',
  jornada smallint not null default 0 check (jornada between 0 and 10),
  diario_dia text not null default '',
  diario integer not null default 0 check (diario between 0 and 86400),
  atualizado_em timestamptz not null default now()
);
create index if not exists ranking_pontos_idx on public.ranking (pontos desc);
create index if not exists ranking_estrelas_idx on public.ranking (estrelas desc);
create index if not exists ranking_sobrev_idx on public.ranking (sobrevivencia desc);
create index if not exists ranking_jornada_idx on public.ranking (jornada_semana, jornada desc);
create index if not exists ranking_diario_idx on public.ranking (diario_dia, diario desc);

alter table public.ranking enable row level security;
drop policy if exists "ranking: dono grava" on public.ranking;
drop policy if exists "ranking: dono atualiza" on public.ranking;
create policy "ranking: dono grava" on public.ranking for insert with check (auth.uid() = user_id);
create policy "ranking: dono atualiza" on public.ranking for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- sem policy de select na tabela: a leitura pública é só pela view abaixo (sem expor user_id)

create or replace view public.ranking_publico as
select
  md5(r.user_id::text) as id,
  r.user_id = auth.uid() as eu,
  r.nome,
  case when r.avatar >= 7 and not e.elite then 1 else r.avatar end as avatar,
  e.elite,
  r.patente, r.pontos, r.estrelas, r.sobrevivencia, r.jornada_semana, r.jornada, r.diario_dia, r.diario
from public.ranking r
cross join lateral (
  select exists (
    select 1 from public.compras c
    where c.user_id = r.user_id and c.produto = 'passe_premium' and c.status = 'aprovado'
      and date_trunc('month', c.criado_em) = date_trunc('month', now())
  ) as elite
) e;

grant select on public.ranking_publico to anon, authenticated;
