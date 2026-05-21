# ППО №3 — сайт на Next.js

## Структура

```
web/
├── app/
│   ├── (site)/          # Публичный сайт (шапка, футер)
│   ├── admin/           # Админка (без шапки сайта)
│   └── api/inquiry/     # POST заявок
├── components/
│   ├── layout/          # Header, Footer, MobileNav
│   └── SiteMain.tsx     # HTML-контент страницы
├── content/             # Извлечённый main из Stitch (HTML)
├── lib/                 # routes, pages, navigation, db
├── prisma/              # Схема PostgreSQL
└── public/assets/       # Картинки
```

## Команды

Из корня репозитория:

```bash
npm run dev      # http://localhost:3000
npm run build
```

Из `web/`:

```bash
npm run db:migrate   # после настройки DATABASE_URL
```

Обновить HTML-контент из статики:

```bash
npm run build:static      # корень: собрать public/
npm run migrate:content   # корень: public → web/content/
```

## База данных

1. Скопируйте `.env.example` → `.env`
2. Укажите `DATABASE_URL`
3. `npm run db:migrate` в `web/`

Модели: `Page`, `Product`, `Review`, `Inquiry`, `Media`.

Пока БД не подключена, страницы берутся из `content/*.html`.

## Стили

- `app/globals.css` — тема Stitch + glass-компоненты
- Tailwind v4 через `@import "tailwindcss"` и `@theme`
- Не CDN — всё собирается при `next build`

## Админка

- http://localhost:3000/admin
- Заявки: `/admin/inquiries` (нужна БД)
- Страницы: `/admin/pages` (список; редактор — следующий этап)
