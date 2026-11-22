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
drop function if exists public.meus_amigos();
create function public.meus_amigos()
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
drop function if exists public.buscar_comandantes(text);
create function public.buscar_comandantes(p_nome text)
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
drop function if exists public.raid_do_cla(text);
create function public.raid_do_cla(p_semana text)
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
