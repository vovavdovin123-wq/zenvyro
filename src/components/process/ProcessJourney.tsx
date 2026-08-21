"use client";

import { LineSidebar } from "@/components/ui/LineSidebar";
import "@/components/ui/LineSidebar.css";
import { processSteps } from "@/content/site";
import { accentHeadlineStyles } from "@/lib/accent";

export function ProcessJourney({
  active,
  onSelect,
  accent,
}: {
  active: number;
  onSelect: (index: number) => void;
  accent: string;
}) {
  const step = processSteps[active] ?? processSteps[0];
  const { accentText } = accentHeadlineStyles(accent);

  return (
    <div className="zn-how">
      <div className="zn-how-grid" aria-hidden />
      <div className="zn-how-copy">
        <h2 className="zn-how-title">
          Как мы работаем<span style={{ color: accentText }}>?</span>
        </h2>
        <div className="zn-process-board">
          <LineSidebar
            items={processSteps.map((item) => item.title)}
            accentColor={accent}
            active={active}
            onItemClick={(index) => onSelect(index)}
          />
          <article className="zn-process-detail">
            <p className="zn-kicker">{step.n}</p>
            <h3 className="zn-title">{step.title}</h3>
            <p className="zn-lead">{step.text}</p>
          </article>
        </div>
      </div>
    </div>
  );
}
