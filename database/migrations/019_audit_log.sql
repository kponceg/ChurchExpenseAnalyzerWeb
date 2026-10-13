create table public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  record_type text not null,
  record_id text not null,
  previous_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now(),
  constraint audit_events_action_not_blank check (length(trim(action)) > 0),
  constraint audit_events_record_type_not_blank check (length(trim(record_type)) > 0),
  constraint audit_events_record_id_not_blank check (length(trim(record_id)) > 0)
);

create index audit_events_organization_created_idx
  on public.audit_events (organization_id, created_at desc);

create index audit_events_record_idx
  on public.audit_events (organization_id, record_type, record_id, created_at desc);

alter table public.audit_events enable row level security;

revoke all on public.audit_events from public, anon, authenticated;
grant select on public.audit_events to authenticated;

create policy "financial leaders view audit events"
on public.audit_events
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships as membership
    where membership.organization_id = audit_events.organization_id
      and membership.user_id = (select auth.uid())
      and membership.active
      and membership.role in ('administrator', 'treasurer')
  )
);

create or replace function public.record_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  event_organization_id uuid;
  event_action text;
  event_record_id text;
  before_values jsonb;
  after_values jsonb;
begin
  if tg_op = 'INSERT' then
    event_organization_id := new.organization_id;
    event_record_id := new.id::text;
    after_values := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    event_organization_id := new.organization_id;
    event_record_id := new.id::text;
    before_values := to_jsonb(old);
    after_values := to_jsonb(new);
  else
    event_organization_id := old.organization_id;
    event_record_id := old.id::text;
    before_values := to_jsonb(old);
  end if;

  if tg_table_name = 'transactions' then
    if tg_op = 'INSERT' then
      event_action := 'transaction.created';
    elsif old.status is distinct from new.status and new.status = 'posted' then
      event_action := 'transaction.approved';
    elsif old.status is distinct from new.status and new.status = 'rejected' then
      event_action := 'transaction.rejected';
    elsif old.status is distinct from new.status and new.status = 'reversed' then
      event_action := 'transaction.voided';
    else
      event_action := 'transaction.updated';
    end if;
  elsif tg_table_name = 'account_reconciliations' then
    if tg_op = 'INSERT' then
      event_action := 'reconciliation.started';
    elsif tg_op = 'DELETE' then
      event_action := 'reconciliation.cancelled';
    elsif old.status is distinct from new.status and new.status = 'completed' then
      event_action := 'reconciliation.completed';
    else
      event_action := 'reconciliation.updated';
    end if;
  elsif tg_table_name = 'organization_memberships' then
    if tg_op = 'INSERT' then
      event_action := 'member.added';
    elsif old.active is distinct from new.active and not new.active then
      event_action := 'member.deactivated';
    elsif old.active is distinct from new.active and new.active then
      event_action := 'member.reactivated';
    elsif old.role is distinct from new.role then
      event_action := 'member.role_changed';
    else
      event_action := 'member.updated';
    end if;
  else
    event_action := tg_table_name || '.' || lower(tg_op);
  end if;

  insert into public.audit_events (
    organization_id,
    actor_id,
    action,
    record_type,
    record_id,
    previous_values,
    new_values
  )
  values (
    event_organization_id,
    auth.uid(),
    event_action,
    tg_table_name,
    event_record_id,
    before_values,
    after_values
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists audit_transactions on public.transactions;
create trigger audit_transactions
after insert or update on public.transactions
for each row execute function public.record_audit_event();

drop trigger if exists audit_account_reconciliations on public.account_reconciliations;
create trigger audit_account_reconciliations
after insert or update or delete on public.account_reconciliations
for each row execute function public.record_audit_event();

drop trigger if exists audit_organization_memberships on public.organization_memberships;
create trigger audit_organization_memberships
after insert or update on public.organization_memberships
for each row execute function public.record_audit_event();

revoke all on function public.record_audit_event() from public, anon, authenticated;

notify pgrst, 'reload schema';
