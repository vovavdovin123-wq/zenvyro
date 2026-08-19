"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const MAX_COLORS = 8;

const frag = `
#define MAX_COLORS 8
uniform vec2 uCanvas;
uniform float uTime;
uniform float uSpeed;
uniform vec2 uRot;
uniform int uColorCount;
uniform vec3 uColors[MAX_COLORS];
uniform int uTransparent;
uniform float uScale;
uniform float uFrequency;
uniform float uWarpStrength;
uniform vec2 uPointer;
uniform float uMouseInfluence;
uniform float uParallax;
uniform float uNoise;
uniform int uIterations;
uniform float uIntensity;
uniform float uBandWidth;
varying vec2 vUv;

void main() {
  float t = uTime * uSpeed;
  vec2 p = vUv * 2.0 - 1.0;
  p += uPointer * uParallax * 0.1;
  vec2 rp = vec2(p.x * uRot.x - p.y * uRot.y, p.x * uRot.y + p.y * uRot.x);
  vec2 q = vec2(rp.x * (uCanvas.x / uCanvas.y), rp.y);
  q /= max(uScale, 0.0001);
  q /= 0.5 + 0.2 * dot(q, q);
  q += 0.2 * cos(t) - 7.56;
  vec2 toward = (uPointer - rp);
  q += toward * uMouseInfluence * 0.2;

  for (int j = 0; j < 5; j++) {
    if (j >= uIterations - 1) break;
    vec2 rr = sin(1.5 * (q.yx * uFrequency) + 2.0 * cos(q * uFrequency));
    q += (rr - q) * 0.15;
  }

  vec3 col = vec3(0.0);
  float a = 1.0;
  vec2 s = q;
  vec3 sumCol = vec3(0.0);
  float cover = 0.0;
  for (int i = 0; i < MAX_COLORS; ++i) {
    if (i >= uColorCount) break;
    s -= 0.01;
    vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
    float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(i)) / 4.0);
    float kBelow = clamp(uWarpStrength, 0.0, 1.0);
    float kMix = pow(kBelow, 0.3);
    float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
    vec2 warped = s + (r - s) * kBelow * gain;
    float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(i)) / 4.0);
    float m = mix(m0, m1, kMix);
    float w = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
    sumCol += uColors[i] * w;
    cover = max(cover, w);
  }
  col = clamp(sumCol, 0.0, 1.0);
  a = uTransparent > 0 ? cover : 1.0;
  col *= uIntensity;
  if (uNoise > 0.0001) {
    float n = fract(sin(dot(gl_FragCoord.xy + vec2(uTime), vec2(12.9898, 78.233))) * 43758.5453);
    col += (n - 0.5) * uNoise;
    col = clamp(col, 0.0, 1.0);
  }
  gl_FragColor = vec4(uTransparent > 0 ? col * a : col, a);
}
`;

const vert = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

type ColorBendsProps = {
  className?: string;
  colors?: string[];
  speed?: number;
  scale?: number;
  frequency?: number;
  intensity?: number;
  transparent?: boolean;
};

export function ColorBends({
  className = "",
  colors = ["#5227FF", "#FF9FFC", "#7C3AED"],
  speed = 0.2,
  scale = 1,
  frequency = 1,
  intensity = 1.15,
  transparent = true,
}: ColorBendsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const colorsRef = useRef(colors);
  const paintRef = useRef<(list: string[]) => void>(() => undefined);

  useEffect(() => {
    colorsRef.current = colors;
    paintRef.current(colors);
  }, [colors]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const uColorsArray = Array.from({ length: MAX_COLORS }, () => new THREE.Vector3());
    const material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uCanvas: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uSpeed: { value: speed },
        uRot: { value: new THREE.Vector2(1, 0) },
        uColorCount: { value: 0 },
        uColors: { value: uColorsArray },
        uTransparent: { value: transparent ? 1 : 0 },
        uScale: { value: scale },
        uFrequency: { value: frequency },
        uWarpStrength: { value: 1 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uMouseInfluence: { value: 0.35 },
        uParallax: { value: 0.45 },
        uNoise: { value: 0.12 },
        uIterations: { value: 2 },
        uIntensity: { value: intensity },
        uBandWidth: { value: 6 },
      },
      transparent: true,
      premultipliedAlpha: true,
    });
    materialRef.current = material;
    scene.add(new THREE.Mesh(geometry, material));

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    const pointer = new THREE.Vector2(0, 0);
    const pointerTarget = new THREE.Vector2(0, 0);
    let raf = 0;
    let running = true;
    let elapsed = 0;
    let last = performance.now();

    const applyColors = (list: string[]) => {
      const toVec = (hex: string) => {
        const h = hex.replace("#", "");
        return new THREE.Vector3(
          Number.parseInt(h.slice(0, 2), 16) / 255,
          Number.parseInt(h.slice(2, 4), 16) / 255,
          Number.parseInt(h.slice(4, 6), 16) / 255,
        );
      };
      const arr = list.filter(Boolean).slice(0, MAX_COLORS).map(toVec);
      for (let i = 0; i < MAX_COLORS; i += 1) {
        if (i < arr.length) (material.uniforms.uColors.value as THREE.Vector3[])[i].copy(arr[i]);
        else (material.uniforms.uColors.value as THREE.Vector3[])[i].set(0, 0, 0);
      }
      material.uniforms.uColorCount.value = arr.length;
    };
    paintRef.current = applyColors;
    applyColors(colorsRef.current);

    const resize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
      renderer.setSize(w, h, false);
      (material.uniforms.uCanvas.value as THREE.Vector2).set(w, h);
    };

    const onMove = (e: PointerEvent) => {
      const box = container.getBoundingClientRect();
      pointerTarget.set(((e.clientX - box.left) / box.width) * 2 - 1, -(((e.clientY - box.top) / box.height) * 2 - 1));
    };

    const loop = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;
      material.uniforms.uTime.value = elapsed;
      pointer.lerp(pointerTarget, Math.min(1, dt * 6));
      (material.uniforms.uPointer.value as THREE.Vector2).copy(pointer);
      const rad = ((90 + elapsed * 4) * Math.PI) / 180;
      (material.uniforms.uRot.value as THREE.Vector2).set(Math.cos(rad), Math.sin(rad));
      renderer.render(scene, camera);
    };

    const tryStart = () => {
      if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(loop);
      } else if (!raf) raf = requestAnimationFrame(loop);
    };
    const tryStop = () => {
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) tryStart();
        else tryStop();
      },
      { threshold: 0 },
    );
    io.observe(container);

    const onVisibility = () => {
      if (document.hidden) tryStop();
      else tryStart();
    };
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      tryStop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) container.removeChild(renderer.domElement);
    };
  }, [frequency, intensity, scale, speed, transparent]);

  return <div ref={containerRef} className={`h-full w-full ${className}`} />;
}
