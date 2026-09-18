# Деплой на Beget по SSH (обновление сайта)

Сайт — Next.js в папке `web/`. На Beget обычно: SSH → `git pull` (или заливка файлов) → `npm ci` → `npm run build` → перезапуск процесса (`pm2`).

Ниже два сценария: **обновление** (сайт уже стоит) и **первый раз**.

Подставьте свои значения:

| Плейсхолдер | Пример |
|-------------|--------|
| `USER` | логин SSH из панели Beget |
| `HOST` | например `xxx.beget.tech` или IP VPS |
| `APP_DIR` | путь к проекту на сервере, например `~/povpro_new` или `/home/USER/povpro_new` |
| `PORT` | порт Node, часто `3000` |

---

## 0. Перед заливкой — на своём компьютере

Изменения админки сейчас могут быть **ещё не в git**. Без коммита `git pull` на сервере их не подтянет.

В корне репозитория на ПК:

```bash
cd /путь/к/povpro_new

git status
git add web/app/admin web/app/api/admin web/app/globals.css \
  web/components/admin web/lib/cms
# не добавляйте web/.env и пароли

git commit -m "Improve admin CMS: content blocks, media library, page import."

# если на сервере тянете с GitHub:
git push origin main
```

Если на сервер ходите **не через GitHub**, а копируете файлы — см. раздел «Вариант B» ниже.

---

## 1. Подключение по SSH

**Windows (PowerShell или Windows Terminal):**

```bash
ssh USER@HOST
```

Пароль — из панели Beget (SSH / VPS), либо вход по ключу.

Проверьте Node (нужен **Node 20+**, лучше 20 или 22 LTS):

```bash
node -v
npm -v
```

Если Node старый или нет:

```bash
# пример через nvm (если уже ставили)
nvm install 22
nvm use 22
```

На VPS Beget Node иногда ставится через их панель или `nvm` — смотрите, как у вас уже крутится текущий сайт.

---

## 2. Обновление уже работающего сайта (обычный случай)

### Вариант A — на сервере есть git-клон репозитория

```bash
cd APP_DIR

# на всякий случай: что сейчас запущено
pm2 list
# или: systemctl status ... / ps aux | grep next

# подтянуть код
git fetch origin
git status
git pull origin main

cd web

# зависимости (если package-lock менялся)
npm ci

# схема БД (если используете PostgreSQL на проде)
# не затирает данные при обычном push схемы; при сомнениях сделайте бэкап БД
npx prisma generate
npx prisma db push
# если у вас принято migrate — используйте ваш обычный способ, не db push вслепую

# сборка
npm run build

# перезапуск
pm2 restart povpro
# если процесс называется иначе — смотрите: pm2 list
# если без pm2, а через systemd:
# sudo systemctl restart povpro
```

Проверка:

```bash
pm2 logs povpro --lines 50
curl -I http://127.0.0.1:PORT
```

Откройте в браузере `https://povpro.ru/admin` (с Ctrl+F5).

### Вариант B — без git на сервере (заливка по SCP/rsync с ПК)

На **своём ПК** из корня `povpro_new` (после коммита или просто с актуальными файлами):

**rsync** (Git Bash / WSL):

```bash
rsync -avz --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude web/.env \
  --exclude 'web/*.db' \
  --exclude .git \
  ./ USER@HOST:APP_DIR/
```

**Важно:** `--exclude web/.env` — **не затирайте** серверный `.env` локальным.

Потом по SSH:

```bash
ssh USER@HOST
cd APP_DIR/web
npm ci
npx prisma generate
npx prisma db push   # если так принято у вас
npm run build
pm2 restart povpro
```

---

## 3. Первый запуск на сервере (если ещё не ставили)

```bash
ssh USER@HOST
cd ~
git clone https://github.com/djstep/povpro_new.git
# или загрузите архив/rsync в APP_DIR

cd APP_DIR/web
cp .env.example .env
nano .env   # заполните значения ниже
```

Минимальный `.env` на проде:

```env
NODE_ENV=production
DATABASE_URL="postgresql://USER:PASS@HOST:5432/DBNAME"
# или sqlite, если так уже настроено:
# DATABASE_URL="file:./prod.db"

ADMIN_PASSWORD="надёжный-пароль"
ADMIN_SESSION_SECRET="длинная-случайная-строка"

NEXT_PUBLIC_SITE_URL="https://povpro.ru"

MAIL_TRANSPORT="sendmail"
MAIL_FROM="noreply@povpro.ru"
MAIL_TO="admin@povpro.ru, logistica@povpro.ru"
```

Дальше:

```bash
npm ci
npx prisma generate
npx prisma db push
npm run build

# запуск через pm2
npm install -g pm2
pm2 start npm --name povpro -- start
# npm start = next start, по умолчанию порт 3000
# чтобы порт был явным:
# pm2 start npx --name povpro -- next start -p 3000

pm2 save
pm2 startup   # выполнить команду, которую выведет pm2
```

Перед приложением обычно стоит **nginx** (прокси на `127.0.0.1:3000`) и HTTPS — это в панели Beget / конфиге nginx. Если сайт уже открывается по домену, прокси скорее всего уже настроен: **не трогайте**, только пересоберите и `pm2 restart`.

Папка загрузок должна быть доступна на запись приложению:

```bash
mkdir -p public/assets/uploads
chmod -R u+rw public/assets/uploads
```

---

## 4. Чеклист после обновления админки

1. `https://povpro.ru/admin` — вход по `ADMIN_PASSWORD` из серверного `.env`
2. **Страницы** → любая → вкладка **Контент** — видны секции, превью
3. **Медиа** → **Библиотека** — загрузка файла; `.gitkeep` не должен торчать
4. Сохранить правку на тестовой странице → проверить на сайте (обновить без кэша)
5. `pm2 logs` — нет ошибок `DATABASE_URL` / Prisma / EACCES на uploads

---

## 5. Откат, если что-то сломалось

```bash
cd APP_DIR
git log -5 --oneline
git checkout <хеш-рабочего-коммита> -- web
cd web
npm ci
npm run build
pm2 restart povpro
```

Или вернуть предыдущий релиз из бэкапа, если копируете без git.

---

## 6. Частые проблемы

| Симптом | Что проверить |
|---------|----------------|
| Админка «закрыта» / нет входа | На проде **обязан** быть `ADMIN_PASSWORD` в `web/.env` |
| «DATABASE_URL не настроен» | Путь к `.env`, перезапуск pm2 после правки `.env` |
| Сборка падает на assets | Скрипт `verify-public-assets` — на месте ли файлы в `web/public/assets` |
| Картинки из админки не сохраняются | Права на `web/public/assets/uploads`, на Beget/Vercel FS иногда read-only — на своём VPS обычно ок |
| Старый интерфейс админки | Кэш браузера / CDN; убедитесь что `build` прошёл и pm2 поднял **новый** `.next` |
| `git pull` ничего не дал | Локально не запушили в тот remote/ветку, откуда тянет сервер |

---

## 7. Короткая шпаргалка «только обновить»

```bash
ssh USER@HOST
cd APP_DIR && git pull origin main
cd web && npm ci && npx prisma generate && npm run build && pm2 restart povpro
pm2 logs povpro --lines 30
```

Если `USER`, `HOST`, `APP_DIR` и имя процесса pm2 пришлёте — можно сузить инструкцию под ваши точные команды одной копипастой.
