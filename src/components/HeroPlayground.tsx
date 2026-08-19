"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePlayground } from "@/components/AccentProvider";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { applyAccent, hexToHsv, hsvToHex, parseHexRgb } from "@/lib/accent";
import "./hero.css";

type NumberProp = {
  name: string;
  type: "number";
  default: number;
  min: number;
  max: number;
  step: number;
};
type ColorProp = { name: string; type: "color"; default: string };
type BoolProp = { name: string; type: "boolean"; default: boolean };
type PropDef = NumberProp | ColorProp | BoolProp;
type Values = Record<string, string | number | boolean>;

const COLOR_BENDS: { label: string; component: string; props: PropDef[] } = {
  label: "ColorBends",
  component: "ColorBends",
  props: [
    { name: "color", type: "color", default: "#A855F7" },
    { name: "speed", type: "number", default: 0.2, min: 0.1, max: 1, step: 0.1 },
    { name: "frequency", type: "number", default: 1, min: 1, max: 3, step: 0.1 },
    { name: "noise", type: "number", default: 0.15, min: 0, max: 0.9, step: 0.01 },
    { name: "bandWidth", type: "number", default: 0.14, min: 0.1, max: 1, step: 0.01 },
    { name: "rotation", type: "number", default: 90, min: 0, max: 360, step: 1 },
    { name: "fadeTop", type: "number", default: 0.75, min: 0.4, max: 1, step: 0.05 },
    { name: "iterations", type: "number", default: 1, min: 1, max: 2, step: 1 },
    { name: "intensity", type: "number", default: 1.25, min: 0.1, max: 2, step: 0.1 },
  ],
};

const SCENE_PRESETS = [
  {
    label: "Nebula",
    values: {
      color: "#A855F7",
      speed: 0.2,
      frequency: 1,
      noise: 0.15,
      bandWidth: 0.14,
      rotation: 90,
      fadeTop: 0.75,
      iterations: 1,
      intensity: 1.25,
    },
  },
  {
    label: "Aurora",
    values: {
      color: "#10B981",
      speed: 0.35,
      frequency: 1.5,
      noise: 0.08,
      bandWidth: 0.3,
      rotation: 60,
      fadeTop: 0.8,
      iterations: 2,
      intensity: 1.15,
    },
  },
  {
    label: "Ember",
    values: {
      color: "#F97316",
      speed: 0.4,
      frequency: 1.8,
      noise: 0.18,
      bandWidth: 0.22,
      rotation: 115,
      fadeTop: 0.7,
      iterations: 1,
      intensity: 1.4,
    },
  },
  {
    label: "Ice",
    values: {
      color: "#06B6D4",
      speed: 0.15,
      frequency: 1.2,
      noise: 0.06,
      bandWidth: 0.4,
      rotation: 45,
      fadeTop: 0.95,
      iterations: 2,
      intensity: 1.1,
    },
  },
] as const;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpColor(from: string, to: string, t: number) {
  const a = hexToHsv(from);
  const b = hexToHsv(to);
  let dh = b.h - a.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  let h = a.h + dh * t;
  if (h < 0) h += 360;
  if (h >= 360) h -= 360;
  return hsvToHex(h, lerp(a.s, b.s, t), lerp(a.v, b.v, t));
}

const EASE_IN_OUT = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const PRESET_DURATION = 1100;
const CHIP_IDLE_RGB = [255, 255, 255];

function chipTint(accentHex: string, weight: number) {
  const [r, g, b] = parseHexRgb(accentHex);
  const mix = (from: number, to: number) => Math.round(lerp(from, to, weight));
  const alpha = lerp(0.45, 1, weight);
  return `rgba(${mix(CHIP_IDLE_RGB[0], r)}, ${mix(CHIP_IDLE_RGB[1], g)}, ${mix(CHIP_IDLE_RGB[2], b)}, ${alpha.toFixed(3)})`;
}

function formatValue(val: number, step: number) {
  if (step >= 1) return String(Math.round(val));
  const d = Math.max(0, Math.ceil(-Math.log10(step)));
  return val.toFixed(d);
}

function startDrag(onMove: (ev: PointerEvent) => void, onEnd?: () => void) {
  document.addEventListener("pointermove", onMove);
  const onUp = () => {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    document.removeEventListener("pointercancel", onUp);
    onEnd?.();
  };
  document.addEventListener("pointerup", onUp);
  document.addEventListener("pointercancel", onUp);
}

function defaultsFromDef() {
  return Object.fromEntries(COLOR_BENDS.props.map((p) => [p.name, p.default])) as Values;
}

function EditableValue({
  type,
  value,
  onChange,
  min,
  max,
  step,
}: {
  type: "number" | "boolean" | "color";
  value: string | number | boolean;
  onChange: (next: string | number | boolean) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const numRef = useRef<HTMLSpanElement>(null);
  const stateRef = useRef({ value, onChange, min, max, step });
  stateRef.current = { value, onChange, min, max, step };

  useEffect(() => {
    const el = numRef.current;
    if (!el || type !== "number") return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { value: v, onChange: oc, min: mn = 0, max: mx = 100, step: s = 1 } = stateRef.current;
      if (typeof v !== "number") return;
      const dir = e.deltaY < 0 ? 1 : -1;
      const next = Math.round((v + dir * s) / s) * s;
      oc(Math.max(mn, Math.min(mx, next)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [type]);

  if (type === "color") {
    return <ColorValue value={String(value)} onChange={(next) => onChange(next)} />;
  }

  if (type === "boolean") {
    return (
      <button type="button" className="ln-hero-code-value ln-hero-code-value--bool" onClick={() => onChange(!value)}>
        {String(value)}
      </button>
    );
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    const isTouch = e.pointerType === "touch";
    if (!isTouch) e.preventDefault();
    const startX = e.clientX;
    const { value: startVal, step: s = 1, min: mn = 0, max: mx = 100 } = stateRef.current;
    if (typeof startVal !== "number") return;
    let moved = false;
    if (!isTouch) {
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    }
    startDrag(
      (ev) => {
        const dx = ev.clientX - startX;
        if (!moved && Math.abs(dx) > 2) moved = true;
        if (!moved) return;
        const next = Math.round((startVal + dx * s * (ev.shiftKey ? 0.02 : 0.15)) / s) * s;
        stateRef.current.onChange(Math.max(mn, Math.min(mx, next)));
      },
      () => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      },
    );
  };

  return (
    <span ref={numRef} className="ln-hero-code-value ln-hero-code-value--number" onPointerDown={handlePointerDown}>
      {formatValue(Number(value), step ?? 1)}
    </span>
  );
}

const COLOR_PRESETS = ["#A855F7", "#7C3AED", "#6366F1", "#3B82F6", "#06B6D4", "#10B981", "#EAB308", "#F97316", "#EF4444", "#EC4899"];

function ColorValue({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const [open, setOpen] = useState(false);
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const wrapRef = useRef<HTMLSpanElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const hsvRef = useRef(hsv);
  hsvRef.current = hsv;

  useEffect(() => {
    if (open) return;
    const next = hexToHsv(value);
    setHsv(next);
    hsvRef.current = next;
  }, [value, open]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onClickOutside);
    return () => document.removeEventListener("pointerdown", onClickOutside);
  }, [open]);

  const applyHsv = useCallback(
    (next: { h: number; s: number; v: number }) => {
      hsvRef.current = next;
      setHsv(next);
      onChange(hsvToHex(next.h, next.s, next.v));
    },
    [onChange],
  );

  const hueColor = hsvToHex(hsv.h, 1, 1);

  return (
    <span ref={wrapRef} className="ln-hero-code-value ln-hero-code-value--color">
      <span className="ln-hero-code-swatch" style={{ background: value }} onClick={() => setOpen((o) => !o)} />
      <span onClick={() => setOpen((o) => !o)}>{`"${value}"`}</span>
      {open ? (
        <div className="ln-hero-color-picker">
          <div
            ref={areaRef}
            className="ln-hero-color-picker-area"
            onPointerDown={(e) => {
              e.preventDefault();
              const update = (ev: PointerEvent) => {
                const rect = areaRef.current!.getBoundingClientRect();
                applyHsv({
                  h: hsvRef.current.h,
                  s: Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width)),
                  v: 1 - Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height)),
                });
              };
              update(e.nativeEvent);
              startDrag(update);
            }}
            style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})` }}
          >
            <div className="ln-hero-color-picker-thumb" style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }} />
          </div>
          <div
            ref={hueRef}
            className="ln-hero-color-picker-hue"
            onPointerDown={(e) => {
              e.preventDefault();
              const update = (ev: PointerEvent) => {
                const rect = hueRef.current!.getBoundingClientRect();
                applyHsv({
                  s: hsvRef.current.s,
                  v: hsvRef.current.v,
                  h: Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width)) * 360,
                });
              };
              update(e.nativeEvent);
              startDrag(update);
            }}
          >
            <div className="ln-hero-color-picker-thumb" style={{ left: `${(hsv.h / 360) * 100}%`, top: "50%" }} />
          </div>
          <div className="ln-hero-color-picker-presets">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                className="ln-hero-color-picker-preset"
                style={{
                  background: c,
                  borderColor: value.toLowerCase() === c.toLowerCase() ? "#fff" : "rgba(255,255,255,0.12)",
                }}
                onClick={() => {
                  const next = hexToHsv(c);
                  setHsv(next);
                  onChange(c);
                }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </span>
  );
}

function InteractiveCode({
  def,
  values,
  onChange,
}: {
  def: typeof COLOR_BENDS;
  values: Values;
  onChange: (name: string, value: string | number | boolean) => void;
}) {
  return (
    <pre className="ln-hero-code-pre">
      <code>
        <span className="c-kw">import</span>
        <span className="c-punc">{" { "}</span>
        <span className="c-comp">{def.component}</span>
        <span className="c-punc">{" } "}</span>
        <span className="c-kw">from</span>
        <span className="c-str">{` '@components/${def.component}';`}</span>
        {"\n\n"}
        <span className="c-kw">function</span>
        <span className="c-fn"> App</span>
        <span className="c-punc">{"() {"}</span>
        {"\n  "}
        <span className="c-kw">return</span>
        <span className="c-punc"> (</span>
        {"\n    "}
        <span className="c-comp">{"<"}</span>
        <span className="c-comp">{def.component}</span>
        {def.props.map((prop) => (
          <span key={prop.name}>
            {"\n      "}
            <span className="c-attr">{prop.name}</span>
            <span className="c-punc">=</span>
            {prop.type === "color" ? (
              <EditableValue type="color" value={values[prop.name]} onChange={(v) => onChange(prop.name, v)} />
            ) : (
              <>
                <span className="c-punc">{"{"}</span>
                <EditableValue
                  type={prop.type}
                  value={values[prop.name]}
                  onChange={(v) => onChange(prop.name, v)}
                  min={prop.type === "number" ? prop.min : undefined}
                  max={prop.type === "number" ? prop.max : undefined}
                  step={prop.type === "number" ? prop.step : undefined}
                />
                <span className="c-punc">{"}"}</span>
              </>
            )}
          </span>
        ))}
        {"\n    "}
        <span className="c-comp">{"/>"}</span>
        {"\n  "}
        <span className="c-punc">)</span>
        {"\n"}
        <span className="c-punc">{"}"}</span>
      </code>
    </pre>
  );
}

export function HeroPlayground() {
  const { snap, hydrated, commit } = usePlayground();
  const [propValues, setPropValues] = useState<Values>(() => ({
    ...defaultsFromDef(),
    ...snap.values,
  }));
  const [activePreset, setActivePreset] = useState<number | null>(snap.preset);
  const [presetFade, setPresetFade] = useState({ from: null as number | null, to: 0 as number | null, e: 1 });
  const propValuesRef = useRef(propValues);
  propValuesRef.current = propValues;
  const activePresetRef = useRef(activePreset);
  activePresetRef.current = activePreset;
  const stopTweenRef = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    if (!hydrated) return;
    const next = { ...defaultsFromDef(), ...snap.values };
    setPropValues((prev) => {
      const same = COLOR_BENDS.props.every((prop) => prev[prop.name] === next[prop.name]);
      return same ? prev : next;
    });
    setActivePreset((prev) => (prev === snap.preset ? prev : snap.preset));
  }, [hydrated, snap]);

  const handlePropChange = useCallback(
    (name: string, value: string | number | boolean) => {
      stopTweenRef.current?.();
      stopTweenRef.current = null;
      setActivePreset(null);
      setPresetFade({ from: null, to: null, e: 1 });
      const next = { ...propValuesRef.current, [name]: value };
      setPropValues(next);
      commit({ values: next, preset: null });
    },
    [commit],
  );

  const applyPreset = useCallback(
    (presetIndex: number) => {
    const preset = SCENE_PRESETS[presetIndex];
    if (!preset) return;
    stopTweenRef.current?.();
    const previous = activePresetRef.current;
    setActivePreset(presetIndex);
    setPresetFade({ from: previous, to: presetIndex, e: 0 });
    const from = propValuesRef.current;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / PRESET_DURATION);
      const e = t >= 1 ? 1 : EASE_IN_OUT(t);
      const b = preset.values as Values;
      const out: Values = { ...from };
      for (const prop of COLOR_BENDS.props) {
        if (!(prop.name in b)) continue;
        if (prop.type === "color") out[prop.name] = lerpColor(String(from[prop.name]), String(b[prop.name]), e);
        else if (prop.type === "number") {
          const v = lerp(Number(from[prop.name]), Number(b[prop.name]), e);
          out[prop.name] = prop.step >= 1 ? Math.round(v) : v;
        } else {
          out[prop.name] = b[prop.name];
        }
      }
      setPropValues(out);
      setPresetFade({ from: previous, to: presetIndex, e });
      if (t < 1) raf = requestAnimationFrame(step);
      else {
        commit({ values: out, preset: presetIndex });
        stopTweenRef.current = null;
      }
    };
    raf = requestAnimationFrame(step);
    stopTweenRef.current = () => cancelAnimationFrame(raf);
  },
  [commit],
);

  const hasChanges = useMemo(
    () => COLOR_BENDS.props.some((p) => propValues[p.name] !== p.default),
    [propValues],
  );

  const resetProps = useCallback(() => {
    stopTweenRef.current?.();
    stopTweenRef.current = null;
    const defaults = defaultsFromDef();
    setActivePreset(0);
    setPresetFade({ from: null, to: 0, e: 1 });
    setPropValues(defaults);
    commit({ values: defaults, preset: 0 });
  }, [commit]);

  useEffect(() => {
    return () => {
      stopTweenRef.current?.();
      commit({ values: propValuesRef.current, preset: activePresetRef.current });
    };
  }, [commit]);

  const accentColor = String(propValues.color);
  const { accentFg, accentText, accentGlow } = useMemo(() => {
    const [ar, ag, ab] = parseHexRgb(accentColor);
    const lum = (0.2126 * ar + 0.7152 * ag + 0.0722 * ab) / 255;
    const hsv = hexToHsv(accentColor);
    return {
      accentFg: lum > 0.5 ? "#000" : "#fff",
      accentText: hsvToHex(hsv.h, Math.min(hsv.s, 0.7), Math.max(hsv.v, 0.92)),
      accentGlow: `0 0 24px rgba(${ar}, ${ag}, ${ab}, 0.3), 0 0 64px rgba(${ar}, ${ag}, ${ab}, 0.14)`,
    };
  }, [accentColor]);

  const presetStyle = useCallback(
    (index: number) => {
      const fading = presetFade.from !== null;
      let weight = 0;
      if (!fading) weight = activePreset === index ? 1 : 0;
      else if (index === presetFade.to) weight = presetFade.e;
      else if (index === presetFade.from) weight = 1 - presetFade.e;
      if (weight <= 0) return undefined;
      return {
        color: chipTint(accentText, weight),
        background: `rgba(255, 255, 255, ${(0.07 * weight).toFixed(4)})`,
        transition: fading ? "none" : undefined,
      } as React.CSSProperties;
    },
    [presetFade, activePreset, accentText],
  );

  useEffect(() => {
    applyAccent(accentColor);
  }, [accentColor]);

  const band = propValues;

  return (
    <section className="ln-hero">
      <HeroBackdrop
        color={String(band.color)}
        speed={Number(band.speed)}
        frequency={Number(band.frequency)}
        noise={Number(band.noise)}
        bandWidth={Number(band.bandWidth)}
        rotation={Number(band.rotation)}
        fadeTop={Number(band.fadeTop)}
        iterations={Number(band.iterations)}
        intensity={Number(band.intensity)}
      />

      <div className="ln-hero-content">
        <div className="ln-hero-left">
          <Link href="/team" className="ln-hero-tag">
            <span className="ln-hero-tag-new" style={{ background: accentColor, color: accentFg }}>
              26
            </span>
            студия цифровых продуктов
          </Link>
          <h1 className="ln-hero-headline">
            <span className="ln-hero-headline-line">Сайты с характером.</span>
            <span className="ln-hero-headline-line" style={{ color: accentText, textShadow: accentGlow }}>
              Сервисы без лишнего.
            </span>
          </h1>
          <p className="ln-hero-description">
            Проектируем и собираем целиком: от сетки экрана до логики кабинета и Telegram.
          </p>
          <div className="ln-hero-buttons">
            <Link
              href="/contact"
              className="ln-hero-btn ln-hero-btn-primary"
              style={{ background: accentColor, borderColor: accentColor, color: accentFg }}
            >
              Обсудить проект
            </Link>
            <Link href="/works" className="ln-hero-btn ln-hero-btn-secondary">
              Смотреть кейсы
            </Link>
          </div>
          <ul className="ln-hero-proof">
            <li>Сайты</li>
            <li aria-hidden className="ln-hero-proof-sep" />
            <li>Сервисы</li>
            <li aria-hidden className="ln-hero-proof-sep" />
            <li>Telegram</li>
            <li aria-hidden className="ln-hero-proof-sep" />
            <li>Сопровождение</li>
          </ul>
        </div>

        <div className="ln-hero-right">
          <div className="ln-hero-code-window">
            <div className="ln-hero-code-titlebar">
              <div className="ln-hero-code-dots">
                <span />
                <span />
                <span />
              </div>
              <div className="ln-hero-code-titlebar-actions">
                <button
                  type="button"
                  className="ln-hero-code-reset"
                  onClick={resetProps}
                  aria-label="Сбросить"
                  disabled={!hasChanges}
                >
                  ↺
                </button>
                <span className="ln-hero-code-label">{COLOR_BENDS.label}</span>
              </div>
            </div>
            <div className="ln-hero-code-body">
              <InteractiveCode def={COLOR_BENDS} values={propValues} onChange={handlePropChange} />
            </div>
            <div className="ln-hero-code-footer">
              <div className="ln-hero-code-presets" role="group" aria-label="Presets">
                {SCENE_PRESETS.map((preset, i) => (
                  <button key={preset.label} type="button" className="ln-hero-code-preset" style={presetStyle(i)} onClick={() => applyPreset(i)}>
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
