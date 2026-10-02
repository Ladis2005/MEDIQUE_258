-- MEDIQUE · esquema da base de dados (Supabase / PostgreSQL)
-- Correr uma vez no SQL Editor do projeto Supabase. Depois correr seed.sql.

create extension if not exists pgcrypto;

-- ───────────── Tabelas ─────────────

create table if not exists colors (
  id     text primary key,
  name   text not null,
  hex    text not null,
  swatch text,
  sort   int  not null default 0
);

create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text not null default '',
  categories  text[] not null default '{}',
  price       numeric(12,2),            -- null = "Preço sob consulta"
  is_new      boolean not null default false,
  active      boolean not null default true,
  model_url   text,
  created_at  timestamptz not null default now()
);

create table if not exists product_colors (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  color_id   text not null references colors(id),
  images     jsonb not null default '{}',
  pending    int  not null default 0 check (pending >= 0),  -- reservadas internamente (ex.: tamanho por confirmar)
  unique (product_id, color_id)
);

create table if not exists variants (
  product_color_id uuid not null references product_colors(id) on delete cascade,
  size             text not null,
  stock            int  not null default 0 check (stock >= 0),
  primary key (product_color_id, size)
);

create table if not exists orders (
  id         uuid primary key default gen_random_uuid(),
  number     bigint generated always as identity (start with 1001) unique,
  created_at timestamptz not null default now(),
  customer   jsonb not null,
  address    jsonb not null,
  items      jsonb not null,
  total      numeric(12,2),
  status     text not null default 'nova'
             check (status in ('nova','confirmada','paga','enviada','entregue','cancelada')),
  notes      text,
  channel    text not null default 'whatsapp'
);

create table if not exists settings (
  key   text primary key,
  value jsonb not null
);

-- Contas com acesso ao painel. Depois de criar o utilizador em Authentication → Users:
--   insert into admins (user_id) values ('<uuid do utilizador>');
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- ───────────── Funções ─────────────

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- Cria a encomenda e reserva o stock numa só transação.
-- O preço é sempre lido da base de dados, nunca do navegador.
create or replace function place_order(payload jsonb) returns orders
language plpgsql security definer set search_path = public as $$
declare
  it        jsonb;
  qty       int;
  v_price   numeric;
  has_null  boolean := false;
  v_total   numeric := 0;
  new_items jsonb := '[]';
  o         orders;
begin
  if jsonb_array_length(coalesce(payload->'items', '[]')) = 0 then
    raise exception 'Encomenda vazia';
  end if;

  for it in select * from jsonb_array_elements(payload->'items') loop
    qty := (it->>'qty')::int;
    if qty is null or qty < 1 or qty > 50 then
      raise exception 'Quantidade inválida';
    end if;

    update variants set stock = stock - qty
     where product_color_id = (it->>'productColorId')::uuid
       and size = it->>'size'
       and stock >= qty;
    if not found then
      raise exception 'SEM_STOCK:%:%', it->>'colorName', it->>'size';
    end if;

    select p.price into v_price
      from products p join product_colors pc on pc.product_id = p.id
     where pc.id = (it->>'productColorId')::uuid;

    if v_price is null then has_null := true; else v_total := v_total + v_price * qty; end if;
    new_items := new_items || jsonb_set(it, '{unitPrice}', coalesce(to_jsonb(v_price), 'null'::jsonb));
  end loop;

  insert into orders (customer, address, items, total, notes)
  values (payload->'customer', payload->'address', new_items,
          case when has_null then null else v_total end, payload->>'notes')
  returning * into o;
  return o;
end $$;

-- Muda o estado de uma encomenda. Cancelar repõe o stock; reabrir volta a reservá-lo.
create or replace function set_order_status(order_id uuid, new_status text) returns void
language plpgsql security definer set search_path = public as $$
declare
  o  orders;
  it jsonb;
  d  int;
begin
  if not is_admin() then raise exception 'Sem permissão'; end if;
  select * into o from orders where id = order_id for update;
  if not found then raise exception 'Encomenda não encontrada'; end if;

  d := case
         when new_status = 'cancelada' and o.status <> 'cancelada' then 1
         when new_status <> 'cancelada' and o.status = 'cancelada' then -1
         else 0 end;

  if d <> 0 then
    for it in select * from jsonb_array_elements(o.items) loop
      update variants set stock = stock + d * (it->>'qty')::int
       where product_color_id = (it->>'productColorId')::uuid and size = it->>'size'
         and stock + d * (it->>'qty')::int >= 0;
      if not found then
        raise exception 'SEM_STOCK:%:%', it->>'colorName', it->>'size';
      end if;
    end loop;
  end if;

  update orders set status = new_status where id = order_id;
end $$;

grant execute on function place_order(jsonb) to anon, authenticated;
grant execute on function is_admin() to anon, authenticated;
grant execute on function set_order_status(uuid, text) to authenticated;

-- ───────────── Segurança (RLS) ─────────────

alter table colors         enable row level security;
alter table products       enable row level security;
alter table product_colors enable row level security;
alter table variants       enable row level security;
alter table orders         enable row level security;
alter table settings       enable row level security;
alter table admins         enable row level security;

-- Leitura pública do catálogo (produtos ocultos só para admins).
create policy "catalogo publico" on colors         for select using (true);
create policy "produtos visiveis" on products      for select using (active or is_admin());
create policy "cores do produto" on product_colors for select using (true);
create policy "stock publico"    on variants       for select using (true);
create policy "definicoes"       on settings       for select using (true);

-- Escrita só para admins.
create policy "admin cores"     on colors         for all using (is_admin()) with check (is_admin());
create policy "admin produtos"  on products       for all using (is_admin()) with check (is_admin());
create policy "admin pc"        on product_colors for all using (is_admin()) with check (is_admin());
create policy "admin variantes" on variants       for all using (is_admin()) with check (is_admin());
create policy "admin defin"     on settings       for all using (is_admin()) with check (is_admin());
-- Encomendas: clientes só criam através de place_order(); admins leem e atualizam.
create policy "admin encomendas" on orders        for select using (is_admin());
create policy "admin ve admins"  on admins        for select using (is_admin());

-- ───────────── Armazenamento de ficheiros ─────────────
-- Fotografias e modelos 3D ficam no bucket público "media".

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media publica" on storage.objects for select using (bucket_id = 'media');
create policy "admin envia media" on storage.objects for insert with check (bucket_id = 'media' and is_admin());
create policy "admin apaga media" on storage.objects for delete using (bucket_id = 'media' and is_admin());
