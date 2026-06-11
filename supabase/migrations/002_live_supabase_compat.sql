-- Compatibility fixes applied to the live Rank Condutores project.
-- Keeps existing deployments aligned with the app without exposing secrets.

alter table public.import_batches
  add column if not exists file_name text;

update public.import_batches
set file_name = coalesce(file_name, original_filename, 'unknown.xlsx')
where file_name is null;

alter table public.import_batches
  alter column file_name set default 'unknown.xlsx';

alter table public.import_batches
  alter column file_name set not null;

alter table public.import_batches
  add column if not exists valid_cards integer;

update public.import_batches
set valid_cards = coalesce(valid_cards, valid_rows, 0)
where valid_cards is null;

alter table public.import_batches
  alter column valid_cards set default 0;

alter table public.import_batches
  alter column valid_cards set not null;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  has_active_column boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_profiles'
      and column_name = 'active'
  )
  into has_active_column;

  if has_active_column then
    execute $sql$
      insert into public.user_profiles (user_id, full_name, role, active)
      values ($1, coalesce($2, $3, $4), 'viewer', true)
      on conflict (user_id) do nothing
    $sql$
    using new.id, new.raw_app_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'full_name', new.email;
  else
    execute $sql$
      insert into public.user_profiles (user_id, full_name, role)
      values ($1, coalesce($2, $3, $4), 'viewer')
      on conflict (user_id) do nothing
    $sql$
    using new.id, new.raw_app_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'full_name', new.email;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

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
