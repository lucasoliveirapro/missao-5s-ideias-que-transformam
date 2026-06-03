-- Missao 5S - hardening de RLS, views e RPCs
-- Execute no SQL Editor do Supabase ou via migration antes de publicar em producao.

alter table public.participants enable row level security;
alter table public.ideas enable row level security;
alter table public.app_admins enable row level security;

alter view public.public_ranking set (security_invoker = true);
alter view public.admin_ideas_view set (security_invoker = true);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path to public
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create or replace function public.admin_update_idea_status(p_idea_id uuid, p_status text)
returns jsonb
language plpgsql
security invoker
set search_path to public
as $$
declare
  v_idea record;
  v_bonus integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Acesso negado. Usuario nao e administrador.';
  end if;

  if p_status not in ('Recebida', 'Em análise', 'Aprovada', 'Implantada', 'Recusada') then
    raise exception 'Status invalido.';
  end if;

  select *
  into v_idea
  from public.ideas
  where id = p_idea_id
  for update;

  if not found then
    raise exception 'Ideia nao encontrada.';
  end if;

  if p_status = 'Aprovada' and v_idea.bonus_aprovada = false then
    v_bonus := 20;

    update public.ideas
    set
      status = p_status,
      bonus_aprovada = true,
      pontos = pontos + v_bonus,
      atualizado_em = now()
    where id = p_idea_id;

  elsif p_status = 'Implantada' and v_idea.bonus_implantada = false then
    v_bonus := 50;

    update public.ideas
    set
      status = p_status,
      bonus_implantada = true,
      pontos = pontos + v_bonus,
      atualizado_em = now()
    where id = p_idea_id;

  else
    update public.ideas
    set
      status = p_status,
      atualizado_em = now()
    where id = p_idea_id;
  end if;

  if v_bonus > 0 then
    update public.participants
    set total_pontos = total_pontos + v_bonus
    where matricula = v_idea.matricula;
  end if;

  return jsonb_build_object(
    'success', true,
    'idea_id', p_idea_id,
    'status', p_status,
    'bonus_adicionado', v_bonus
  );
end;
$$;

create or replace function public.admin_clear_event()
returns jsonb
language plpgsql
security invoker
set search_path to public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso negado. Usuario nao e administrador.';
  end if;

  delete from public.ideas;
  delete from public.participants;

  return jsonb_build_object(
    'success', true,
    'message', 'Dados do evento apagados com sucesso.'
  );
end;
$$;

drop policy if exists "public_update_participants" on public.participants;
drop policy if exists "public_insert_participants" on public.participants;
drop policy if exists "public_read_ranking" on public.participants;
drop policy if exists "admin_manage_participants" on public.participants;
drop policy if exists "public can update participants" on public.participants;
drop policy if exists "public can insert participants" on public.participants;
drop policy if exists "public can read participants" on public.participants;
drop policy if exists "admin can manage participants" on public.participants;

drop policy if exists "public_insert_ideas" on public.ideas;
drop policy if exists "admin_read_ideas" on public.ideas;
drop policy if exists "admin_update_ideas" on public.ideas;
drop policy if exists "admin_delete_ideas" on public.ideas;
drop policy if exists "public can insert ideas" on public.ideas;
drop policy if exists "admin can read ideas" on public.ideas;
drop policy if exists "admin can manage ideas" on public.ideas;

drop policy if exists "admin_read_own_record" on public.app_admins;
drop policy if exists "admin can read admins" on public.app_admins;

create policy "public can read ranking participants"
on public.participants
for select
to anon, authenticated
using (true);

create policy "admin can manage participants"
on public.participants
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admin can manage ideas"
on public.ideas
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admin can read own record"
on public.app_admins
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke all privileges on table public.participants from anon, authenticated;
revoke all privileges on table public.ideas from anon, authenticated;
revoke all privileges on table public.app_admins from anon, authenticated;
revoke all privileges on table public.public_ranking from anon, authenticated;
revoke all privileges on table public.admin_ideas_view from anon, authenticated;

grant select (nome, matricula, turno, total_ideias, total_pontos, ultima_participacao)
on table public.participants
to anon, authenticated;

grant update, delete on table public.participants to authenticated;
grant select, update, delete on table public.ideas to authenticated;
grant select on table public.app_admins to authenticated;
grant select on table public.public_ranking to anon, authenticated;
grant select on table public.admin_ideas_view to authenticated;

revoke execute on function public.submit_idea(text, text, text, text, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.admin_update_idea_status(uuid, text) from public, anon, authenticated;
revoke execute on function public.admin_clear_event() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

grant execute on function public.submit_idea(text, text, text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.admin_update_idea_status(uuid, text) to authenticated;
grant execute on function public.admin_clear_event() to authenticated;
grant execute on function public.is_admin() to authenticated;
