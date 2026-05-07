-- Один главный админ по email: запись в таблицы и в Storage только для этого пользователя.
-- В Supabase → Authentication создайте пользователя с ТЕМ ЖЕ email, что в js/config.js → adminEmail.
-- Выполните этот скрипт в SQL Editor (можно повторно).

-- Замените email, если смените админа в config (должно совпадать с adminEmail).
-- Текущий админ: danyadmwhook2@gmail.com

drop policy if exists "works_insert_authenticated" on public.works;
drop policy if exists "works_update_authenticated" on public.works;
drop policy if exists "works_delete_authenticated" on public.works;
drop policy if exists "work_images_insert_authenticated" on public.work_images;
drop policy if exists "work_images_update_authenticated" on public.work_images;
drop policy if exists "work_images_delete_authenticated" on public.work_images;

create policy "works_insert_main_admin"
  on public.works for insert
  with check (
    lower(coalesce(auth.jwt() ->> 'email', ''))
    = lower('danyadmwhook2@gmail.com')
  );

create policy "works_update_main_admin"
  on public.works for update
  using (
    lower(coalesce(auth.jwt() ->> 'email', ''))
    = lower('danyadmwhook2@gmail.com')
  );

create policy "works_delete_main_admin"
  on public.works for delete
  using (
    lower(coalesce(auth.jwt() ->> 'email', ''))
    = lower('danyadmwhook2@gmail.com')
  );

create policy "work_images_insert_main_admin"
  on public.work_images for insert
  with check (
    lower(coalesce(auth.jwt() ->> 'email', ''))
    = lower('danyadmwhook2@gmail.com')
  );

create policy "work_images_update_main_admin"
  on public.work_images for update
  using (
    lower(coalesce(auth.jwt() ->> 'email', ''))
    = lower('danyadmwhook2@gmail.com')
  );

create policy "work_images_delete_main_admin"
  on public.work_images for delete
  using (
    lower(coalesce(auth.jwt() ->> 'email', ''))
    = lower('danyadmwhook2@gmail.com')
  );

-- Storage: только для того же email
drop policy if exists "portfolio_auth_insert" on storage.objects;
drop policy if exists "portfolio_auth_update" on storage.objects;
drop policy if exists "portfolio_auth_delete" on storage.objects;

create policy "portfolio_main_admin_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'portfolio'
    and lower(coalesce(auth.jwt() ->> 'email', ''))
    = lower('danyadmwhook2@gmail.com')
  );

create policy "portfolio_main_admin_update"
  on storage.objects for update
  using (
    bucket_id = 'portfolio'
    and lower(coalesce(auth.jwt() ->> 'email', ''))
    = lower('danyadmwhook2@gmail.com')
  );

create policy "portfolio_main_admin_delete"
  on storage.objects for delete
  using (
    bucket_id = 'portfolio'
    and lower(coalesce(auth.jwt() ->> 'email', ''))
    = lower('danyadmwhook2@gmail.com')
  );
