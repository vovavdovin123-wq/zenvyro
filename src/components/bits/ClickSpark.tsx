"use client";

import { useCallback, useRef, type MouseEvent, type ReactNode } from "react";

type Spark = { x: number; y: number; vx: number; vy: number; life: number };

export function ClickSpark({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparks = useRef<Spark[]>([]);
  const running = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sparks.current = sparks.current
      .map((spark) => ({
        ...spark,
        x: spark.x + spark.vx,
        y: spark.y + spark.vy,
        life: spark.life - 0.035,
      }))
      .filter((spark) => spark.life > 0);
    for (const spark of sparks.current) {
      ctx.globalAlpha = spark.life;
      ctx.fillStyle = spark.life > 0.5 ? "#FF9FFC" : "#27C5FF";
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (sparks.current.length) {
      requestAnimationFrame(draw);
    } else {
      running.current = false;
    }
  }, []);

  function burst(event: MouseEvent<HTMLDivElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    for (let i = 0; i < 16; i += 1) {
      const angle = (Math.PI * 2 * i) / 16;
      sparks.current.push({
        x,
        y,
        vx: Math.cos(angle) * (1.6 + Math.random() * 2),
        vy: Math.sin(angle) * (1.6 + Math.random() * 2),
        life: 1,
      });
    }
    if (!running.current) {
      running.current = true;
      requestAnimationFrame(draw);
    }
  }

  return (
    <div className={`relative ${className}`} onClick={burst}>
      {children}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  );
}
