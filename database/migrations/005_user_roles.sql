begin;

create or replace function public.get_organization_members()
returns table (
  user_id uuid,
  email text,
  role text,
  joined_at timestamptz,
  organization_id uuid,
  organization_name text,
  is_current_user boolean,
  can_manage boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_organization_id uuid;
  caller_membership_role text;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;

  select membership.organization_id, membership.role
  into current_organization_id, caller_membership_role
  from public.organization_memberships as membership
  where membership.user_id = current_user_id
  order by membership.created_at
  limit 1;

  if current_organization_id is null then raise exception 'Organization membership required'; end if;

  return query
  select membership.user_id,
         coalesce(app_user.email, 'Unknown account')::text,
         membership.role,
         membership.created_at,
         organization.id,
         organization.name,
         membership.user_id = current_user_id,
         caller_membership_role = 'administrator'
  from public.organization_memberships as membership
  join public.organizations as organization on organization.id = membership.organization_id
  left join auth.users as app_user on app_user.id = membership.user_id
  where membership.organization_id = current_organization_id
  order by app_user.email nulls last;
end;
$$;

create or replace function public.change_organization_member_role(target_user_id uuid, new_role text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_organization_id uuid;
  caller_membership_role text;
  target_role text;
  administrator_count integer;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if new_role not in ('administrator', 'treasurer', 'data_entry', 'approver', 'viewer') then raise exception 'Invalid organization role'; end if;

  select membership.organization_id, membership.role
  into current_organization_id, caller_membership_role
  from public.organization_memberships as membership
  where membership.user_id = current_user_id
  order by membership.created_at
  limit 1;

  if caller_membership_role is distinct from 'administrator' then raise exception 'Only administrators can change roles'; end if;

  perform 1
  from public.organization_memberships
  where organization_id = current_organization_id
  for update;

  select membership.role into target_role
  from public.organization_memberships as membership
  where membership.organization_id = current_organization_id
    and membership.user_id = target_user_id;

  if target_role is null then raise exception 'Organization member not found'; end if;

  if target_role = 'administrator' and new_role <> 'administrator' then
    select count(*) into administrator_count
    from public.organization_memberships
    where organization_id = current_organization_id
      and role = 'administrator';
    if administrator_count <= 1 then raise exception 'The organization must keep at least one administrator'; end if;
  end if;

  update public.organization_memberships
  set role = new_role
  where organization_id = current_organization_id
    and user_id = target_user_id;

  return new_role;
end;
$$;

revoke all on function public.get_organization_members() from public, anon;
revoke all on function public.change_organization_member_role(uuid, text) from public, anon;
grant execute on function public.get_organization_members() to authenticated;
grant execute on function public.change_organization_member_role(uuid, text) to authenticated;

commit;
