-- =============================================================================
-- Lunas 3D — Dados de EXEMPLO (seed)
-- 3 categorias, 6 cores e 4 produtos. Pode rodar mais de uma vez sem duplicar.
-- Para remover depois: apague os produtos pelo painel admin (ou arquive).
-- =============================================================================

-- Categorias
insert into public.categories (name, slug, description, sort_order) values
  ('Decoração',            'decoracao',     'Vasos, luminárias e peças para deixar o ambiente com a sua cara.', 1),
  ('Utilidades',           'utilidades',    'Organizadores, suportes e soluções práticas para o dia a dia.',     2),
  ('Geek & Colecionáveis', 'geek',          'Miniaturas, chaveiros e itens para colecionadores.',               3)
on conflict (slug) do nothing;

-- Cores (paleta de filamentos)
insert into public.colors (name, hex, sort_order) values
  ('Preto',          '#1F1F1F', 1),
  ('Branco',         '#F5F5F0', 2),
  ('Cinza Espacial', '#7A7F87', 3),
  ('Azul Galáxia',   '#2F4BA0', 4),
  ('Vermelho',       '#C8323C', 5),
  ('Dourado Silk',   '#C9A646', 6)
on conflict (name) do nothing;

-- Produtos
insert into public.products
  (category_id, name, slug, short_description, description, price, promo_price,
   stock_mode, stock_quantity, production_days, weight_grams, length_cm, width_cm, height_cm,
   status, is_featured, sort_order)
values
  ((select id from public.categories where slug = 'decoracao'),
   'Vaso Geométrico Lua', 'vaso-geometrico-lua',
   'Vaso facetado para suculentas e plantas pequenas.',
   'Vaso decorativo com design geométrico low-poly, ideal para suculentas, cactos e plantas artificiais. Impresso em PLA, com furo de drenagem opcional.',
   49.90, 39.90, 'in_stock', 8, null, 180, 12, 12, 14, 'active', true, 1),

  ((select id from public.categories where slug = 'decoracao'),
   'Luminária Lunar', 'luminaria-lunar',
   'Luminária em formato de lua com textura de crateras.',
   'Luminária de mesa em formato de lua cheia, com textura realista de crateras. Acompanha base e LED quente USB. Produzida sob encomenda.',
   129.90, null, 'made_to_order', 0, 5, 350, 18, 18, 20, 'active', true, 2),

  ((select id from public.categories where slug = 'utilidades'),
   'Suporte para Celular Articulado', 'suporte-celular-articulado',
   'Suporte de mesa com ângulo ajustável.',
   'Suporte de celular para mesa com dobradiça articulada e ângulo ajustável. Compatível com a maioria dos celulares, com ou sem capa.',
   34.90, null, 'in_stock', 15, null, 90, 10, 8, 3, 'active', true, 3),

  ((select id from public.categories where slug = 'geek'),
   'Chaveiro Astronauta', 'chaveiro-astronauta',
   'Chaveiro de astronauta com argola de metal.',
   'Chaveiro de astronauta com acabamento detalhado e argola de metal. Ótimo para presentear.',
   14.90, null, 'in_stock', 30, null, 20, 6, 4, 1, 'active', false, 4)
on conflict (slug) do nothing;

-- Cores disponíveis por produto (+ acréscimo opcional)
insert into public.product_colors (product_id, color_id, price_delta)
select p.id, c.id, v.delta
from (values
  ('vaso-geometrico-lua',        'Branco',          0.00),
  ('vaso-geometrico-lua',        'Preto',           0.00),
  ('vaso-geometrico-lua',        'Cinza Espacial',  0.00),
  ('vaso-geometrico-lua',        'Dourado Silk',    8.00),
  ('luminaria-lunar',            'Branco',          0.00),
  ('suporte-celular-articulado', 'Preto',           0.00),
  ('suporte-celular-articulado', 'Branco',          0.00),
  ('suporte-celular-articulado', 'Azul Galáxia',    0.00),
  ('suporte-celular-articulado', 'Vermelho',        0.00),
  ('chaveiro-astronauta',        'Branco',          0.00),
  ('chaveiro-astronauta',        'Azul Galáxia',    0.00),
  ('chaveiro-astronauta',        'Dourado Silk',    3.00)
) as v(slug, color, delta)
join public.products p on p.slug = v.slug
join public.colors   c on c.name = v.color
on conflict (product_id, color_id) do nothing;
