# ППО №3 — сайт из Google Stitch

Статический сайт по макетам Stitch с **структурой URL как на [povpro.ru](https://povpro.ru)**.

## Сборка и запуск

```bash
npm run dev
```

Откройте **http://localhost:3000/**

После изменения исходников в `site/pages/` выполните `npm run build`.

## Структура меню (как povpro.ru)

- **Главная** → `/`
- **Фрикционные накладки**
  - Наши фрикционные изделия → `/frikcionnye-nakladki/nashi-izdeliya/`
  - Технические условия → `/frikcionnye-nakladki/tu/`
- **Мехобработка** (+ подразделы: продукция, штампы, валы, фрезерные, токарные и др.)
- **Интеллектуальные системы** → `/irt/`
- **Услуги**
  - Продажа МЛД → `/mashiny-dlya-litya-pod-davleniem/`
  - Ремонт МЛД → `/remont-mashin-dlya-litya-pod-davleniem/`
  - Термообработка → `/termoobrabotka/`
  - Ремонт КПО → `/remont-kuznechno-pressovogo-oborudovaniya/`
  - Изготовление кальянов → `/izgotovlenie-kalyanovs/`
- **Контакты** → `/contacts/`
- **Отзывы** → `/otzyvy-o-ppo/`

## Файлы

| Путь | Назначение |
|------|------------|
| `site/pages/` | Исходный HTML из Stitch |
| `site/dist/` | Собранный сайт (после `npm run build`) |
| `scripts/build-site.mjs` | Сборка: URL + меню povpro.ru |

Подразделы мехобработки без отдельного макета в Stitch используют страницу «Мехобработка» с заголовком раздела.
