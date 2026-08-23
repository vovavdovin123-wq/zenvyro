"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Stepper, { Step } from "@/components/bits/Stepper";
import { pingApplyStart, pingApplySubmit } from "@/components/layout/Analytics";
import { FadeIn } from "@/components/ui/FadeIn";
import { AutoTextarea } from "@/components/ui/AutoTextarea";
import { HeroBackdrop } from "@/components/home/HeroBackdrop";
import { producerName } from "@/content/site";
import "@/styles/apply.css";

const kinds = [
  { id: "sites", label: "Сайт", hint: "Лендинг, витрина, корпоративная страница" },
  { id: "services", label: "Сервис", hint: "Кабинет, запись, заявки, личный контур" },
  { id: "bots", label: "Telegram", hint: "Бот, канал, сценарий общения" },
  { id: "support", label: "Сопровождение", hint: "Развитие уже живого продукта" },
];

const deadlines = ["2–4 недели", "1–2 месяца", "3 месяца", "дата уже есть"];

function budgetDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatBudget(value: string) {
  const digits = budgetDigits(value);
  if (!digits) return "";
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${grouped} ₽`;
}

function digitIndexAt(formatted: string, caret = 0) {
  let seen = 0;
  const end = Math.min(Math.max(caret, 0), formatted.length);
  for (let i = 0; i < end; i += 1) {
    if (/\d/.test(formatted[i] || "")) seen += 1;
  }
  return seen;
}

function caretAfterCount(formatted: string, count = 0) {
  if (count <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i += 1) {
    if (!/\d/.test(formatted[i] || "")) continue;
    seen += 1;
    if (seen >= count) return i + 1;
  }
  return formatted.length;
}

function applyBudgetEdit(value: string, start = 0, end = 0, insert: string, del: string) {
  let digits = budgetDigits(value);
  let from = digitIndexAt(value, start);
  let to = digitIndexAt(value, end);
  if (from > to) {
    const swap = from;
    from = to;
    to = swap;
  }
  if (del === "back" && from === to) {
    if (from <= 0) return { budget: digits ? formatBudget(digits) : "", caret: 0 };
    from -= 1;
  }
  if (del === "fwd" && from === to) to = from + 1;
  const incoming = budgetDigits(insert || "");
  digits = `${digits.slice(0, from)}${incoming}${digits.slice(to)}`;
  if (!digits) return { budget: "", caret: 0 };
  const budget = formatBudget(digits);
  return { budget, caret: caretAfterCount(budget, from + incoming.length) };
}

function phoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

function nationalPhoneDigits(value: string) {
  let digits = phoneDigits(value);
  if (!digits) return "";
  if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  return (digits.startsWith("7") ? digits.slice(1) : digits).slice(0, 10);
}

function formatNational(rest: string) {
  if (!rest) return "+7";
  let out = "+7";
  out += ` (${rest.slice(0, 3)}`;
  if (rest.length >= 3) out += ")";
  if (rest.length > 3) out += ` ${rest.slice(3, 6)}`;
  if (rest.length > 6) out += `-${rest.slice(6, 8)}`;
  if (rest.length > 8) out += `-${rest.slice(8, 10)}`;
  return out;
}

function formatPhone(value: string) {
  if (!phoneDigits(value)) return "";
  return formatNational(nationalPhoneDigits(value));
}

function skipCountryDigit(formatted: string, index = 0, seen = 0) {
  return Boolean(formatted.startsWith("+7") && index <= 1 && formatted[index] === "7" && seen === 0);
}

function nationalIndexAt(formatted: string, caret = 0) {
  let seen = 0;
  const end = Math.min(Math.max(caret, 0), formatted.length);
  for (let i = 0; i < end; i += 1) {
    const ch = formatted[i];
    if (!ch || !/\d/.test(ch)) continue;
    if (skipCountryDigit(formatted, i, seen)) continue;
    seen += 1;
  }
  return seen;
}

function caretAfterNational(formatted: string, count = 0) {
  if (count <= 0) {
    const prefix = formatted.indexOf("+7");
    return prefix >= 0 ? prefix + 2 : formatted.length;
  }
  let seen = 0;
  for (let i = 0; i < formatted.length; i += 1) {
    const ch = formatted[i];
    if (!ch || !/\d/.test(ch)) continue;
    if (skipCountryDigit(formatted, i, seen)) continue;
    seen += 1;
    if (seen >= count) return i + 1;
  }
  return formatted.length;
}

function applyPhoneEdit(value: string, start = 0, end = 0, insert: string, del: string) {
  let rest = nationalPhoneDigits(value);
  let from = nationalIndexAt(value, start);
  let to = nationalIndexAt(value, end);
  if (from > to) {
    const swap = from;
    from = to;
    to = swap;
  }
  if (del === "back" && from === to) {
    if (from <= 0) {
      if (!rest) return { phone: "", caret: 0 };
      const next = formatNational(rest);
      return { phone: next, caret: caretAfterNational(next, 0) };
    }
    from -= 1;
  }
  if (del === "fwd" && from === to) to = from + 1;
  let incoming = phoneDigits(insert || "");
  if (!rest && from === 0 && (incoming === "7" || incoming === "8")) {
    return { phone: "+7", caret: 2 };
  }
  if (incoming.startsWith("8")) incoming = `7${incoming.slice(1)}`;
  if (incoming.startsWith("7") && incoming.length >= 11) incoming = incoming.slice(1);
  incoming = incoming.slice(0, 10);
  rest = `${rest.slice(0, from)}${incoming}${rest.slice(to)}`.slice(0, 10);
  if (!rest) return { phone: "+7", caret: 2 };
  const phone = formatNational(rest);
  return { phone, caret: caretAfterNational(phone, from + incoming.length) };
}

function isMessengerOrEmail(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^[^\s@"<>]+@[^\s@"<>]+\.[^\s@"<>]+$/.test(trimmed) && !trimmed.startsWith("@")) return true;
  const username = trimmed
    .replace(/^@/, "")
    .replace(/^(https?:\/\/)?(t\.me|telegram\.me)\//i, "")
    .replace(/\/.*$/, "");
  return /^[a-zA-Z0-9_]{5,32}$/.test(username);
}

type Draft = {
  kind: string;
  goal: string;
  audience: string;
  now: string;
  references: string;
  firstVersion: string;
  budget: string;
  deadline: string;
  deadlineNote: string;
  name: string;
  contact: string;
  phone: string;
  company: string;
  consent: boolean;
};

const empty: Draft = {
  kind: "",
  goal: "",
  audience: "",
  now: "",
  references: "",
  firstVersion: "",
  budget: "",
  deadline: "",
  deadlineNote: "",
  name: "",
  contact: "",
  phone: "",
  company: "",
  consent: false,
};

function readBeforeInput(event: FormEvent<HTMLInputElement>) {
  const native = event.nativeEvent as InputEvent;
  const type = native.inputType ?? "";
  if (!type.startsWith("insert") && !type.startsWith("delete")) return null;
  event.preventDefault();
  const input = event.currentTarget;
  return {
    value: input.value,
    start: input.selectionStart ?? 0,
    end: input.selectionEnd ?? 0,
    insert: type.startsWith("insert") ? (native.data ?? "") : "",
    del: type.includes("Forward") ? "fwd" : "back",
  };
}

export function ApplyHero({
  withWorksLink = false,
  page = false,
}: {
  withWorksLink?: boolean;
  page?: boolean;
}) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(empty);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");
  const [formKey, setFormKey] = useState(0);
  const started = useRef(false);
  const phoneRef = useRef<HTMLInputElement>(null);
  const phoneCaret = useRef<number | null>(null);
  const phoneLock = useRef(false);
  const budgetRef = useRef<HTMLInputElement>(null);
  const budgetCaret = useRef<number | null>(null);
  const budgetLock = useRef(false);

  const patch = (next: Partial<Draft>) => {
    if (!started.current) {
      started.current = true;
      pingApplyStart();
    }
    setDraft((prev) => ({ ...prev, ...next }));
  };

  useLayoutEffect(() => {
    if (phoneCaret.current != null && phoneRef.current) {
      phoneRef.current.setSelectionRange(phoneCaret.current, phoneCaret.current);
      phoneCaret.current = null;
    }
    if (budgetCaret.current != null && budgetRef.current) {
      budgetRef.current.setSelectionRange(budgetCaret.current, budgetCaret.current);
      budgetCaret.current = null;
    }
  }, [draft.phone, draft.budget]);

  const commitPhone = (result: { phone: string; caret: number }) => {
    if (phoneLock.current) return;
    phoneLock.current = true;
    phoneCaret.current = result.caret;
    patch({ phone: result.phone });
    queueMicrotask(() => {
      phoneLock.current = false;
    });
  };

  const commitBudget = (result: { budget: string; caret: number }) => {
    if (budgetLock.current) return;
    budgetLock.current = true;
    budgetCaret.current = result.caret;
    patch({ budget: result.budget });
    queueMicrotask(() => {
      budgetLock.current = false;
    });
  };

  const canProceed = useMemo(() => {
    if (step === 1) return Boolean(draft.kind);
    if (step === 2) return draft.goal.trim().length >= 24;
    if (step === 3) return draft.audience.trim().length >= 12;
    if (step === 4) return draft.now.trim().length >= 8 && draft.references.trim().length >= 8;
    if (step === 5) return draft.firstVersion.trim().length >= 12;
    if (step === 6) {
      const deadlineOk =
        draft.deadline.trim().length > 0 &&
        (draft.deadline !== "дата уже есть" || draft.deadlineNote.trim().length >= 3);
      return deadlineOk && Number(budgetDigits(draft.budget)) >= 5000;
    }
    if (step === 7) {
      return (
        draft.name.trim().length >= 2 &&
        isMessengerOrEmail(draft.contact) &&
        phoneDigits(draft.phone).length === 11 &&
        draft.consent
      );
    }
    return false;
  }, [draft, step]);

  async function submit() {
    if (status === "loading") return;
    setStatus("loading");
    const kindLabel = kinds.find((item) => item.id === draft.kind)?.label ?? "";
    const deadline =
      draft.deadline === "дата уже есть"
        ? draft.deadlineNote.trim()
        : [draft.deadline, draft.deadlineNote.trim()].filter(Boolean).join(" · ");
    const leadText = [
      `Тип: ${kindLabel}`,
      `Цель: ${draft.goal.trim()}`,
      `Для кого: ${draft.audience.trim()}`,
      `Сейчас: ${draft.now.trim()}`,
      `Ориентиры: ${draft.references.trim()}`,
      `Первая версия: ${draft.firstVersion.trim()}`,
      draft.company.trim() ? `Компания: ${draft.company.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name,
        contact: draft.contact,
        phone: draft.phone,
        leadText,
        budget: formatBudget(draft.budget) || draft.budget.trim(),
        deadline,
        consent: draft.consent,
      }),
    });
    const json = (await response.json()) as { id?: string; error?: string };
    if (!response.ok) {
      setStatus("err");
      setMessage(json.error ?? "Не отправилось. Проверьте поля и попробуйте ещё раз.");
      return;
    }
    pingApplySubmit();
    setStatus("ok");
    setMessage(
      `Заявку ${json.id} получили. ${producerName} напишет в Telegram, на почту или по телефону — как указали в брифе.`,
    );
  }

  return (
    <section className={`zn-apply${page ? " zn-apply--page" : ""}`}>
      <div className="zn-apply-shell">
        <FadeIn y={page ? 0 : 28}>
          <div className="zn-apply-card">
            <div className="zn-apply-fx">
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
            </div>
            <div className="zn-apply-inner">
              <h2 className="zn-apply-title">Расскажите о задаче.</h2>
              <p className="zn-apply-sub">
                Чем точнее бриф, тем быстрее {producerName} поймёт, наш ли это формат. Срок и бюджет
                нужны сразу.
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
                  {status === "err" ? <p className="zn-apply-err">{message}</p> : null}
                  <Stepper
                    key={formKey}
                    initialStep={1}
                    onStepChange={setStep}
                    onFinalStepCompleted={() => void submit()}
                    backButtonText="Назад"
                    nextButtonText="Далее"
                    completeButtonText={status === "loading" ? "Отправляем…" : "Отправить"}
                    disableStepIndicators
                    nextButtonProps={{ disabled: !canProceed || status === "loading" }}
                    stepCircleContainerClassName="zn-apply-stepper"
                  >
                    <Step>
                      <p className="zn-apply-label">Что нужно сделать?</p>
                      <div className="zn-apply-kinds">
                        {kinds.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={draft.kind === item.id ? "is-on" : ""}
                            onClick={() => patch({ kind: item.id })}
                          >
                            <strong>{item.label}</strong>
                            <span>{item.hint}</span>
                          </button>
                        ))}
                      </div>
                    </Step>

                    <Step>
                      <p className="zn-apply-label">Какая цель?</p>
                      <p className="zn-apply-hint">
                        Пример: «Собрать заявки на курс в Telegram, чтобы менеджер не ловил их в директ».
                      </p>
                      <AutoTextarea
                        value={draft.goal}
                        onChange={(event) => patch({ goal: event.target.value })}
                        placeholder="Что должно произойти после запуска."
                      />
                    </Step>

                    <Step>
                      <p className="zn-apply-label">Для кого это?</p>
                      <p className="zn-apply-hint">Пример: «Владельцы небольших клиник, сами принимают решение о сайте».</p>
                      <AutoTextarea
                        value={draft.audience}
                        onChange={(event) => patch({ audience: event.target.value })}
                        placeholder="Кто пользуется, кто платит, какой рынок."
                      />
                    </Step>

                    <Step>
                      <p className="zn-apply-label">Что есть сейчас</p>
                      <p className="zn-apply-hint">Пример: «Есть Tilda и Figma, бота нет». Оба поля обязательны.</p>
                      <div className="zn-apply-fields">
                        <AutoTextarea
                          value={draft.now}
                          onChange={(event) => patch({ now: event.target.value })}
                          placeholder="Сайт, бот, ничего, конструктор, макеты."
                        />
                        <AutoTextarea
                          value={draft.references}
                          onChange={(event) => patch({ references: event.target.value })}
                          placeholder="Ссылки на 1–2 ориентира или «ориентиров нет»."
                        />
                      </div>
                    </Step>

                    <Step>
                      <p className="zn-apply-label">Что должно быть в первой версии?</p>
                      <p className="zn-apply-hint">
                        Пример: «Главная, заявка, админка. Личный кабинет — позже».
                      </p>
                      <AutoTextarea
                        value={draft.firstVersion}
                        onChange={(event) => patch({ firstVersion: event.target.value })}
                        placeholder="Какой минимум запускаем первым."
                      />
                    </Step>

                    <Step>
                      <p className="zn-apply-label">Срок и бюджет</p>
                      <p className="zn-apply-hint">Бюджет напишите цифрами — сами поставим точки и знак рублей. Например 15000 → 15.000 ₽.</p>
                      <div className="zn-apply-chips">
                        {deadlines.map((item) => (
                          <button
                            key={item}
                            type="button"
                            className={draft.deadline === item ? "is-on" : ""}
                            onClick={() => patch({ deadline: item })}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                      <div className="zn-apply-fields" style={{ marginTop: 10 }}>
                        <input
                          value={draft.deadlineNote}
                          onChange={(event) => patch({ deadlineNote: event.target.value })}
                          placeholder={
                            draft.deadline === "дата уже есть"
                              ? "Дата. Например, к 12 сентября"
                              : "Уточнение по сроку, если есть"
                          }
                        />
                        <input
                          ref={budgetRef}
                          value={draft.budget}
                          onBeforeInput={(event) => {
                            const edit = readBeforeInput(event);
                            if (!edit) return;
                            commitBudget(applyBudgetEdit(edit.value, edit.start, edit.end, edit.insert, edit.del));
                          }}
                          onPaste={(event) => {
                            event.preventDefault();
                            const input = event.currentTarget;
                            commitBudget(
                              applyBudgetEdit(
                                input.value,
                                input.selectionStart ?? 0,
                                input.selectionEnd ?? 0,
                                event.clipboardData.getData("text"),
                                "",
                              ),
                            );
                          }}
                          onKeyDown={(event) => {
                            if (event.key !== "Backspace" && event.key !== "Delete") return;
                            if (event.nativeEvent.isComposing) return;
                            event.preventDefault();
                            const input = event.currentTarget;
                            commitBudget(
                              applyBudgetEdit(
                                input.value,
                                input.selectionStart ?? 0,
                                input.selectionEnd ?? 0,
                                "",
                                event.key === "Delete" ? "fwd" : "back",
                              ),
                            );
                          }}
                          onChange={(event) => {
                            if (budgetLock.current) return;
                            const next = formatBudget(event.target.value);
                            if (next !== draft.budget) patch({ budget: next });
                          }}
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="Бюджет. Например: 15.000 ₽"
                        />
                      </div>
                    </Step>

                    <Step>
                      <p className="zn-apply-label">Как с вами связаться</p>
                      <p className="zn-apply-hint">
                        Telegram или почта — куда писать. Телефон нужен всегда.
                      </p>
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
                        <input
                          ref={phoneRef}
                          value={draft.phone}
                          onBeforeInput={(event) => {
                            const edit = readBeforeInput(event);
                            if (!edit) return;
                            commitPhone(applyPhoneEdit(edit.value, edit.start, edit.end, edit.insert, edit.del));
                          }}
                          onPaste={(event) => {
                            event.preventDefault();
                            const input = event.currentTarget;
                            commitPhone(
                              applyPhoneEdit(
                                input.value,
                                input.selectionStart ?? 0,
                                input.selectionEnd ?? 0,
                                event.clipboardData.getData("text"),
                                "",
                              ),
                            );
                          }}
                          onKeyDown={(event) => {
                            if (event.key !== "Backspace" && event.key !== "Delete") return;
                            if (event.nativeEvent.isComposing) return;
                            event.preventDefault();
                            const input = event.currentTarget;
                            commitPhone(
                              applyPhoneEdit(
                                input.value,
                                input.selectionStart ?? 0,
                                input.selectionEnd ?? 0,
                                "",
                                event.key === "Delete" ? "fwd" : "back",
                              ),
                            );
                          }}
                          onChange={(event) => {
                            if (phoneLock.current) return;
                            const next = formatPhone(event.target.value);
                            if (next !== draft.phone) patch({ phone: next });
                          }}
                          placeholder="Телефон. Например: +7 (999) 123-45-67"
                          inputMode="tel"
                          autoComplete="tel"
                        />
                        <input
                          value={draft.company}
                          onChange={(event) => patch({ company: event.target.value })}
                          placeholder="Компания или проект, если есть"
                          autoComplete="organization"
                        />
                      </div>
                      <div className="zn-apply-consent">
                        <button
                          type="button"
                          className={draft.consent ? "is-on" : ""}
                          aria-pressed={draft.consent}
                          aria-label="Согласен на обработку персональных данных"
                          onClick={() => patch({ consent: !draft.consent })}
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                            <path
                              d="M3.2 8.2 6.4 11.4 12.8 4.6"
                              pathLength="18"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <div className="zn-apply-consent-copy">
                          <button type="button" className="zn-apply-consent-text" onClick={() => patch({ consent: !draft.consent })}>
                            Согласен на обработку ПДн
                          </button>
                          <Link href="/legal/consent">Согласие и политика</Link>
                        </div>
                      </div>
                    </Step>
                  </Stepper>
                  {withWorksLink && step === 1 ? (
                    <Link href="/works" className="zn-apply-works">
                      Смотреть кейсы
                    </Link>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
