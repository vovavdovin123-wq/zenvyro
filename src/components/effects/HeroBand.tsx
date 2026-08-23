"use client";

import { memo, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { glDpr, isCoarsePointer } from "@/lib/glBudget";

const frag = `
precision mediump float;
uniform vec2 uCanvas;
uniform float uTime;
uniform float uSpeed;
uniform vec2 uRot;
uniform vec3 uColor;
uniform float uScale;
uniform float uFrequency;
uniform float uWarpStrength;
uniform float uNoise;
uniform float uBandWidth;
uniform float uYOffset;
uniform float uFadeTop;
uniform vec2 uPointer;
uniform float uMouseInfluence;
uniform int uIterations;
uniform float uIntensity;
varying vec2 vUv;

void main() {
  float t = uTime * uSpeed;
  vec2 uv = vUv;
  uv.y += uYOffset;
  vec2 p = uv * 2.0 - 1.0;
  vec2 rp = vec2(p.x * uRot.x - p.y * uRot.y, p.x * uRot.y + p.y * uRot.x);
  float aspect = uCanvas.x / uCanvas.y;
  vec2 q = vec2(rp.x * aspect, rp.y);
  float invScale = 1.0 / max(uScale, 0.0001);
  q *= invScale;
  q /= 0.5 + 0.2 * dot(q, q);
  q += (uPointer - rp) * uMouseInfluence * 0.2;
  q += 0.2 * cos(t) - 7.56;

  for (int i = 0; i < 5; i++) {
    if (i >= uIterations) break;
    vec2 r = sin(1.5 * (q.yx * uFrequency) + 2.0 * cos(q * uFrequency));
    q = q + (r - q) * uWarpStrength;
  }

  float m = length(q + sin(5.0 * q.y * uFrequency - 3.0 * t) * 0.25);
  float w = 1.0 - exp(-6.0 / exp(6.0 * m));
  w = pow(clamp(w, 0.0, 1.0), uBandWidth);
  w *= smoothstep(uFadeTop, 0.0, vUv.y);
  w *= uIntensity;

  vec3 col = uColor * w;
  col += (fract(sin(dot(gl_FragCoord.xy + vec2(uTime), vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * uNoise;
  col = clamp(col, 0.0, 1.0) * w;

  gl_FragColor = vec4(col, w);
}
`;

const vert = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

type HeroBandProps = {
  className?: string;
  style?: React.CSSProperties;
  color?: string;
  rotation?: number;
  speed?: number;
  scale?: number;
  frequency?: number;
  warpStrength?: number;
  noise?: number;
  bandWidth?: number;
  yOffset?: number;
  fadeTop?: number;
  mouseInfluence?: number;
  iterations?: number;
  intensity?: number;
};

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return Boolean(gl);
  } catch {
    return false;
  }
}

export const HeroBand = memo(function HeroBand({
  className = "",
  style,
  color = "#A855F7",
  rotation = 90,
  speed = 0.2,
  scale = 1,
  frequency = 1,
  warpStrength = 1,
  noise = 0.15,
  bandWidth = 0.14,
  yOffset = 0.3,
  fadeTop = 0.75,
  mouseInfluence = 0.3,
  iterations = 1,
  intensity = 1.25,
}: HeroBandProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(hasWebGL());
  }, []);

  useEffect(() => {
    if (!supported) return;
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uCanvas: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uSpeed: { value: speed },
        uRot: { value: new THREE.Vector2(1, 0) },
        uColor: { value: new THREE.Vector3(0.66, 0.33, 0.97) },
        uScale: { value: scale },
        uFrequency: { value: frequency },
        uWarpStrength: { value: warpStrength },
        uNoise: { value: noise },
        uBandWidth: { value: bandWidth },
        uYOffset: { value: yOffset },
        uFadeTop: { value: fadeTop },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uMouseInfluence: { value: mouseInfluence },
        uIterations: { value: iterations },
        uIntensity: { value: intensity },
      },
      premultipliedAlpha: true,
      transparent: true,
    });
    materialRef.current = material;
    scene.add(new THREE.Mesh(geometry, material));

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: "high-performance",
        alpha: true,
      });
    } catch {
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.imageRendering = "auto";
    container.appendChild(renderer.domElement);

    const pointerTarget = new THREE.Vector2(0, 0);
    const pointerCurrent = new THREE.Vector2(0, 0);
    const rect = { left: 0, top: 0, width: 1, height: 1 };
    let raf = 0;
    let running = true;
    let last = performance.now();
    let lastW = 0;
    let lastH = 0;
    const coarse = isCoarsePointer();
    if (coarse) material.uniforms.uMouseInfluence.value = 0;

    const handleResize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      if (lastW === w && Math.abs(lastH - h) < 120 && lastW > 0) return;
      lastW = w;
      lastH = h;
      renderer.setPixelRatio(glDpr(h));
      renderer.setSize(w, h, false);
      material.uniforms.uCanvas.value.set(w, h);
      const bounds = container.getBoundingClientRect();
      rect.left = bounds.left;
      rect.top = bounds.top;
      rect.width = bounds.width;
      rect.height = bounds.height;
    };

    const handlePointer = (event: MouseEvent) => {
      if (coarse) return;
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      pointerTarget.set(x, y);
    };

    const loop = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      material.uniforms.uTime.value += dt;
      pointerCurrent.lerp(pointerTarget, Math.min(1, dt * 4));
      material.uniforms.uPointer.value.copy(pointerCurrent);
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
        const box = entry.boundingClientRect;
        const onScreen =
          entry.isIntersecting ||
          (box.width > 8 &&
            box.height > 8 &&
            box.bottom > 0 &&
            box.top < (window.innerHeight || 1) &&
            box.right > 0 &&
            box.left < (window.innerWidth || 1));
        if (onScreen) tryStart();
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

    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);
    if (!coarse) window.addEventListener("mousemove", handlePointer, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      tryStop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
      window.removeEventListener("mousemove", handlePointer);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported]);

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.uSpeed.value = speed;
    material.uniforms.uScale.value = scale;
    material.uniforms.uFrequency.value = frequency;
    material.uniforms.uWarpStrength.value = warpStrength;
    material.uniforms.uNoise.value = noise;
    material.uniforms.uBandWidth.value = bandWidth;
    material.uniforms.uYOffset.value = yOffset;
    material.uniforms.uFadeTop.value = fadeTop;
    material.uniforms.uMouseInfluence.value = isCoarsePointer() ? 0 : mouseInfluence;
    material.uniforms.uIterations.value = iterations;
    material.uniforms.uIntensity.value = intensity;
    const hex = color.replace("#", "").trim();
    material.uniforms.uColor.value.set(
      Number.parseInt(hex.slice(0, 2), 16) / 255,
      Number.parseInt(hex.slice(2, 4), 16) / 255,
      Number.parseInt(hex.slice(4, 6), 16) / 255,
    );
    const rad = (rotation * Math.PI) / 180;
    material.uniforms.uRot.value.set(Math.cos(rad), Math.sin(rad));
  }, [
    bandWidth,
    color,
    fadeTop,
    frequency,
    intensity,
    iterations,
    mouseInfluence,
    noise,
    rotation,
    scale,
    speed,
    warpStrength,
    yOffset,
  ]);

  if (!supported) return null;
  return <div ref={containerRef} className={className} style={{ width: "100%", height: "100%", ...style }} />;
});
