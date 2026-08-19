import Link from "next/link";
import { FadeIn } from "@/components/bits/FadeIn";
import { CountUp } from "@/components/bits/CountUp";
import { ApplyHero } from "@/components/ApplyHero";
import { HomeWorks } from "@/components/HomeWorks";
import { processSteps, services, team } from "@/lib/site";
import "./landing.css";

const pills = [
  "композиция",
  "типографика",
  "интерфейс",
  "логика",
  "запись",
  "кабинет",
  "telegram",
  "запуск",
  "сопровождение",
] as const;

export function HomeBelowHero() {
  const row = [...pills, ...pills];

  return (
    <div className="zn-below">
      <HomeWorks />

      <section className="zn-sec zn-sec--alt">
        <div className="zn-inner">
          <FadeIn>
            <p className="zn-kicker">Студия</p>
            <h2 className="zn-title">Что делаем</h2>
            <p className="zn-lead">Четыре формата. Четыре человека. Один заказ от начала до сдачи.</p>
          </FadeIn>
          <div className="zn-bento">
            <FadeIn className="zn-span-7">
            <article className="zn-glass zn-bento-card">
              <div className="zn-bento-visual">
                <div className="zn-marquee">
                  <div className="zn-marquee-track">
                    <div className="zn-marquee-row">
                      {row.map((item, i) => (
                        <span key={`a-${i}`} className="zn-pill">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="zn-marquee-track">
                    <div className="zn-marquee-row rev">
                      {row.map((item, i) => (
                        <span key={`b-${i}`} className="zn-pill">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="zn-bento-body">
                <h3>Одна команда</h3>
                <p>Продюсер, дизайнер, разработчик и тестировщик. Те же люди от брифа до сдачи.</p>
              </div>
            </article>
            </FadeIn>

            <FadeIn className="zn-span-5" delay={0.06}>
            <article className="zn-glass zn-bento-card">
              <div className="zn-bento-visual">
                <div className="zn-stat">
                  <p className="zn-stat-num">
                    <CountUp value={7} />
                  </p>
                  <p className="zn-stat-label">шагов в заказе</p>
                </div>
              </div>
              <div className="zn-bento-body">
                <h3>Сначала ясность</h3>
                <p>Смета после брифа. Разработка — после предоплаты и утверждённого состава.</p>
              </div>
            </article>
            </FadeIn>

            {services.map((service, index) => (
              <FadeIn
                key={service.title}
                className={index % 2 === 0 ? "zn-span-5" : "zn-span-7"}
                delay={0.08 + index * 0.05}
              >
              <article className="zn-glass zn-bento-card">
                <div className="zn-bento-body" style={{ borderTop: "none", paddingTop: 22 }}>
                  <p className="zn-kicker" style={{ marginBottom: 10 }}>
                    {service.kicker}
                  </p>
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                </div>
              </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="zn-sec">
        <div className="zn-inner">
          <FadeIn>
            <div className="zn-head">
              <div>
                <p className="zn-kicker">Люди</p>
                <h2 className="zn-title">Команда</h2>
                <p className="zn-lead">Четыре человека. Знакомьтесь.</p>
              </div>
              <Link href="/team" className="zn-more">
                Все люди
              </Link>
            </div>
          </FadeIn>
          <div className="zn-team-grid">
            {team.map((person, index) => (
              <FadeIn key={person.name} delay={index * 0.06}>
              <article className="zn-glass zn-person">
                <div className="zn-avatar">{person.name.slice(0, 1)}</div>
                <h3>{person.name}</h3>
                <p className="role">{person.role}</p>
                <p className="note">{person.note}</p>
              </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="zn-sec zn-sec--alt">
        <div className="zn-inner zn-qs">
          <FadeIn>
            <p className="zn-kicker">Процесс</p>
            <h2 className="zn-title">Как устроен заказ</h2>
            <p className="zn-lead">Семь шагов. Новый запрос — отдельный этап, текущий не раздуваем.</p>
            <Link href="/process" className="zn-more" style={{ display: "inline-flex", marginTop: 28 }}>
              Весь процесс
            </Link>
          </FadeIn>
          <FadeIn delay={0.08}>
          <div className="zn-glass zn-board">
            <div className="zn-board-bar">
              <span>заказ</span>
              <span>7 шагов</span>
            </div>
            <ol>
              {processSteps.map((step) => (
                <li key={step.n}>
                  <span className="n">{step.n}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          </FadeIn>
        </div>
      </section>

      <ApplyHero withWorksLink />
    </div>
  );
}
