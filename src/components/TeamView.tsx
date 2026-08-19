"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { CardDots } from "@/components/CardDots";
import { FieldHero } from "@/components/FieldHero";
import { FieldStage } from "@/components/FieldStage";
import { StoryRow } from "@/components/StoryRow";
import { SiteFerrofluid } from "@/components/bits/SiteFerrofluid";
import { accentHeadlineStyles, useAccentColor } from "@/lib/accent";
import { team } from "@/lib/site";
import "./landing.css";

export function TeamView() {
  const accent = useAccentColor();
  const { accentFg, accentText, accentGlow } = useMemo(() => accentHeadlineStyles(accent), [accent]);
  const [worldSize, setWorldSize] = useState(640);

  return (
    <div>
      <FieldHero effect={<SiteFerrofluid />}>
        <div className="ln-hero-left">
          <p className="ln-hero-tag ln-hero-tag-static">
            <span className="ln-hero-tag-new" style={{ background: accent, color: accentFg }}>
              4
            </span>
            люди студии
          </p>
          <h1 className="ln-hero-headline">
            <span className="ln-hero-headline-line">Четыре человека.</span>
            <span className="ln-hero-headline-line" style={{ color: accentText, textShadow: accentGlow }}>
              Один заказ.
            </span>
          </h1>
          <p className="ln-hero-description">
            Владимир ведёт, Юра рисует, Александр собирает, Алан проверяет. Состав не меняется по дороге.
          </p>
          <div className="ln-hero-buttons">
            <Link
              href="/contact"
              className="ln-hero-btn ln-hero-btn-primary"
              style={{ background: accent, borderColor: accent, color: accentFg }}
            >
              Написать
            </Link>
            <Link href="/process" className="ln-hero-btn ln-hero-btn-secondary">
              Как устроен заказ
            </Link>
          </div>
          <ul className="ln-hero-proof">
            {team.map((person, index) => (
              <Fragment key={person.name}>
                {index > 0 ? <li aria-hidden className="ln-hero-proof-sep" /> : null}
                <li>{person.name}</li>
              </Fragment>
            ))}
          </ul>
        </div>
      </FieldHero>

      <div className="zn-below">
        <section className="zn-sec">
          <div className="zn-inner">
            <FieldStage onWorldSize={setWorldSize} layer={<SiteFerrofluid worldSize={worldSize} />}>
              <header data-topo-window className="zn-has-dots zn-works-banner">
                <CardDots />
                <div className="zn-works-banner-inner">
                  <div>
                    <p className="zn-kicker">Люди</p>
                    <h2 className="zn-title">Кто внутри</h2>
                  </div>
                  <Link href="/contact" className="zn-more">
                    Написать
                  </Link>
                </div>
              </header>
              <div className="flex flex-col">
                {team.map((person, index) => (
                  <StoryRow
                    key={person.name}
                    cover={person.name}
                    kicker={person.role}
                    title={person.name}
                    text={person.note}
                    reverse={index % 2 === 1}
                    last={index === team.length - 1}
                  />
                ))}
              </div>
            </FieldStage>
          </div>
        </section>
      </div>
    </div>
  );
}
