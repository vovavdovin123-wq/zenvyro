export function paintStageMask(stage: HTMLElement, layer: HTMLElement) {
  const sr = stage.getBoundingClientRect();
  const width = Math.max(1, Math.round(sr.width));
  const height = Math.max(1, Math.round(sr.height));
  const holes = [...stage.querySelectorAll<HTMLElement>("[data-topo-window]")];
  const rects = holes
    .map((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return null;
      const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
      return {
        x: r.left - sr.left,
        y: r.top - sr.top,
        w: r.width,
        h: r.height,
        rx: Math.min(radius, r.width / 2, r.height / 2),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${rects
    .map((box) => `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="${box.rx}" fill="white"/>`)
    .join("")}</svg>`;
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  layer.style.maskImage = url;
  layer.style.webkitMaskImage = url;
  layer.style.maskSize = "100% 100%";
  layer.style.webkitMaskSize = "100% 100%";
  layer.style.maskRepeat = "no-repeat";
  layer.style.webkitMaskRepeat = "no-repeat";
  return holes;
}

export function coverWorldSize(stage: HTMLElement, holes: HTMLElement[]) {
  const stageW = stage.getBoundingClientRect().width;
  const covers = holes
    .map((el) => el.getBoundingClientRect().width)
    .filter((w) => w > 40 && w < stageW * 0.85);
  return Math.max(covers[0] ?? stageW * 0.5, 280);
}

export function bindStageMask(
  stage: HTMLElement,
  layer: HTMLElement,
  onPaint?: (holes: HTMLElement[]) => void,
) {
  let frame = 0;

  const paint = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const holes = paintStageMask(stage, layer);
      onPaint?.(holes);
    });
  };

  const ro = new ResizeObserver(paint);
  ro.observe(stage);
  for (const hole of stage.querySelectorAll("[data-topo-window]")) ro.observe(hole);

  window.addEventListener("resize", paint);
  paint();

  return () => {
    cancelAnimationFrame(frame);
    ro.disconnect();
    window.removeEventListener("resize", paint);
  };
}
