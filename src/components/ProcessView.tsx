"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CardDots } from "@/components/CardDots";
import { FadeIn } from "@/components/bits/FadeIn";
import { FieldHero } from "@/components/FieldHero";
import { FieldStage } from "@/components/FieldStage";
import { LineSidebar } from "@/components/bits/LineSidebar";
import "@/components/bits/LineSidebar.css";
import { SiteMoltenMetal } from "@/components/bits/SiteMoltenMetal";
import { accentHeadlineStyles, useAccentColor } from "@/lib/accent";
import { processSteps, rules } from "@/lib/site";
import "./landing.css";

export function ProcessView() {
  const accent = useAccentColor();
  const { accentFg, accentText, accentGlow } = useMemo(() => accentHeadlineStyles(accent), [accent]);
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);
  const [worldSize, setWorldSize] = useState(640);
  const step = processSteps[active] ?? processSteps[0];

  function selectStep(index: number) {
    if (index === active) return;
    setDir(index > active ? 1 : -1);
    setActive(index);
  }

  return (
    <div>
      <FieldHero effect={<SiteMoltenMetal />}>
        <div className="ln-hero-left">
          <p className="ln-hero-tag ln-hero-tag-static">
            <span className="ln-hero-tag-new" style={{ background: accent, color: accentFg }}>
              7
            </span>
            шагов в заказе
          </p>
          <h1 className="ln-hero-headline">
            <span className="ln-hero-headline-line">Сначала ясность.</span>
            <span className="ln-hero-headline-line" style={{ color: accentText, textShadow: accentGlow }}>
              Затем сборка.
            </span>
          </h1>
          <p className="ln-hero-description">
            От первого письма до сдачи — один продюсер. Новый запрос оформляем отдельно, текущий этап не раздуваем.
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
            <FieldStage onWorldSize={setWorldSize} layer={<SiteMoltenMetal worldSize={worldSize} />}>
              <header data-topo-window className="zn-has-dots zn-works-banner">
                <CardDots />
                <div className="zn-works-banner-inner">
                  <div>
                    <p className="zn-kicker">Процесс</p>
                    <h2 className="zn-title">Ход заказа</h2>
                  </div>
                  <Link href="/contact" className="zn-more">
                    Обсудить
                  </Link>
                </div>
              </header>
              <div className="zn-process-board">
                <LineSidebar
                  items={processSteps.map((item) => item.title)}
                  accentColor={accent}
                  textColor="#c4c4c4"
                  markerColor="#6c6c6c"
                  showIndex
                  showMarker
                  proximityRadius={140}
                  maxShift={28}
                  falloff="smooth"
                  markerLength={60}
                  markerGap={0}
                  tickScale={0.5}
                  scaleTick
                  itemGap={28}
                  fontSize={1.35}
                  smoothing={260}
                  defaultActive={0}
                  onItemClick={(index) => selectStep(index)}
                />
                <article data-topo-window className="zn-has-dots zn-process-detail">
                  <CardDots />
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={step.n}
                      initial={{ opacity: 0, y: 22 * dir }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 * dir }}
                      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p className="zn-kicker">{step.n}</p>
                      <h3 className="zn-title">{step.title}</h3>
                      <p className="zn-lead">{step.text}</p>
                    </motion.div>
                  </AnimatePresence>
                </article>
              </div>
            </FieldStage>
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
