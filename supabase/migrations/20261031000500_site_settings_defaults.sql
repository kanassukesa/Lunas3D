-- =============================================================================
-- Lunas 3D — Migration 0005: configurações padrão do site
-- Tudo aqui é editável depois pelo painel admin (Etapa 5).
-- "on conflict do nothing" garante que rodar de novo não apaga suas edições.
-- =============================================================================

insert into public.site_settings (key, value, is_public, description) values
  ('store_name',     '"Lunas 3D"',                                        true,  'Nome da loja'),
  ('tagline',        '"Impressão 3D sob medida em Fortaleza"',            true,  'Frase curta exibida na home e no SEO'),
  ('whatsapp',       '"5585988669361"',                                   true,  'WhatsApp com DDI+DDD, só números'),
  ('contact_email',  '"contato@lunas3d.com.br"',                          true,  'E-mail de contato exibido no site'),
  ('instagram',      '"lunas3d"',                                         true,  'Usuário do Instagram, sem @'),
  ('pickup_address', '{"street":"Endereço a definir","neighborhood":"","city":"Fortaleza","state":"CE","cep":"","notes":"Retirada com horário combinado pelo WhatsApp"}',
                                                                          true,  'Endereço de retirada no local'),
  ('origin_cep',     '"60000000"',                                        true,  'CEP de origem para cálculo de frete'),
  ('business_hours', '"Seg a Sex, 9h às 18h · Sáb, 9h às 13h"',          true,  'Horário de atendimento'),
  ('announcement',   '{"enabled":true,"text":"Peças personalizadas sob encomenda — peça seu orçamento!","href":"/personalizado"}',
                                                                          true,  'Aviso no topo do site'),
  ('home_banners',   '[{"title":"Ideias que ganham forma, camada por camada","subtitle":"Peças em impressão 3D prontas para entrega ou feitas sob medida para você.","cta_label":"Ver produtos","cta_href":"/produtos","image_path":null}]',
                                                                          true,  'Banners do carrossel da home'),
  ('about_text',     '"A Lunas 3D é um estúdio de impressão 3D em Fortaleza-CE. Criamos peças decorativas, utilitárias e colecionáveis, além de projetos sob medida."',
                                                                          true,  'Texto "Sobre"'),
  ('how_it_works',   '[{"title":"Escolha ou descreva","text":"Escolha uma peça da vitrine ou envie a sua ideia com fotos de referência."},{"title":"Combine o pagamento","text":"Finalize o pedido e combine o pagamento direto no WhatsApp."},{"title":"Produção","text":"Imprimimos e fazemos o acabamento da sua peça com cuidado."},{"title":"Receba","text":"Retire no local ou receba pelos Correios."}]',
                                                                          true,  'Passos do "Como funciona"'),
  ('faq',            '[{"q":"Quais formas de pagamento vocês aceitam?","a":"Pix, cartão e transferência. O pagamento é combinado pelo WhatsApp depois que você finaliza o pedido."},{"q":"Quanto tempo leva para ficar pronto?","a":"Peças em estoque saem em até 2 dias úteis. Peças sob encomenda e personalizadas têm o prazo informado no produto ou no orçamento."},{"q":"Vocês enviam para todo o Brasil?","a":"Sim, enviamos pelos Correios. O frete é calculado pelo CEP no carrinho."}]',
                                                                          true,  'Perguntas frequentes'),
  ('owner_notification_email', '"contato@lunas3d.com.br"',                false, 'E-mail que recebe avisos de novos pedidos/orçamentos (privado)')
on conflict (key) do nothing;
