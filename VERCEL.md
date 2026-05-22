# Деплой на Vercel

## Обязательно

**Settings → General → Root Directory:** `web` → **Save**

**Settings → Build and Deployment** — снимите все **Override** (Build / Install / Output должны быть пустыми или Default).

| Поле | Значение |
|------|----------|
| Root Directory | `web` |
| Framework | Next.js |
| Output Directory | *(пусто)* |
| Build Command | *(пусто — из `web/vercel.json`)* |

**Не используйте** корневой `vercel.json` с `outputDirectory: web/.next` — при Root Directory `web` это даёт 404.

## Деплой

```bash
git push origin main
```

**Deployments → Create Deployment** → `main` → последний коммит.

## Проверка

- Статус деплоя: **Ready**
- Открывайте URL **именно этого** деплоя (кнопка Visit)
- Домен: `https://ваш-проект.vercel.app/` — не папку `web/` в браузере

## Локально

```bash
cd web
npm install
npm run build
npm run start
```

Откройте http://localhost:3000
