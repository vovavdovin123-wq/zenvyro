"use client";

import { useEffect, useState } from "react";

export const ACCENT_KEY = "zn-accent";
export const PLAYGROUND_KEY = "zn-playground";
export const DEFAULT_ACCENT = "#A855F7";

export type PlaygroundSnap = {
  values: Record<string, string | number | boolean>;
  preset: number | null;
};

export function hsvToHex(h: number, s: number, v: number) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toH = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toH(r)}${toH(g)}${toH(b)}`;
}

export function hexToHsv(hex: string) {
  const h = hex.replace("#", "");
  const r = Number.parseInt(h.slice(0, 2), 16) / 255;
  const g = Number.parseInt(h.slice(2, 4), 16) / 255;
  const b = Number.parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let hue = 0;
  if (d > 0) {
    if (max === r) hue = 60 * (((g - b) / d) % 6);
    else if (max === g) hue = 60 * ((b - r) / d + 2);
    else hue = 60 * ((r - g) / d + 4);
  }
  if (hue < 0) hue += 360;
  return { h: hue, s: max === 0 ? 0 : d / max, v: max };
}

export function parseHexRgb(hex: string) {
  const h = hex.replace("#", "");
  return [Number.parseInt(h.slice(0, 2), 16), Number.parseInt(h.slice(2, 4), 16), Number.parseInt(h.slice(4, 6), 16)] as const;
}

const accentListeners = new Set<(color: string) => void>();
let appliedAccent = "";

export function applyAccent(hex: string) {
  if (typeof document === "undefined") return;
  const color = hex.startsWith("#") && hex.length >= 7 ? hex.slice(0, 7).toUpperCase() : DEFAULT_ACCENT;
  if (color === appliedAccent) return;
  appliedAccent = color;
  const hsv = hexToHsv(color);
  const dark = hsvToHex(hsv.h, Math.min(hsv.s + 0.1, 1), Math.max(hsv.v * 0.7, 0));
  const light = hsvToHex((hsv.h + 30) % 360, Math.max(hsv.s * 0.8, 0), Math.min(hsv.v * 1.15, 1));
  const spark = hsvToHex((hsv.h + 140) % 360, Math.min(Math.max(hsv.s, 0.62), 1), 1);
  const [r, g, b] = parseHexRgb(color);
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const root = document.documentElement;
  root.style.setProperty("--primary", color);
  root.style.setProperty("--secondary", light);
  root.style.setProperty("--brand", `linear-gradient(135deg, ${color} 0%, ${light} 100%)`);
  root.style.setProperty("--pro-dark", dark);
  root.style.setProperty("--pro-base", color);
  root.style.setProperty("--pro-light", light);
  root.style.setProperty("--pro-glow", `${r}, ${g}, ${b}`);
  root.style.setProperty("--pro-fg", lum > 0.5 ? "#000" : "#fff");
  root.style.setProperty("--mark-dot", spark);
  root.style.setProperty("--accent-cyan", spark);
  accentListeners.forEach((listener) => listener(color));
}

export function saveAccent(hex: string) {
  try {
    localStorage.setItem(ACCENT_KEY, hex);
  } catch {
    /* private mode */
  }
}

export function readAccent() {
  try {
    return localStorage.getItem(ACCENT_KEY);
  } catch {
    return null;
  }
}

export function savePlayground(snap: PlaygroundSnap) {
  try {
    localStorage.setItem(PLAYGROUND_KEY, JSON.stringify(snap));
  } catch {
    /* private mode */
  }
}

export function readPlayground(): PlaygroundSnap | null {
  try {
    const raw = localStorage.getItem(PLAYGROUND_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlaygroundSnap;
    if (!parsed?.values || typeof parsed.values !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function topoColorsFromAccent(hex: string) {
  const hsv = hexToHsv(hex);
  return {
    lowColor: hsvToHex(hsv.h, Math.min(hsv.s + 0.18, 1), Math.max(hsv.v * 0.52, 0.28)),
    midColor: hsvToHex((hsv.h + 32) % 360, Math.min(Math.max(hsv.s * 0.62, 0.28), 1), Math.min(hsv.v * 1.18, 1)),
    highColor: "#FFFFFF",
  };
}

export function ferroColorsFromAccent(hex: string) {
  const hsv = hexToHsv(hex);
  return [
    hex,
    hsvToHex((hsv.h + 28) % 360, Math.max(hsv.s * 0.55, 0.22), Math.min(hsv.v * 1.2, 1)),
    "#FFFFFF",
  ];
}

export function moltenColorsFromAccent(hex: string) {
  const { lowColor, midColor, highColor } = topoColorsFromAccent(hex);
  return { color1: lowColor, color2: midColor, color3: highColor };
}

export function accentHeadlineStyles(hex: string) {
  const [ar, ag, ab] = parseHexRgb(hex);
  const lum = (0.2126 * ar + 0.7152 * ag + 0.0722 * ab) / 255;
  const hsv = hexToHsv(hex);
  return {
    accentFg: lum > 0.5 ? "#000" : "#fff",
    accentText: hsvToHex(hsv.h, Math.min(hsv.s, 0.7), Math.max(hsv.v, 0.92)),
    accentGlow: `0 0 24px rgba(${ar}, ${ag}, ${ab}, 0.3), 0 0 64px rgba(${ar}, ${ag}, ${ab}, 0.14)`,
  };
}

export function useAccentColor() {
  const [color, setColor] = useState(DEFAULT_ACCENT);

  useEffect(() => {
    const next = appliedAccent || readAccent() || DEFAULT_ACCENT;
    setColor((prev) => (prev.toUpperCase() === next.toUpperCase() ? prev : next));
    const onAccent = (value: string) => {
      setColor((prev) => (prev.toUpperCase() === value.toUpperCase() ? prev : value));
    };
    accentListeners.add(onAccent);
    return () => {
      accentListeners.delete(onAccent);
    };
  }, []);

  return color;
}
