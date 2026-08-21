export const categories = [
  { id: "all", label: "Все" },
  { id: "sites", label: "Сайты" },
  { id: "services", label: "Сервисы" },
  { id: "bots", label: "Telegram" },
  { id: "support", label: "Сопровождение" },
] as const;

export type WorkCategory = Exclude<(typeof categories)[number]["id"], "all">;

export type Work = {
  slug: string;
  title: string;
  client: string;
  year: string;
  category: WorkCategory;
  /** Placeholder SVG until a real screenshot is ready. */
  cover: string;
  gallery: string[];
  frames: string[];
  summary: string;
  problem: string;
  solution: string;
  role: string;
  results: { label: string; value: number; suffix?: string }[];
  stack: string[];
};

/** Covers and galleries are abstract SVGs. Swap for screenshots when real work ships. */
export const works: Work[] = [
  {
    slug: "north-atelier",
    title: "North Atelier",
    client: "Ателье North",
    year: "2026",
    category: "sites",
    cover: "/works/north.svg",
    gallery: ["/works/north.svg", "/works/north-2.svg", "/works/north-3.svg"],
    frames: ["Главная", "Запись", "Портфолио"],
    summary: "Сайт ателье, где запись стоит рядом с работами — не за ними.",
    problem: "Галерея занимала весь первый экран. Клиенты листали ткани и уходили, не оставив заявку.",
    solution:
      "Собрали главную вокруг одной кнопки. Работы остались — уже как доказательство мастерства. Форма короткая: имя, контакт, что сшить.",
    role: "Дизайн и разработка",
    results: [
      { label: "заявок с главной", value: 38, suffix: "%" },
      { label: "экрана до формы", value: 1 },
      { label: "недель до запуска", value: 4 },
    ],
    stack: ["Next.js", "Tailwind", "Telegram"],
  },
  {
    slug: "volta-lab",
    title: "Volta Lab",
    client: "Volta Lab",
    year: "2026",
    category: "services",
    cover: "/works/volta.svg",
    gallery: ["/works/volta.svg", "/works/volta-2.svg"],
    frames: ["Календарь", "Оплата слота"],
    summary: "Календарь записи: слоты, оплата, статусы. Один кабинет.",
    problem: "Запись жила в переписке. Слоты пересекались, оплату считали руками.",
    solution:
      "Календарь свободного времени, оплата до визита, статусы для администратора. Клиент видит только то, что можно взять.",
    role: "Продукт и разработка",
    results: [
      { label: "слотов без накладок", value: 100, suffix: "%" },
      { label: "кабинет", value: 1 },
      { label: "дней до первого релиза", value: 21 },
    ],
    stack: ["Next.js", "Stripe", "Postgres"],
  },
  {
    slug: "kora-bot",
    title: "Kora",
    client: "Kora",
    year: "2025",
    category: "bots",
    cover: "/works/kora.svg",
    gallery: ["/works/kora.svg", "/works/kora-2.svg"],
    frames: ["Чат заявки", "Карточка менеджеру"],
    summary: "Telegram для заявок: клиент пишет в чат, менеджер получает карточку.",
    problem: "Менеджер отвечал на всё подряд. Пустые диалоги смешивались с заказами.",
    solution:
      "Бот собирает цель, срок и контакт — и отдаёт готовую карточку. Пустые разговоры в очередь не попадают.",
    role: "Сценарий и бот",
    results: [
      { label: "поля до менеджера", value: 3 },
      { label: "меньше шума в чате", value: 70, suffix: "%" },
    ],
    stack: ["Telegram", "Node.js"],
  },
  {
    slug: "field-notes",
    title: "Field Notes",
    client: "Field Notes",
    year: "2025",
    category: "sites",
    cover: "/works/field.svg",
    gallery: ["/works/field.svg", "/works/field-2.svg"],
    frames: ["Выпуск", "Архив"],
    summary: "Редакционный сайт: выпуск, архив и одна кнопка подписки.",
    problem: "Журнал жил в PDF и сторис. Архив нельзя было найти, подписка терялась.",
    solution:
      "Выпуск стал страницей, архив — сеткой. Подписка стоит внизу каждого текста и больше нигде не спорит.",
    role: "Дизайн и вёрстка",
    results: [
      { label: "выпусков в архиве", value: 24 },
      { label: "призыв на странице", value: 1 },
    ],
    stack: ["Next.js", "MDX"],
  },
  {
    slug: "harbor-care",
    title: "Harbor Care",
    client: "Harbor Care",
    year: "2026",
    category: "support",
    cover: "/works/field.svg",
    gallery: ["/works/field.svg", "/works/field-2.svg"],
    frames: ["Релизы", "Очередь правок"],
    summary: "Сопровождение после запуска: правки, релизы и очередь задач без раздувания текущего этапа.",
    problem: "После запуска правки терялись в чатах, срочное смешивалось с новым функционалом.",
    solution:
      "Собрали очередь: баг — сразу, фича — отдельным этапом. Клиент видит статус, команда не раздувает текущий релиз.",
    role: "Сопровождение",
    results: [
      { label: "релизов в месяц", value: 4 },
      { label: "очередь без чата", value: 1 },
    ],
    stack: ["Next.js", "Vercel"],
  },
];

export function getWork(slug: string) {
  return works.find((work) => work.slug === slug);
}

export function nextWork(slug: string) {
  const index = works.findIndex((work) => work.slug === slug);
  if (index < 0) return undefined;
  return works[(index + 1) % works.length];
}

export const categoryLabel: Record<WorkCategory, string> = {
  sites: "Сайт",
  services: "Сервис",
  bots: "Telegram",
  support: "Сопровождение",
};
