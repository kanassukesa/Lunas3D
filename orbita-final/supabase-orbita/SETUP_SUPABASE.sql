-- Órbita Final: TUDO de uma vez (saves, compras, ranking, clãs, convites, amigos, chats e chefe do clã).
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

-- ================================================================ migrations/20261122000300_convites.sql
-- Órbita Final: convites de clã por jogador (dentro do jogo, sem e-mail nem celular).
-- O líder ou um oficial procura o comandante pelo nome e convida; o jogador vê o convite no jogo e aceita ou recusa.
-- Clã "aberto" continua aceitando quem tocar em Entrar; clã fechado só entra por convite.

create table if not exists public.cla_convites (
  id bigint generated always as identity primary key,
  cla_id uuid not null references public.clas (id) on delete cascade,
  para_user uuid not null references auth.users (id) on delete cascade,
  de_user uuid not null references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now(),
  unique (cla_id, para_user)
);
create index if not exists cla_convites_para_idx on public.cla_convites (para_user);
alter table public.cla_convites enable row level security;

-- clãs novos começam fechados (só por convite); o líder pode abrir em "Editar"
alter table public.clas alter column aberto set default false;

-- convites que EU recebi, com os dados do clã
create or replace view public.meus_convites as
select cv.id, cv.cla_id, c.nome, c.tag, c.emblema,
  (select count(*)::int from public.cla_membros m where m.cla_id = c.id) as membros,
  coalesce(r.nome, 'Comandante') as de_nome, cv.criado_em
from public.cla_convites cv
join public.clas c on c.id = cv.cla_id
left join public.ranking r on r.user_id = cv.de_user
where cv.para_user = auth.uid();
grant select on public.meus_convites to authenticated;

-- busca por nome do comandante (mínimo 2 letras), sem expor user_id
create or replace function public.buscar_jogadores(p_nome text)
returns table (id text, nome text, avatar smallint, patente smallint, pontos bigint, tem_cla boolean, convidado boolean)
language sql stable security definer set search_path = public as $$
  select md5(r.user_id::text), r.nome,
    case when r.avatar between 7 and 9 then 1::smallint else r.avatar end,
    r.patente, r.pontos,
    exists (select 1 from cla_membros m where m.user_id = r.user_id),
    exists (select 1 from cla_convites cv where cv.para_user = r.user_id and cv.cla_id = meu_cla())
  from ranking r
  where auth.uid() is not null and char_length(trim(p_nome)) >= 2
    and r.user_id <> auth.uid()
    and r.nome ilike '%' || replace(replace(trim(p_nome), '%', ''), '_', '') || '%'
  order by (lower(r.nome) = lower(trim(p_nome))) desc, r.pontos desc
  limit 20
$$;

create or replace function public.convidar_jogador(p_jogador text)
returns void language plpgsql security definer set search_path = public as $$
declare v_cla uuid; v_cargo text; v_alvo uuid;
begin
  select cla_id, cargo into v_cla, v_cargo from cla_membros where user_id = auth.uid();
  if v_cla is null then raise exception 'Você não está em um clã'; end if;
  if v_cargo = 'membro' then raise exception 'Só o líder ou os oficiais podem convidar'; end if;
  select user_id into v_alvo from ranking where md5(user_id::text) = p_jogador;
  if v_alvo is null then raise exception 'Jogador não encontrado'; end if;
  if exists (select 1 from cla_membros where user_id = v_alvo) then raise exception 'Esse jogador já está em um clã'; end if;
  if (select count(*) from cla_membros where cla_id = v_cla) >= 30 then raise exception 'Clã cheio (30/30)'; end if;
  if (select count(*) from cla_convites where cla_id = v_cla) >= 30 then raise exception 'Muitos convites pendentes. Espere alguns responderem.'; end if;
  insert into cla_convites (cla_id, para_user, de_user) values (v_cla, v_alvo, auth.uid())
    on conflict (cla_id, para_user) do nothing;
end $$;

create or replace function public.aceitar_convite(p_convite bigint)
returns void language plpgsql security definer set search_path = public as $$
declare v_cla uuid;
begin
  select cla_id into v_cla from cla_convites where id = p_convite and para_user = auth.uid();
  if v_cla is null then raise exception 'Convite não encontrado'; end if;
  if exists (select 1 from cla_membros where user_id = auth.uid()) then raise exception 'Você já está em um clã'; end if;
  perform 1 from clas where id = v_cla for update;
  if (select count(*) from cla_membros where cla_id = v_cla) >= 30 then raise exception 'Clã cheio (30/30)'; end if;
  insert into cla_membros (user_id, cla_id) values (auth.uid(), v_cla);
  delete from cla_convites where para_user = auth.uid();  -- entrou num clã: os outros convites somem
end $$;

create or replace function public.recusar_convite(p_convite bigint)
returns void language sql security definer set search_path = public as $$
  delete from cla_convites where id = p_convite and para_user = auth.uid()
$$;

revoke execute on function public.buscar_jogadores(text), public.convidar_jogador(text), public.aceitar_convite(bigint), public.recusar_convite(bigint) from public, anon;
grant execute on function public.buscar_jogadores(text), public.convidar_jogador(text), public.aceitar_convite(bigint), public.recusar_convite(bigint) to authenticated;

-- ================================================================ migrations/20261122000400_amigos_chat_raid.sql
-- Órbita Final: amigos, chat privado entre amigos e Chefe do Clã (raid semanal).
-- Mesmo padrão dos clãs: tabelas fechadas (RLS sem policies); leitura e ações só por funções que conferem auth.uid().

-- ------------------------------------------------------------------ "online agora"
alter table public.ranking add column if not exists visto_em timestamptz not null default now();

create or replace function public.marcar_online()
returns void language sql security definer set search_path = public as $$
  update ranking set visto_em = now() where user_id = auth.uid()
$$;

-- ------------------------------------------------------------------ amigos
create table if not exists public.amizades (
  id bigint generated always as identity primary key,
  de_user uuid not null references auth.users (id) on delete cascade,
  para_user uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente', 'aceito')),
  criado_em timestamptz not null default now(),
  check (de_user <> para_user),
  unique (de_user, para_user)
);
create index if not exists amizades_para_idx on public.amizades (para_user);
alter table public.amizades enable row level security;

create table if not exists public.mensagens (
  id bigint generated always as identity primary key,
  de_user uuid not null references auth.users (id) on delete cascade,
  para_user uuid not null references auth.users (id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 200),
  lida boolean not null default false,
  criado_em timestamptz not null default now()
);
create index if not exists mensagens_par_idx on public.mensagens (least(de_user, para_user), greatest(de_user, para_user), id desc);
create index if not exists mensagens_naolidas_idx on public.mensagens (para_user) where not lida;
alter table public.mensagens enable row level security;

-- amigos, pedidos recebidos e enviados (id = md5 do outro jogador)
create or replace function public.meus_amigos()
returns table (id text, pedido bigint, situacao text, nome text, avatar smallint, patente smallint, pontos bigint, visto_em timestamptz, nao_lidas int)
language sql stable security definer set search_path = public as $$
  select md5(o.outro::text), a.id,
    case when a.status = 'aceito' then 'amigo' when a.para_user = auth.uid() then 'recebido' else 'enviado' end,
    coalesce(r.nome, 'Comandante'),
    case when coalesce(r.avatar, 1) between 7 and 9 then 1::smallint else coalesce(r.avatar, 1) end,
    coalesce(r.patente, 0::smallint), coalesce(r.pontos, 0), coalesce(r.visto_em, a.criado_em),
    (select count(*)::int from mensagens m where m.de_user = o.outro and m.para_user = auth.uid() and not m.lida)
  from amizades a
  cross join lateral (select case when a.de_user = auth.uid() then a.para_user else a.de_user end as outro) o
  left join ranking r on r.user_id = o.outro
  where auth.uid() is not null and (a.de_user = auth.uid() or a.para_user = auth.uid())
  order by (a.status = 'pendente' and a.para_user = auth.uid()) desc, coalesce(r.visto_em, a.criado_em) desc
$$;

-- busca para adicionar amigo: diz se já é amigo / pedido pendente
create or replace function public.buscar_comandantes(p_nome text)
returns table (id text, nome text, avatar smallint, patente smallint, pontos bigint, amizade text)
language sql stable security definer set search_path = public as $$
  select md5(r.user_id::text), r.nome,
    case when r.avatar between 7 and 9 then 1::smallint else r.avatar end, r.patente, r.pontos,
    coalesce((select case when a.status = 'aceito' then 'amigo' when a.de_user = auth.uid() then 'enviado' else 'recebido' end
      from amizades a where (a.de_user = auth.uid() and a.para_user = r.user_id) or (a.para_user = auth.uid() and a.de_user = r.user_id) limit 1), '')
  from ranking r
  where auth.uid() is not null and char_length(trim(p_nome)) >= 2 and r.user_id <> auth.uid()
    and r.nome ilike '%' || replace(replace(trim(p_nome), '%', ''), '_', '') || '%'
  order by (lower(r.nome) = lower(trim(p_nome))) desc, r.pontos desc
  limit 20
$$;

create or replace function public.pedir_amizade(p_jogador text)
returns text language plpgsql security definer set search_path = public as $$
declare v_alvo uuid; v_volta bigint;
begin
  if auth.uid() is null then raise exception 'Entre na sua conta primeiro'; end if;
  select user_id into v_alvo from ranking where md5(user_id::text) = p_jogador;
  if v_alvo is null or v_alvo = auth.uid() then raise exception 'Jogador não encontrado'; end if;
  if (select count(*) from amizades where de_user = auth.uid() or para_user = auth.uid()) >= 100 then raise exception 'Limite de 100 amigos'; end if;
  -- ele já tinha me pedido: vira amizade na hora
  select id into v_volta from amizades where de_user = v_alvo and para_user = auth.uid();
  if v_volta is not null then update amizades set status = 'aceito' where id = v_volta; return 'aceito'; end if;
  insert into amizades (de_user, para_user) values (auth.uid(), v_alvo) on conflict (de_user, para_user) do nothing;
  return 'enviado';
end $$;

create or replace function public.responder_amizade(p_pedido bigint, p_aceitar boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_aceitar then
    update amizades set status = 'aceito' where id = p_pedido and para_user = auth.uid() and status = 'pendente';
  else
    delete from amizades where id = p_pedido and para_user = auth.uid() and status = 'pendente';
  end if;
end $$;

create or replace function public.remover_amigo(p_amigo text)
returns void language sql security definer set search_path = public as $$
  delete from amizades where (de_user = auth.uid() and md5(para_user::text) = p_amigo) or (para_user = auth.uid() and md5(de_user::text) = p_amigo)
$$;

-- ------------------------------------------------------------------ chat privado (só entre amigos)
create or replace function public.enviar_mensagem(p_amigo text, p_texto text)
returns void language plpgsql security definer set search_path = public as $$
declare v_alvo uuid;
begin
  select case when a.de_user = auth.uid() then a.para_user else a.de_user end into v_alvo
    from amizades a where a.status = 'aceito' and ((a.de_user = auth.uid() and md5(a.para_user::text) = p_amigo) or (a.para_user = auth.uid() and md5(a.de_user::text) = p_amigo));
  if v_alvo is null then raise exception 'Vocês precisam ser amigos para conversar'; end if;
  if char_length(trim(coalesce(p_texto, ''))) = 0 then return; end if;
  if (select count(*) from mensagens where de_user = auth.uid() and criado_em > now() - interval '10 seconds') >= 4 then
    raise exception 'Calma! Espere alguns segundos para mandar outra mensagem';
  end if;
  insert into mensagens (de_user, para_user, texto) values (auth.uid(), v_alvo, left(trim(p_texto), 200));
end $$;

-- últimas 50 mensagens da conversa (e marca as recebidas como lidas)
create or replace function public.ler_conversa(p_amigo text)
returns table (id bigint, eu boolean, texto text, criado_em timestamptz)
language plpgsql security definer set search_path = public as $$
declare v_outro uuid;
begin
  select case when a.de_user = auth.uid() then a.para_user else a.de_user end into v_outro
    from amizades a where a.status = 'aceito' and ((a.de_user = auth.uid() and md5(a.para_user::text) = p_amigo) or (a.para_user = auth.uid() and md5(a.de_user::text) = p_amigo));
  if v_outro is null then return; end if;
  update mensagens set lida = true where de_user = v_outro and para_user = auth.uid() and not lida;
  return query
    select m.id, m.de_user = auth.uid(), m.texto, m.criado_em from (
      select * from mensagens
      where (de_user = auth.uid() and para_user = v_outro) or (de_user = v_outro and para_user = auth.uid())
      order by id desc limit 50) m
    order by m.id;
end $$;

create or replace function public.mensagens_nao_lidas()
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from mensagens where para_user = auth.uid() and not lida
$$;

-- ------------------------------------------------------------------ Chefe do Clã (raid semanal)
-- vida = 150 mil por membro (mínimo 2): ~3 partidas de cada um por semana derrubam o chefe.
create table if not exists public.cla_raid (
  cla_id uuid not null references public.clas (id) on delete cascade,
  semana text not null,
  vida bigint not null,
  dano bigint not null default 0,
  derrotado_em timestamptz,
  primary key (cla_id, semana)
);
create table if not exists public.cla_raid_dano (
  cla_id uuid not null references public.clas (id) on delete cascade,
  semana text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  dano bigint not null default 0,
  ultimo_em timestamptz not null default now(),
  premio_em timestamptz,
  primary key (cla_id, semana, user_id)
);
alter table public.cla_raid enable row level security;
alter table public.cla_raid_dano enable row level security;

-- soma o dano de uma partida no chefe do clã (o jogo manda o total que as sentinelas causaram)
create or replace function public.dano_raid(p_semana text, p_dano bigint)
returns void language plpgsql security definer set search_path = public as $$
declare v_cla uuid; v_dano bigint; v_membros int;
begin
  v_cla := meu_cla();
  if v_cla is null or p_dano is null or p_dano <= 0 then return; end if;
  if p_semana !~ '^\d{4}-W\d{2}$' then raise exception 'Semana inválida'; end if;
  v_dano := least(p_dano, 3000000);  -- teto por partida (anti-trapaça simples)
  -- no máximo 1 registro a cada 45 s por jogador
  if exists (select 1 from cla_raid_dano where cla_id = v_cla and semana = p_semana and user_id = auth.uid() and ultimo_em > now() - interval '45 seconds') then return; end if;
  select count(*) into v_membros from cla_membros where cla_id = v_cla;
  insert into cla_raid (cla_id, semana, vida) values (v_cla, p_semana, 150000 * greatest(v_membros, 2)) on conflict do nothing;
  insert into cla_raid_dano (cla_id, semana, user_id, dano) values (v_cla, p_semana, auth.uid(), v_dano)
    on conflict (cla_id, semana, user_id) do update set dano = cla_raid_dano.dano + excluded.dano, ultimo_em = now();
  update cla_raid set dano = dano + v_dano,
    derrotado_em = case when derrotado_em is null and dano + v_dano >= vida then now() else derrotado_em end
    where cla_id = v_cla and semana = p_semana;
end $$;

-- situação do chefe do MEU clã na semana + ranking de dano dos membros
create or replace function public.raid_do_cla(p_semana text)
returns table (vida bigint, dano bigint, derrotado boolean, membro text, nome text, avatar smallint, dano_membro bigint, eu boolean, premio_pego boolean)
language sql stable security definer set search_path = public as $$
  select coalesce(cr.vida, 150000 * greatest((select count(*) from cla_membros where cla_id = meu_cla()), 2)),
    coalesce(cr.dano, 0), cr.derrotado_em is not null,
    md5(d.user_id::text), coalesce(r.nome, 'Comandante'),
    case when coalesce(r.avatar, 1) between 7 and 9 then 1::smallint else coalesce(r.avatar, 1) end,
    coalesce(d.dano, 0), d.user_id = auth.uid(), d.premio_em is not null
  from (select meu_cla() as cla) mc
  left join cla_raid cr on cr.cla_id = mc.cla and cr.semana = p_semana
  left join cla_raid_dano d on d.cla_id = mc.cla and d.semana = p_semana
  left join ranking r on r.user_id = d.user_id
  where mc.cla is not null
  order by d.dano desc nulls last
$$;

-- prêmio: só uma vez por semana, só para quem ajudou e só com o chefe derrotado. Devolve a posição no dano (1 = maior).
create or replace function public.resgatar_raid(p_semana text)
returns int language plpgsql security definer set search_path = public as $$
declare v_cla uuid; v_pos int;
begin
  v_cla := meu_cla();
  if v_cla is null then raise exception 'Você não está em um clã'; end if;
  if not exists (select 1 from cla_raid where cla_id = v_cla and semana = p_semana and derrotado_em is not null) then raise exception 'O chefe ainda não foi derrotado'; end if;
  if not exists (select 1 from cla_raid_dano where cla_id = v_cla and semana = p_semana and user_id = auth.uid() and dano > 0) then raise exception 'Você precisa causar dano no chefe para ganhar o prêmio'; end if;
  if exists (select 1 from cla_raid_dano where cla_id = v_cla and semana = p_semana and user_id = auth.uid() and premio_em is not null) then raise exception 'Prêmio já resgatado'; end if;
  update cla_raid_dano set premio_em = now() where cla_id = v_cla and semana = p_semana and user_id = auth.uid();
  select 1 + count(*) into v_pos from cla_raid_dano where cla_id = v_cla and semana = p_semana and dano > (select dano from cla_raid_dano where cla_id = v_cla and semana = p_semana and user_id = auth.uid());
  return v_pos;
end $$;

revoke execute on function public.marcar_online(), public.meus_amigos(), public.buscar_comandantes(text), public.pedir_amizade(text),
  public.responder_amizade(bigint, boolean), public.remover_amigo(text), public.enviar_mensagem(text, text), public.ler_conversa(text),
  public.mensagens_nao_lidas(), public.dano_raid(text, bigint), public.raid_do_cla(text), public.resgatar_raid(text) from public, anon;
grant execute on function public.marcar_online(), public.meus_amigos(), public.buscar_comandantes(text), public.pedir_amizade(text),
  public.responder_amizade(bigint, boolean), public.remover_amigo(text), public.enviar_mensagem(text, text), public.ler_conversa(text),
  public.mensagens_nao_lidas(), public.dano_raid(text, bigint), public.raid_do_cla(text), public.resgatar_raid(text) to authenticated;

-- ================================================================ migrations/20261122000500_chat_global.sql
-- Órbita Final: chat global (todo mundo), com filtro de palavrão, limite anti-spam e denúncia.
-- Regras: só quem tem comandante (linha no ranking) fala; 3 mensagens a cada 15 s; até 150 letras.
-- Denúncia: 3 jogadores diferentes denunciam a mesma mensagem → ela some para todos.
-- Mensagens com mais de 3 dias são apagadas sozinhas.

create table if not exists public.chat_global (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 150),
  oculta boolean not null default false,
  criado_em timestamptz not null default now()
);
create index if not exists chat_global_idx on public.chat_global (id desc) where not oculta;
alter table public.chat_global enable row level security;

create table if not exists public.chat_denuncias (
  msg_id bigint not null references public.chat_global (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (msg_id, user_id)
);
alter table public.chat_denuncias enable row level security;

-- troca palavrões por asteriscos (lista básica; dá para aumentar)
create or replace function public.limpar_texto(p text)
returns text language sql immutable as $$
  select regexp_replace(p,
    '\m(porra|caralho|put[ao]s?|merda|buceta|bucet[ai]nha|foda|foder|fodas?e|fdp|vsf|vtnc|tnc|viad[oa]s?|arrombad[oa]s?|cacete|corno|piroca|cuz[aã]o|cu|pqp|desgra[cç]ad[oa]|vagabund[oa]|bosta)\M',
    '***', 'gi')
$$;

create or replace function public.enviar_global(p_texto text)
returns void language plpgsql security definer set search_path = public as $$
declare v_txt text;
begin
  if auth.uid() is null then raise exception 'Entre na sua conta primeiro'; end if;
  if not exists (select 1 from ranking where user_id = auth.uid()) then raise exception 'Crie o seu comandante para falar no chat'; end if;
  v_txt := left(trim(coalesce(p_texto, '')), 150);
  if char_length(v_txt) = 0 then return; end if;
  if (select count(*) from chat_global where user_id = auth.uid() and criado_em > now() - interval '15 seconds') >= 3 then
    raise exception 'Calma! Espere alguns segundos para mandar outra mensagem';
  end if;
  insert into chat_global (user_id, texto) values (auth.uid(), limpar_texto(v_txt));
  delete from chat_global where criado_em < now() - interval '3 days';
end $$;

-- últimas 60 mensagens visíveis
create or replace function public.ler_global()
returns table (id bigint, autor text, eu boolean, nome text, avatar smallint, patente smallint, elite boolean, texto text, criado_em timestamptz)
language sql stable security definer set search_path = public as $$
  select m.id, md5(m.user_id::text), m.user_id = auth.uid(), coalesce(rp.nome, 'Comandante'), coalesce(rp.avatar, 1::smallint),
    coalesce(rp.patente, 0::smallint), coalesce(rp.elite, false), m.texto, m.criado_em
  from (select * from chat_global where not oculta order by id desc limit 60) m
  left join ranking_publico rp on rp.id = md5(m.user_id::text)
  order by m.id
$$;

create or replace function public.denunciar_global(p_msg bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Entre na sua conta primeiro'; end if;
  if exists (select 1 from chat_global where id = p_msg and user_id = auth.uid()) then return; end if;
  insert into chat_denuncias (msg_id, user_id) values (p_msg, auth.uid()) on conflict do nothing;
  if (select count(*) from chat_denuncias where msg_id = p_msg) >= 3 then
    update chat_global set oculta = true where id = p_msg;
  end if;
end $$;

revoke execute on function public.enviar_global(text), public.ler_global(), public.denunciar_global(bigint) from public, anon;
grant execute on function public.enviar_global(text), public.ler_global(), public.denunciar_global(bigint) to authenticated;

