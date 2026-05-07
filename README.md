# Портфолио (Pinterest-стиль)

Статический сайт: HTML, CSS, без сборки. Галерея — колоночная вёрстка (masonry), данные и загрузки через **Supabase**.

## Структура

- `index.html` — галерея работ  
- `price.html`, `contacts.html`, `clients.html` — тексты (редактируйте под себя)  
- `admin.html` — вход и добавление работ (одно фото или пак)  
- `supabase/schema.sql` — таблицы и RLS  
- `supabase/storage.sql` — bucket `portfolio` и политики Storage  

## Настройка Supabase

1. Создайте проект на [supabase.com](https://supabase.com).  
2. **SQL Editor** → выполните `supabase/schema.sql`, затем `supabase/storage.sql`.  
3. **Authentication** → включите Email; создайте пользователя (ваш админ).  
4. В **Settings → API** скопируйте Project URL и `anon` key в `js/config.js`.  

Чтение галереи доступно всем; создавать и удалять работы может только **вошедший** пользователь (RLS `authenticated`).

## Локальный просмотр

Откройте `index.html` через локальный сервер (из папки проекта):

```bash
npx --yes serve .
```

Иначе браузер может заблокировать часть запросов к Supabase с `file://`.

## GitHub и Vercel

1. Запушьте репозиторий на GitHub.  
2. В Vercel: **Add New Project** → импорт репозитория, **Framework Preset**: Other, корень проекта — каталог с `index.html`.  
3. Деплой без build command. Домен выдаст Vercel автоматически.  

Подставьте реальные значения в `js/config.js` перед коммитом или правьте прямо в репозитории: **anon key** с корректными RLS обычно считается публичным; **service_role** в код не вставляйте.

## Админка

1. Откройте `/admin.html` на сайте.  
2. Войдите email/паролём из Supabase Auth.  
3. Тип **Одна картинка** — один файл; **Пак** — несколько файлов (сетка в карточке).  

После удаления работы записи в таблицах удаляются; файлы в Storage при желании можно чистить вручную в панели Supabase.
