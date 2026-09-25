/*
 * Topography: inspired by React Bits (https://reactbits.dev/backgrounds/topography)
 * Copyright (c) David Haz. MIT + Commons Clause License.
 * Own shader: domain-warped fbm height field drawn as anti-aliased contour lines with
 * stronger "index" contours, gentle pointer bump, fade-in, dithering, theme-aware colour,
 * reduced-motion and visibility handling. Requires WebGL2 (silently skipped otherwise).
 */
import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import { cn } from '../../lib/utils';

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragment = `#version 300 es
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform vec3  uColor;
uniform float uOpacity;
uniform float uFade;
uniform float uBands;
uniform vec2  uMouse;
uniform float uMouseAmt;

out vec4 fragColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

void main() {
  // Height-normalised coordinates keep the terrain scale consistent across aspect ratios.
  vec2 uv = gl_FragCoord.xy / uRes.y;
  float t = uTime * 0.025;

  vec2 q = uv * 0.95;
  vec2 warp = vec2(fbm(q + vec2(0.0, t)), fbm(q + vec2(5.2, -t)));
  float h = fbm(q + 1.4 * warp + vec2(t * 0.6, 0.0));

  // Soft hill under the pointer.
  vec2 m = uMouse * vec2(uRes.x / uRes.y, 1.0);
  float dm = distance(uv, m);
  h += exp(-dm * dm / 0.03) * 0.06 * uMouseAmt;

  float f = h * uBands;
  float fr = fract(f);
  float ld = min(fr, 1.0 - fr);
  float aa = max(fwidth(f), 1e-4);

  // Every 5th contour is an index line: a touch thicker and brighter.
  float major = step(mod(floor(f + 0.5), 5.0), 0.5);
  float halfWidth = mix(0.35, 0.8, major) * aa;
  float line = 1.0 - smoothstep(halfWidth, halfWidth + aa, ld);

  float a = line * mix(0.55, 1.0, major) * uOpacity * uFade;
  a += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  a = clamp(a, 0.0, 1.0);

  fragColor = vec4(uColor * a, a);
}`;

export function Topography({ color = [1, 1, 1], opacity = 0.14, bands = 16, className }) {
  const containerRef = useRef(null);
  const propsRef = useRef({});
  propsRef.current = { color, opacity, bands };
  const redrawRef = useRef(null);
  const colorKey = color.join(',');

  useEffect(() => {
    redrawRef.current?.();
  }, [colorKey, opacity, bands]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer;
    try {
      renderer = new Renderer({ webgl: 2, alpha: true, premultipliedAlpha: true, antialias: false, dpr: Math.min(window.devicePixelRatio || 1, 1.5) });
    } catch {
      return;
    }
    const gl = renderer.gl;
    if (!gl || !renderer.isWebgl2) return; // Shader needs GLSL 3.00 (fwidth); skip decoration otherwise.

    gl.clearColor(0, 0, 0, 0);
    Object.assign(gl.canvas.style, { display: 'block', width: '100%', height: '100%' });
    container.appendChild(gl.canvas);

    const uniforms = {
      uRes: { value: [1, 1] },
      uTime: { value: 0 },
      uColor: { value: [1, 1, 1] },
      uOpacity: { value: 0 },
      uFade: { value: 0 },
      uBands: { value: 22 },
      uMouse: { value: [0.5, 0.5] },
      uMouseAmt: { value: 0 },
    };
    const program = new Program(gl, { vertex, fragment, uniforms });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Start the terrain at a random point in time so each visit looks a little different.
    const timeOffset = Math.random() * 400;
    const mouse = { x: 0.5, y: 0.5, amt: 0, targetAmt: 0 };
    const smooth = { x: 0.5, y: 0.5 };
    let start = null;

    const draw = (t) => {
      const p = propsRef.current;
      if (start === null) start = t;
      smooth.x += (mouse.x - smooth.x) * 0.06;
      smooth.y += (mouse.y - smooth.y) * 0.06;
      mouse.amt += (mouse.targetAmt - mouse.amt) * 0.04;
      uniforms.uColor.value = p.color;
      uniforms.uOpacity.value = p.opacity;
      uniforms.uBands.value = p.bands;
      uniforms.uFade.value = reducedMotion ? 1 : Math.min(1, (t - start) / 1600) ** 2;
      uniforms.uMouse.value = [smooth.x, smooth.y];
      uniforms.uMouseAmt.value = mouse.amt;
      uniforms.uTime.value = timeOffset + t * 0.001;
      renderer.render({ scene: mesh });
    };

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = container;
      if (!w || !h) return;
      renderer.setSize(w, h);
      uniforms.uRes.value = [gl.canvas.width, gl.canvas.height];
      if (reducedMotion) draw(0);
    };

    const onMove = (e) => {
      if (e.pointerType === 'touch') return;
      const r = container.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) / r.width;
      mouse.y = 1 - (e.clientY - r.top) / r.height;
      mouse.targetAmt = 1;
    };
    const onLeave = () => {
      mouse.targetAmt = 0;
    };
    if (!reducedMotion) {
      window.addEventListener('pointermove', onMove, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);
    }

    let visible = true;
    const io = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
    });
    io.observe(container);
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    let raf = 0;
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      draw(t);
    };
    if (reducedMotion) {
      redrawRef.current = () => draw(0);
      draw(0);
    } else raf = requestAnimationFrame(loop);

    return () => {
      redrawRef.current = null;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      if (gl.canvas.parentNode === container) container.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return <div ref={containerRef} aria-hidden="true" className={cn('pointer-events-none absolute inset-0', className)} />;
}
