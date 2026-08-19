"use client";

import { FormEvent, useEffect, useState } from "react";
import { STATUS_LABEL, type HumanAction, type Order } from "@/lib/types";

const actions: Array<{ action: HumanAction; label: string; statuses: Order["status"][] }> = [
  { action: "approve_reply", label: "Отправить отклик", statuses: ["awaiting_reply_approval"] },
  { action: "skip_reply", label: "Пропуск", statuses: ["awaiting_reply_approval"] },
  { action: "confirm_price", label: "Подтвердить цену", statuses: ["awaiting_price_approval"] },
  { action: "mark_prepayment", label: "Предоплата есть", statuses: ["awaiting_prepayment"] },
  { action: "archive_kp", label: "Архив КП", statuses: ["awaiting_prepayment", "awaiting_price_approval"] },
  { action: "approve_spec", label: "Фиксировать ТЗ", statuses: ["awaiting_spec_approval"] },
  { action: "revise_spec", label: "Правки ТЗ", statuses: ["awaiting_spec_approval"] },
  { action: "accept_stage", label: "Этап принят", statuses: ["awaiting_stage_review"] },
  { action: "reject_stage", label: "Доработка", statuses: ["awaiting_stage_review"] },
  { action: "open_demo", label: "Открыть демо", statuses: ["awaiting_demo"] },
];

export function StudioBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [password, setPassword] = useState("");
  const [needAuth, setNeedAuth] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/studio");
    if (response.status === 401) {
      setNeedAuth(true);
      return;
    }
    const json = (await response.json()) as { orders: Order[] };
    setNeedAuth(false);
    setOrders(json.orders);
  }

  useEffect(() => {
    void load();
  }, []);

  async function login(event: FormEvent) {
    event.preventDefault();
    await fetch("/api/studio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    await load();
  }

  async function run(id: string, action: HumanAction) {
    setError("");
    const notes =
      action === "revise_spec" || action === "reject_stage"
        ? window.prompt("Комментарий") ?? ""
        : undefined;
    const demoUrl = action === "open_demo" ? window.prompt("URL демо") ?? "" : undefined;
    const response = await fetch("/api/studio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, notes, demoUrl }),
    });
    if (!response.ok) {
      setError("Не получилось выполнить действие");
      return;
    }
    await load();
  }

  if (needAuth) {
    return (
      <form onSubmit={login} className="mx-auto grid max-w-sm gap-4">
        <p className="text-ink-muted">Пароль студии</p>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-2xl border border-white/10 bg-bg-primary px-4 py-3"
        />
        <button className="rounded-full bg-primary px-5 py-3 font-semibold text-white">Войти</button>
      </form>
    );
  }

  return (
    <div className="grid gap-6">
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {orders.length === 0 ? (
        <p className="text-ink-muted">Заявок пока нет. Они появятся с сайта или из бота.</p>
      ) : null}
      {orders.map((order) => (
        <article key={order.id} className="rounded-3xl border border-white/10 bg-bg-secondary p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg">{order.client.name}</p>
              <p className="mt-1 text-sm text-ink-muted">
                {order.id} · {STATUS_LABEL[order.status]} · {order.source}
              </p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-lavender">
              {STATUS_LABEL[order.status]}
            </span>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm text-ink-muted">{order.leadText}</p>
          {order.hunter ? (
            <p className="mt-3 text-sm">Охотник: {order.hunter.reason}</p>
          ) : null}
          {order.pricing ? (
            <p className="mt-2 text-sm">
              Оценка: {order.pricing.priceRub.toLocaleString("ru-RU")} ₽ / {order.pricing.timelineDays} дн
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            {actions
              .filter((item) => item.statuses.includes(order.status))
              .map((item) => (
                <button
                  key={item.action}
                  onClick={() => void run(order.id, item.action)}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm transition hover:border-secondary hover:text-secondary"
                >
                  {item.label}
                </button>
              ))}
          </div>
        </article>
      ))}
    </div>
  );
}
