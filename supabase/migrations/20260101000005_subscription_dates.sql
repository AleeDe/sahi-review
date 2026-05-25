-- Track subscription start + end dates explicitly.
-- subscription_started_at = first payment date (set on first recordPayment).
-- subscription_ends_at = latest payment.period_end (advances with each payment).

alter table businesses
  add column if not exists subscription_started_at timestamptz,
  add column if not exists subscription_ends_at timestamptz;

-- Backfill from any existing payments (if any tenant already has payments).
update businesses b set
  subscription_started_at = (
    select min(created_at) from payments p where p.business_id = b.id
  ),
  subscription_ends_at = (
    select max(period_end)::timestamptz from payments p where p.business_id = b.id
  )
where exists (select 1 from payments p where p.business_id = b.id);

-- After-insert trigger on payments → keep subscription dates fresh.
create or replace function bump_subscription_dates()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update businesses set
    subscription_started_at = coalesce(subscription_started_at, new.created_at),
    subscription_ends_at = greatest(coalesce(subscription_ends_at, '1970-01-01'::timestamptz), new.period_end::timestamptz),
    subscription_status = 'active'
  where id = new.business_id;
  return new;
end $$;

drop trigger if exists trg_bump_subscription_dates on payments;
create trigger trg_bump_subscription_dates
  after insert on payments
  for each row execute function bump_subscription_dates();
