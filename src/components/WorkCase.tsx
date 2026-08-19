"use client";

import Link from "next/link";
import { CardDots } from "@/components/CardDots";
import { CountUp } from "@/components/bits/CountUp";
import { TopoStage } from "@/components/TopoStage";
import { categoryLabel, type Work } from "@/lib/works";
import "./works.css";

export function WorkCase({ work, next }: { work: Work; next: Work }) {
  return (
    <article className="zn-case">
      <div className="zn-inner zn-case-shell">
        <TopoStage>
          <header data-topo-window className="zn-has-dots zn-case-hero">
            <CardDots />
            <div className="zn-case-hero-inner">
              <Link href="/works" className="zn-case-back">
                Все кейсы
              </Link>
              <p className="zn-case-kicker">
                {categoryLabel[work.category]} · {work.year}
              </p>
              <h1 className="zn-case-title">{work.title}.</h1>
              <p className="zn-case-lead">{work.summary}</p>
              <p className="zn-case-meta">
                {work.client} · {work.role} · {work.stack.join(" · ")}
              </p>
            </div>
          </header>

          <section className="zn-case-story">
            <div className="zn-case-story-main">
              <div className="zn-case-block">
                <p className="zn-case-kicker">01 · Задача</p>
                <h2 className="zn-case-h">Исходное состояние</h2>
                <p className="zn-case-text">{work.problem}</p>
              </div>
              <div className="zn-case-block">
                <p className="zn-case-kicker">02 · Решение</p>
                <h2 className="zn-case-h">Что сделали</h2>
                <p className="zn-case-text">{work.solution}</p>
              </div>
            </div>
            <aside className="zn-case-metrics" aria-label="Результат">
              <p className="zn-case-kicker">Результат</p>
              {work.results.map((item) => (
                <div key={item.label} className="zn-case-metric">
                  <p className="zn-case-metric-value">
                    <CountUp value={item.value} suffix={item.suffix ?? ""} />
                  </p>
                  <p className="zn-case-metric-label">{item.label}</p>
                </div>
              ))}
            </aside>
          </section>

          <div data-topo-window className="zn-has-dots zn-case-screen">
            <CardDots />
            <div className="zn-case-screen-inner">
              <p className="zn-case-kicker">Что внутри</p>
              <ul className="zn-case-frames">
                {work.frames.map((label, index) => (
                  <li key={label}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div data-topo-window className="zn-has-dots zn-case-next">
            <CardDots />
            <div className="zn-case-next-copy">
              <p className="zn-case-kicker">Следующий кейс</p>
              <Link href={`/works/${next.slug}`} className="zn-case-next-title">
                {next.title}.
              </Link>
            </div>
            <Link href="/contact" className="zn-nav-pro zn-case-cta">
              Обсудить проект
            </Link>
          </div>
        </TopoStage>
      </div>
    </article>
  );
}
