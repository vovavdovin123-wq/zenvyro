# Zenvyro

Сайт студии и внутренний контур заявок.

## Запуск

```bash
cp .env.example .env.local
npm run dev
```

Сайт: http://localhost:3000

Telegram-бот (отдельный процесс): `npm run bot`

## Где что лежит

```
src/
  app/            маршруты Next.js — страницы и API
  components/     UI по разделам сайта
    layout/       шапка, подвал, логотип
    home/         главная
    works/        кейсы
    team/         люди
    process/      процесс
    apply/        форма заявки
    legal/        документы и реквизиты
    effects/      фоновые сцены (точки, ferro, molten, topo)
    ui/           мелкие общие куски
  content/        тексты сайта: услуги, кейсы, юр.данные
  styles/         CSS лендинга
  lib/            общее: цвет акцента, лимиты WebGL
  studio/         заявки, Telegram, агенты — не публичный сайт
```

Маршруты в `src/app/` совпадают с URL: `/`, `/works`, `/team`, `/process`, `/contact`, `/requisites`, `/legal/*`.

Тексты страниц — в `src/content/`. Кейсы только в `content/works.ts`, не дублировать в `site.ts`.

`src/studio/` — очередь заявок, шаблоны сообщений и бот. Это внутреннее.

## Переменные

См. `.env.example`. Для карточек заявок в Telegram нужны `TELEGRAM_BOT_TOKEN` и `TELEGRAM_ADMIN_CHAT_IDS`.
