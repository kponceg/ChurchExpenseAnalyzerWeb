begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'transaction-attachments',
  'transaction-attachments',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table public.transaction_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  storage_path text not null,
  original_filename text not null
    check (char_length(trim(original_filename)) between 1 and 180),
  mime_type text not null
    check (mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (storage_path)
);

create index transaction_attachments_transaction_idx
  on public.transaction_attachments (transaction_id, created_at desc);

alter table public.transaction_attachments enable row level security;

revoke all on public.transaction_attachments from anon, authenticated;
grant select, insert, delete on public.transaction_attachments to authenticated;

create policy "active members view transaction attachments"
on public.transaction_attachments
for select
to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['administrator', 'treasurer', 'data_entry', 'approver', 'viewer']
  )
);

create policy "authorized members add transaction attachments"
on public.transaction_attachments
for insert
to authenticated
with check (
  uploaded_by = (select auth.uid())
  and public.has_organization_role(
    organization_id,
    array['administrator', 'treasurer', 'data_entry']
  )
  and exists (
    select 1
    from public.transactions
    where transactions.id = transaction_attachments.transaction_id
      and transactions.organization_id = transaction_attachments.organization_id
  )
);

create policy "authorized members remove transaction attachments"
on public.transaction_attachments
for delete
to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['administrator', 'treasurer']
  )
  or (
    uploaded_by = (select auth.uid())
    and public.has_organization_role(organization_id, array['data_entry'])
    and exists (
      select 1
      from public.transactions
      where transactions.id = transaction_attachments.transaction_id
        and transactions.organization_id = transaction_attachments.organization_id
        and transactions.status = 'pending'
    )
  )
);

create policy "active members read transaction attachment files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'transaction-attachments'
  and exists (
    select 1
    from public.organization_memberships
    where organization_memberships.organization_id::text = (storage.foldername(name))[1]
      and organization_memberships.user_id = (select auth.uid())
      and organization_memberships.active
  )
);

create policy "authorized members upload transaction attachment files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'transaction-attachments'
  and exists (
    select 1
    from public.organization_memberships
    where organization_memberships.organization_id::text = (storage.foldername(name))[1]
      and organization_memberships.user_id = (select auth.uid())
      and organization_memberships.active
      and organization_memberships.role in ('administrator', 'treasurer', 'data_entry')
  )
);

create policy "authorized members delete transaction attachment files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'transaction-attachments'
  and (
    owner_id = (select auth.uid()::text)
    or exists (
      select 1
      from public.organization_memberships
      where organization_memberships.organization_id::text = (storage.foldername(name))[1]
        and organization_memberships.user_id = (select auth.uid())
        and organization_memberships.active
        and organization_memberships.role in ('administrator', 'treasurer')
    )
  )
);

commit;
