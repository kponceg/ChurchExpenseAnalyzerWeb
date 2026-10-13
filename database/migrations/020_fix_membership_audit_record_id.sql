begin;

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
    after_values := to_jsonb(new);
    event_record_id := coalesce(after_values ->> 'id', after_values ->> 'user_id');
  elsif tg_op = 'UPDATE' then
    event_organization_id := new.organization_id;
    before_values := to_jsonb(old);
    after_values := to_jsonb(new);
    event_record_id := coalesce(after_values ->> 'id', after_values ->> 'user_id');
  else
    event_organization_id := old.organization_id;
    before_values := to_jsonb(old);
    event_record_id := coalesce(before_values ->> 'id', before_values ->> 'user_id');
  end if;

  if event_record_id is null then
    raise exception 'Audited table % must have an id or user_id field', tg_table_name;
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

revoke all on function public.record_audit_event() from public, anon, authenticated;

notify pgrst, 'reload schema';

commit;
