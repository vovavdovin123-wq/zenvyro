"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeroBackdrop } from "@/components/home/HeroBackdrop";
import { usePlayground } from "@/components/layout/AccentProvider";
import { hexToHsv, hsvToHex } from "@/lib/accent";
import { useStudio } from "@/studio/useStudio";

function Icon({ name }: { name: "grid" | "trend" | "list" | "plus" }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    "aria-hidden": true as const,
  };
  if (name === "grid") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="7" height="7" rx="1.6" />
        <rect x="13" y="4" width="7" height="7" rx="1.6" />
        <rect x="4" y="13" width="7" height="7" rx="1.6" />
        <rect x="13" y="13" width="7" height="7" rx="1.6" />
      </svg>
    );
  }
  if (name === "trend") {
    return (
      <svg {...common}>
        <path d="M4 16.5 9.2 11l3.6 3.4L20 7.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 7.5v4.2M20 7.5h-4.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "list") {
    return (
      <svg {...common}>
        <path d="M8 7h12M8 12h12M8 17h12" strokeLinecap="round" />
        <circle cx="4.5" cy="7" r="1" fill="currentColor" stroke="none" />
        <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="4.5" cy="17" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

const NAV = [
  { href: "/studio", label: "Обзор", icon: "grid" as const, match: "exact" as const },
  { href: "/studio/funnel", label: "Воронка", icon: "trend" as const, match: "prefix" as const },
  { href: "/studio/orders", label: "Заказы", icon: "list" as const, match: "prefix" as const },
  { href: "/studio/freelance", label: "Фриланс", icon: "plus" as const, match: "prefix" as const },
];

function StudioTint() {
  const { snap, commit } = usePlayground();
  const color = String(snap.values.color ?? "#A855F7");
  const hsv = hexToHsv(color);

  return (
    <label className="zn-dash-tint">
      <span>Цвет сайта</span>
      <input
        type="range"
        min={0}
        max={360}
        value={Math.round(hsv.h)}
        aria-label="Оттенок как на главной"
        onChange={(event) => {
          const next = hsvToHex(Number(event.target.value), hsv.s || 0.62, hsv.v || 0.97);
          commit({ values: { ...snap.values, color: next }, preset: null });
        }}
      />
    </label>
  );
}

function StudioLogin() {
  const { password, setPassword, login, loggingIn, error } = useStudio();
  return (
    <div className="zn-dash-login">
      <p className="zn-dash-kicker">Zenvyro studio</p>
      <h1 className="zn-studio-title">Вход</h1>
      <p className="zn-studio-sub">Воронка заявок, заказы с сайта и фриланса.</p>
      <form onSubmit={login} className="zn-glass zn-studio-card zn-studio-login">
        <p className="zn-dash-label">Пароль студии</p>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="zn-studio-input"
          autoComplete="current-password"
        />
        {error ? <p className="zn-dash-error">{error}</p> : null}
        <button type="submit" disabled={loggingIn} className="zn-studio-btn zn-studio-btn--primary">
          {loggingIn ? "Входим…" : "Войти"}
        </button>
      </form>
    </div>
  );
}

function StudioNav() {
  const pathname = usePathname();
  const { summary, funnel } = useStudio();
  const counts: Record<string, string | undefined> = {
    "/studio/funnel": String(funnel?.sessions ?? 0),
    "/studio/orders": String(summary?.total ?? 0),
  };

  return (
    <aside className="zn-dash-rail" aria-label="Разделы студии">
      <Link href="/studio" className="zn-dash-brand">
        <span className="zn-dash-mark">Z</span>
        <span>
          <strong>Zenvyro</strong>
          <em>Studio</em>
        </span>
      </Link>
      <p className="zn-dash-rail-label">Меню</p>
      <nav className="zn-dash-nav">
        {NAV.map((item) => {
          const active = item.match === "exact" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`zn-dash-nav-btn${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="zn-dash-nav-ico">
                <Icon name={item.icon} />
              </span>
              <span className="zn-dash-nav-label">{item.label}</span>
              {counts[item.href] ? <span className="zn-dash-nav-count">{counts[item.href]}</span> : null}
            </Link>
          );
        })}
      </nav>
      <StudioTint />
      {summary ? (
        <div className="zn-dash-rail-foot">
          <span>В работе</span>
          <strong>{summary.inWork}</strong>
        </div>
      ) : null}
    </aside>
  );
}

export function StudioFrame({ children }: { children: ReactNode }) {
  const { needAuth, error } = useStudio();

  return (
    <div className="zn-studio">
      <div className="zn-studio-fx">
        <HeroBackdrop showFade={false} />
      </div>
      <div className="zn-studio-inner">
        {needAuth ? (
          <StudioLogin />
        ) : (
          <div className="zn-dash">
            <StudioNav />
            <div className="zn-dash-body">
              {error ? <p className="zn-dash-error">{error}</p> : null}
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
