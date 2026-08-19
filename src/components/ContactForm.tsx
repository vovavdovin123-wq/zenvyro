"use client";

import { FormEvent, useState } from "react";
import { ClickSpark } from "./bits/ClickSpark";
import { ElectricBorder } from "./bits/ElectricBorder";
import { producerName } from "@/lib/site";

const budgets = ["80–150 тыс", "150–300 тыс", "300–600 тыс", "от 600 тыс"];

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    console.log("Zenvyro lead", data);
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
            className="rounded-2xl border border-white/10 bg-bg-primary px-4 py-3 outline-none focus:border-primary"
          />
        </label>
        <label className="grid gap-2 text-sm">
          Telegram или email
          <input
            required
            name="contact"
            className="rounded-2xl border border-white/10 bg-bg-primary px-4 py-3 outline-none focus:border-primary"
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
          className="resize-y rounded-2xl border border-white/10 bg-bg-primary px-4 py-3 outline-none focus:border-primary"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          Бюджет
          <select
            name="budget"
            defaultValue={budgets[1]}
            className="rounded-2xl border border-white/10 bg-bg-primary px-4 py-3 outline-none focus:border-primary"
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
            className="rounded-2xl border border-white/10 bg-bg-primary px-4 py-3 outline-none focus:border-primary"
          />
        </label>
      </div>
      <ClickSpark>
        <ElectricBorder className="w-fit">
          <button
            disabled={status === "loading"}
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {status === "loading" ? "Отправляем…" : "Отправить заявку"}
          </button>
        </ElectricBorder>
      </ClickSpark>
      {message ? (
        <p className={status === "err" ? "text-sm text-red-300" : "text-sm text-ink-muted"}>{message}</p>
      ) : null}
    </form>
  );
}
