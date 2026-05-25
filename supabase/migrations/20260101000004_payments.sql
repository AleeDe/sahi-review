-- Manual payment tracking (no Stripe in MVP for PK; founder records bank/JazzCash/Easypaisa transfers).

create table payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 0),
  currency text not null check (currency in ('PKR','USD')),
  method text not null check (method in ('bank_transfer','jazzcash','easypaisa','stripe','cash','other')),
  reference text,
  period_start date not null,
  period_end date not null check (period_end >= period_start),
  recorded_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);
create index on payments (business_id, created_at desc);
create index on payments (period_end);

alter table businesses
  add column if not exists billing_email text,
  add column if not exists monthly_amount numeric(10,2),
  add column if not exists currency text check (currency in ('PKR','USD'));

-- Default monthly_amount + currency from plan, for businesses created earlier.
update businesses set
  monthly_amount = case when plan = 'local_pkr' then 1500 else 99 end,
  currency = case when plan = 'local_pkr' then 'PKR' else 'USD' end
where monthly_amount is null;

-- RLS
alter table payments enable row level security;

create policy pay_admin_all on payments for all to authenticated
  using (is_admin())
  with check (is_admin());

create policy pay_owner_select on payments for select to authenticated
  using (is_business_owner_of(business_id));
