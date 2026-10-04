begin;

create or replace function public.add_organization_member(member_email text, member_role text)
returns table (user_id uuid, email text, role text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_organization_id uuid;
  caller_membership_role text;
  target_user_id uuid;
  normalized_email text := lower(trim(member_email));
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if member_role not in ('administrator', 'treasurer', 'data_entry', 'approver', 'viewer') then raise exception 'Invalid organization role'; end if;
  if normalized_email = '' then raise exception 'Email address is required'; end if;

  select membership.organization_id, membership.role
  into current_organization_id, caller_membership_role
  from public.organization_memberships as membership
  where membership.user_id = current_user_id
  order by membership.created_at
  limit 1;

  if caller_membership_role is distinct from 'administrator' then raise exception 'Only administrators can add members'; end if;

  select app_user.id into target_user_id
  from auth.users as app_user
  where lower(app_user.email) = normalized_email
  limit 1;

  if target_user_id is null then raise exception 'No account exists for that email address'; end if;
  if exists (
    select 1
    from public.organization_memberships as existing_membership
    where existing_membership.user_id = target_user_id
  ) then raise exception 'That account already belongs to an organization'; end if;

  insert into public.organization_memberships (organization_id, user_id, role)
  values (current_organization_id, target_user_id, member_role);

  return query select target_user_id, normalized_email, member_role;
end;
$$;

revoke all on function public.add_organization_member(text, text) from public, anon;
grant execute on function public.add_organization_member(text, text) to authenticated;

commit;
