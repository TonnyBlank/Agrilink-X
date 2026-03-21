alter table public.micro_loan_applications
  add column if not exists interest_rate numeric(5,2),
  add column if not exists repayment_days integer;
