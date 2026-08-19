"use client";

import Link from "next/link";
import { useState } from "react";
import { FadeIn } from "@/components/bits/FadeIn";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { producerName } from "@/lib/site";
import "./apply.css";

const kinds = [
  { id: "sites", label: "Сайт" },
  { id: "services", label: "Сервис" },
  { id: "bots", label: "Telegram" },
  { id: "support", label: "Сопровождение" },
];

const budgets = ["80–150 тыс", "150–300 тыс", "300–600 тыс", "от 600 тыс"];

type Draft = {
  kind: string;
  name: string;
  contact: string;
  leadText: string;
  budget: string;
  deadline: string;
};

const empty: Draft = {
  kind: "",
  name: "",
  contact: "",
  leadText: "",
  budget: budgets[1],
  deadline: "",
};

export function ApplyHero({
  withWorksLink = false,
  page = false,
}: {
  withWorksLink?: boolean;
  page?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(empty);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  const total = 4;
  const patch = (next: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...next }));

  const canNext =
    (step === 0 && Boolean(draft.kind)) ||
    (step === 1 && draft.name.trim().length >= 2 && draft.contact.trim().length >= 3) ||
    (step === 2 && draft.leadText.trim().length >= 20) ||
    step === 3;

  async function submit() {
    setStatus("loading");
    const kindLabel = kinds.find((item) => item.id === draft.kind)?.label ?? "";
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name,
        contact: draft.contact,
        leadText: `${kindLabel}. ${draft.leadText}`.trim(),
        budget: draft.budget,
        deadline: draft.deadline,
      }),
    });
    const json = (await response.json()) as { id?: string; error?: string };
    if (!response.ok) {
      setStatus("err");
      setMessage(json.error ?? "Не отправилось. Проверьте поля и попробуйте ещё раз.");
      return;
    }
    setStatus("ok");
    setMessage(
      `Заявку ${json.id} получили. ${producerName} напишет в этот или следующий рабочий день.`,
    );
  }

  return (
    <section className={`zn-apply${page ? " zn-apply--page" : ""}`}>
      <div className="zn-apply-shell">
        <FadeIn y={page ? 0 : 28}>
        <div className="zn-apply-card">
          <HeroBackdrop
            speed={0.22}
            frequency={1.15}
            noise={0.12}
            bandWidth={0.22}
            rotation={78}
            fadeTop={0.98}
            iterations={1}
            intensity={1.45}
            showFade={false}
          />
          <div className="zn-apply-inner">
            <h2 className="zn-apply-title">Расскажите о задаче.</h2>
            <p className="zn-apply-sub">
              Письмо читает {producerName}. Если формат наш — ответим в ближайший рабочий день.
            </p>

            {status === "ok" ? (
              <div className="zn-apply-done">
                <p>{message}</p>
                {withWorksLink ? (
                  <Link href="/works" className="zn-apply-btn zn-apply-btn--ghost">
                    Смотреть кейсы
                  </Link>
                ) : null}
              </div>
            ) : (
              <>
                <div className="zn-apply-progress" aria-hidden>
                  {Array.from({ length: total }).map((_, index) => (
                    <span key={index} className={index <= step ? "is-on" : ""} />
                  ))}
                </div>

                <div className="zn-apply-step">
                  {step === 0 ? (
                    <div className="zn-apply-kinds">
                      {kinds.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={draft.kind === item.id ? "is-on" : ""}
                          onClick={() => patch({ kind: item.id })}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {step === 1 ? (
                    <div className="zn-apply-fields">
                      <input
                        value={draft.name}
                        onChange={(event) => patch({ name: event.target.value })}
                        placeholder="Имя"
                        autoComplete="name"
                      />
                      <input
                        value={draft.contact}
                        onChange={(event) => patch({ contact: event.target.value })}
                        placeholder="Telegram или email"
                        autoComplete="off"
                      />
                    </div>
                  ) : null}

                  {step === 2 ? (
                    <textarea
                      value={draft.leadText}
                      onChange={(event) => patch({ leadText: event.target.value })}
                      rows={5}
                      placeholder="Что нужно сделать. Для кого. Есть ли ориентиры."
                    />
                  ) : null}

                  {step === 3 ? (
                    <div className="zn-apply-fields">
                      <select value={draft.budget} onChange={(event) => patch({ budget: event.target.value })}>
                        {budgets.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                      <input
                        value={draft.deadline}
                        onChange={(event) => patch({ deadline: event.target.value })}
                        placeholder="Срок. Например, к сентябрю"
                      />
                    </div>
                  ) : null}
                </div>

                {status === "err" ? <p className="zn-apply-err">{message}</p> : null}

                <div className="zn-apply-actions">
                  {step > 0 ? (
                    <button type="button" className="zn-apply-btn zn-apply-btn--ghost" onClick={() => setStep((n) => n - 1)}>
                      Назад
                    </button>
                  ) : withWorksLink ? (
                    <Link href="/works" className="zn-apply-btn zn-apply-btn--ghost">
                      Смотреть кейсы
                    </Link>
                  ) : (
                    <span />
                  )}
                  {step < 3 ? (
                    <button
                      type="button"
                      className="zn-apply-btn zn-apply-btn--solid"
                      disabled={!canNext}
                      onClick={() => setStep((n) => n + 1)}
                    >
                      Далее
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="zn-apply-btn zn-apply-btn--solid"
                      disabled={!canNext || status === "loading"}
                      onClick={() => void submit()}
                    >
                      {status === "loading" ? "Отправляем…" : "Отправить"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        </FadeIn>
      </div>
    </section>
  );
}
