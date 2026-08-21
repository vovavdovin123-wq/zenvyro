"use client";

import Link from "next/link";
import { money } from "@/studio/helpers";
import { useStudio } from "@/studio/useStudio";

export function StudioOverview() {
  const { summary, funnel } = useStudio();
  const cards = [
    { label: "Посетители", value: String(funnel?.sessions ?? 0), hint: "за период воронки", tone: "blue" },
    { label: "Брифы", value: String(funnel?.applySubmits ?? 0), hint: `${funnel?.applyStarts ?? 0} начали заявку`, tone: "cyan" },
    { label: "Заказы", value: String(summary?.total ?? 0), hint: `${summary?.inWork ?? 0} в работе`, tone: "violet" },
    { label: "Средняя цена", value: summary?.avgPrice ? `${money(summary.avgPrice)} ₽` : "—", hint: `${summary?.priced ?? 0} с цифрой`, tone: "green" },
  ];

  return (
    <div className="zn-dash-page">
      <section className="zn-dash-welcome">
        <div>
          <p className="zn-dash-kicker">С возвращением</p>
          <h1 className="zn-studio-title">Обзор студии</h1>
          <p className="zn-studio-sub">Заявки, воронка и заказы — в одном контуре.</p>
          <Link href="/studio/orders" className="zn-studio-btn zn-studio-btn--primary">
            К заказам
          </Link>
        </div>
        <ul className="zn-dash-welcome-src">
          <li>
            <span>Сайт</span>
            <strong>{summary?.bySource.web ?? 0}</strong>
          </li>
          <li>
            <span>Фриланс</span>
            <strong>{summary?.bySource.hunt ?? 0}</strong>
          </li>
          <li>
            <span>Telegram</span>
            <strong>{summary?.bySource.telegram ?? 0}</strong>
          </li>
        </ul>
      </section>

      <div className="zn-dash-minis">
        {cards.map((card) => (
          <section key={card.label} className={`zn-dash-mini zn-dash-mini--${card.tone}`}>
            <h2>{card.label}</h2>
            <p className="zn-dash-stat">{card.value}</p>
            <p className="zn-dash-hint">{card.hint}</p>
          </section>
        ))}
      </div>

      <section className="zn-dash-mini zn-dash-mini--wide" aria-label="Выручка">
        <h2>Закрыто</h2>
        <p className="zn-dash-stat">{summary?.closed ?? 0}</p>
        <p className="zn-dash-hint">
          {summary?.closedRevenue ? `${money(summary.closedRevenue)} ₽` : "без суммы"} · оценки {summary?.sumPrice ? `${money(summary.sumPrice)} ₽` : "—"}
        </p>
      </section>
    </div>
  );
}
