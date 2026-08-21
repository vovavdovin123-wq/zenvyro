"use client";

import { useMemo } from "react";
import { Ferrofluid } from "@/components/effects/Ferrofluid";
import { ferroColorsFromAccent, useAccentColor } from "@/lib/accent";

export function SiteFerrofluid({ className = "", worldSize }: { className?: string; worldSize?: number }) {
  const accent = useAccentColor();
  const colors = useMemo(() => ferroColorsFromAccent(accent), [accent]);

  return (
    <Ferrofluid
      className={className}
      colors={colors}
      speed={0.1}
      scale={3}
      turbulence={1}
      fluidity={0.09}
      rimWidth={0.22}
      sharpness={1.9}
      shimmer={1.25}
      glow={1.9}
      flowDirection="down"
      opacity={1}
      mouseInteraction={!worldSize}
      mouseStrength={0.5}
      mouseRadius={0.2}
      worldSize={worldSize}
    />
  );
}
