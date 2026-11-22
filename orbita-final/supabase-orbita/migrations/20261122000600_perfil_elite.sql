-- Órbita Final: selo ELITE (Passe Premium) em todo lugar e perfil público do jogador.
-- - ranking.premium: o jogo avisa se tem o Passe Premium da temporada (fase de testes, com pagamento simulado).
--   Quando o pagamento real estiver ligado, trocar a view para usar SÓ as compras aprovadas.
-- - ranking.perfil: resumo público do progresso (estatísticas, skins, fases) para a tela de perfil.

alter table public.ranking add column if not exists premium boolean not null default false;
alter table public.ranking add column if not exists perfil jsonb not null default '{}'::jsonb;
alter table public.ranking drop constraint if exists ranking_perfil_tamanho;
alter table public.ranking add constraint ranking_perfil_tamanho check (pg_column_size(perfil) < 6000);

create or replace view public.ranking_publico as
select
  md5(r.user_id::text) as id,
  r.user_id = auth.uid() as eu,
  r.nome,
  case when r.avatar between 7 and 9 and not (e.elite or r.premium) then 1 else r.avatar end as avatar,  -- 7-9 = comandantes ELITE
  (e.elite or r.premium) as elite,
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

-- as funções abaixo passam a devolver "elite" (mudou o formato: precisa apagar e criar de novo)
drop function if exists public.buscar_jogadores(text);
create function public.buscar_jogadores(p_nome text)
returns table (id text, nome text, avatar smallint, patente smallint, pontos bigint, tem_cla boolean, convidado boolean, elite boolean)
language sql stable security definer set search_path = public as $$
  select rp.id, rp.nome, rp.avatar::smallint, rp.patente, rp.pontos,
    exists (select 1 from cla_membros m where m.user_id = r.user_id),
    exists (select 1 from cla_convites cv where cv.para_user = r.user_id and cv.cla_id = meu_cla()),
    rp.elite
  from ranking r join ranking_publico rp on rp.id = md5(r.user_id::text)
  where auth.uid() is not null and char_length(trim(p_nome)) >= 2
    and r.user_id <> auth.uid()
    and r.nome ilike '%' || replace(replace(trim(p_nome), '%', ''), '_', '') || '%'
  order by (lower(r.nome) = lower(trim(p_nome))) desc, r.pontos desc
  limit 20
$$;

drop function if exists public.buscar_comandantes(text);
create function public.buscar_comandantes(p_nome text)
returns table (id text, nome text, avatar smallint, patente smallint, pontos bigint, amizade text, elite boolean)
language sql stable security definer set search_path = public as $$
  select rp.id, rp.nome, rp.avatar::smallint, rp.patente, rp.pontos,
    coalesce((select case when a.status = 'aceito' then 'amigo' when a.de_user = auth.uid() then 'enviado' else 'recebido' end
      from amizades a where (a.de_user = auth.uid() and a.para_user = r.user_id) or (a.para_user = auth.uid() and a.de_user = r.user_id) limit 1), ''),
    rp.elite
  from ranking r join ranking_publico rp on rp.id = md5(r.user_id::text)
  where auth.uid() is not null and char_length(trim(p_nome)) >= 2 and r.user_id <> auth.uid()
    and r.nome ilike '%' || replace(replace(trim(p_nome), '%', ''), '_', '') || '%'
  order by (lower(r.nome) = lower(trim(p_nome))) desc, r.pontos desc
  limit 20
$$;

drop function if exists public.meus_amigos();
create function public.meus_amigos()
returns table (id text, pedido bigint, situacao text, nome text, avatar smallint, patente smallint, pontos bigint, visto_em timestamptz, nao_lidas int, elite boolean)
language sql stable security definer set search_path = public as $$
  select md5(o.outro::text), a.id,
    case when a.status = 'aceito' then 'amigo' when a.para_user = auth.uid() then 'recebido' else 'enviado' end,
    coalesce(rp.nome, 'Comandante'), coalesce(rp.avatar, 1)::smallint,
    coalesce(rp.patente, 0::smallint), coalesce(rp.pontos, 0), coalesce(r.visto_em, a.criado_em),
    (select count(*)::int from mensagens m where m.de_user = o.outro and m.para_user = auth.uid() and not m.lida),
    coalesce(rp.elite, false)
  from amizades a
  cross join lateral (select case when a.de_user = auth.uid() then a.para_user else a.de_user end as outro) o
  left join ranking r on r.user_id = o.outro
  left join ranking_publico rp on rp.id = md5(o.outro::text)
  where auth.uid() is not null and (a.de_user = auth.uid() or a.para_user = auth.uid())
  order by (a.status = 'pendente' and a.para_user = auth.uid()) desc, coalesce(r.visto_em, a.criado_em) desc
$$;

drop function if exists public.raid_do_cla(text);
create function public.raid_do_cla(p_semana text)
returns table (vida bigint, dano bigint, derrotado boolean, membro text, nome text, avatar smallint, dano_membro bigint, eu boolean, premio_pego boolean, elite boolean)
language sql stable security definer set search_path = public as $$
  select coalesce(cr.vida, 150000 * greatest((select count(*) from cla_membros where cla_id = meu_cla()), 2)),
    coalesce(cr.dano, 0), cr.derrotado_em is not null,
    md5(d.user_id::text), coalesce(rp.nome, 'Comandante'), coalesce(rp.avatar, 1)::smallint,
    coalesce(d.dano, 0), d.user_id = auth.uid(), d.premio_em is not null, coalesce(rp.elite, false)
  from (select meu_cla() as cla) mc
  left join cla_raid cr on cr.cla_id = mc.cla and cr.semana = p_semana
  left join cla_raid_dano d on d.cla_id = mc.cla and d.semana = p_semana
  left join ranking_publico rp on rp.id = md5(d.user_id::text)
  where mc.cla is not null
  order by d.dano desc nulls last
$$;

-- perfil público de um jogador (id = md5, o mesmo dos rankings, chats e clãs)
create or replace function public.perfil_jogador(p_id text)
returns table (id text, eu boolean, nome text, avatar smallint, elite boolean, patente smallint, pontos bigint, estrelas int,
  sobrevivencia int, jornada smallint, jornada_semana text, diario int, diario_dia text, visto_em timestamptz, perfil jsonb,
  cla_nome text, cla_tag text, cla_emblema smallint, cla_cargo text, amizade text)
language sql stable security definer set search_path = public as $$
  select rp.id, r.user_id = auth.uid(), rp.nome, rp.avatar::smallint, rp.elite, rp.patente, rp.pontos, rp.estrelas,
    rp.sobrevivencia, rp.jornada, rp.jornada_semana, rp.diario, rp.diario_dia, r.visto_em, r.perfil,
    c.nome, c.tag, c.emblema, m.cargo,
    coalesce((select case when a.status = 'aceito' then 'amigo' when a.de_user = auth.uid() then 'enviado' else 'recebido' end
      from amizades a where (a.de_user = auth.uid() and a.para_user = r.user_id) or (a.para_user = auth.uid() and a.de_user = r.user_id) limit 1), '')
  from ranking r
  join ranking_publico rp on rp.id = md5(r.user_id::text)
  left join cla_membros m on m.user_id = r.user_id
  left join clas c on c.id = m.cla_id
  where md5(r.user_id::text) = p_id
$$;

revoke execute on function public.buscar_jogadores(text), public.buscar_comandantes(text), public.meus_amigos(), public.raid_do_cla(text) from public, anon;
grant execute on function public.buscar_jogadores(text), public.buscar_comandantes(text), public.meus_amigos(), public.raid_do_cla(text) to authenticated;
grant execute on function public.perfil_jogador(text) to anon, authenticated;
