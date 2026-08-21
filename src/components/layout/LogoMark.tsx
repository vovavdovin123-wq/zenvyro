"use client";

import { useId } from "react";

/**
 * Отметка Zenvyro. Дуга + ядро = «спокойный дизайн, мощная разработка»
 * (незамкнутый круг — Zen, плотное ядро — Vyro/скорость разработки).
 * Голубая точка следует за акцентом через --mark-dot (пишет applyAccent).
 *
 * Цвета дуги и фона тянутся из CSS-переменных, которые applyAccent()
 * (см. src/lib/accent.ts) пишет в document.documentElement.style при
 * смене акцента в ColorBends/плейграунде — поэтому лого перекрашивается
 * вживую вместе с сайтом, без перерендера и без повторного импорта файла.
 */
export function LogoMark({ size = 36 }: { size?: number }) {
  const gradId = `zenvyro-mark-grad-${useId().replace(/:/g, "")}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradId} x1="8" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: "var(--primary)" }} />
          <stop offset="1" style={{ stopColor: "var(--secondary)" }} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={`url(#${gradId})`} />
      <path
        d="M40 20.1 A16 16 0 1 1 17 28.5"
        stroke="var(--pro-fg)"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="32" cy="34" r="7" fill="var(--pro-fg)" />
      <circle cx="40" cy="20.1" r="4" fill="var(--mark-dot)" />
    </svg>
  );
}
