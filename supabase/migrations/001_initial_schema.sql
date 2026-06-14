-- =========================================================
-- Ranking AM - Cartoes SS Z2/Z3/Z4
-- Supabase/PostgreSQL initial schema
-- =========================================================

create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists unaccent;

create schema if not exists app_private;

-- -----------------------------
-- Types
-- -----------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'leader', 'viewer');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'z_card_type') then
    create type public.z_card_type as enum ('Z2', 'Z3', 'Z4');
  end if;
end $$;

-- -----------------------------
-- Utility functions
-- -----------------------------

create or replace function public.normalize_name(input text)
returns text
language sql
immutable
parallel safe
set search_path = public
as $$
  select nullif(
    upper(
      trim(
        regexp_replace(
          unaccent(coalesce(input, '')),
          '\s+',
          ' ',
          'g'
        )
      )
    ),
    ''
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function app_private.has_any_role(required_roles public.app_role[])
returns boolean
language sql
security definer
stable
set search_path = public, app_private
as $$
  select exists (
    select 1
    from public.user_profiles p
    where p.user_id = auth.uid()
      and p.role = any(required_roles)
  );
$$;

revoke all on function app_private.has_any_role(public.app_role[]) from public;
grant usage on schema app_private to authenticated;
grant execute on function app_private.has_any_role(public.app_role[]) to authenticated;

create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, app_private
as $$
begin
  insert into public.user_profiles (user_id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_app_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'full_name'),
    'viewer'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- -----------------------------
-- User profiles
-- -----------------------------

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role public.app_role not null default 'viewer',
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function app_private.handle_new_user();

-- -----------------------------
-- Operators
-- -----------------------------

create table if not exists public.operators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text generated always as (public.normalize_name(name)) stored,
  badge text,
  shift text,
  team text,
  ute text,
  photo_path text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint operators_name_not_empty check (length(trim(name)) > 0)
);

create unique index if not exists operators_normalized_name_active_idx
on public.operators (normalized_name)
where active = true;

create index if not exists operators_shift_idx on public.operators (shift);
create index if not exists operators_team_idx on public.operators (team);
create index if not exists operators_ute_idx on public.operators (ute);

drop trigger if exists trg_operators_updated_at on public.operators;
create trigger trg_operators_updated_at
before update on public.operators
for each row execute function public.set_updated_at();

create table if not exists public.operator_aliases (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id) on delete cascade,
  alias text not null,
  normalized_alias text generated always as (public.normalize_name(alias)) stored,
  created_at timestamptz not null default now(),
  constraint operator_aliases_alias_not_empty check (length(trim(alias)) > 0)
);

create unique index if not exists operator_aliases_normalized_alias_idx
on public.operator_aliases (normalized_alias);

create index if not exists operator_aliases_operator_id_idx
on public.operator_aliases (operator_id);

-- -----------------------------
-- Import batches
-- -----------------------------

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  total_rows integer not null default 0,
  valid_cards integer not null default 0,
  ignored_rows integer not null default 0,
  error_rows integer not null default 0,
  z2_count integer not null default 0,
  z3_count integer not null default 0,
  z4_count integer not null default 0,
  min_created_at timestamptz,
  max_created_at timestamptz,
  imported_by uuid references auth.users(id),
  status text not null default 'completed',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists import_batches_created_at_idx
on public.import_batches (created_at desc);

create index if not exists import_batches_imported_by_idx
on public.import_batches (imported_by);

-- -----------------------------
-- SS cards
-- -----------------------------

create table if not exists public.ss_cards (
  id uuid primary key default gen_random_uuid(),
  ss_number text not null unique,
  status text,
  company text,
  unit text,
  location_1 text,
  location_2 text,
  location_3 text,
  location_4 text,
  line text,
  operation text,
  ute_mapped text,
  asset text,
  requester_name text,
  requester_email text,
  user_name text,
  normalized_user_name text generated always as (public.normalize_name(user_name)) stored,
  main_subject text,
  secondary_subject text,
  z_type public.z_card_type,
  description text,
  machine_stopped boolean,
  safety_item boolean,
  created_at_manusis timestamptz,
  classification text,
  safety text,
  production text,
  quality text,
  environment text,
  cost_center text,
  work_center text,
  has_wcm_tag boolean,
  wcm_pillar text,
  om_number text,
  om_status text,
  om_service_type text,
  om_service_nature text,
  om_opened_at timestamptz,
  om_description text,
  om_closed_at timestamptz,
  is_closed_for_operator boolean not null default false,
  raw_data jsonb not null default '{}'::jsonb,
  import_batch_id uuid references public.import_batches(id) on delete set null,
  imported_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ss_cards_ss_number_not_empty check (length(trim(ss_number)) > 0)
);

create index if not exists ss_cards_created_at_manusis_idx
on public.ss_cards (created_at_manusis desc);

create index if not exists ss_cards_z_type_idx on public.ss_cards (z_type);
create index if not exists ss_cards_status_idx on public.ss_cards (status);
create index if not exists ss_cards_line_idx on public.ss_cards (line);
create index if not exists ss_cards_ute_mapped_idx on public.ss_cards (ute_mapped);
create index if not exists ss_cards_normalized_user_name_idx on public.ss_cards (normalized_user_name);
create index if not exists ss_cards_import_batch_id_idx on public.ss_cards (import_batch_id);

create index if not exists ss_cards_ranking_idx
on public.ss_cards (
  created_at_manusis,
  z_type,
  normalized_user_name,
  status,
  ute_mapped,
  line
);

drop trigger if exists trg_ss_cards_updated_at on public.ss_cards;
create trigger trg_ss_cards_updated_at
before update on public.ss_cards
for each row execute function public.set_updated_at();

create table if not exists public.import_errors (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid references public.import_batches(id) on delete cascade,
  row_number integer,
  error_code text not null,
  error_message text not null,
  raw_row jsonb,
  created_at timestamptz not null default now()
);

create index if not exists import_errors_batch_id_idx
on public.import_errors (import_batch_id);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx
on public.audit_logs (created_at desc);

create index if not exists audit_logs_actor_user_id_idx
on public.audit_logs (actor_user_id);

-- -----------------------------
-- Ranking view
-- -----------------------------

create or replace view public.v_ss_cards_enriched
with (security_invoker = true)
as
select
  c.*,
  o.id as operator_id,
  o.name as operator_name,
  o.badge as operator_badge,
  o.shift as operator_shift,
  o.team as operator_team,
  o.ute as operator_ute,
  o.photo_path as operator_photo_path,
  (o.id is not null) as has_registered_operator
from public.ss_cards c
left join public.operators o
  on o.active = true
 and o.normalized_name = c.normalized_user_name

union all

select
  c.*,
  o.id as operator_id,
  o.name as operator_name,
  o.badge as operator_badge,
  o.shift as operator_shift,
  o.team as operator_team,
  o.ute as operator_ute,
  o.photo_path as operator_photo_path,
  true as has_registered_operator
from public.ss_cards c
join public.operator_aliases a
  on a.normalized_alias = c.normalized_user_name
join public.operators o
  on o.id = a.operator_id
 and o.active = true
where not exists (
  select 1
  from public.operators direct_o
  where direct_o.active = true
    and direct_o.normalized_name = c.normalized_user_name
);

-- -----------------------------
-- Storage bucket
-- -----------------------------

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'operator-photos',
  'operator-photos',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- -----------------------------
-- RLS
-- -----------------------------

alter table public.user_profiles enable row level security;
alter table public.operators enable row level security;
alter table public.operator_aliases enable row level security;
alter table public.import_batches enable row level security;
alter table public.ss_cards enable row level security;
alter table public.import_errors enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Users can read own profile" on public.user_profiles;
create policy "Users can read own profile"
on public.user_profiles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Admins can read all profiles" on public.user_profiles;
create policy "Admins can read all profiles"
on public.user_profiles
for select
to authenticated
using (app_private.has_any_role(array['admin']::public.app_role[]));

drop policy if exists "Admins can manage profiles" on public.user_profiles;
create policy "Admins can manage profiles"
on public.user_profiles
for all
to authenticated
using (app_private.has_any_role(array['admin']::public.app_role[]))
with check (app_private.has_any_role(array['admin']::public.app_role[]));

drop policy if exists "Authenticated users can read operators" on public.operators;
create policy "Authenticated users can read operators"
on public.operators
for select
to authenticated
using (true);

drop policy if exists "Admins and leaders can manage operators" on public.operators;
create policy "Admins and leaders can manage operators"
on public.operators
for all
to authenticated
using (app_private.has_any_role(array['admin', 'leader']::public.app_role[]))
with check (app_private.has_any_role(array['admin', 'leader']::public.app_role[]));

drop policy if exists "Authenticated users can read operator aliases" on public.operator_aliases;
create policy "Authenticated users can read operator aliases"
on public.operator_aliases
for select
to authenticated
using (true);

drop policy if exists "Admins and leaders can manage operator aliases" on public.operator_aliases;
create policy "Admins and leaders can manage operator aliases"
on public.operator_aliases
for all
to authenticated
using (app_private.has_any_role(array['admin', 'leader']::public.app_role[]))
with check (app_private.has_any_role(array['admin', 'leader']::public.app_role[]));

drop policy if exists "Authenticated users can read ss cards" on public.ss_cards;
create policy "Authenticated users can read ss cards"
on public.ss_cards
for select
to authenticated
using (true);

drop policy if exists "Admins and leaders can manage ss cards" on public.ss_cards;
create policy "Admins and leaders can manage ss cards"
on public.ss_cards
for all
to authenticated
using (app_private.has_any_role(array['admin', 'leader']::public.app_role[]))
with check (app_private.has_any_role(array['admin', 'leader']::public.app_role[]));

drop policy if exists "Admins and leaders can read import batches" on public.import_batches;
create policy "Admins and leaders can read import batches"
on public.import_batches
for select
to authenticated
using (app_private.has_any_role(array['admin', 'leader']::public.app_role[]));

drop policy if exists "Admins and leaders can create import batches" on public.import_batches;
create policy "Admins and leaders can create import batches"
on public.import_batches
for insert
to authenticated
with check (app_private.has_any_role(array['admin', 'leader']::public.app_role[]));

drop policy if exists "Admins and leaders can update import batches" on public.import_batches;
create policy "Admins and leaders can update import batches"
on public.import_batches
for update
to authenticated
using (app_private.has_any_role(array['admin', 'leader']::public.app_role[]))
with check (app_private.has_any_role(array['admin', 'leader']::public.app_role[]));

drop policy if exists "Admins and leaders can read import errors" on public.import_errors;
create policy "Admins and leaders can read import errors"
on public.import_errors
for select
to authenticated
using (app_private.has_any_role(array['admin', 'leader']::public.app_role[]));

drop policy if exists "Admins and leaders can create import errors" on public.import_errors;
create policy "Admins and leaders can create import errors"
on public.import_errors
for insert
to authenticated
with check (app_private.has_any_role(array['admin', 'leader']::public.app_role[]));

drop policy if exists "Admins and leaders can read audit logs" on public.audit_logs;
create policy "Admins and leaders can read audit logs"
on public.audit_logs
for select
to authenticated
using (app_private.has_any_role(array['admin', 'leader']::public.app_role[]));

drop policy if exists "Authenticated users can view operator photos metadata" on storage.objects;
create policy "Authenticated users can view operator photos metadata"
on storage.objects
for select
to authenticated
using (bucket_id = 'operator-photos');

drop policy if exists "Admins and leaders can upload operator photos" on storage.objects;
create policy "Admins and leaders can upload operator photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'operator-photos'
  and app_private.has_any_role(array['admin', 'leader']::public.app_role[])
);

drop policy if exists "Admins and leaders can update operator photos" on storage.objects;
create policy "Admins and leaders can update operator photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'operator-photos'
  and app_private.has_any_role(array['admin', 'leader']::public.app_role[])
)
with check (
  bucket_id = 'operator-photos'
  and app_private.has_any_role(array['admin', 'leader']::public.app_role[])
);

drop policy if exists "Admins and leaders can delete operator photos" on storage.objects;
create policy "Admins and leaders can delete operator photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'operator-photos'
  and app_private.has_any_role(array['admin', 'leader']::public.app_role[])
);

-- -----------------------------
-- Grants
-- -----------------------------

grant usage on schema public to anon, authenticated;
grant select on public.v_ss_cards_enriched to authenticated;

grant select on public.user_profiles to authenticated;
grant select on public.operators to authenticated;
grant select on public.operator_aliases to authenticated;
grant select on public.ss_cards to authenticated;
grant select on public.import_batches to authenticated;
grant select on public.import_errors to authenticated;
grant select on public.audit_logs to authenticated;

grant insert, update, delete on public.operators to authenticated;
grant insert, update, delete on public.operator_aliases to authenticated;
grant insert, update, delete on public.ss_cards to authenticated;
grant insert, update on public.import_batches to authenticated;
grant insert on public.import_errors to authenticated;

-- audit_logs writes are intentionally reserved for trusted server code.
