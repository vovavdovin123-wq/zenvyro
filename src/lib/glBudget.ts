export function glIsLite() {
  if (typeof navigator === "undefined") return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency || 8;
  return Boolean(connection?.saveData) || cores <= 4 || (typeof memory === "number" && memory <= 4);
}

export function isCoarsePointer() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
}

export function isToolbarJitter(prevW: number, prevH: number, nextW: number, nextH: number, slack = 120) {
  return prevW > 0 && prevW === nextW && Math.abs(prevH - nextH) < slack;
}

export function glCssSize(width: number, height: number, maxEdge = 1200) {
  const cap = glIsLite() ? 720 : maxEdge;
  const w = Math.max(1, Math.floor(width));
  const h = Math.max(1, Math.floor(height));
  const scale = Math.min(1, cap / Math.max(w, h));
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
  if (glIsLite() || isCoarsePointer()) return 1;
  const raw = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  return height > 900 ? 1 : Math.min(raw, 1.25);
}
