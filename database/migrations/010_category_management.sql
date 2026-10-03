begin;

create or replace function public.create_financial_category(category_name text, category_transaction_type text)
returns table (id uuid, name text, transaction_type text, active boolean, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_organization_id uuid;
  caller_role text;
  normalized_name text := trim(category_name);
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if char_length(normalized_name) not between 1 and 80 then raise exception 'Category name must contain 1 to 80 characters'; end if;
  if category_transaction_type not in ('income', 'expense') then raise exception 'Invalid category type'; end if;

  select membership.organization_id, membership.role
  into current_organization_id, caller_role
  from public.organization_memberships as membership
  where membership.user_id = current_user_id
  order by membership.created_at
  limit 1;

  if caller_role is distinct from 'administrator' then raise exception 'Only administrators can create categories'; end if;

  return query
  insert into public.categories (organization_id, name, transaction_type)
  values (current_organization_id, normalized_name, category_transaction_type)
  returning categories.id, categories.name, categories.transaction_type, categories.active, categories.created_at;
end;
$$;

create or replace function public.update_financial_category(target_category_id uuid, category_name text, category_active boolean)
returns table (id uuid, name text, transaction_type text, active boolean, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_organization_id uuid;
  caller_role text;
  existing_active boolean;
  existing_type text;
  normalized_name text := trim(category_name);
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if char_length(normalized_name) not between 1 and 80 then raise exception 'Category name must contain 1 to 80 characters'; end if;

  select membership.organization_id, membership.role
  into current_organization_id, caller_role
  from public.organization_memberships as membership
  where membership.user_id = current_user_id
  order by membership.created_at
  limit 1;

  if caller_role is distinct from 'administrator' then raise exception 'Only administrators can manage categories'; end if;

  select financial_category.active, financial_category.transaction_type
  into existing_active, existing_type
  from public.categories as financial_category
  where financial_category.id = target_category_id
    and financial_category.organization_id = current_organization_id;

  if existing_type is null then raise exception 'Category not found'; end if;
  if existing_active and not category_active and (
    select count(*) from public.categories as active_category
    where active_category.organization_id = current_organization_id
      and active_category.transaction_type = existing_type
      and active_category.active
  ) <= 1 then raise exception 'The final active category of this type cannot be deactivated'; end if;

  return query
  update public.categories as financial_category
  set name = normalized_name,
      active = category_active
  where financial_category.id = target_category_id
    and financial_category.organization_id = current_organization_id
  returning financial_category.id, financial_category.name, financial_category.transaction_type, financial_category.active, financial_category.created_at;
end;
$$;

revoke all on function public.create_financial_category(text, text) from public, anon;
revoke all on function public.update_financial_category(uuid, text, boolean) from public, anon;
grant execute on function public.create_financial_category(text, text) to authenticated;
grant execute on function public.update_financial_category(uuid, text, boolean) to authenticated;

commit;
