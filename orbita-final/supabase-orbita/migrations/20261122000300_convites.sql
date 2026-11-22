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
