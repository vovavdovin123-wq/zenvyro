"use client";

import { useMemo } from "react";
import { MoltenMetal } from "@/components/bits/MoltenMetal";
import { moltenColorsFromAccent, useAccentColor } from "@/lib/accent";

export function SiteMoltenMetal({ className = "", worldSize }: { className?: string; worldSize?: number }) {
  const accent = useAccentColor();
  const colors = useMemo(() => moltenColorsFromAccent(accent), [accent]);
  return (
    <MoltenMetal {...colors} mouseInteraction={false} mouseStrength={0} worldSize={worldSize} className={className} />
  );
}
