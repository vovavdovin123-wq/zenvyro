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
  memory/         обёртка CLI графа кода (не MCP)
```

Маршруты в `src/app/` совпадают с URL: `/`, `/works`, `/team`, `/process`, `/contact`, `/requisites`, `/legal/*`.

Тексты страниц — в `src/content/`. Кейсы только в `content/works.ts`, не дублировать в `site.ts`.

`src/studio/` — очередь заявок, шаблоны сообщений и бот. Это внутреннее.

## Граф кода (без MCP)

Нужен бинарник [codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp) без установки MCP: `install.ps1 --skip-config` или переменная `CBM_BIN`.

```bash
npm run memory -- index
npm run memory -- arch
npm run memory -- search --name Handler --label Function
npm run memory -- trace ProcessOrder --direction inbound
npm run memory -- impact
```

## Переменные

См. `.env.example`. Для карточек заявок в Telegram нужны `TELEGRAM_BOT_TOKEN` и `TELEGRAM_ADMIN_CHAT_IDS`.
