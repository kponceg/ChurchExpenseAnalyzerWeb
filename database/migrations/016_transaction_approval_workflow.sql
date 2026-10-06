begin;

alter table public.transactions drop constraint if exists transactions_status_check;
alter table public.transactions add constraint transactions_status_check
  check (status in ('draft', 'pending', 'posted', 'rejected', 'reversed'));

alter table public.transactions
  add column if not exists approved_by uuid references auth.users(id) on delete restrict,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_by uuid references auth.users(id) on delete restrict,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_reason text
    check (rejection_reason is null or char_length(trim(rejection_reason)) between 3 and 160);

create or replace function public.set_new_transaction_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_role text;
begin
  if auth.uid() is null or new.created_by <> auth.uid() then
    raise exception 'Authentication required';
  end if;

  select membership.role into caller_role
  from public.organization_memberships as membership
  where membership.organization_id = new.organization_id
    and membership.user_id = auth.uid()
    and membership.active;

  if caller_role = 'data_entry' then
    new.status := 'pending';
  elsif caller_role in ('administrator', 'treasurer') then
    new.status := 'posted';
  else
    raise exception 'Your role cannot create transactions';
  end if;

  new.approved_by := null;
  new.approved_at := null;
  new.rejected_by := null;
  new.rejected_at := null;
  new.rejection_reason := null;
  return new;
end;
$$;

revoke all on function public.set_new_transaction_status() from public, anon, authenticated;

drop trigger if exists set_new_transaction_status on public.transactions;
create trigger set_new_transaction_status
before insert on public.transactions
for each row execute function public.set_new_transaction_status();

create or replace function public.review_transaction(target_transaction_id uuid, decision text, reason text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_organization_id uuid;
  normalized_decision text := lower(trim(decision));
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if normalized_decision not in ('approve', 'reject') then raise exception 'Decision must be approve or reject'; end if;
  if normalized_decision = 'reject' and char_length(trim(coalesce(reason, ''))) not between 3 and 160 then
    raise exception 'A rejection reason between 3 and 160 characters is required';
  end if;

  select organization_id into target_organization_id
  from public.transactions
  where id = target_transaction_id and status = 'pending'
  for update;

  if target_organization_id is null then raise exception 'Pending transaction not found'; end if;
  if not public.has_organization_role(target_organization_id, array['administrator', 'treasurer', 'approver']) then
    raise exception 'Your role cannot review transactions';
  end if;

  if normalized_decision = 'approve' then
    update public.transactions
    set status = 'posted', approved_by = current_user_id, approved_at = now(),
        rejected_by = null, rejected_at = null, rejection_reason = null,
        updated_at = now(), updated_by = current_user_id
    where id = target_transaction_id and status = 'pending';
  else
    update public.transactions
    set status = 'rejected', rejected_by = current_user_id, rejected_at = now(),
        rejection_reason = trim(reason), approved_by = null, approved_at = null,
        updated_at = now(), updated_by = current_user_id
    where id = target_transaction_id and status = 'pending';
  end if;

  return normalized_decision;
end;
$$;

revoke all on function public.review_transaction(uuid, text, text) from public, anon;
grant execute on function public.review_transaction(uuid, text, text) to authenticated;

commit;
