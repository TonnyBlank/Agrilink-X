create table if not exists public.micro_loan_offers (
  id uuid primary key default gen_random_uuid(),
  applicant_role text not null check (applicant_role in ('farmer_pro', 'buyer_enterprise')),
  product_type text not null check (product_type in ('seasonal_working_capital', 'equipment_top_up', 'buyer_contract_financing')),
  product_title text not null,
  max_amount numeric(12,2) not null check (max_amount > 0),
  interest_rate numeric(5,2),
  repayment_days integer,
  speed text,
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists micro_loan_offers_role_active_created_idx
  on public.micro_loan_offers (applicant_role, is_active, created_at desc);

alter table public.micro_loan_offers enable row level security;

drop policy if exists "micro_loan_offers_authenticated_read" on public.micro_loan_offers;

create policy "micro_loan_offers_authenticated_read"
on public.micro_loan_offers
for select
using (auth.role() = 'authenticated');
