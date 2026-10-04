begin;

alter table public.organization_memberships add column if not exists active boolean not null default true;
alter table public.organization_memberships add column if not exists previous_role text check (previous_role is null or previous_role in ('administrator', 'treasurer', 'data_entry', 'approver', 'viewer'));
alter table public.organization_memberships add column if not exists deactivated_at timestamptz;
alter table public.organization_memberships add column if not exists deactivated_by uuid references auth.users(id) on delete set null;

create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.organization_memberships
    where organization_id = target_organization_id and user_id = (select auth.uid()) and active
  );
$$;

drop function if exists public.get_organization_members();

create or replace function public.get_organization_members()
returns table (user_id uuid, email text, role text, joined_at timestamptz, organization_id uuid, organization_name text, is_current_user boolean, can_manage boolean, active boolean, deactivated_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid(); current_organization_id uuid; caller_membership_role text;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  select membership.organization_id, membership.role into current_organization_id, caller_membership_role
  from public.organization_memberships as membership where membership.user_id = current_user_id and membership.active order by membership.created_at limit 1;
  if current_organization_id is null then raise exception 'Active organization membership required'; end if;
  return query select membership.user_id, coalesce(app_user.email, 'Unknown account')::text, membership.role, membership.created_at,
    organization.id, organization.name, membership.user_id = current_user_id, caller_membership_role = 'administrator', membership.active, membership.deactivated_at
  from public.organization_memberships as membership join public.organizations as organization on organization.id = membership.organization_id
  left join auth.users as app_user on app_user.id = membership.user_id where membership.organization_id = current_organization_id
  order by membership.active desc, app_user.email nulls last;
end;
$$;

revoke all on function public.get_organization_members() from public, anon;
grant execute on function public.get_organization_members() to authenticated;

create or replace function public.set_organization_member_active(target_user_id uuid, new_active boolean)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid(); current_organization_id uuid; caller_role text; target_role text; target_active boolean; active_administrator_count integer;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  select membership.organization_id, membership.role into current_organization_id, caller_role
  from public.organization_memberships as membership where membership.user_id = current_user_id and membership.active order by membership.created_at limit 1;
  if caller_role is distinct from 'administrator' then raise exception 'Only administrators can change member access'; end if;
  if target_user_id = current_user_id and not new_active then raise exception 'You cannot deactivate your own access'; end if;
  perform 1 from public.organization_memberships where organization_id = current_organization_id for update;
  select membership.role, membership.active into target_role, target_active from public.organization_memberships as membership
  where membership.organization_id = current_organization_id and membership.user_id = target_user_id;
  if target_role is null then raise exception 'Organization member not found'; end if;
  if target_active = new_active then return new_active; end if;
  if not new_active and target_role = 'administrator' then
    select count(*) into active_administrator_count from public.organization_memberships
    where organization_id = current_organization_id and role = 'administrator' and active;
    if active_administrator_count <= 1 then raise exception 'The final active administrator cannot be deactivated'; end if;
  end if;
  if new_active then
    update public.organization_memberships set active = true, role = coalesce(previous_role, role), previous_role = null, deactivated_at = null, deactivated_by = null
    where organization_id = current_organization_id and user_id = target_user_id;
  else
    update public.organization_memberships set active = false, previous_role = role, role = 'viewer', deactivated_at = now(), deactivated_by = current_user_id
    where organization_id = current_organization_id and user_id = target_user_id;
  end if;
  return new_active;
end;
$$;

revoke all on function public.set_organization_member_active(uuid, boolean) from public, anon;
grant execute on function public.set_organization_member_active(uuid, boolean) to authenticated;
commit;
