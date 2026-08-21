"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export function FadeIn({
  children,
  className = "",
  delay = 0,
  y = 28,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShown(true);
        io.disconnect();
      },
      { threshold: 0.12, rootMargin: "-64px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const style = {
    "--zn-reveal-y": `${y}px`,
    transitionDelay: shown ? `${delay}s` : "0s",
  } as CSSProperties;

  return (
    <div ref={ref} className={`zn-reveal${shown ? " is-in" : ""} ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}
