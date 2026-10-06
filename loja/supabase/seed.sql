-- MEDIQUE · stock inicial (35 uniformes: 34 à venda + 1 pink com tamanho por confirmar).
-- Correr depois de schema.sql.

insert into colors (id, name, hex, swatch, sort) values
  ('azul-royal',    'Azul Royal',                   '#2850B8', null, 0),
  ('azul-turquesa', 'Azul Claro / Turquesa',        '#43BCD3', null, 1),
  ('branco',        'Branco',                       '#F8F8F6', null, 2),
  ('rosa',          'Rosa / Vermelho-rosa',         '#DD5577', null, 3),
  ('pink',          'Rosa Forte / Pink',            '#E0358C', null, 4),
  ('rosa-salmao',   'Rosa Salmão / Coral Claro',    '#F2A08B', null, 5),
  ('vermelho',      'Vermelho',                     '#C4232E', null, 6),
  ('bege',          'Bege Claro / Creme',           '#EADCC4', null, 7),
  ('bordo',         'Bordô / Vinho',                '#6B1A2D', null, 8),
  ('azul-petroleo', 'Azul Petróleo',                '#1B5E6B', null, 9),
  ('verde-lima',    'Verde-lima',                   '#98CF55', null, 10),
  ('verde-garrafa', 'Verde Escuro / Verde Garrafa', '#1F4D34', null, 11),
  ('preto',         'Preto',                        '#1B1E22', null, 12),
  ('cinzento',      'Cinzento / Cinza',             '#9AA3AB', null, 13),
  ('camuflado',     'Camuflado Verde',              '#6B7440',
     'radial-gradient(circle at 30% 35%,#4F5D2F 0 28%,transparent 30%),radial-gradient(circle at 70% 65%,#2F3A1E 0 26%,transparent 28%),radial-gradient(circle at 75% 25%,#8A8F5A 0 20%,transparent 22%),#6B7440', 14)
on conflict (id) do nothing;

insert into settings (key, value) values
  ('sizes',     '["XS","S","M","L","XL","XXL"]'),
  ('whatsapp',  '"https://wa.me/message/5Z32NMOECZ27P1"'),
  ('instagram', '"https://www.instagram.com/medique_lda"'),
  ('facebook',  '"https://www.facebook.com/share/1H4BAY1Ypu/"'),
  ('x',         '"https://x.com/medique258"'),
  ('tiktok',    '"https://www.tiktok.com/@medique_259"'),
  ('email',     '""')
on conflict (key) do nothing;

with p as (
  insert into products (slug, name, description, categories, price, is_new)
  values ('conjunto-scrub-medique', 'Conjunto Scrub MEDIQUE',
          'Conjunto de blusa e calça para o dia a dia de médicos, enfermeiros e equipas de saúde. Disponível em 15 cores.',
          '{feminino,masculino,conjuntos,novidades}', 2000, true)
  on conflict (slug) do update set slug = excluded.slug
  returning id
),
stock (color_id, s, m, l, xl, xxl, pending) as (values
  ('azul-royal',    2, 3, 2, 0, 0, 0),
  ('azul-turquesa', 1, 0, 1, 0, 0, 0),
  ('branco',        2, 0, 1, 1, 0, 0),
  ('rosa',          0, 1, 0, 0, 0, 0),
  ('pink',          3, 1, 0, 0, 0, 1),
  ('rosa-salmao',   2, 0, 0, 0, 0, 0),
  ('vermelho',      2, 0, 0, 1, 0, 0),
  ('bege',          0, 1, 0, 0, 0, 0),
  ('bordo',         0, 1, 1, 0, 0, 0),
  ('azul-petroleo', 1, 0, 0, 0, 0, 0),
  ('verde-lima',    2, 0, 0, 0, 0, 0),
  ('verde-garrafa', 1, 0, 0, 1, 0, 0),
  ('preto',         1, 0, 0, 0, 0, 0),
  ('cinzento',      1, 0, 0, 0, 0, 0),
  ('camuflado',     0, 1, 0, 0, 0, 0)
),
pc as (
  insert into product_colors (product_id, color_id, pending)
  select p.id, stock.color_id, stock.pending from p, stock
  on conflict (product_id, color_id) do nothing
  returning id, color_id
)
insert into variants (product_color_id, size, stock)
select pc.id, v.size, v.qty
from pc join stock on stock.color_id = pc.color_id
cross join lateral (values ('XS', 0), ('S', stock.s), ('M', stock.m), ('L', stock.l), ('XL', stock.xl), ('XXL', stock.xxl)) as v(size, qty)
on conflict do nothing;

-- Fotografias iniciais (servidas pelo próprio site, pasta public/produtos).
update product_colors pc set images = v.images::jsonb
from (values
  ('azul-royal', '{"front":"/produtos/azul-royal-mulher.jpg","gallery":["/produtos/azul-royal-homem.jpg"]}'),
  ('bege',       '{"front":"/produtos/bege-frente-costas.jpg"}'),
  ('rosa',       '{"front":"/produtos/rosa-frente.jpg","gallery":["/produtos/rosa-lado.jpg"]}'),
  ('azul-petroleo', '{"front":"/produtos/petroleo-mulher.jpg","gallery":["/produtos/petroleo-casal.jpg","/produtos/petroleo-homem.jpg"]}'),
  ('cinzento',   '{"front":"/produtos/cinzento-mulher.jpg","gallery":["/produtos/cinzento-casal.jpg","/produtos/cinzento-homem.jpg"]}'),
  ('bordo',      '{"front":"/produtos/bordo-mulher.jpg","gallery":["/produtos/bordo-casal.jpg"]}'),
  ('azul-turquesa', '{"front":"/produtos/turquesa-mulher.jpg","gallery":["/produtos/turquesa-homem.jpg"]}'),
  ('pink',          '{"front":"/produtos/pink-mulher.jpg","gallery":["/produtos/pink-homem.jpg"]}'),
  ('verde-garrafa', '{"front":"/produtos/verde-garrafa-mulher.jpg","gallery":["/produtos/verde-garrafa-homem.jpg"]}'),
  ('rosa-salmao',   '{"front":"/produtos/salmao-mulher.jpg","gallery":["/produtos/salmao-homem.jpg"]}'),
  ('vermelho',      '{"front":"/produtos/vermelho-mulher.jpg","gallery":["/produtos/vermelho-homem.jpg"]}'),
  ('branco',        '{"front":"/produtos/branco-mulher.jpg","gallery":["/produtos/branco-homem.jpg"]}'),
  ('verde-lima',    '{"front":"/produtos/verde-lima-mulher.jpg","gallery":["/produtos/verde-lima-homem.jpg"]}'),
  ('preto',         '{"front":"/produtos/preto-mulher.jpg","gallery":["/produtos/preto-homem.jpg"]}'),
  ('camuflado',     '{"front":"/produtos/camuflado-mulher.jpg"}')
) as v(color_id, images), products p
where pc.color_id = v.color_id and pc.product_id = p.id and p.slug = 'conjunto-scrub-medique'
  and pc.images = '{}'::jsonb;
