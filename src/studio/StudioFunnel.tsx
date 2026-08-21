"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { PERIODS, pct } from "@/studio/helpers";
import { ComboChart, DualRing } from "@/studio/charts";
import { press } from "@/studio/StudioMotion";
import { useStudio } from "@/studio/useStudio";

export function StudioFunnel() {
  const { stats, funnel, period, setPeriod } = useStudio();
  const conversion = useMemo(() => {
    if (!funnel) return { start: 0, submit: 0, overall: 0 };
    return {
      start: pct(funnel.applyStarts, funnel.sessions),
      submit: pct(funnel.applySubmits, funnel.applyStarts),
      overall: pct(funnel.applySubmits, funnel.sessions),
    };
  }, [funnel]);

  return (
    <div className="zn-dash-page">
      <header className="zn-dash-head">
        <div>
          <p className="zn-dash-kicker">Студия</p>
          <h1 className="zn-studio-title">Воронка</h1>
        </div>
        <div className="zn-dash-period" role="group" aria-label="Период статистики">
          {PERIODS.map((days) => (
            <motion.button
              key={days}
              type="button"
              className={period === days ? "is-active" : ""}
              onClick={() => setPeriod(days)}
              {...press}
            >
              {days} дней
            </motion.button>
          ))}
        </div>
      </header>

      <div className="zn-dash-top">
        <section className="zn-glass zn-dash-card zn-dash-chart-card" aria-labelledby="zn-chart-title">
          <h2 id="zn-chart-title">Посетители и заявки</h2>
          <ComboChart data={stats} />
          <div className="zn-dash-legend">
            <span>
              <span className="zn-dash-swatch" style={{ background: "var(--primary)" }} />
              Посетители
            </span>
            <span>
              <span className="zn-dash-swatch" style={{ background: "var(--accent-cyan)" }} />
              Начали заявку
            </span>
            <span>
              <span className="zn-dash-swatch" style={{ background: "var(--secondary)" }} />
              Отправили бриф
            </span>
          </div>
        </section>

        <section className="zn-glass zn-dash-card zn-dash-donut-wrap" aria-labelledby="zn-conv-title">
          <h2 id="zn-conv-title">Конверсия</h2>
          <DualRing
            outer={conversion.start}
            inner={conversion.submit}
            center={`${conversion.overall}%`}
            caption="бриф / визит"
          />
          <ul className="zn-dash-keys">
            <li>
              <span>Старт / посетители</span>
              <strong>{conversion.start}%</strong>
            </li>
            <li>
              <span>Бриф / старт</span>
              <strong>{conversion.submit}%</strong>
            </li>
            <li>
              <span>Посетители</span>
              <strong>{funnel?.sessions ?? 0}</strong>
            </li>
            <li>
              <span>Начали заявку</span>
              <strong>{funnel?.applyStarts ?? 0}</strong>
            </li>
            <li>
              <span>Отправили бриф</span>
              <strong>{funnel?.applySubmits ?? 0}</strong>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
