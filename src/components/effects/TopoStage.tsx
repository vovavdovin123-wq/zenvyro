"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SiteTopography } from "@/components/effects/SiteTopography";
import { bindStageMask, coverWorldSize } from "@/lib/stageMask";

export function TopoStage({ children, className = "" }: { children: ReactNode; className?: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const [worldSize, setWorldSize] = useState(640);

  useEffect(() => {
    const stage = stageRef.current;
    const layer = layerRef.current;
    if (!stage || !layer) return;

    return bindStageMask(stage, layer, (holes) => {
      const next = coverWorldSize(stage, holes);
      setWorldSize((prev) => (Math.abs(prev - next) > 2 ? next : prev));
    });
  }, []);

  return (
    <div ref={stageRef} className={`zn-topo-stage ${className}`.trim()}>
      <div ref={layerRef} className="zn-topo-layer" aria-hidden>
        <SiteTopography worldSize={worldSize} />
      </div>
      {children}
    </div>
  );
}
