-- =============================================================================
-- Lunas 3D — Migration 0003: Row Level Security (RLS)
-- =============================================================================
-- Regra geral:
--   * Visitante (anon) e cliente leem apenas o catálogo PUBLICADO e as
--     configurações públicas do site.
--   * Cliente (authenticated) lê/edita SOMENTE os próprios dados.
--   * Admin (profiles.role = 'admin') lê e altera tudo.
--   * Pedidos são CRIADOS pelo servidor (Server Action com a chave secreta),
--     que recalcula preços e frete — o navegador nunca envia o "total".
--     Por isso não existe política de INSERT em orders/order_items para clientes.
--   * A chave secreta (service role) ignora RLS: use só no servidor.
-- =============================================================================

alter table public.profiles                      enable row level security;
alter table public.categories                    enable row level security;
alter table public.colors                        enable row level security;
alter table public.products                      enable row level security;
alter table public.product_images                enable row level security;
alter table public.product_colors                enable row level security;
alter table public.addresses                     enable row level security;
alter table public.orders                        enable row level security;
alter table public.order_items                   enable row level security;
alter table public.order_status_history          enable row level security;
alter table public.custom_requests               enable row level security;
alter table public.custom_request_images         enable row level security;
alter table public.custom_request_status_history enable row level security;
alter table public.site_settings                 enable row level security;

-- Permissões básicas de tabela (o RLS filtra as linhas depois).
-- Explicitamos os GRANTs para não depender do padrão do projeto Supabase.
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create policy "profiles: dono ou admin leem"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "profiles: dono ou admin atualizam"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));
-- INSERT: feito pelo trigger on_auth_user_created. DELETE: em cascata ao apagar o usuário.

-- -----------------------------------------------------------------------------
-- Catálogo: categories, colors, products, product_images, product_colors
-- -----------------------------------------------------------------------------
create policy "categories: público lê ativas"
  on public.categories for select to anon, authenticated
  using (is_active or (select public.is_admin()));
create policy "categories: admin gerencia"
  on public.categories for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "colors: público lê ativas"
  on public.colors for select to anon, authenticated
  using (is_active or (select public.is_admin()));
create policy "colors: admin gerencia"
  on public.colors for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "products: público lê publicados"
  on public.products for select to anon, authenticated
  using (status = 'active' or (select public.is_admin()));
create policy "products: admin gerencia"
  on public.products for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "product_images: público lê de produtos publicados"
  on public.product_images for select to anon, authenticated
  using (
    exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
    or (select public.is_admin())
  );
create policy "product_images: admin gerencia"
  on public.product_images for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "product_colors: público lê de produtos publicados"
  on public.product_colors for select to anon, authenticated
  using (
    exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
    or (select public.is_admin())
  );
create policy "product_colors: admin gerencia"
  on public.product_colors for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- addresses: só o dono (admin lê para despachar pedidos)
-- -----------------------------------------------------------------------------
create policy "addresses: dono ou admin leem"
  on public.addresses for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "addresses: dono cria"
  on public.addresses for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "addresses: dono atualiza"
  on public.addresses for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "addresses: dono apaga"
  on public.addresses for delete to authenticated
  using (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- orders / order_items / order_status_history
-- -----------------------------------------------------------------------------
create policy "orders: dono ou admin leem"
  on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "orders: admin atualiza"
  on public.orders for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "orders: admin cria"
  on public.orders for insert to authenticated
  with check ((select public.is_admin()));
create policy "orders: admin apaga"
  on public.orders for delete to authenticated
  using ((select public.is_admin()));

create policy "order_items: dono do pedido ou admin leem"
  on public.order_items for select to authenticated
  using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid()))
    or (select public.is_admin())
  );
create policy "order_items: admin gerencia"
  on public.order_items for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "order_status_history: dono do pedido ou admin leem"
  on public.order_status_history for select to authenticated
  using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid()))
    or (select public.is_admin())
  );
create policy "order_status_history: admin gerencia"
  on public.order_status_history for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- custom_requests / imagens / linha do tempo
-- -----------------------------------------------------------------------------
create policy "custom_requests: dono ou admin leem"
  on public.custom_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "custom_requests: cliente cria o próprio"
  on public.custom_requests for insert to authenticated
  with check (user_id = (select auth.uid()));
-- Cliente NÃO atualiza diretamente: aprova/recusa pela função respond_to_quote().
create policy "custom_requests: admin atualiza"
  on public.custom_requests for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "custom_requests: admin apaga"
  on public.custom_requests for delete to authenticated
  using ((select public.is_admin()));

create policy "custom_request_images: dono ou admin leem"
  on public.custom_request_images for select to authenticated
  using (
    exists (select 1 from public.custom_requests r where r.id = custom_request_id and r.user_id = (select auth.uid()))
    or (select public.is_admin())
  );
create policy "custom_request_images: dono anexa enquanto pendente"
  on public.custom_request_images for insert to authenticated
  with check (
    exists (
      select 1 from public.custom_requests r
      where r.id = custom_request_id and r.user_id = (select auth.uid()) and r.status = 'pending'
    )
    -- a foto precisa estar na pasta do próprio usuário no bucket "references"
    and split_part(storage_path, '/', 1) = (select auth.uid())::text
  );
create policy "custom_request_images: admin gerencia"
  on public.custom_request_images for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "custom_request_status_history: dono ou admin leem"
  on public.custom_request_status_history for select to authenticated
  using (
    exists (select 1 from public.custom_requests r where r.id = custom_request_id and r.user_id = (select auth.uid()))
    or (select public.is_admin())
  );
create policy "custom_request_status_history: admin gerencia"
  on public.custom_request_status_history for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- site_settings
-- -----------------------------------------------------------------------------
create policy "site_settings: público lê as públicas"
  on public.site_settings for select to anon, authenticated
  using (is_public or (select public.is_admin()));
create policy "site_settings: admin gerencia"
  on public.site_settings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
