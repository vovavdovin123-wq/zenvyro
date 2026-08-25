"use client";

import { FormEvent, useState } from "react";

const LOTS = [
  { id: "ethiopia", name: "Эфиопия Гуджи", note: "бергамот, жасмин, белый персик", price: "1 290 ₽ / 250 г" },
  { id: "kenya", name: "Кения Ньери", note: "смородина, грейпфрут, какао", price: "1 390 ₽ / 250 г" },
  { id: "brazil", name: "Бразилия Серрадо", note: "орех, шоколад, низкая кислотность", price: "990 ₽ / 250 г" },
];

export function RoasterView() {
  const [lot, setLot] = useState(LOTS[0].id);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2 || contact.trim().length < 3) return;
    setSent(true);
  }

  return (
    <div className="roast">
      <header className="roast-bar">
        <p className="roast-mark">Северная обжарка</p>
        <a href="#order">Заказать на неделю</a>
      </header>

      <section className="roast-hero">
        <p className="roast-kicker">Тестовый лендинг по ТЗ</p>
        <h1>Зерно на неделю. Без подписки впрок.</h1>
        <p className="roast-lead">
          Три лота, обжарка по средам, доставка до пятницы. Оплаты на этом шаге нет — только заявка.
        </p>
        <a className="roast-cta" href="#order">
          Оставить заявку
        </a>
      </section>

      <section className="roast-lots" id="lots">
        <h2>Лоты этой недели</h2>
        <ul>
          {LOTS.map((item) => (
            <li key={item.id}>
              <h3>{item.name}</h3>
              <p>{item.note}</p>
              <p className="roast-price">{item.price}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="roast-order" id="order">
        <h2>Заявка</h2>
        {sent ? (
          <p className="roast-ok">Заявка принята. Свяжемся и подтвердим лот.</p>
        ) : (
          <form onSubmit={onSubmit}>
            <label>
              Имя
              <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
            </label>
            <label>
              Telegram или телефон
              <input value={contact} onChange={(event) => setContact(event.target.value)} required minLength={3} />
            </label>
            <label>
              Лот
              <select value={lot} onChange={(event) => setLot(event.target.value)}>
                {LOTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit">Отправить</button>
          </form>
        )}
      </section>
    </div>
  );
}
