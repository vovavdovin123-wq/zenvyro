"use client";

import { useMemo } from "react";
import { Topography } from "@/components/effects/Topography";
import { topoColorsFromAccent, useAccentColor } from "@/lib/accent";

const topoProps = {
  speed: 0.25,
  morphAmount: 3,
  morphSpeed: 0.05,
  bands: 1,
  thickness: 0.01,
  scale: 2.5,
  pixelSize: 1,
  glow: 0.1,
  colorMode: "elevation" as const,
  contrast: 1.45,
  brightness: 0.6,
  fillBands: true,
  opacity: 1,
  grain: true,
  grainIntensity: 0,
  mouseInteraction: true,
  mouseRadius: 0.5,
  mouseStrength: 0.4,
};

export function SiteTopography({ className = "", worldSize }: { className?: string; worldSize?: number }) {
  const accent = useAccentColor();
  const colors = useMemo(() => topoColorsFromAccent(accent), [accent]);
  return <Topography {...topoProps} {...colors} worldSize={worldSize} className={className} />;
}
