begin;

create or replace function public.create_financial_fund(fund_name text)
returns table (id uuid, name text, active boolean, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_organization_id uuid;
  caller_role text;
  normalized_name text := trim(fund_name);
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if char_length(normalized_name) not between 1 and 80 then raise exception 'Fund name must contain 1 to 80 characters'; end if;

  select membership.organization_id, membership.role
  into current_organization_id, caller_role
  from public.organization_memberships as membership
  where membership.user_id = current_user_id
  order by membership.created_at
  limit 1;

  if caller_role is distinct from 'administrator' then raise exception 'Only administrators can create funds'; end if;

  return query
  insert into public.funds (organization_id, name)
  values (current_organization_id, normalized_name)
  returning funds.id, funds.name, funds.active, funds.created_at;
end;
$$;

create or replace function public.update_financial_fund(target_fund_id uuid, fund_name text, fund_active boolean)
returns table (id uuid, name text, active boolean, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_organization_id uuid;
  caller_role text;
  existing_active boolean;
  normalized_name text := trim(fund_name);
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if char_length(normalized_name) not between 1 and 80 then raise exception 'Fund name must contain 1 to 80 characters'; end if;

  select membership.organization_id, membership.role
  into current_organization_id, caller_role
  from public.organization_memberships as membership
  where membership.user_id = current_user_id
  order by membership.created_at
  limit 1;

  if caller_role is distinct from 'administrator' then raise exception 'Only administrators can manage funds'; end if;

  select financial_fund.active
  into existing_active
  from public.funds as financial_fund
  where financial_fund.id = target_fund_id
    and financial_fund.organization_id = current_organization_id;

  if existing_active is null then raise exception 'Fund not found'; end if;
  if existing_active and not fund_active and (
    select count(*) from public.funds as active_fund
    where active_fund.organization_id = current_organization_id and active_fund.active
  ) <= 1 then raise exception 'The final active fund cannot be deactivated'; end if;

  return query
  update public.funds as financial_fund
  set name = normalized_name,
      active = fund_active
  where financial_fund.id = target_fund_id
    and financial_fund.organization_id = current_organization_id
  returning financial_fund.id, financial_fund.name, financial_fund.active, financial_fund.created_at;
end;
$$;

revoke all on function public.create_financial_fund(text) from public, anon;
revoke all on function public.update_financial_fund(uuid, text, boolean) from public, anon;
grant execute on function public.create_financial_fund(text) to authenticated;
grant execute on function public.update_financial_fund(uuid, text, boolean) to authenticated;

commit;
