"use client";

import { useRef, useState, type MouseEvent, type ReactNode } from "react";

export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(82, 39, 255, 0.28)",
}: {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  function onMove(event: MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setOpacity(0.85)}
      onMouseLeave={() => setOpacity(0)}
      className={`group relative overflow-hidden rounded-[1.4rem] border border-white/[0.08] bg-bg-secondary transition duration-500 hover:-translate-y-1 hover:scale-[1.02] ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 max-md:hidden"
        style={{
          opacity,
          background: `radial-gradient(420px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 42%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-0 rounded-[1.4rem] opacity-0 transition duration-500 group-hover:opacity-100">
        <div className="absolute inset-[-1px] rounded-[1.45rem] bg-brand opacity-80 blur-[10px]" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
