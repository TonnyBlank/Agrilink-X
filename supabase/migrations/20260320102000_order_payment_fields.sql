alter table public.orders
add column if not exists payment_status text not null default 'unpaid'
  check (payment_status in ('unpaid', 'initiated', 'pending_confirmation', 'paid', 'failed'));

alter table public.orders
add column if not exists merchant_request_id text;

alter table public.orders
add column if not exists checkout_request_id text;

alter table public.orders
add column if not exists payment_error text;

alter table public.orders
add column if not exists paid_at timestamptz;

create index if not exists orders_checkout_request_id_idx on public.orders(checkout_request_id);
