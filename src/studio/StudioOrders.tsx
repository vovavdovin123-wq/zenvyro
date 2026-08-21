"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { SOURCE_LABEL, STATUS_LABEL, type OrderSource, type OrderStatus } from "@/studio/types";
import { actions, contact, money, orderMatchesFilter, orderMatchesQuery, orderMoney } from "@/studio/helpers";
import { press } from "@/studio/StudioMotion";
import { useStudio } from "@/studio/useStudio";

const FILTERS: Array<{ id: "all" | "work" | OrderStatus; label: string }> = [
  { id: "all", label: "Все" },
  { id: "work", label: "В работе" },
  { id: "awaiting_reply_approval", label: "Черновик" },
  { id: "awaiting_price_approval", label: "Цена" },
  { id: "awaiting_prepayment", label: "Предоплата" },
  { id: "closed", label: "Закрыто" },
];

function sourceTone(source: OrderSource) {
  if (source === "web") return "violet";
  if (source === "hunt") return "cyan";
  return "blue";
}

export function StudioOrders() {
  const { orders, summary, run } = useStudio();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const needle = query.trim().toLowerCase();
  const visible = useMemo(
    () => orders.filter((order) => orderMatchesFilter(order, filter) && orderMatchesQuery(order, needle)),
    [orders, filter, needle],
  );

  return (
    <div className="zn-dash-board">
      <header className="zn-dash-head zn-dash-head--row">
        <div>
          <p className="zn-dash-kicker">Таблица</p>
          <h1 className="zn-studio-title">Заказы</h1>
          <p className="zn-studio-sub">
            {summary?.total ?? 0} всего · {summary?.inWork ?? 0} в работе · {visible.length} на экране
          </p>
        </div>
        <label className="zn-dash-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.2-3.2" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Найти: имя, id, статус, контакт, текст"
            aria-label="Поиск заказов"
          />
        </label>
      </header>

      <div className="zn-dash-filters" role="tablist" aria-label="Фильтр заказов">
        {FILTERS.map((item) => (
          <motion.button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            className={filter === item.id ? "is-active" : ""}
            onClick={() => setFilter(item.id)}
            {...press}
          >
            {item.label}
          </motion.button>
        ))}
      </div>

      <section className="zn-dash-table" aria-label="Список заказов">
        <div className="zn-dash-table-head">
          <span>Клиент</span>
          <span>Статус</span>
          <span>Источник</span>
          <span>Цена</span>
        </div>
        <div className="zn-dash-table-scroll">
          {orders.length === 0 ? (
            <p className="zn-dash-empty">Пока пусто. Заявки с сайта и заказы с площадок появятся здесь.</p>
          ) : visible.length === 0 ? (
            <p className="zn-dash-empty">Ничего не нашли. Сбросьте поиск или фильтр.</p>
          ) : (
            visible.map((order, index) => {
              const price = orderMoney(order);
              const open = openId === order.id;
              return (
                <motion.article
                  key={order.id}
                  layout
                  className={`zn-dash-row${open ? " is-open" : ""}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index, 12) * 0.03, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <button
                    type="button"
                    className="zn-dash-row-main"
                    onClick={() => setOpenId(open ? null : order.id)}
                    aria-expanded={open}
                  >
                    <span className="zn-dash-row-who">
                      <span className="zn-dash-avatar">{order.client.name.slice(0, 1)}</span>
                      <span>
                        <strong>{order.client.name}</strong>
                        <em>{order.id.slice(0, 8)}</em>
                      </span>
                    </span>
                    <span className="zn-dash-chip">{STATUS_LABEL[order.status]}</span>
                    <span className={`zn-dash-src zn-dash-src--${sourceTone(order.source)}`}>
                      {SOURCE_LABEL[order.source]}
                    </span>
                    <span className="zn-dash-row-price">{price ? `${price} ₽` : "—"}</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open ? (
                      <motion.div
                        className="zn-dash-row-detail"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {contact(order) ? <p className="zn-dash-order-meta">{contact(order)}</p> : null}
                        <p className="zn-dash-lead">{order.leadText}</p>
                        {order.hunter ? <p className="zn-dash-order-meta">Охотник: {order.hunter.reason}</p> : null}
                        {order.replyDraft && order.source === "hunt" ? (
                          <p className="zn-dash-lead">Черновик: {order.replyDraft}</p>
                        ) : null}
                        {order.pricing ? (
                          <p className="zn-dash-order-meta">
                            Оценка: {money(order.pricing.priceRub)} ₽ / {order.pricing.timelineDays} дн
                          </p>
                        ) : null}
                        <div className="zn-dash-actions">
                          {actions
                            .filter((item) => item.statuses.includes(order.status))
                            .map((item) => (
                              <motion.button
                                type="button"
                                key={item.action}
                                onClick={() => void run(order.id, item.action)}
                                className="zn-studio-btn"
                                {...press}
                              >
                                {item.label}
                              </motion.button>
                            ))}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
