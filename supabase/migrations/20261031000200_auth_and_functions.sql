-- =============================================================================
-- Lunas 3D — Migration 0002: perfis automáticos, papel de admin e regras de negócio
-- =============================================================================

-- -----------------------------------------------------------------------------
-- is_admin(): usada pelas políticas RLS.
-- SECURITY DEFINER para poder ler profiles sem cair em recursão de RLS.
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- Cria o profile automaticamente quando alguém se cadastra
-- (e-mail/senha ou Google). Nome e foto vêm do provedor, se existirem.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mantém o e-mail do profile em sincronia se o usuário trocar de e-mail
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- -----------------------------------------------------------------------------
-- Impede que um cliente se promova a admin editando o próprio profile.
-- Só um admin (ou o SQL Editor / service role, onde auth.uid() é nulo) muda "role".
-- -----------------------------------------------------------------------------
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Somente administradores podem alterar o papel (role) de um usuário.'
      using errcode = '42501';
  end if;
  -- o e-mail é controlado pelo Supabase Auth, não pelo cliente
  if new.email is distinct from old.email and auth.uid() is not null and not public.is_admin() then
    new.email := old.email;
  end if;
  return new;
end;
$$;

create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- -----------------------------------------------------------------------------
-- Linha do tempo dos pedidos: toda criação/mudança de status gera um registro.
-- Para anexar uma observação/código de rastreio à mudança, use a função
-- admin_set_order_status() abaixo (ela passa a nota para este trigger).
-- -----------------------------------------------------------------------------
create or replace function public.log_order_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_status_history (order_id, status, note, tracking_code, created_by)
    values (
      new.id,
      new.status,
      nullif(current_setting('lunas.status_note', true), ''),
      case when new.status = 'shipped' then new.tracking_code end,
      auth.uid()
    );
  end if;
  return new;
end;
$$;

create trigger log_order_status
  after insert or update of status on public.orders
  for each row execute function public.log_order_status();

-- Exige código de rastreio quando o status vira "enviado" por Correios
create or replace function public.validate_order_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'shipped' and new.delivery_method = 'shipping'
     and coalesce(trim(new.tracking_code), '') = '' then
    raise exception 'Informe o código de rastreio para marcar o pedido como enviado.'
      using errcode = '23514';
  end if;
  if new.status = 'ready_for_pickup' and new.delivery_method <> 'pickup' then
    raise exception 'O status "pronto para retirada" só vale para pedidos com retirada no local.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger validate_order_status
  before insert or update of status, tracking_code on public.orders
  for each row execute function public.validate_order_status();

-- Admin altera status + nota (+ rastreio) numa única chamada:
--   supabase.rpc('admin_set_order_status', { p_order_id, p_status, p_note, p_tracking_code })
create or replace function public.admin_set_order_status(
  p_order_id uuid,
  p_status public.order_status,
  p_note text default null,
  p_tracking_code text default null
)
returns public.orders
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result public.orders;
begin
  if not public.is_admin() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  perform set_config('lunas.status_note', coalesce(p_note, ''), true);

  update public.orders
     set status = p_status,
         tracking_code = coalesce(nullif(trim(p_tracking_code), ''), tracking_code)
   where id = p_order_id
  returning * into result;

  if result.id is null then
    raise exception 'Pedido não encontrado.' using errcode = 'P0002';
  end if;

  perform set_config('lunas.status_note', '', true);
  return result;
end;
$$;

-- -----------------------------------------------------------------------------
-- Linha do tempo dos orçamentos personalizados
-- -----------------------------------------------------------------------------
create or replace function public.log_custom_request_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.custom_request_status_history (custom_request_id, status, note, created_by)
    values (
      new.id,
      new.status,
      nullif(current_setting('lunas.status_note', true), ''),
      auth.uid()
    );
  end if;
  return new;
end;
$$;

create trigger log_custom_request_status
  after insert or update of status on public.custom_requests
  for each row execute function public.log_custom_request_status();

-- Cliente cria o orçamento sempre "limpo": status pendente e sem campos do admin
create or replace function public.sanitize_new_custom_request()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.user_id := auth.uid();
    new.status := 'pending';
    new.quoted_price := null;
    new.quoted_shipping_cost := null;
    new.quoted_deadline_days := null;
    new.admin_message := null;
    new.quoted_at := null;
    new.customer_responded_at := null;
    new.order_id := null;
  end if;
  return new;
end;
$$;

create trigger sanitize_new_custom_request
  before insert on public.custom_requests
  for each row execute function public.sanitize_new_custom_request();

-- Cliente aprova ou recusa um orçamento que já foi respondido:
--   supabase.rpc('respond_to_quote', { p_request_id, p_approve: true })
create or replace function public.respond_to_quote(p_request_id uuid, p_approve boolean)
returns public.custom_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.custom_requests;
begin
  update public.custom_requests
     set status = case when p_approve then 'approved'::public.custom_request_status
                       else 'rejected'::public.custom_request_status end,
         customer_responded_at = now()
   where id = p_request_id
     and user_id = auth.uid()
     and status = 'quoted'
  returning * into result;

  if result.id is null then
    raise exception 'Orçamento não encontrado ou não está aguardando sua resposta.'
      using errcode = 'P0002';
  end if;
  return result;
end;
$$;

-- Funções expostas: só usuários logados podem chamar as RPCs de negócio
revoke execute on function public.admin_set_order_status(uuid, public.order_status, text, text) from public, anon;
revoke execute on function public.respond_to_quote(uuid, boolean) from public, anon;
grant execute on function public.admin_set_order_status(uuid, public.order_status, text, text) to authenticated;
grant execute on function public.respond_to_quote(uuid, boolean) to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- Funções de trigger não devem ser chamáveis pela API
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;
revoke execute on function public.log_order_status() from public, anon, authenticated;
revoke execute on function public.log_custom_request_status() from public, anon, authenticated;
