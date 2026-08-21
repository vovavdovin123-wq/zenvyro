"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { bindStageMask, coverWorldSize } from "@/lib/stageMask";

export function FieldStage({
  children,
  layer,
  className = "",
  onWorldSize,
}: {
  children: ReactNode;
  layer: ReactNode;
  className?: string;
  onWorldSize?: (size: number) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const worldCb = useRef(onWorldSize);
  worldCb.current = onWorldSize;
  const lastWorld = useRef(0);

  useEffect(() => {
    const stage = stageRef.current;
    const mask = layerRef.current;
    if (!stage || !mask) return;
    return bindStageMask(stage, mask, (holes) => {
      const cb = worldCb.current;
      if (!cb) return;
      const next = coverWorldSize(stage, holes);
      if (Math.abs(lastWorld.current - next) <= 2) return;
      lastWorld.current = next;
      cb(next);
    });
  }, []);

  return (
    <div ref={stageRef} className={`zn-topo-stage ${className}`.trim()}>
      <div ref={layerRef} className="zn-topo-layer" aria-hidden>
        {layer}
      </div>
      {children}
    </div>
  );
}
