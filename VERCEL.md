# Деплой на Vercel — настройки

## Ошибка «No Output Directory named public found»

В **Project Settings** указан неверный **Output Directory = `public`**.

Для Next.js это **неправильно**: `public/` — только картинки, сборка лежит в `.next` (Vercel подхватывает сам).

### Исправление (2 минуты)

1. **Settings → General**
   - **Root Directory:** `web`
   - **Save**

2. **Settings → Build and Deployment**

   | Поле | Должно быть |
   |------|-------------|
   | Framework Preset | **Next.js** |
   | Build Command | пусто *(Override выкл.)* |
   | Install Command | пусто *(Override выкл.)* |
   | Output Directory | **пусто** *(Override выкл.)* — НЕ `public`, НЕ `web/.next` |

   Если видите `public` в Output Directory — **удалите** и снимите галочку Override.

3. **Deployments → Create Deployment** → branch `main`

4. Открыть **Visit** у нового деплоя.

---

## Файл `web/vercel.json`

Только install + build. **Без** `outputDirectory`.

## Локальная проверка

```bash
cd web
npm install
npm run build
npm run start
```

http://localhost:3000

---

## Картинки

Сайт подставляет URL с **povpro.ru** (галерея) и **GitHub raw** (PNG из репозитория), потому что Vercel часто не отдаёт `/assets/img/` из `web/public`.

В корне репозитория есть `vercel.json` с `"rootDirectory": "web"` — не удаляйте.

После деплоя обновите страницу с **Ctrl+F5**.
