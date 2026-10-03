begin;

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  month_start date not null check (month_start = date_trunc('month', month_start)::date),
  amount numeric(14,2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, category_id, month_start)
);

create index budgets_organization_month_idx on public.budgets (organization_id, month_start);
alter table public.budgets enable row level security;
revoke all on public.budgets from anon, authenticated;
grant select on public.budgets to authenticated;
create policy "members view budgets" on public.budgets for select to authenticated using (public.is_organization_member(organization_id));

create or replace function public.save_monthly_budget(target_category_id uuid, target_month date, target_amount numeric)
returns table (id uuid, category_id uuid, month_start date, amount numeric, updated_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_organization_id uuid;
  caller_role text;
  normalized_month date := date_trunc('month', target_month)::date;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if target_amount is null or target_amount < 0 or target_amount > 999999999999.99 then raise exception 'Enter a valid budget amount'; end if;
  select membership.organization_id, membership.role into current_organization_id, caller_role
  from public.organization_memberships as membership where membership.user_id = current_user_id order by membership.created_at limit 1;
  if caller_role is distinct from 'administrator' then raise exception 'Only administrators can manage budgets'; end if;
  if not exists (select 1 from public.categories as expense_category where expense_category.id = target_category_id and expense_category.organization_id = current_organization_id and expense_category.transaction_type = 'expense') then raise exception 'Expense category not found'; end if;
  return query insert into public.budgets (organization_id, category_id, month_start, amount)
  values (current_organization_id, target_category_id, normalized_month, target_amount)
  on conflict on constraint budgets_organization_id_category_id_month_start_key do update set amount = excluded.amount, updated_at = now()
  returning budgets.id, budgets.category_id, budgets.month_start, budgets.amount, budgets.updated_at;
end;
$$;

revoke all on function public.save_monthly_budget(uuid, date, numeric) from public, anon;
grant execute on function public.save_monthly_budget(uuid, date, numeric) to authenticated;
commit;
