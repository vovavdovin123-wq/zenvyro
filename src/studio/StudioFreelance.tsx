"use client";

import { motion } from "framer-motion";
import { press } from "@/studio/StudioMotion";
import { useStudio } from "@/studio/useStudio";

export function StudioFreelance() {
  const { manual, setManual, addOrder, saving } = useStudio();

  return (
    <div className="zn-dash-page">
      <header className="zn-dash-head">
        <div>
          <p className="zn-dash-kicker">Студия</p>
          <h1 className="zn-studio-title">Фриланс</h1>
          <p className="zn-studio-sub">Агент вносит площадку, бриф и цену. Эти заказы входят в среднюю цену и сводку.</p>
        </div>
      </header>
      <section className="zn-glass zn-dash-card zn-dash-form">
        <form onSubmit={addOrder}>
          <select
            value={manual.platform}
            onChange={(event) => setManual((prev) => ({ ...prev, platform: event.target.value }))}
            className="zn-dash-field"
          >
            <option>Kwork</option>
            <option>FL.ru</option>
            <option>Habr Freelance</option>
            <option>Другая площадка</option>
          </select>
          <input
            value={manual.name}
            onChange={(event) => setManual((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Имя клиента или ник"
            className="zn-dash-field"
          />
          <textarea
            value={manual.leadText}
            onChange={(event) => setManual((prev) => ({ ...prev, leadText: event.target.value }))}
            placeholder="Текст заявки с площадки"
            rows={4}
            className="zn-dash-field zn-dash-span-2"
          />
          <input
            value={manual.telegram}
            onChange={(event) => setManual((prev) => ({ ...prev, telegram: event.target.value }))}
            placeholder="Telegram"
            className="zn-dash-field"
          />
          <input
            value={manual.email}
            onChange={(event) => setManual((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="Email"
            className="zn-dash-field"
          />
          <input
            value={manual.phone}
            onChange={(event) => setManual((prev) => ({ ...prev, phone: event.target.value }))}
            placeholder="Телефон"
            className="zn-dash-field"
          />
          <input
            value={manual.priceRub}
            onChange={(event) => setManual((prev) => ({ ...prev, priceRub: event.target.value }))}
            placeholder="Цена, ₽"
            inputMode="numeric"
            className="zn-dash-field"
          />
          <input
            value={manual.timelineDays}
            onChange={(event) => setManual((prev) => ({ ...prev, timelineDays: event.target.value }))}
            placeholder="Срок, дни"
            inputMode="numeric"
            className="zn-dash-field"
          />
          <motion.button
            type="submit"
            disabled={saving || manual.leadText.trim().length < 8}
            className="zn-studio-btn zn-studio-btn--primary zn-dash-span-2"
            {...press}
          >
            {saving ? "Сохраняем…" : "Добавить в сводку"}
          </motion.button>
        </form>
      </section>
    </div>
  );
}
