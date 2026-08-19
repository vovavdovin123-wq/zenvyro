"use client";

import { type ReactNode } from "react";
import { DotField } from "@/components/bits/DotField";
import "./hero.css";

export function FieldHero({
  effect,
  children,
}: {
  effect: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="ln-hero">
      <div className="ln-hero-backdrop" aria-hidden>
        <div className="ln-hero-dots">
          <DotField
            dotRadius={1}
            dotSpacing={18}
            cursorRadius={500}
            cursorForce={0.1}
            bulgeOnly
            bulgeStrength={67}
            sparkle={false}
            waveAmplitude={0}
            gradientFrom="rgba(242, 241, 247, 0.78)"
            gradientTo="rgba(209, 196, 245, 0.62)"
          />
        </div>
        <div className="ln-hero-field">{effect}</div>
        <div className="ln-hero-bottom-fade" />
        <div className="ln-hero-grain" />
      </div>
      <div className="ln-hero-content ln-hero-content--page">{children}</div>
    </section>
  );
}
