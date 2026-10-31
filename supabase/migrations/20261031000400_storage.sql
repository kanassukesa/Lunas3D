-- =============================================================================
-- Lunas 3D — Migration 0004: Storage (buckets e políticas)
-- =============================================================================
--   products   → PÚBLICO. Fotos dos produtos, banners e categorias. Só admin envia.
--   references → PRIVADO. Fotos de referência dos clientes (pedido personalizado).
--                Caminho obrigatório: {user_id}/{custom_request_id}/{arquivo}
--                Leitura só por URL assinada (dono ou admin).
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('products',   'products',   true,  10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('references', 'references', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------- bucket "products" ------------------------------
-- Leitura pública é automática (bucket public = true). Escrita só admin.
create policy "products bucket: admin envia"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'products' and (select public.is_admin()));
create policy "products bucket: admin atualiza"
  on storage.objects for update to authenticated
  using (bucket_id = 'products' and (select public.is_admin()))
  with check (bucket_id = 'products' and (select public.is_admin()));
create policy "products bucket: admin apaga"
  on storage.objects for delete to authenticated
  using (bucket_id = 'products' and (select public.is_admin()));
create policy "products bucket: admin lista"
  on storage.objects for select to authenticated
  using (bucket_id = 'products' and (select public.is_admin()));

-- --------------------------- bucket "references" -----------------------------
create policy "references bucket: cliente envia na própria pasta"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'references'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "references bucket: dono ou admin leem"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'references'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );
create policy "references bucket: dono ou admin apagam"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'references'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );
