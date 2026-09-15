begin;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  created_at timestamptz not null default now()
);

create table public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('administrator', 'treasurer', 'data_entry', 'approver', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  account_type text not null check (account_type in ('checking', 'savings', 'cash', 'other')),
  opening_balance numeric(14,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  transaction_type text not null check (transaction_type in ('income', 'expense')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, transaction_type, name)
);

create table public.funds (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  account_id uuid not null references public.accounts(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  fund_id uuid not null references public.funds(id) on delete restrict,
  transaction_type text not null check (transaction_type in ('income', 'expense', 'transfer')),
  transaction_date date not null,
  amount numeric(14,2) not null check (amount > 0),
  description text not null check (char_length(trim(description)) between 1 and 160),
  status text not null default 'posted' check (status in ('draft', 'pending', 'posted', 'reversed')),
  idempotency_key uuid not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);

create index transactions_organization_date_idx on public.transactions (organization_id, transaction_date desc);
create index transactions_category_idx on public.transactions (category_id);
create index transactions_fund_idx on public.transactions (fund_id);

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.funds enable row level security;
alter table public.transactions enable row level security;

revoke all on public.organizations, public.organization_memberships, public.accounts, public.categories, public.funds, public.transactions from anon;
revoke all on public.organizations, public.organization_memberships, public.accounts, public.categories, public.funds, public.transactions from authenticated;
grant select on public.organizations, public.organization_memberships, public.accounts, public.categories, public.funds, public.transactions to authenticated;
grant insert on public.transactions to authenticated;

create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_memberships
    where organization_id = target_organization_id and user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_organization_member(uuid) from public, anon;
grant execute on function public.is_organization_member(uuid) to authenticated;

create policy "members view organizations" on public.organizations for select to authenticated
using (public.is_organization_member(id));
create policy "members view memberships" on public.organization_memberships for select to authenticated
using (public.is_organization_member(organization_id));
create policy "members view accounts" on public.accounts for select to authenticated
using (public.is_organization_member(organization_id));
create policy "members view categories" on public.categories for select to authenticated
using (public.is_organization_member(organization_id));
create policy "members view funds" on public.funds for select to authenticated
using (public.is_organization_member(organization_id));
create policy "members view transactions" on public.transactions for select to authenticated
using (public.is_organization_member(organization_id));
create policy "members create transactions" on public.transactions for insert to authenticated
with check (
  public.is_organization_member(organization_id)
  and created_by = (select auth.uid())
  and transaction_type = 'income'
);

create or replace function public.ensure_initial_organization(organization_name text default 'Church Organization')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  selected_organization_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;

  select organization_id into selected_organization_id
  from public.organization_memberships
  where user_id = current_user_id
  order by created_at
  limit 1;

  if selected_organization_id is not null then return selected_organization_id; end if;

  insert into public.organizations (name)
  values (organization_name)
  returning id into selected_organization_id;

  insert into public.organization_memberships (organization_id, user_id, role)
  values (selected_organization_id, current_user_id, 'administrator');

  insert into public.accounts (organization_id, name, account_type)
  values (selected_organization_id, 'Checking', 'checking');

  insert into public.categories (organization_id, name, transaction_type)
  values
    (selected_organization_id, 'Tithe', 'income'),
    (selected_organization_id, 'Church offering', 'income'),
    (selected_organization_id, 'Children''s offering', 'income'),
    (selected_organization_id, 'First fruits', 'income'),
    (selected_organization_id, 'Talent / food', 'income'),
    (selected_organization_id, 'Temple rent', 'income'),
    (selected_organization_id, 'General support', 'income');

  insert into public.funds (organization_id, name)
  values
    (selected_organization_id, 'Support of the work'),
    (selected_organization_id, 'General congregation'),
    (selected_organization_id, 'Children''s commission'),
    (selected_organization_id, 'Legal and building'),
    (selected_organization_id, 'Presbytery');

  return selected_organization_id;
end;
$$;

revoke all on function public.ensure_initial_organization(text) from public, anon;
grant execute on function public.ensure_initial_organization(text) to authenticated;

commit;
