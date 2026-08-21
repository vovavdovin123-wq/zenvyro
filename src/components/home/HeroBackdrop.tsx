"use client";

import { DotField } from "@/components/effects/DotField";
import { HeroBand } from "@/components/effects/HeroBand";
import { useAccentColor } from "@/lib/accent";
import "@/styles/hero.css";

export type HeroBackdropProps = {
  className?: string;
  color?: string;
  speed?: number;
  frequency?: number;
  noise?: number;
  bandWidth?: number;
  rotation?: number;
  fadeTop?: number;
  iterations?: number;
  intensity?: number;
  scale?: number;
  warpStrength?: number;
  yOffset?: number;
  mouseInfluence?: number;
  dotRadius?: number;
  dotSpacing?: number;
  cursorRadius?: number;
  cursorForce?: number;
  bulgeOnly?: boolean;
  bulgeStrength?: number;
  sparkle?: boolean;
  waveAmplitude?: number;
  showFade?: boolean;
  showDots?: boolean;
};

export function HeroBackdrop({
  className = "",
  color,
  speed = 0.2,
  frequency = 1,
  noise = 0.15,
  bandWidth = 0.14,
  rotation = 90,
  fadeTop = 0.75,
  iterations = 1,
  intensity = 1.25,
  scale = 1,
  warpStrength = 1,
  yOffset = 0.3,
  mouseInfluence = 0.3,
  dotRadius = 1,
  dotSpacing = 18,
  cursorRadius = 500,
  cursorForce = 0.1,
  bulgeOnly = true,
  bulgeStrength = 67,
  sparkle = false,
  waveAmplitude = 0,
  showFade = true,
  showDots = true,
}: HeroBackdropProps) {
  const accent = useAccentColor();

  return (
    <div className={`ln-hero-backdrop ${className}`} aria-hidden>
      {showDots ? (
        <div className="ln-hero-dots">
          <DotField
            dotRadius={dotRadius}
            dotSpacing={dotSpacing}
            cursorRadius={cursorRadius}
            cursorForce={cursorForce}
            bulgeOnly={bulgeOnly}
            bulgeStrength={bulgeStrength}
            sparkle={sparkle}
            waveAmplitude={waveAmplitude}
            gradientFrom="rgba(242, 241, 247, 0.78)"
            gradientTo="rgba(209, 196, 245, 0.62)"
          />
        </div>
      ) : null}
      <HeroBand
        className="ln-hero-band"
        color={color ?? accent}
        speed={speed}
        frequency={frequency}
        noise={noise}
        bandWidth={bandWidth}
        rotation={rotation}
        fadeTop={fadeTop}
        iterations={iterations}
        intensity={intensity}
        scale={scale}
        warpStrength={warpStrength}
        yOffset={yOffset}
        mouseInfluence={mouseInfluence}
      />
      {showFade ? <div className="ln-hero-bottom-fade" /> : null}
      <div className="ln-hero-grain" />
    </div>
  );
}
