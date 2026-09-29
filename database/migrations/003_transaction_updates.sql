begin;

alter table public.transactions
add column if not exists updated_at timestamptz,
add column if not exists updated_by uuid references auth.users(id) on delete restrict;

grant update (account_id, category_id, fund_id, transaction_date, amount, description, payment_reference, updated_at, updated_by)
on public.transactions to authenticated;

create policy "authorized members update transactions"
on public.transactions
for update
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships
    where organization_id = transactions.organization_id
      and user_id = (select auth.uid())
      and role in ('administrator', 'treasurer', 'data_entry')
  )
)
with check (
  exists (
    select 1
    from public.organization_memberships
    where organization_id = transactions.organization_id
      and user_id = (select auth.uid())
      and role in ('administrator', 'treasurer', 'data_entry')
  )
  and updated_by = (select auth.uid())
);

commit;
