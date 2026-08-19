"use client";

import { memo, useEffect, useRef } from "react";
import "./DotField.css";

const TWO_PI = Math.PI * 2;

export type DotFieldProps = {
  dotRadius?: number;
  dotSpacing?: number;
  cursorRadius?: number;
  cursorForce?: number;
  bulgeOnly?: boolean;
  bulgeStrength?: number;
  sparkle?: boolean;
  waveAmplitude?: number;
  gradientFrom?: string;
  gradientTo?: string;
  className?: string;
};

type Dot = { ax: number; ay: number; sx: number; sy: number; vx: number; vy: number; x: number; y: number };

export const DotField = memo(function DotField({
  dotRadius = 1,
  dotSpacing = 18,
  cursorRadius = 500,
  cursorForce = 0.1,
  bulgeOnly = true,
  bulgeStrength = 67,
  sparkle = false,
  waveAmplitude = 0,
  gradientFrom = "rgba(242, 241, 247, 0.78)",
  gradientTo = "rgba(209, 196, 245, 0.62)",
  className = "",
}: DotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999, sx: -9999, sy: -9999 });
  const rafRef = useRef<number>(0);
  const sizeRef = useRef({ w: 0, h: 0 });
  const presence = useRef(0);
  const propsRef = useRef({
    dotRadius,
    dotSpacing,
    cursorRadius,
    cursorForce,
    bulgeOnly,
    bulgeStrength,
    sparkle,
    waveAmplitude,
    gradientFrom,
    gradientTo,
  });
  propsRef.current = {
    dotRadius,
    dotSpacing,
    cursorRadius,
    cursorForce,
    bulgeOnly,
    bulgeStrength,
    sparkle,
    waveAmplitude,
    gradientFrom,
    gradientTo,
  };
  const rebuildRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const surface = canvasRef.current;
    if (!surface) return;
    const context = surface.getContext("2d", { alpha: true });
    if (!context) return;
    const canvasSurface: HTMLCanvasElement = surface;
    const ctx: CanvasRenderingContext2D = context;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let resizeTimer: ReturnType<typeof setTimeout>;

    function buildDots(w: number, h: number) {
      const p = propsRef.current;
      const step = p.dotRadius + p.dotSpacing;
      const cols = Math.floor(w / step);
      const rows = Math.floor(h / step);
      const padX = (w % step) / 2;
      const padY = (h % step) / 2;
      const dots: Dot[] = new Array(rows * cols);
      let idx = 0;
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const ax = padX + col * step + step / 2;
          const ay = padY + row * step + step / 2;
          dots[idx] = { ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay };
          idx += 1;
        }
      }
      dotsRef.current = dots;
    }

    function doResize() {
      const parent = canvasSurface.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      canvasSurface.width = w * dpr;
      canvasSurface.height = h * dpr;
      canvasSurface.style.width = `${w}px`;
      canvasSurface.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w, h };
      buildDots(w, h);
    }

    function resize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(doResize, 100);
    }

    function onMouseMove(e: MouseEvent) {
      const parent = canvasSurface.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    }

    let frameCount = 0;
    let idleFrames = 0;
    let visible = true;

    function tick() {
      if (!visible) {
        rafRef.current = 0;
        return;
      }
      frameCount += 1;
      const dots = dotsRef.current;
      const m = mouseRef.current;
      const { w, h } = sizeRef.current;
      const p = propsRef.current;
      const len = dots.length;
      const time = frameCount * 0.02;
      if (m.x > -9000) {
        if (m.sx < -9000) {
          m.sx = m.x;
          m.sy = m.y;
        } else {
          m.sx += (m.x - m.sx) * 0.07;
          m.sy += (m.y - m.sy) * 0.07;
        }
        presence.current += (1 - presence.current) * 0.04;
      } else {
        presence.current += (0 - presence.current) * 0.025;
      }
      if (presence.current < 0.001) presence.current = 0;
      const eng = presence.current;
      const busy = eng > 0.002 || m.x > -9000;
      if (!busy) idleFrames += 1;
      else idleFrames = 0;
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, p.gradientFrom);
      grad.addColorStop(1, p.gradientTo);
      ctx.fillStyle = grad;
      const crSq = p.cursorRadius * p.cursorRadius;
      const rad = p.dotRadius / 2;
      const isBulge = p.bulgeOnly;
      const mx = m.sx;
      const my = m.sy;
      ctx.beginPath();
      for (let i = 0; i < len; i += 1) {
        const d = dots[i];
        const dx = mx - d.ax;
        const dy = my - d.ay;
        const distSq = dx * dx + dy * dy;
        if (distSq < crSq && eng > 0.01) {
          const dist = Math.sqrt(distSq) || 1;
          if (isBulge) {
            const t = 1 - dist / p.cursorRadius;
            const falloff = t * t * (3 - 2 * t);
            const push = falloff * p.bulgeStrength * 0.55 * eng;
            const nx = dx / dist;
            const ny = dy / dist;
            d.sx += (d.ax - nx * push - d.sx) * 0.055;
            d.sy += (d.ay - ny * push - d.sy) * 0.055;
          } else {
            const move = (500 / dist) * (p.cursorForce * 4) * eng;
            d.vx += (dx / dist) * -move * 0.04;
            d.vy += (dy / dist) * -move * 0.04;
          }
        } else if (isBulge) {
          d.sx += (d.ax - d.sx) * 0.035;
          d.sy += (d.ay - d.sy) * 0.035;
        }
        if (!isBulge) {
          d.vx *= 0.92;
          d.vy *= 0.92;
          d.x = d.ax + d.vx;
          d.y = d.ay + d.vy;
          d.sx += (d.x - d.sx) * 0.06;
          d.sy += (d.y - d.sy) * 0.06;
        }
        let drawX = d.sx;
        let drawY = d.sy;
        if (p.waveAmplitude > 0) {
          drawY += Math.sin(d.ax * 0.03 + time) * p.waveAmplitude;
          drawX += Math.cos(d.ay * 0.03 + time * 0.7) * p.waveAmplitude * 0.5;
        }
        const r = p.sparkle && (((i * 2654435761) ^ (frameCount >> 3)) >>> 0) % 100 < 3 ? rad * 1.8 : rad;
        ctx.moveTo(drawX + r, drawY);
        ctx.arc(drawX, drawY, r, 0, TWO_PI);
      }
      ctx.fill();
      if (idleFrames > 18 && !busy && p.waveAmplitude <= 0) {
        rafRef.current = 0;
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    doResize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !rafRef.current) rafRef.current = requestAnimationFrame(tick);
      },
      { threshold: 0 },
    );
    io.observe(canvasSurface);
    rafRef.current = requestAnimationFrame(tick);
    rebuildRef.current = () => {
      const { w, h } = sizeRef.current;
      if (w > 0 && h > 0) buildDots(w, h);
    };

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(resizeTimer);
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  useEffect(() => {
    rebuildRef.current?.();
  }, [dotRadius, dotSpacing]);

  return (
    <div className={`dot-field-container ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
});
