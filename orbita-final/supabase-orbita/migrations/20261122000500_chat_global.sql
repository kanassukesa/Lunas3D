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
