export function glCssSize(width: number, height: number, maxEdge = 1200) {
  const w = Math.max(1, Math.floor(width));
  const h = Math.max(1, Math.floor(height));
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  return {
    w: Math.max(1, Math.round(w * scale)),
    h: Math.max(1, Math.round(h * scale)),
  };
}

export function coverGlCanvas(canvas: HTMLCanvasElement) {
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
}

export function glDpr(height = 0) {
  const raw = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  return height > 900 ? 1 : Math.min(raw, 1.25);
}
