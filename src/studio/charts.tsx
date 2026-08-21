"use client";

import { type ReactNode } from "react";
import { type StatsDay } from "@/studio/types";
import { shortDate } from "@/studio/helpers";

export function ComboChart({ data }: { data: StatsDay[] }) {
  const width = 640;
  const height = 248;
  const pad = { l: 6, r: 6, t: 16, b: 28 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const n = Math.max(1, data.length);
  const max = Math.max(1, ...data.flatMap((day) => [day.sessions, day.applyStarts, day.applySubmits]));
  const slot = innerW / n;
  const barW = Math.min(22, Math.max(5, slot * 0.46));
  const x = (index: number) => pad.l + slot * index + slot / 2;
  const y = (value: number) => pad.t + innerH - (value / max) * innerH;
  const line = (key: "applyStarts" | "applySubmits") =>
    data.map((day, index) => `${x(index)},${y(day[key])}`).join(" ");
  const tick = data.length > 16 ? 4 : data.length > 8 ? 2 : 1;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="zn-dash-combo" role="img" aria-label="Посетители, старты заявки и отправки по дням">
      <defs>
        <linearGradient id="znBar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--pro-dark)" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((step) => (
        <line
          key={step}
          className="zn-dash-gridline"
          x1={pad.l}
          x2={width - pad.r}
          y1={pad.t + innerH * (1 - step)}
          y2={pad.t + innerH * (1 - step)}
        />
      ))}
      {data.map((day, index) => {
        const barH = day.sessions ? Math.max(4, (day.sessions / max) * innerH) : 0;
        return (
          <rect
            key={day.date}
            x={x(index) - barW / 2}
            y={y(day.sessions)}
            width={barW}
            height={barH}
            rx={Math.min(7, barW / 2)}
            fill="url(#znBar)"
          >
            <title>
              {shortDate(day.date)}: {day.sessions} посетителей, {day.applyStarts} стартов, {day.applySubmits} отправок
            </title>
          </rect>
        );
      })}
      <polyline points={line("applyStarts")} fill="none" stroke="var(--accent-cyan)" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={line("applySubmits")} fill="none" stroke="var(--secondary)" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((day, index) => (
        <g key={`pts-${day.date}`}>
          <circle cx={x(index)} cy={y(day.applyStarts)} r="3.2" fill="var(--accent-cyan)" />
          <circle cx={x(index)} cy={y(day.applySubmits)} r="3.2" fill="var(--secondary)" />
        </g>
      ))}
      {data.map((day, index) =>
        index % tick === 0 || index === data.length - 1 ? (
          <text key={`t-${day.date}`} className="zn-dash-axis" x={x(index)} y={height - 6} textAnchor="middle">
            {shortDate(day.date)}
          </text>
        ) : null,
      )}
    </svg>
  );
}

export function Donut({
  slices,
  size = 168,
  thickness = 16,
  children,
  track = "rgba(255, 255, 255, 0.1)",
}: {
  slices: Array<{ value: number; color: string; label: string }>;
  size?: number;
  thickness?: number;
  children?: ReactNode;
  track?: string;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  let offset = 0;

  return (
    <div className="zn-dash-donut" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={track} strokeWidth={thickness} />
        <g transform={`rotate(-90 ${cx} ${cx})`}>
          {total
            ? slices
                .filter((slice) => slice.value > 0)
                .map((slice) => {
                  const len = (slice.value / total) * c;
                  const node = (
                    <circle
                      key={slice.label}
                      cx={cx}
                      cy={cx}
                      r={r}
                      fill="none"
                      stroke={slice.color}
                      strokeWidth={thickness}
                      strokeDasharray={`${len} ${c - len}`}
                      strokeDashoffset={-offset}
                      strokeLinecap="butt"
                    >
                      <title>
                        {slice.label}: {slice.value}
                      </title>
                    </circle>
                  );
                  offset += len;
                  return node;
                })
            : null}
        </g>
      </svg>
      <div className="zn-dash-donut-center">{children}</div>
    </div>
  );
}

export function DualRing({
  outer,
  inner,
  center,
  caption,
}: {
  outer: number;
  inner: number;
  center: string;
  caption: string;
}) {
  const size = 168;
  const cx = size / 2;
  const outerR = 66;
  const innerR = 46;
  const outerC = 2 * Math.PI * outerR;
  const innerC = 2 * Math.PI * innerR;
  const o = Math.min(100, Math.max(0, outer)) / 100;
  const i = Math.min(100, Math.max(0, inner)) / 100;

  return (
    <div className="zn-dash-donut">
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={cx} cy={cx} r={outerR} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="14" />
        <circle cx={cx} cy={cx} r={innerR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
        <g transform={`rotate(-90 ${cx} ${cx})`}>
          <circle
            cx={cx}
            cy={cx}
            r={outerR}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${outerC * o} ${outerC}`}
          />
          <circle
            cx={cx}
            cy={cx}
            r={innerR}
            fill="none"
            stroke="var(--secondary)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${innerC * i} ${innerC}`}
          />
        </g>
      </svg>
      <div className="zn-dash-donut-center">
        <strong>{center}</strong>
        <span>{caption}</span>
      </div>
    </div>
  );
}
