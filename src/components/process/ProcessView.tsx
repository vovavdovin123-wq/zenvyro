"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FadeIn } from "@/components/ui/FadeIn";
import { FieldHero } from "@/components/effects/FieldHero";
import { SiteMoltenMetal } from "@/components/effects/SiteMoltenMetal";
import { ProcessJourney } from "@/components/process/ProcessJourney";
import { accentHeadlineStyles, useAccentColor } from "@/lib/accent";
import { processSteps, rules } from "@/content/site";
import "@/styles/process.css";

export function ProcessView() {
  const accent = useAccentColor();
  const { accentFg, accentText, accentGlow } = useMemo(() => accentHeadlineStyles(accent), [accent]);
  const [active, setActive] = useState(0);

  return (
    <div>
      <FieldHero effect={<SiteMoltenMetal />}>
        <div className="ln-hero-left">
          <p className="ln-hero-tag ln-hero-tag-static">
            <span className="ln-hero-tag-new" style={{ background: accent, color: accentFg }}>
              {processSteps.length}
            </span>
            этапов в продукте
          </p>
          <h1 className="ln-hero-headline">
            <span className="ln-hero-headline-line">Сначала ясность.</span>
            <span className="ln-hero-headline-line" style={{ color: accentText, textShadow: accentGlow }}>
              Затем сборка.
            </span>
          </h1>
          <p className="ln-hero-description">
            Знакомимся, собираем MVP, запускаем, усиливаем продукт и остаёмся на поддержке. Один продюсер на весь контур.
          </p>
          <div className="ln-hero-buttons">
            <Link
              href="/contact"
              className="ln-hero-btn ln-hero-btn-primary"
              style={{ background: accent, borderColor: accent, color: accentFg }}
            >
              Обсудить проект
            </Link>
            <Link href="/team" className="ln-hero-btn ln-hero-btn-secondary">
              Люди
            </Link>
          </div>
        </div>
      </FieldHero>

      <div className="zn-below">
        <section className="zn-sec">
          <div className="zn-inner">
            <ProcessJourney active={active} onSelect={setActive} accent={accent} />
            <FadeIn>
              <ul className="zn-story-rules">
                {rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </FadeIn>
          </div>
        </section>
      </div>
    </div>
  );
}
