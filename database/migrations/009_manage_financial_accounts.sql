begin;

create or replace function public.update_financial_account(target_account_id uuid, account_name text, account_active boolean)
returns table (id uuid, name text, account_type text, opening_balance numeric, active boolean, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_organization_id uuid;
  caller_role text;
  existing_active boolean;
  normalized_name text := trim(account_name);
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if char_length(normalized_name) not between 1 and 80 then raise exception 'Account name must contain 1 to 80 characters'; end if;

  select membership.organization_id, membership.role
  into current_organization_id, caller_role
  from public.organization_memberships as membership
  where membership.user_id = current_user_id
  order by membership.created_at
  limit 1;

  if caller_role is distinct from 'administrator' then raise exception 'Only administrators can manage financial accounts'; end if;

  select financial_account.active
  into existing_active
  from public.accounts as financial_account
  where financial_account.id = target_account_id
    and financial_account.organization_id = current_organization_id;

  if existing_active is null then raise exception 'Financial account not found'; end if;
  if existing_active and not account_active and (
    select count(*) from public.accounts as active_account
    where active_account.organization_id = current_organization_id and active_account.active
  ) <= 1 then raise exception 'The final active financial account cannot be deactivated'; end if;

  return query
  update public.accounts as financial_account
  set name = normalized_name,
      active = account_active
  where financial_account.id = target_account_id
    and financial_account.organization_id = current_organization_id
  returning financial_account.id, financial_account.name, financial_account.account_type, financial_account.opening_balance, financial_account.active, financial_account.created_at;
end;
$$;

revoke all on function public.update_financial_account(uuid, text, boolean) from public, anon;
grant execute on function public.update_financial_account(uuid, text, boolean) to authenticated;

commit;
