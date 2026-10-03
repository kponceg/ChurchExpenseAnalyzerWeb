begin;

alter table public.accounts drop constraint if exists accounts_account_type_check;
alter table public.accounts
add constraint accounts_account_type_check
check (account_type in ('checking', 'savings', 'cash', 'petty_cash', 'other'));

create or replace function public.create_financial_account(account_name text, new_account_type text, initial_balance numeric default 0)
returns table (id uuid, name text, account_type text, opening_balance numeric, active boolean, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_organization_id uuid;
  caller_role text;
  normalized_name text := trim(account_name);
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if char_length(normalized_name) not between 1 and 80 then raise exception 'Account name must contain 1 to 80 characters'; end if;
  if new_account_type not in ('checking', 'savings', 'cash', 'petty_cash', 'other') then raise exception 'Invalid account type'; end if;
  if initial_balance is null or initial_balance < -999999999999.99 or initial_balance > 999999999999.99 then raise exception 'Invalid opening balance'; end if;

  select membership.organization_id, membership.role
  into current_organization_id, caller_role
  from public.organization_memberships as membership
  where membership.user_id = current_user_id
  order by membership.created_at
  limit 1;

  if caller_role is distinct from 'administrator' then raise exception 'Only administrators can create financial accounts'; end if;

  return query
  insert into public.accounts (organization_id, name, account_type, opening_balance)
  values (current_organization_id, normalized_name, new_account_type, initial_balance)
  returning accounts.id, accounts.name, accounts.account_type, accounts.opening_balance, accounts.active, accounts.created_at;
end;
$$;

revoke all on function public.create_financial_account(text, text, numeric) from public, anon;
grant execute on function public.create_financial_account(text, text, numeric) to authenticated;

commit;
