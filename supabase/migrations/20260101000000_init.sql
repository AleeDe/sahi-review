-- Sahi Review — initial schema
create extension if not exists pgcrypto;
create extension if not exists citext;

-- businesses (tenants)
create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  slug citext not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$'),
  google_place_id text,
  google_rating_cached numeric(2,1) check (google_rating_cached between 0 and 5),
  google_review_count_cached int default 0 check (google_review_count_cached >= 0),
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  subscription_status text not null default 'trial'
    check (subscription_status in ('trial','active','paused','cancelled')),
  plan text not null default 'local_pkr' check (plan in ('local_pkr','international_usd')),
  owner_user_id uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index on businesses (owner_user_id);
create index on businesses (subscription_status) where subscription_status in ('trial','active');

-- feedback
create table feedback (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text check (length(comment) <= 2000),
  customer_name text check (length(customer_name) <= 120),
  customer_phone_hash text,
  redirected_to_google boolean not null default false,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index on feedback (business_id, created_at desc);
create index on feedback (business_id, rating);
create index on feedback (business_id, created_at desc) where rating <= 3;
create index on feedback (business_id, ip_hash, created_at desc);

-- per-tenant settings (threshold etc.)
create table business_settings (
  business_id uuid primary key references businesses(id) on delete cascade,
  threshold_rating int not null default 4 check (threshold_rating between 1 and 5),
  redirect_url text,
  branding jsonb not null default '{}'::jsonb
);

-- audit log
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid,
  action text not null,
  business_id uuid references businesses(id) on delete set null,
  meta jsonb not null default '{}'::jsonb,
  at timestamptz not null default now()
);
create index on audit_log (business_id, at desc);

-- role helpers
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

create or replace function is_business_owner_of(b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from businesses where id = b and owner_user_id = auth.uid())
$$;

revoke all on function is_admin(), is_business_owner_of(uuid) from public;
grant execute on function is_admin(), is_business_owner_of(uuid) to authenticated, anon;

-- RLS
alter table businesses        enable row level security;
alter table feedback          enable row level security;
alter table business_settings enable row level security;
alter table audit_log         enable row level security;

-- businesses policies
create policy biz_owner_select on businesses for select to authenticated
  using (owner_user_id = auth.uid() or is_admin());
create policy biz_anon_lookup on businesses for select to anon
  using (subscription_status in ('trial','active'));
create policy biz_owner_update on businesses for update to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());
create policy biz_admin_update on businesses for update to authenticated
  using (is_admin());
create policy biz_admin_delete on businesses for delete to authenticated using (is_admin());

-- feedback policies — owners read their own; admin BLOCKED on PII columns via column grants below
create policy fb_owner_select on feedback for select to authenticated
  using (is_business_owner_of(business_id));
-- inserts happen via service_role (server-side API); no anon insert policy needed.

-- business_settings policies
create policy bs_owner_all on business_settings for all to authenticated
  using (is_business_owner_of(business_id))
  with check (is_business_owner_of(business_id));

-- audit_log policies
create policy al_admin_read on audit_log for select to authenticated using (is_admin());
create policy al_owner_read on audit_log for select to authenticated
  using (business_id is not null and is_business_owner_of(business_id));

-- admin-safe stats view (no PII)
create view admin_feedback_stats as
  select id, business_id, rating, redirected_to_google, created_at
  from feedback;

grant select on admin_feedback_stats to authenticated;

-- auto-create business_settings on new business
create or replace function ensure_business_settings()
returns trigger language plpgsql as $$
begin
  insert into business_settings (business_id) values (new.id)
  on conflict do nothing;
  return new;
end $$;

create trigger trg_ensure_business_settings
after insert on businesses
for each row execute function ensure_business_settings();
