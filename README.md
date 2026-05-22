# ППО №3 — сайт

Next.js 15 в папке `web/`. Деплой: [VERCEL.md](VERCEL.md).

## Запуск

```bash
npm run dev
```

http://localhost:3000 — сайт, http://localhost:3000/admin — админка.

## Команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Разработка |
| `npm run build` | Сборка |
| `npm run migrate:content` | Обновить HTML из Stitch → `web/content/` |
| `npm run styles:extract` | Стили Stitch → `web/styles/stitch-components.css` |

## Структура

| Путь | Назначение |
|------|------------|
| `web/app/` | Страницы, API, админка |
| `web/components/` | Шапка, подвал, навигация |
| `web/content/` | HTML-контент страниц |
| `web/public/assets/img/` | PNG-иллюстрации (галерея — с povpro.ru) |
| `site/pages/` | Исходники Stitch |
| `scripts/` | Миграция контента и стилей |

## База данных (опционально)

```bash
cd web && cp .env.example .env
# DATABASE_URL=postgresql://...
npm run db:migrate
```

Без БД страницы читаются из `web/content/*.html`.

## Обновление из Stitch

```bash
npm run migrate:content
```
