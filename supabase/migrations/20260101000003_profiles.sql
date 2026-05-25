-- profiles: one row per auth.users, holds display-only fields.
-- Role stays in auth.users.app_metadata (for fast JWT-based RLS checks).
-- This table is for full name, avatar, phone, and any other UI metadata.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on profiles (email);

-- Auto-create profile row whenever a new auth user is created.
-- Pulls full_name + avatar from OAuth provider metadata if available.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Keep updated_at fresh on changes.
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_profiles_touch
  before update on profiles
  for each row execute function touch_updated_at();

-- RLS
alter table profiles enable row level security;

-- A user can read & update their own profile.
create policy profile_owner_select on profiles for select to authenticated
  using (id = auth.uid());
create policy profile_owner_update on profiles for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and email = (select email from profiles where id = auth.uid())  -- email is read-only
  );

-- Admins can read every profile (needed for the admin tenant list).
create policy profile_admin_select on profiles for select to authenticated
  using (is_admin());

-- Backfill profiles for users that already exist (e.g. you, signed in before this migration).
insert into public.profiles (id, email, full_name, avatar_url)
select
  u.id,
  u.email,
  coalesce(
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name',
    split_part(u.email, '@', 1)
  ),
  coalesce(
    u.raw_user_meta_data ->> 'avatar_url',
    u.raw_user_meta_data ->> 'picture'
  )
from auth.users u
where u.email is not null
on conflict (id) do nothing;
