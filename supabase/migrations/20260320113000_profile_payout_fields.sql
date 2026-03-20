alter table public.profiles
add column if not exists payout_method text
  check (payout_method in ('mpesa', 'bank'));

alter table public.profiles
add column if not exists payout_mpesa_number text;

alter table public.profiles
add column if not exists bank_name text;

alter table public.profiles
add column if not exists bank_account_name text;

alter table public.profiles
add column if not exists bank_account_number text;

alter table public.profiles
add column if not exists payout_details_updated_at timestamptz;
