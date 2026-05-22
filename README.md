# ППО №3 — сайт

Основной проект: **Next.js 15** в папке `web/`.

## Запуск

```bash
npm run dev
```

Откройте **http://localhost:3000/**

Подробности: [web/README.md](web/README.md)

## Деплой на Vercel

**Root Directory = `web`** (обязательно). Подробно: [VERCEL.md](VERCEL.md).

Переменные окружения (опционально): `DATABASE_URL`.

## Структура

| Путь | Назначение |
|------|------------|
| `web/app/` | Страницы Next.js, API, админка |
| `web/components/` | Header, Footer, UI |
| `web/content/` | HTML-контент страниц (из Stitch) |
| `web/app/globals.css` | Тема Tailwind + glass-стили |
| `web/prisma/` | Схема PostgreSQL |
| `web/public/assets/` | Изображения |
| `site/pages/` | Исходники Stitch (HTML) |
| `scripts/build-site.mjs` | Вспомогательная сборка (папка `public/` в gitignore) |
| `scripts/migrate-content-to-next.mjs` | Stitch → `web/content/` |

## База данных

```bash
cd web
cp .env.example .env
# укажите DATABASE_URL
npm run db:migrate
```

## Админка

1. Запустите сайт: `npm run dev`
2. Откройте в браузере: **http://localhost:3000/admin**

Разделы:
- `/admin` — обзор
- `/admin/pages` — список страниц
- `/admin/inquiries` — заявки (нужна БД)

Пароль пока **не включён** — на продакшене добавьте авторизацию до выкладки в интернет.

## Обновление контента из Stitch

```bash
npm run migrate:content
npm run dev
```
