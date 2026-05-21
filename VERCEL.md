# Деплой на Vercel

Приложение Next.js лежит в папке **`web/`** (не в корне репозитория).

## Обязательная настройка (один раз)

**Vercel → Project → Settings → General → Root Directory**

```
web
```

Сохранить (**Save**).

| Поле | Значение |
|------|----------|
| Root Directory | `web` |
| Framework Preset | Next.js (подтянется сам) |
| Build Command | *(пусто — из `web/vercel.json`)* |
| Install Command | *(пусто)* |
| Output Directory | *(пусто — `.next` по умолчанию)* |

Снимите **Override**, если в Build стоят старые команды вроде `npm run build --prefix web`.

## Деплой

1. `git push origin main`
2. **Deployments → Create Deployment** → branch `main` → последний коммит  
   (не **Redeploy** у старого failed build)

## Если Root Directory пустой (корень репо)

Используется корневой `vercel.json`: `npm run build -w web`, выход `web/.next`.  
Framework **не** должен быть Next.js на корне — в корневом `package.json` нет `next`.
