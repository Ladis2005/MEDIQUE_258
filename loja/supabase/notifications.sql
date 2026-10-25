-- Avisos de venda com o painel fechado (notificação push no telemóvel + email).
-- Corra uma vez no SQL Editor do Supabase. Pode correr de novo sem problema.
-- Antes de correr, troque TROCAR_PELA_PALAVRA_SECRETA pelo mesmo valor de NOTIFY_SECRET na Vercel.

-- Permite ao Supabase chamar o site (Vercel) quando entra uma encomenda.
create extension if not exists pg_net;

-- Telemóveis e computadores onde a equipa ativou os avisos no painel.
create table if not exists push_subscriptions (
  endpoint     text primary key,
  subscription jsonb not null,
  user_id      uuid references auth.users(id) on delete cascade default auth.uid(),
  created_at   timestamptz not null default now()
);
alter table push_subscriptions enable row level security;
drop policy if exists "admin avisos" on push_subscriptions;
create policy "admin avisos" on push_subscriptions for all using (is_admin()) with check (is_admin());

-- Configuração privada: sem políticas, só as funções do servidor a leem.
create table if not exists notify_config (
  key   text primary key,
  value text not null
);
alter table notify_config enable row level security;
insert into notify_config (key, value) values
  ('url', 'https://medique-seven.vercel.app/api/order-notify'),
  ('secret', 'TROCAR_PELA_PALAVRA_SECRETA')
on conflict (key) do update set value = excluded.value;

-- A cada encomenda nova, envia-a ao site com a lista de telemóveis a avisar.
create or replace function notify_new_order() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_url    text := (select value from notify_config where key = 'url');
  v_secret text := (select value from notify_config where key = 'secret');
begin
  if v_url is null then return new; end if;
  perform net.http_post(
    url     := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', v_secret),
    body    := jsonb_build_object(
      'order', to_jsonb(new),
      'subscriptions', coalesce((select jsonb_agg(subscription) from push_subscriptions), '[]'::jsonb)
    ),
    timeout_milliseconds := 10000
  );
  return new;
exception when others then
  -- Um aviso falhado nunca pode impedir a venda.
  raise warning 'aviso de venda falhou: %', sqlerrm;
  return new;
end $$;

drop trigger if exists orders_notify on orders;
create trigger orders_notify after insert on orders
  for each row execute function notify_new_order();
