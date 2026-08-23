"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { type HumanAction, type Order, type StatsDay } from "@/studio/types";
import { emptyManual, type Funnel, type Manual, type Period, type Summary } from "@/studio/helpers";

type StudioValue = {
  orders: Order[];
  stats: StatsDay[];
  summary: Summary | null;
  funnel: Funnel | null;
  needAuth: boolean;
  error: string;
  password: string;
  setPassword: (value: string) => void;
  loggingIn: boolean;
  login: (event: FormEvent) => Promise<void>;
  period: Period;
  setPeriod: (value: Period) => void;
  load: (days?: Period) => Promise<void>;
  run: (id: string, action: HumanAction) => Promise<void>;
  manual: Manual;
  setManual: (value: Manual | ((prev: Manual) => Manual)) => void;
  saving: boolean;
  addOrder: (event: FormEvent) => Promise<void>;
};

const StudioContext = createContext<StudioValue | null>(null);

async function studioFetch(path: string, init?: RequestInit) {
  return fetch(path, {
    credentials: "same-origin",
    ...init,
  });
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<StatsDay[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [password, setPassword] = useState("");
  const [needAuth, setNeedAuth] = useState(false);
  const [error, setError] = useState("");
  const [manual, setManual] = useState<Manual>(emptyManual);
  const [saving, setSaving] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [period, setPeriod] = useState<Period>(14);

  const load = useCallback(async (days: Period = period) => {
    const response = await studioFetch(`/api/studio?days=${days}`);
    if (!response.ok) {
      setError("Не удалось загрузить студию");
      return;
    }
    const json = (await response.json()) as {
      needAuth?: boolean;
      orders?: Order[];
      stats?: StatsDay[];
      summary?: Summary;
      funnel?: Funnel;
    };
    if (json.needAuth) {
      setNeedAuth(true);
      return;
    }
    setNeedAuth(false);
    setOrders(json.orders ?? []);
    setStats(json.stats ?? []);
    setSummary(json.summary ?? null);
    setFunnel(json.funnel ?? null);
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  const login = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoggingIn(true);
    const response = await studioFetch("/api/studio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoggingIn(false);
    if (!response.ok) {
      setError("Неверный пароль");
      return;
    }
    await load();
  }, [load, password]);

  const run = useCallback(async (id: string, action: HumanAction) => {
    setError("");
    const notes =
      action === "revise_spec" || action === "reject_stage" ? (window.prompt("Комментарий") ?? "") : undefined;
    const demoUrl = action === "open_demo" ? (window.prompt("URL демо") ?? "") : undefined;
    const response = await studioFetch("/api/studio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, notes, demoUrl }),
    });
    if (!response.ok) {
      setError("Не получилось выполнить действие");
      return;
    }
    await load();
  }, [load]);

  const addOrder = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await studioFetch("/api/studio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        create: true,
        source: "hunt",
        platform: manual.platform,
        name: manual.name,
        leadText: manual.leadText,
        telegram: manual.telegram,
        email: manual.email,
        phone: manual.phone,
        priceRub: manual.priceRub ? Number(manual.priceRub.replace(/\D/g, "")) : undefined,
        timelineDays: manual.timelineDays ? Number(manual.timelineDays) : undefined,
      }),
    });
    setSaving(false);
    if (!response.ok) {
      setError("Не удалось добавить заказ с площадки");
      return;
    }
    setManual(emptyManual);
    await load();
  }, [load, manual]);

  const value = useMemo<StudioValue>(
    () => ({
      orders,
      stats,
      summary,
      funnel,
      needAuth,
      error,
      password,
      setPassword,
      loggingIn,
      login,
      period,
      setPeriod,
      load,
      run,
      manual,
      setManual,
      saving,
      addOrder,
    }),
    [orders, stats, summary, funnel, needAuth, error, password, loggingIn, login, period, load, run, manual, saving, addOrder],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used within StudioProvider");
  return ctx;
}
