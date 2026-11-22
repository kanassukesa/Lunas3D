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
