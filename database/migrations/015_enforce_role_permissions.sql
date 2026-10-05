begin;

create or replace function public.has_organization_role(target_organization_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships
    where organization_id = target_organization_id
      and user_id = (select auth.uid())
      and active
      and role = any(allowed_roles)
  );
$$;

revoke all on function public.has_organization_role(uuid, text[]) from public, anon;
grant execute on function public.has_organization_role(uuid, text[]) to authenticated;

drop policy if exists "members create transactions" on public.transactions;
create policy "authorized members create transactions"
on public.transactions
for insert
to authenticated
with check (
  public.has_organization_role(organization_id, array['administrator', 'treasurer', 'data_entry'])
  and created_by = (select auth.uid())
  and transaction_type in ('income', 'expense')
);

drop policy if exists "authorized members update transactions" on public.transactions;
create policy "authorized members update transactions"
on public.transactions
for update
to authenticated
using (public.has_organization_role(organization_id, array['administrator', 'treasurer', 'data_entry']))
with check (
  public.has_organization_role(organization_id, array['administrator', 'treasurer', 'data_entry'])
  and updated_by = (select auth.uid())
);

create or replace function public.void_transaction(target_transaction_id uuid, reason text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_organization_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if char_length(trim(reason)) not between 3 and 160 then raise exception 'A void reason between 3 and 160 characters is required'; end if;

  select organization_id into target_organization_id
  from public.transactions
  where id = target_transaction_id and status = 'posted';

  if target_organization_id is null then raise exception 'Posted transaction not found'; end if;
  if not public.has_organization_role(target_organization_id, array['administrator', 'treasurer']) then
    raise exception 'Only administrators and treasurers can void transactions';
  end if;

  update public.transactions
  set status = 'reversed', void_reason = trim(reason), voided_at = now(), voided_by = current_user_id,
      updated_at = now(), updated_by = current_user_id
  where id = target_transaction_id and organization_id = target_organization_id and status = 'posted';

  return target_transaction_id;
end;
$$;

revoke all on function public.void_transaction(uuid, text) from public, anon;
grant execute on function public.void_transaction(uuid, text) to authenticated;

commit;
