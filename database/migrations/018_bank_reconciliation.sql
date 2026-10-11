begin;

create table public.account_reconciliations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  account_id uuid not null references public.accounts(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  beginning_balance numeric(14,2) not null,
  statement_ending_balance numeric(14,2) not null,
  status text not null default 'draft' check (status in ('draft', 'completed')),
  notes text check (notes is null or char_length(trim(notes)) between 1 and 500),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_by uuid not null references auth.users(id) on delete restrict,
  updated_at timestamptz not null default now(),
  completed_by uuid references auth.users(id) on delete restrict,
  completed_at timestamptz,
  check (period_start <= period_end),
  check (
    (status = 'draft' and completed_by is null and completed_at is null)
    or (status = 'completed' and completed_by is not null and completed_at is not null)
  ),
  unique (account_id, period_end)
);

create table public.reconciliation_items (
  reconciliation_id uuid not null references public.account_reconciliations(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  cleared_by uuid not null references auth.users(id) on delete restrict,
  cleared_at timestamptz not null default now(),
  primary key (reconciliation_id, transaction_id),
  unique (transaction_id)
);

create index account_reconciliations_account_period_idx
  on public.account_reconciliations (account_id, period_end desc);
create unique index account_reconciliations_one_draft_idx
  on public.account_reconciliations (account_id)
  where status = 'draft';
create index reconciliation_items_organization_idx
  on public.reconciliation_items (organization_id);

alter table public.account_reconciliations enable row level security;
alter table public.reconciliation_items enable row level security;

revoke all on public.account_reconciliations, public.reconciliation_items from anon, authenticated;
grant select on public.account_reconciliations, public.reconciliation_items to authenticated;

create policy "active members view account reconciliations"
on public.account_reconciliations
for select
to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['administrator', 'treasurer', 'data_entry', 'approver', 'viewer']
  )
);

create policy "active members view reconciliation items"
on public.reconciliation_items
for select
to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['administrator', 'treasurer', 'data_entry', 'approver', 'viewer']
  )
);

create or replace function public.start_account_reconciliation(
  target_account_id uuid,
  statement_period_start date,
  statement_period_end date,
  statement_balance numeric,
  reconciliation_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_organization_id uuid;
  account_opening_balance numeric(14,2);
  previous_period_end date;
  starting_balance numeric(14,2);
  new_reconciliation_id uuid;
  normalized_notes text := nullif(trim(reconciliation_notes), '');
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if statement_period_start is null or statement_period_end is null or statement_period_start > statement_period_end then
    raise exception 'Enter a valid statement period';
  end if;
  if statement_balance is null or statement_balance < -999999999999.99 or statement_balance > 999999999999.99 then
    raise exception 'Enter a valid statement ending balance';
  end if;
  if normalized_notes is not null and char_length(normalized_notes) > 500 then
    raise exception 'Notes cannot exceed 500 characters';
  end if;

  select account.organization_id, account.opening_balance
  into target_organization_id, account_opening_balance
  from public.accounts as account
  where account.id = target_account_id;

  if target_organization_id is null then raise exception 'Financial account not found'; end if;
  if not public.has_organization_role(target_organization_id, array['administrator', 'treasurer']) then
    raise exception 'Only administrators and treasurers can reconcile accounts';
  end if;

  select reconciliation.period_end, reconciliation.statement_ending_balance
  into previous_period_end, starting_balance
  from public.account_reconciliations as reconciliation
  where reconciliation.account_id = target_account_id
    and reconciliation.status = 'completed'
  order by reconciliation.period_end desc
  limit 1;

  if previous_period_end is not null and statement_period_start <= previous_period_end then
    raise exception 'The statement period overlaps a completed reconciliation';
  end if;
  starting_balance := coalesce(starting_balance, account_opening_balance);

  insert into public.account_reconciliations (
    organization_id,
    account_id,
    period_start,
    period_end,
    beginning_balance,
    statement_ending_balance,
    notes,
    created_by,
    updated_by
  ) values (
    target_organization_id,
    target_account_id,
    statement_period_start,
    statement_period_end,
    starting_balance,
    statement_balance,
    normalized_notes,
    current_user_id,
    current_user_id
  )
  returning id into new_reconciliation_id;

  return new_reconciliation_id;
end;
$$;

create or replace function public.set_reconciliation_transaction_cleared(
  target_reconciliation_id uuid,
  target_transaction_id uuid,
  is_cleared boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_organization_id uuid;
  target_account_id uuid;
  target_period_end date;
  target_status text;
  transaction_organization_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;

  select organization_id, account_id, period_end, status
  into target_organization_id, target_account_id, target_period_end, target_status
  from public.account_reconciliations
  where id = target_reconciliation_id
  for update;

  if target_organization_id is null then raise exception 'Reconciliation not found'; end if;
  if target_status <> 'draft' then raise exception 'Completed reconciliations cannot be changed'; end if;
  if not public.has_organization_role(target_organization_id, array['administrator', 'treasurer']) then
    raise exception 'Only administrators and treasurers can reconcile accounts';
  end if;

  if is_cleared then
    select transaction.organization_id
    into transaction_organization_id
    from public.transactions as transaction
    where transaction.id = target_transaction_id
      and transaction.organization_id = target_organization_id
      and transaction.account_id = target_account_id
      and transaction.status = 'posted'
      and transaction.transaction_type in ('income', 'expense')
      and transaction.transaction_date <= target_period_end;

    if transaction_organization_id is null then
      raise exception 'Only posted transactions for this account and statement period can be cleared';
    end if;

    insert into public.reconciliation_items (
      reconciliation_id,
      transaction_id,
      organization_id,
      cleared_by
    ) values (
      target_reconciliation_id,
      target_transaction_id,
      target_organization_id,
      current_user_id
    )
    on conflict (reconciliation_id, transaction_id) do nothing;
  else
    delete from public.reconciliation_items
    where reconciliation_id = target_reconciliation_id
      and transaction_id = target_transaction_id;
  end if;

  update public.account_reconciliations
  set updated_by = current_user_id, updated_at = now()
  where id = target_reconciliation_id;

  return is_cleared;
end;
$$;

create or replace function public.complete_account_reconciliation(target_reconciliation_id uuid)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_organization_id uuid;
  target_status text;
  starting_balance numeric(14,2);
  statement_balance numeric(14,2);
  cleared_activity numeric(14,2);
  cleared_balance numeric(14,2);
  difference numeric(14,2);
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;

  select organization_id, status, beginning_balance, statement_ending_balance
  into target_organization_id, target_status, starting_balance, statement_balance
  from public.account_reconciliations
  where id = target_reconciliation_id
  for update;

  if target_organization_id is null then raise exception 'Reconciliation not found'; end if;
  if target_status <> 'draft' then raise exception 'This reconciliation is already completed'; end if;
  if not public.has_organization_role(target_organization_id, array['administrator', 'treasurer']) then
    raise exception 'Only administrators and treasurers can complete reconciliations';
  end if;

  select coalesce(sum(
    case transaction.transaction_type
      when 'income' then transaction.amount
      when 'expense' then -transaction.amount
      else 0
    end
  ), 0)
  into cleared_activity
  from public.reconciliation_items as item
  join public.transactions as transaction on transaction.id = item.transaction_id
  where item.reconciliation_id = target_reconciliation_id
    and transaction.status = 'posted';

  cleared_balance := starting_balance + cleared_activity;
  difference := statement_balance - cleared_balance;
  if difference <> 0 then
    raise exception 'The reconciliation difference must be zero before completion';
  end if;

  update public.account_reconciliations
  set status = 'completed',
      completed_by = current_user_id,
      completed_at = now(),
      updated_by = current_user_id,
      updated_at = now()
  where id = target_reconciliation_id;

  return difference;
end;
$$;

create or replace function public.cancel_account_reconciliation(target_reconciliation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_organization_id uuid;
  target_status text;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;

  select organization_id, status
  into target_organization_id, target_status
  from public.account_reconciliations
  where id = target_reconciliation_id
  for update;

  if target_organization_id is null then raise exception 'Reconciliation not found'; end if;
  if target_status <> 'draft' then raise exception 'Completed reconciliations cannot be cancelled'; end if;
  if not public.has_organization_role(target_organization_id, array['administrator', 'treasurer']) then
    raise exception 'Only administrators and treasurers can cancel reconciliations';
  end if;

  delete from public.account_reconciliations
  where id = target_reconciliation_id and status = 'draft';

  return target_reconciliation_id;
end;
$$;

create or replace function public.protect_completed_reconciliation_transactions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.reconciliation_items as item
    join public.account_reconciliations as reconciliation
      on reconciliation.id = item.reconciliation_id
    where item.transaction_id = old.id
      and reconciliation.status = 'completed'
  ) and (
    new.account_id is distinct from old.account_id
    or new.transaction_type is distinct from old.transaction_type
    or new.transaction_date is distinct from old.transaction_date
    or new.amount is distinct from old.amount
    or new.status is distinct from old.status
  ) then
    raise exception 'A completed reconciliation protects this transaction from financial changes';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_completed_reconciliation_transactions on public.transactions;
create trigger protect_completed_reconciliation_transactions
before update on public.transactions
for each row execute function public.protect_completed_reconciliation_transactions();

revoke all on function public.start_account_reconciliation(uuid, date, date, numeric, text) from public, anon;
revoke all on function public.set_reconciliation_transaction_cleared(uuid, uuid, boolean) from public, anon;
revoke all on function public.complete_account_reconciliation(uuid) from public, anon;
revoke all on function public.cancel_account_reconciliation(uuid) from public, anon;
revoke all on function public.protect_completed_reconciliation_transactions() from public, anon, authenticated;

grant execute on function public.start_account_reconciliation(uuid, date, date, numeric, text) to authenticated;
grant execute on function public.set_reconciliation_transaction_cleared(uuid, uuid, boolean) to authenticated;
grant execute on function public.complete_account_reconciliation(uuid) to authenticated;
grant execute on function public.cancel_account_reconciliation(uuid) to authenticated;

commit;
