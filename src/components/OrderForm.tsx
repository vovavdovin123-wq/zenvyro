"use client";

import { FormEvent, useState } from "react";
import { producerName } from "@/lib/site";

const budgets = ["80–150 тыс", "150–300 тыс", "300–600 тыс", "от 600 тыс"];

export function OrderForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        contact: data.contact,
        leadText: data.leadText,
        budget: data.budget,
        deadline: data.deadline,
      }),
    });
    const json = (await response.json()) as { id?: string; error?: string };
    if (!response.ok) {
      setStatus("err");
      setMessage(json.error ?? "Не отправилось. Напишите чуть подробнее.");
      return;
    }
    setStatus("ok");
    setMessage(
      `Заявку ${json.id} получили. ${producerName} напишет в этот или следующий рабочий день.`,
    );
    form.reset();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          Имя
          <input
            required
            name="name"
            className="rounded-2xl border border-line bg-bg px-4 py-3 outline-none focus:border-lime"
          />
        </label>
        <label className="grid gap-2 text-sm">
          Telegram или email
          <input
            required
            name="contact"
            className="rounded-2xl border border-line bg-bg px-4 py-3 outline-none focus:border-lime"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm">
        Задача
        <textarea
          required
          name="leadText"
          rows={5}
          placeholder="Что нужно сделать. Для кого. Есть ли ориентиры."
          className="resize-y rounded-2xl border border-line bg-bg px-4 py-3 outline-none focus:border-lime"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          Бюджет
          <select
            name="budget"
            className="rounded-2xl border border-line bg-bg px-4 py-3 outline-none focus:border-lime"
            defaultValue={budgets[1]}
          >
            {budgets.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Срок
          <input
            name="deadline"
            placeholder="Например, к сентябрю"
            className="rounded-2xl border border-line bg-bg px-4 py-3 outline-none focus:border-lime"
          />
        </label>
      </div>
      <button
        disabled={status === "loading"}
        className="mt-2 rounded-full bg-lime px-6 py-3 text-sm font-semibold text-bg transition hover:bg-lime-2 disabled:opacity-60"
      >
        {status === "loading" ? "Отправляем…" : "Отправить заявку"}
      </button>
      {message ? (
        <p className={status === "err" ? "text-sm text-red-300" : "text-sm text-paper-dim"}>{message}</p>
      ) : null}
    </form>
  );
}
