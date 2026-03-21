create table if not exists public.micro_loan_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  applicant_role text not null check (applicant_role in ('farmer_pro', 'buyer_enterprise')),
  product_type text not null check (product_type in ('seasonal_working_capital', 'equipment_top_up', 'buyer_contract_financing')),
  product_title text not null,
  requested_amount numeric(12,2) not null check (requested_amount > 0),
  approved_amount numeric(12,2),
  speed text,
  status text not null default 'approved' check (status in ('pending_review', 'approved', 'rejected', 'disbursed')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists micro_loan_applications_user_created_idx
  on public.micro_loan_applications (user_id, created_at desc);

alter table public.micro_loan_applications enable row level security;

drop policy if exists "micro_loan_owner_read" on public.micro_loan_applications;
drop policy if exists "micro_loan_owner_insert" on public.micro_loan_applications;
drop policy if exists "micro_loan_owner_update" on public.micro_loan_applications;

create policy "micro_loan_owner_read"
on public.micro_loan_applications
for select
using (user_id = auth.uid());

create policy "micro_loan_owner_insert"
on public.micro_loan_applications
for insert
with check (user_id = auth.uid());

create policy "micro_loan_owner_update"
on public.micro_loan_applications
for update
using (user_id = auth.uid());
