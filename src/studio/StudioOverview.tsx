"use client";

import Link from "next/link";
import { money } from "@/studio/helpers";
import { useStudio } from "@/studio/useStudio";

export function StudioOverview() {
  const { summary, funnel, usage } = useStudio();
  const cards = [
    { label: "Посетители", value: String(funnel?.sessions ?? 0), hint: "за период воронки", tone: "blue" },
    { label: "Брифы", value: String(funnel?.applySubmits ?? 0), hint: `${funnel?.applyStarts ?? 0} начали заявку`, tone: "cyan" },
    { label: "Заказы", value: String(summary?.total ?? 0), hint: `${summary?.inWork ?? 0} в работе`, tone: "violet" },
    { label: "Средняя цена", value: summary?.avgPrice ? `${money(summary.avgPrice)} ₽` : "—", hint: `${summary?.priced ?? 0} с цифрой`, tone: "green" },
  ];
  const agents = Object.entries(usage?.byAgent ?? {});

  return (
    <div className="zn-dash-page">
      <section className="zn-dash-welcome">
        <div>
          <p className="zn-dash-kicker">С возвращением</p>
          <h1 className="zn-studio-title">Обзор студии</h1>
          <p className="zn-studio-sub">Заявки, воронка, заказы и расход токенов агентов.</p>
          <div className="zn-dash-welcome-actions">
            <Link href="/studio/orders" className="zn-studio-btn zn-studio-btn--primary">
              К заказам
            </Link>
            <Link href="/demo" className="zn-studio-btn">
              Тестовое демо
            </Link>
          </div>
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

      <section className="zn-dash-mini zn-dash-mini--wide" aria-label="Токены агентов">
        <h2>Токены агентов</h2>
        <p className="zn-dash-stat">{(usage?.totalTokens ?? 0).toLocaleString("ru-RU")}</p>
        <p className="zn-dash-hint">
          {usage?.llmCalls ?? 0} вызовов LLM · {usage?.fallbackCalls ?? 0} фолбэк ·{" "}
          {(usage?.promptTokens ?? 0).toLocaleString("ru-RU")} in / {(usage?.completionTokens ?? 0).toLocaleString("ru-RU")} out
        </p>
        {agents.length ? (
          <ul className="zn-dash-usage">
            {agents.map(([name, row]) => (
              <li key={name}>
                <span>{name}</span>
                <strong>{row.totalTokens.toLocaleString("ru-RU")}</strong>
                <em>
                  {row.llmCalls}/{row.calls}
                </em>
              </li>
            ))}
          </ul>
        ) : (
          <p className="zn-dash-hint">Пока нет вызовов. Без OPENAI_API_KEY агенты идут в фолбэк — токены 0.</p>
        )}
      </section>
    </div>
  );
}
