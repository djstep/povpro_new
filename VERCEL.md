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

## Картинки не грузятся (битые иконки / фото)

### Проверка после деплоя

Откройте в браузере (подставьте свой домен Vercel):

`https://ВАШ-ДОМЕН.vercel.app/assets/img/povpro-gallery-1.jpg`

- **200** — файлы на сервере есть, обновите страницу с Ctrl+F5.
- **404** — на Vercel нет файлов из `web/public` или старый деплой.

### Что сделать

1. Убедитесь, что в Git есть `web/public/assets/img/` (коммит `Add site images to repo for Vercel deploy`).
2. **Settings → General → Root Directory:** `web`
3. **Output Directory:** пусто (Override выключен).
4. **Deployments → Create Deployment** → ветка `main` (новый деплой, не Redeploy старого до push картинок).
5. Локально: `npm run migrate:content` — копирует `assets` в `web/public`.

Сборка падает с ошибкой про `web/public/assets/img`, если картинки не на месте — так Vercel не соберёт пустой сайт.
