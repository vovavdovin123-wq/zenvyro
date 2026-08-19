"use client";

import { useEffect, useRef, useState } from "react";
import { DotField } from "@/components/bits/DotField";

export function CardDots() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "120px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="zn-card-dots" aria-hidden>
      {visible ? (
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
      ) : null}
    </div>
  );
}
