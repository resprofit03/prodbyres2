-- Bucket для файлов портфолио (выполните в Supabase SQL Editor)
-- Повторный запуск: сначала удаляем политики с теми же именами

drop policy if exists "portfolio_public_read" on storage.objects;
drop policy if exists "portfolio_auth_insert" on storage.objects;
drop policy if exists "portfolio_auth_update" on storage.objects;
drop policy if exists "portfolio_auth_delete" on storage.objects;

insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do update set public = excluded.public;

-- Публичное чтение всех объектов в bucket portfolio
create policy "portfolio_public_read"
  on storage.objects for select
  using (bucket_id = 'portfolio');

-- Загрузка и изменение только авторизованным пользователям
create policy "portfolio_auth_insert"
  on storage.objects for insert
  with check (bucket_id = 'portfolio' and auth.role() = 'authenticated');

create policy "portfolio_auth_update"
  on storage.objects for update
  using (bucket_id = 'portfolio' and auth.role() = 'authenticated');

create policy "portfolio_auth_delete"
  on storage.objects for delete
  using (bucket_id = 'portfolio' and auth.role() = 'authenticated');
