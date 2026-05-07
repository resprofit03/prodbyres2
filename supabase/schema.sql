-- Портфолио: работы и изображения (одиночные и паки)
-- Выполните в Supabase SQL Editor

create extension if not exists "pgcrypto";

-- Таблица работ
create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  item_type text not null check (item_type in ('single', 'pack')),
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Изображения внутри работы (для single — одна строка, для pack — несколько)
create table if not exists public.work_images (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  public_url text not null,
  storage_path text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists work_images_work_id_idx on public.work_images(work_id);

alter table public.works enable row level security;
alter table public.work_images enable row level security;

-- Чтение галереи всем
create policy "works_select_public"
  on public.works for select
  using (true);

create policy "work_images_select_public"
  on public.work_images for select
  using (true);

-- Запись только авторизованным (ваш аккаунт админа в Authentication)
create policy "works_insert_authenticated"
  on public.works for insert
  with check (auth.role() = 'authenticated');

create policy "works_update_authenticated"
  on public.works for update
  using (auth.role() = 'authenticated');

create policy "works_delete_authenticated"
  on public.works for delete
  using (auth.role() = 'authenticated');

create policy "work_images_insert_authenticated"
  on public.work_images for insert
  with check (auth.role() = 'authenticated');

create policy "work_images_update_authenticated"
  on public.work_images for update
  using (auth.role() = 'authenticated');

create policy "work_images_delete_authenticated"
  on public.work_images for delete
  using (auth.role() = 'authenticated');

-- Хранилище: выполните скрипт supabase/storage.sql
