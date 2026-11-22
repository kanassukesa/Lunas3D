-- Órbita Final: TUDO de uma vez (saves, compras, ranking e clãs).
-- Cole no Supabase: SQL Editor → New query → cole tudo → Run. Pode rodar de novo sem problema.

-- ================================================================ migrations/20261121000100_monetizacao.sql
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

-- ================================================================ migrations/20261122000100_ranking.sql
-- Órbita Final: ranking global por modo (Elo/patente, Campanha, Sobrevivência, Jornada da semana, Desafio do dia).
-- Cada jogador grava só a PRÓPRIA linha; todo mundo lê o ranking pela view pública.
-- O selo ELITE (Passe Premium) NÃO vem do cliente: a view calcula a partir das compras aprovadas (gravadas só pelo servidor).

create table if not exists public.ranking (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 3 and 14),
  avatar smallint not null default 1 check (avatar between 1 and 12),
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
  case when r.avatar between 7 and 9 and not e.elite then 1 else r.avatar end as avatar,  -- 7-9 = comandantes ELITE
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

-- comandantes 10-12 (Geada, Enxame, Fagulha): amplia o limite em bancos que já tinham a regra antiga (1-9)
alter table public.ranking drop constraint if exists ranking_avatar_check;
alter table public.ranking add constraint ranking_avatar_check check (avatar between 1 and 12);

-- ================================================================ migrations/20261122000200_cla.sql
-- Órbita Final: clãs (criar/entrar/sair, cargos, chat e ranking de clãs).
-- Segurança: as tabelas ficam fechadas (RLS sem policies). O jogo só LÊ pelas views e só MUDA pelas funções
-- abaixo, que conferem quem está chamando (auth.uid()). Um jogador participa de no máximo 1 clã.

create table if not exists public.clas (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 3 and 16),
  tag text not null check (tag ~ '^[A-Z0-9]{2,4}$'),
  descricao text not null default '' check (char_length(descricao) <= 80),
  emblema smallint not null default 1 check (emblema between 1 and 8),
  aberto boolean not null default true,
  criado_em timestamptz not null default now()
);
create unique index if not exists clas_nome_unq on public.clas (lower(nome));
create unique index if not exists clas_tag_unq on public.clas (tag);

create table if not exists public.cla_membros (
  user_id uuid primary key references auth.users (id) on delete cascade,  -- primary key = 1 clã por jogador
  cla_id uuid not null references public.clas (id) on delete cascade,
  cargo text not null default 'membro' check (cargo in ('lider', 'oficial', 'membro')),
  entrou_em timestamptz not null default now()
);
create index if not exists cla_membros_cla_idx on public.cla_membros (cla_id);

create table if not exists public.cla_chat (
  id bigint generated always as identity primary key,
  cla_id uuid not null references public.clas (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 200),
  criado_em timestamptz not null default now()
);
create index if not exists cla_chat_idx on public.cla_chat (cla_id, criado_em desc);

alter table public.clas enable row level security;
alter table public.cla_membros enable row level security;
alter table public.cla_chat enable row level security;

-- clã de quem está chamando (null se não estiver em nenhum)
create or replace function public.meu_cla() returns uuid
language sql stable security definer set search_path = public as $$
  select cla_id from public.cla_membros where user_id = auth.uid()
$$;

-- ------------------------------------------------------------------ leitura (views)

-- todos os clãs com total de membros e pontos somados (ranking de clãs)
create or replace view public.clas_ranking as
select c.id, c.nome, c.tag, c.descricao, c.emblema, c.aberto,
  count(m.user_id)::int as membros,
  coalesce(sum(r.pontos), 0)::bigint as pontos,
  coalesce(sum(r.estrelas), 0)::int as estrelas,
  coalesce(c.id = public.meu_cla(), false) as meu
from public.clas c
left join public.cla_membros m on m.cla_id = c.id
left join public.ranking r on r.user_id = m.user_id
group by c.id;

-- membros do MEU clã (sem expor user_id)
create or replace view public.cla_membros_publico as
select md5(m.user_id::text) as id, m.user_id = auth.uid() as eu, m.cargo, m.entrou_em,
  coalesce(rp.nome, 'Comandante') as nome, coalesce(rp.avatar, 1) as avatar, coalesce(rp.elite, false) as elite,
  coalesce(rp.patente, 0) as patente, coalesce(rp.pontos, 0) as pontos
from public.cla_membros m
left join public.ranking_publico rp on rp.id = md5(m.user_id::text)
where m.cla_id = public.meu_cla();

-- chat do MEU clã
create or replace view public.cla_chat_publico as
select ch.id, md5(ch.user_id::text) as autor, ch.user_id = auth.uid() as eu,
  coalesce(r.nome, 'Comandante') as nome, ch.texto, ch.criado_em
from public.cla_chat ch
left join public.ranking r on r.user_id = ch.user_id
where ch.cla_id = public.meu_cla();

grant select on public.clas_ranking, public.cla_membros_publico, public.cla_chat_publico to anon, authenticated;

-- ------------------------------------------------------------------ ações (funções)

create or replace function public.criar_cla(p_nome text, p_tag text, p_descricao text, p_emblema smallint)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Entre na sua conta primeiro'; end if;
  if exists (select 1 from cla_membros where user_id = auth.uid()) then raise exception 'Você já está em um clã'; end if;
  if char_length(trim(p_nome)) not between 3 and 16 then raise exception 'O nome precisa ter de 3 a 16 letras'; end if;
  if upper(trim(p_tag)) !~ '^[A-Z0-9]{2,4}$' then raise exception 'A tag precisa ter de 2 a 4 letras ou números'; end if;
  if exists (select 1 from clas where lower(nome) = lower(trim(p_nome))) then raise exception 'Já existe um clã com esse nome'; end if;
  if exists (select 1 from clas where tag = upper(trim(p_tag))) then raise exception 'Essa tag já está em uso'; end if;
  insert into clas (nome, tag, descricao, emblema)
    values (trim(p_nome), upper(trim(p_tag)), left(coalesce(trim(p_descricao), ''), 80), greatest(1, least(8, coalesce(p_emblema, 1))))
    returning id into v_id;
  insert into cla_membros (user_id, cla_id, cargo) values (auth.uid(), v_id, 'lider');
  return v_id;
end $$;

create or replace function public.entrar_cla(p_cla uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Entre na sua conta primeiro'; end if;
  if exists (select 1 from cla_membros where user_id = auth.uid()) then raise exception 'Você já está em um clã'; end if;
  perform 1 from clas where id = p_cla for update;  -- trava o clã enquanto conta as vagas
  if not exists (select 1 from clas where id = p_cla and aberto) then raise exception 'Esse clã não está aceitando membros'; end if;
  if (select count(*) from cla_membros where cla_id = p_cla) >= 30 then raise exception 'Clã cheio (30/30)'; end if;
  insert into cla_membros (user_id, cla_id) values (auth.uid(), p_cla);
end $$;

-- sair: se o líder sair, passa a liderança (oficial mais antigo, senão o membro mais antigo); último a sair apaga o clã
create or replace function public.sair_cla()
returns void language plpgsql security definer set search_path = public as $$
declare v_cla uuid; v_cargo text; v_novo uuid;
begin
  select cla_id, cargo into v_cla, v_cargo from cla_membros where user_id = auth.uid();
  if v_cla is null then return; end if;
  delete from cla_membros where user_id = auth.uid();
  if v_cargo = 'lider' then
    select user_id into v_novo from cla_membros where cla_id = v_cla order by (cargo = 'oficial') desc, entrou_em limit 1;
    if v_novo is null then delete from clas where id = v_cla;
    else update cla_membros set cargo = 'lider' where user_id = v_novo; end if;
  end if;
end $$;

-- líder expulsa qualquer um; oficial expulsa só membros. p_membro = id da view (md5)
create or replace function public.expulsar_membro(p_membro text)
returns void language plpgsql security definer set search_path = public as $$
declare v_cla uuid; v_cargo text; v_alvo uuid; v_alvo_cargo text;
begin
  select cla_id, cargo into v_cla, v_cargo from cla_membros where user_id = auth.uid();
  if v_cargo is null or v_cargo = 'membro' then raise exception 'Só o líder ou os oficiais podem expulsar'; end if;
  select user_id, cargo into v_alvo, v_alvo_cargo from cla_membros where cla_id = v_cla and md5(user_id::text) = p_membro;
  if v_alvo is null or v_alvo = auth.uid() then raise exception 'Membro não encontrado'; end if;
  if v_alvo_cargo = 'lider' or (v_alvo_cargo = 'oficial' and v_cargo <> 'lider') then raise exception 'Você não pode expulsar esse membro'; end if;
  delete from cla_membros where user_id = v_alvo;
end $$;

-- líder promove membro a oficial (ou rebaixa oficial a membro)
create or replace function public.alternar_oficial(p_membro text)
returns void language plpgsql security definer set search_path = public as $$
declare v_cla uuid; v_cargo text;
begin
  select cla_id, cargo into v_cla, v_cargo from cla_membros where user_id = auth.uid();
  if v_cargo is distinct from 'lider' then raise exception 'Só o líder pode promover'; end if;
  update cla_membros set cargo = case when cargo = 'oficial' then 'membro' else 'oficial' end
    where cla_id = v_cla and md5(user_id::text) = p_membro and cargo <> 'lider';
end $$;

create or replace function public.editar_cla(p_descricao text, p_aberto boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_cla uuid; v_cargo text;
begin
  select cla_id, cargo into v_cla, v_cargo from cla_membros where user_id = auth.uid();
  if v_cargo is distinct from 'lider' then raise exception 'Só o líder pode editar o clã'; end if;
  update clas set descricao = left(coalesce(trim(p_descricao), ''), 80), aberto = coalesce(p_aberto, true) where id = v_cla;
end $$;

-- chat: no máximo 3 mensagens a cada 10 segundos por jogador
create or replace function public.enviar_chat(p_texto text)
returns void language plpgsql security definer set search_path = public as $$
declare v_cla uuid;
begin
  v_cla := meu_cla();
  if v_cla is null then raise exception 'Você não está em um clã'; end if;
  if char_length(trim(coalesce(p_texto, ''))) = 0 then return; end if;
  if (select count(*) from cla_chat where user_id = auth.uid() and criado_em > now() - interval '10 seconds') >= 3 then
    raise exception 'Calma! Espere alguns segundos para mandar outra mensagem';
  end if;
  insert into cla_chat (cla_id, user_id, texto) values (v_cla, auth.uid(), left(trim(p_texto), 200));
end $$;

revoke execute on function public.criar_cla(text, text, text, smallint), public.entrar_cla(uuid), public.sair_cla(),
  public.expulsar_membro(text), public.alternar_oficial(text), public.editar_cla(text, boolean), public.enviar_chat(text) from public, anon;
grant execute on function public.criar_cla(text, text, text, smallint), public.entrar_cla(uuid), public.sair_cla(),
  public.expulsar_membro(text), public.alternar_oficial(text), public.editar_cla(text, boolean), public.enviar_chat(text) to authenticated;
grant execute on function public.meu_cla() to anon, authenticated;

