alter table public.micro_loan_applications
  add column if not exists disbursed_at timestamptz,
  add column if not exists repaid_at timestamptz;

alter table public.micro_loan_applications
  drop constraint if exists micro_loan_applications_status_check;

alter table public.micro_loan_applications
  add constraint micro_loan_applications_status_check
  check (status in ('pending_review', 'approved', 'rejected', 'disbursed', 'repaid'));

update public.micro_loan_applications
set disbursed_at = coalesce(disbursed_at, reviewed_at, created_at)
where status in ('approved', 'disbursed', 'repaid');

create table if not exists public.micro_loan_repayments (
  id uuid primary key default gen_random_uuid(),
  loan_application_id uuid not null references public.micro_loan_applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null default 'mpesa',
  payment_ref text,
  phone_number text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists micro_loan_repayments_loan_created_idx
  on public.micro_loan_repayments (loan_application_id, created_at asc);

create index if not exists micro_loan_repayments_user_created_idx
  on public.micro_loan_repayments (user_id, created_at desc);

alter table public.micro_loan_repayments enable row level security;

drop policy if exists "micro_loan_repayment_owner_read" on public.micro_loan_repayments;
drop policy if exists "micro_loan_repayment_owner_insert" on public.micro_loan_repayments;

create policy "micro_loan_repayment_owner_read"
on public.micro_loan_repayments
for select
using (user_id = auth.uid());

create policy "micro_loan_repayment_owner_insert"
on public.micro_loan_repayments
for insert
with check (user_id = auth.uid());
