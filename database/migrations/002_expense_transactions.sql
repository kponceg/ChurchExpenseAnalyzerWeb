begin;

alter table public.transactions
add column if not exists payment_reference text
check (payment_reference is null or char_length(trim(payment_reference)) between 1 and 80);

insert into public.categories (organization_id, name, transaction_type)
select organizations.id, expense_categories.name, 'expense'
from public.organizations
cross join (
  values
    ('Building rent'),
    ('Utilities'),
    ('Bank fees'),
    ('Church insurance'),
    ('Essential supplies'),
    ('Pastor support and travel'),
    ('Children''s guides'),
    ('Magazine and literature'),
    ('Presbytery contributions'),
    ('Other expense')
) as expense_categories(name)
on conflict (organization_id, transaction_type, name) do nothing;

create or replace function public.ensure_initial_organization(organization_name text default 'My Church')
returns uuid
language plpgsql
security definer
set search_path = public
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
    (selected_organization_id, 'General support', 'income'),
    (selected_organization_id, 'Building rent', 'expense'),
    (selected_organization_id, 'Utilities', 'expense'),
    (selected_organization_id, 'Bank fees', 'expense'),
    (selected_organization_id, 'Church insurance', 'expense'),
    (selected_organization_id, 'Essential supplies', 'expense'),
    (selected_organization_id, 'Pastor support and travel', 'expense'),
    (selected_organization_id, 'Children''s guides', 'expense'),
    (selected_organization_id, 'Magazine and literature', 'expense'),
    (selected_organization_id, 'Presbytery contributions', 'expense'),
    (selected_organization_id, 'Other expense', 'expense');

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

commit;
