create extension if not exists pgcrypto;

alter table if exists public.profiles add column if not exists interests text;
alter table if exists public.profiles add column if not exists request_message text;
alter table if exists public.profiles add column if not exists display_username text;
alter table if exists public.profiles add column if not exists approved_at timestamptz;
alter table if exists public.profiles add column if not exists approved_by uuid references public.profiles(id);

alter table if exists public.books add column if not exists cover_accent text not null default '#e0f2fe';
alter table if exists public.books add column if not exists created_at timestamptz not null default now();

alter table if exists public.comments add column if not exists user_name text;

create table if not exists public.app_settings (
  id boolean primary key default true,
  library_name text not null default 'Leo Mohan Reader Library',
  author_name text not null default 'Leo Mohan',
  author_email text not null default 'hello@leomohan.net',
  registration_approval_email text not null default 'leomohan@yahoo.com',
  website text not null default 'https://www.leomohan.net',
  about text not null default 'Leo Mohan writes across technology, business, education, spirituality, religion, motivation, and fiction.',
  latest_release text not null default 'Latest release coming soon',
  latest_release_note text not null default 'Publish your latest release note from the admin panel.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id = true)
);

insert into public.app_settings (
  id,
  library_name,
  author_name,
  author_email,
  registration_approval_email,
  website,
  about,
  latest_release,
  latest_release_note
)
values (
  true,
  'Leo Mohan Reader Library',
  'Leo Mohan',
  'hello@leomohan.net',
  'leomohan@yahoo.com',
  'https://www.leomohan.net',
  'Leo Mohan writes across technology, business, education, spirituality, religion, motivation, and fiction.',
  'Latest release coming soon',
  'Publish your latest release note from the admin panel.'
)
on conflict (id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email,
    interests,
    request_message
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'interests', ''),
    coalesce(new.raw_user_meta_data->>'request_message', '')
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email,
    interests = excluded.interests,
    request_message = excluded.request_message;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and approval_status = 'approved'
  );
$$;

alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.news_items enable row level security;
alter table public.ratings enable row level security;
alter table public.comments enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "Users can view own profile or admins" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;
drop policy if exists "Public can read active books" on public.books;
drop policy if exists "Admins can manage books" on public.books;
drop policy if exists "Public can read news" on public.news_items;
drop policy if exists "Admins can manage news" on public.news_items;
drop policy if exists "Public can read ratings" on public.ratings;
drop policy if exists "Approved readers can manage own ratings" on public.ratings;
drop policy if exists "Public can read comments" on public.comments;
drop policy if exists "Approved readers can insert comments" on public.comments;
drop policy if exists "Public can read app settings" on public.app_settings;
drop policy if exists "Admins can manage app settings" on public.app_settings;

create policy "Users can view own profile or admins"
on public.profiles
for select
to authenticated
using (auth.uid() = id or public.is_admin());

create policy "Admins can update profiles"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read active books"
on public.books
for select
to public
using (status = 'active' or public.is_admin());

create policy "Admins can manage books"
on public.books
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read news"
on public.news_items
for select
to public
using (true);

create policy "Admins can manage news"
on public.news_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read ratings"
on public.ratings
for select
to public
using (true);

create policy "Approved readers can manage own ratings"
on public.ratings
for all
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and approval_status = 'approved'
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and approval_status = 'approved'
  )
);

create policy "Public can read comments"
on public.comments
for select
to public
using (true);

create policy "Approved readers can insert comments"
on public.comments
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and approval_status = 'approved'
  )
);

create policy "Public can read app settings"
on public.app_settings
for select
to public
using (true);

create policy "Admins can manage app settings"
on public.app_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', true)
on conflict (id) do nothing;

drop policy if exists "Public can view book covers" on storage.objects;
drop policy if exists "Admins can upload book covers" on storage.objects;
drop policy if exists "Admins can update book covers" on storage.objects;
drop policy if exists "Admins can delete book covers" on storage.objects;

create policy "Public can view book covers"
on storage.objects
for select
to public
using (bucket_id = 'book-covers');

create policy "Admins can upload book covers"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'book-covers'
  and public.is_admin()
);

create policy "Admins can update book covers"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'book-covers'
  and public.is_admin()
)
with check (
  bucket_id = 'book-covers'
  and public.is_admin()
);

create policy "Admins can delete book covers"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'book-covers'
  and public.is_admin()
);
