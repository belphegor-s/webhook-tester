/*
 * SignalField: the landing hero background, and a small simulation of what the product does.
 *
 * The page is a halftone dot matrix. Requests are packets this component schedules: each one enters from the edge
 * of the hero, rides an eased lane into the endpoint pill (`sinkRef`) and lights up the dots it passes, coloured by
 * its HTTP method. When it lands, a pulse shaped like the pill's own rounded outline ripples out across the grid,
 * and `onArrive` fires so the live feed in the hero receives the same request at the same moment.
 *
 * On narrow screens packets fall from the top into the pill instead of running in from the sides. Dots dim behind
 * the headline (`quietRef`) so the words always sit on a calm field, and grow a little under the pointer.
 *
 * It is decoration, so it never costs the page anything: WebGL2 or nothing (the hero still reads without it), a lost
 * context hides the canvas, reduced motion or Save-Data draws one still frame, the loop stops off screen or in a
 * background tab (and its clock stops with it, so nothing bursts on return), slow frames drop the resolution, and it
 * never takes pointer events.
 */
import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import { cn } from '../../lib/utils';

const MAX_PACKETS = 8;
const MAX_PULSES = 4;

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragment = `#version 300 es
precision highp float;

#define MAX_PACKETS ${MAX_PACKETS}
#define MAX_PULSES ${MAX_PULSES}

uniform vec2  uRes;
uniform float uTime;
uniform float uDpr;
uniform float uCell;
uniform vec3  uInk;
uniform float uBase;
uniform float uFade;
uniform vec4  uSink;   // pill centre xy, half size zw
uniform float uSinkR;  // pill corner radius
uniform vec4  uQuiet;  // headline box: centre xy, half size zw
uniform vec2  uMouse;
uniform float uMouseAmt;
uniform vec4  uPkPath[MAX_PACKETS];  // start xy, end xy
uniform vec4  uPkTime[MAX_PACKETS];  // start time, duration, vertical, alive
uniform vec3  uPkColor[MAX_PACKETS];
uniform vec4  uPulse[MAX_PULSES];    // start time, rgb

out vec4 fragColor;

// All lengths are in device pixels with y up, like gl_FragCoord.

float hash(vec2 p) {
  p = fract(p * vec2(443.897, 441.423));
  p += dot(p, p.yx + 19.19);
  return fract((p.x + p.y) * p.x);
}

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float sdBox(vec2 p, vec2 b) {
  vec2 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

void main() {
  // Every pixel shades the dot of its own cell, so the field is evaluated once per dot centre.
  vec2 cell = floor(gl_FragCoord.xy / uCell);
  vec2 c = (cell + 0.5) * uCell;
  float rnd = hash(cell);

  float pkE = 0.0;   // energy from packets and pulses, carries their colour
  vec3 pkC = vec3(0.0);
  float inkE = 0.0;  // energy drawn in the ink colour (halo, pointer)

  float sigma = uCell * 1.05;
  float trailLen = 210.0 * uDpr;

  for (int i = 0; i < MAX_PACKETS; i++) {
    vec4 tm = uPkTime[i];
    if (tm.w < 0.5) continue;
    float prog = (uTime - tm.x) / tm.y;
    if (prog < 0.0 || prog > 1.7) continue;

    // Lanes are eased curves along their main axis; vertical lanes are solved in swapped coordinates.
    vec4 path = uPkPath[i];
    vec2 a = path.xy;
    vec2 b = path.zw;
    vec2 p = c;
    if (tm.z > 0.5) { a = a.yx; b = b.yx; p = p.yx; }
    float span = b.x - a.x;
    float u = (p.x - a.x) / span;
    if (u < 0.0 || u > 1.0) continue;

    float e = u * u * (3.0 - 2.0 * u);
    float slope = (b.y - a.y) * 6.0 * u * (1.0 - u) / span;
    float d = abs(p.y - mix(a.y, b.y, e)) / sqrt(1.0 + slope * slope);
    float across = exp(-d * d / (2.0 * sigma * sigma));
    if (across < 0.01) continue;

    // The head accelerates off the edge, lands at full speed, then keeps "draining" into the pill so the
    // trail slides in behind it instead of vanishing.
    float head = prog < 1.0 ? pow(prog, 1.35) : 1.0 + (prog - 1.0) * 1.35;
    float behind = (head - u) * abs(span);
    float tail = behind >= 0.0 ? exp(-3.2 * behind / trailLen) : exp(behind / (uCell * 0.7));
    // A faint wire shows where an in-flight packet is headed.
    float wire = 0.07 * smoothstep(0.0, 0.08, prog) * (1.0 - smoothstep(0.95, 1.2, prog));
    float k = across * (tail + wire);
    pkE += k;
    pkC += uPkColor[i] * k;
  }

  // Arrival pulses expand from the pill's outline, slowing and widening as they fade.
  float sd = sdRoundBox(c - uSink.xy, uSink.zw, uSinkR);
  for (int j = 0; j < MAX_PULSES; j++) {
    vec4 pl = uPulse[j];
    float age = uTime - pl.x;
    if (pl.x < 0.0 || age < 0.0 || age > 1.9) continue;
    float r = 380.0 * uDpr * (1.0 - exp(-age * 1.9));
    float w = uCell * (0.9 + age * 1.6);
    float life = 1.0 - age / 1.9;
    float k = exp(-pow(sd - r, 2.0) / (2.0 * w * w)) * life * life * 0.95;
    pkE += k;
    pkC += pl.yzw * k;
  }

  // A soft halo hugs the pill, the receiver.
  inkE += exp(-max(sd, 0.0) / (uCell * 2.2)) * 0.22;

  // Pointer lens.
  float dm = distance(c, uMouse);
  inkE += exp(-dm * dm / (2.0 * pow(72.0 * uDpr, 2.0))) * 0.32 * uMouseAmt;

  // Idle grid: a slow diagonal swell, plus the odd dot that blinks like a status light.
  float swell = 0.5 + 0.5 * sin((c.x * 0.55 + c.y) / uRes.y * 5.0 - uTime * 0.32);
  float blink = pow(max(0.0, sin(uTime * (0.35 + rnd * 0.5) + rnd * 120.0)), 60.0);
  float base = uBase * (0.55 + 0.45 * swell) + uBase * 2.6 * blink;

  // Calm behind the headline.
  float quiet = smoothstep(-24.0 * uDpr, 72.0 * uDpr, sdBox(c - uQuiet.xy, uQuiet.zw));
  base *= mix(0.2, 1.0, quiet);
  pkE *= mix(0.3, 1.0, quiet);
  inkE *= mix(0.3, 1.0, quiet);

  float energy = clamp(pkE + inkE, 0.0, 1.0);
  float alpha = clamp(base + energy * (1.0 - base), 0.0, 1.0);
  vec3 col = (uInk * (base + inkE) + pkC) / max(base + inkE + pkE, 1e-4);

  // Halftone: brighter dots are also larger, up to nearly touching their neighbours.
  float radius = mix(0.75 * uDpr, uCell * 0.44, smoothstep(0.0, 1.0, energy));
  float dist = length(gl_FragCoord.xy - c);
  float cover = 1.0 - smoothstep(radius - 0.75, radius + 0.75, dist);

  float a = cover * alpha * uFade;
  fragColor = vec4(col * a, a);
}`;

// Resolves any CSS colour (oklch included) to 0..1 sRGB by painting one pixel.
const createColorReader = () => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  return (css, fallback) => {
    if (!ctx || !css) return fallback;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return [r / 255, g / 255, b / 255];
  };
};

const rand = (min, max) => min + Math.random() * (max - min);

/**
 * @param sinkRef   element packets fly into (its rounded outline shapes the arrival pulse)
 * @param quietRef  element the field calms down behind
 * @param pick      () => data for the next request; must include `colorVar`, a CSS custom property such as '--success'
 * @param onArrive  (data) => void, called when that request's packet lands
 */
export function SignalField({ sinkRef, quietRef, pick, onArrive, className }) {
  const containerRef = useRef(null);
  const callbacks = useRef({});
  callbacks.current = { pick, onArrive };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches || Boolean(navigator.connection?.saveData);
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    let renderer;
    try {
      renderer = new Renderer({ webgl: 2, alpha: true, premultipliedAlpha: true, antialias: false, depth: false, dpr, powerPreference: 'low-power' });
    } catch {
      return;
    }
    const gl = renderer.gl;
    if (!gl || !renderer.isWebgl2) return;

    const canvas = gl.canvas;
    gl.clearColor(0, 0, 0, 0);
    Object.assign(canvas.style, { display: 'block', width: '100%', height: '100%' });
    container.appendChild(canvas);

    const uniforms = {
      uRes: { value: [1, 1] },
      uTime: { value: 0 },
      uDpr: { value: dpr },
      uCell: { value: 11 * dpr },
      uInk: { value: [1, 1, 1] },
      uBase: { value: 0.14 },
      uFade: { value: 0 },
      uSink: { value: [0, 0, 1, 1] },
      uSinkR: { value: 0 },
      uQuiet: { value: [0, 0, 0, 0] },
      uMouse: { value: [-1e4, -1e4] },
      uMouseAmt: { value: 0 },
      uPkPath: { value: Array.from({ length: MAX_PACKETS }, () => [0, 0, 1, 1]) },
      uPkTime: { value: Array.from({ length: MAX_PACKETS }, () => [0, 1, 0, 0]) },
      uPkColor: { value: Array.from({ length: MAX_PACKETS }, () => [1, 1, 1]) },
      uPulse: { value: Array.from({ length: MAX_PULSES }, () => [-1, 1, 1, 1]) },
    };

    let program;
    try {
      program = new Program(gl, { vertex, fragment, uniforms });
    } catch {
      container.removeChild(canvas);
      return;
    }
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    // Theme colours, refreshed whenever the root's class (light/dark) changes.
    const readColor = createColorReader();
    const palette = new Map();
    const colorOf = (cssVar) => {
      if (!palette.has(cssVar)) palette.set(cssVar, readColor(getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim(), [1, 1, 1]));
      return palette.get(cssVar);
    };
    const applyTheme = () => {
      palette.clear();
      const dark = document.documentElement.classList.contains('dark');
      uniforms.uInk.value = colorOf('--foreground');
      uniforms.uBase.value = dark ? 0.15 : 0.17;
    };
    applyTheme();

    // Layout, in device pixels with y up.
    const callbacksEl = { sink: () => sinkRef?.current, quiet: () => quietRef?.current };
    const layout = { w: 1, h: 1, wide: true, sink: { x: 0, y: 0, hw: 1, hh: 1 } };
    const rectIn = (el, box) => {
      const r = el.getBoundingClientRect();
      return { x: (r.left - box.left + r.width / 2) * dpr, y: (box.bottom - r.top - r.height / 2) * dpr, hw: (r.width / 2) * dpr, hh: (r.height / 2) * dpr };
    };
    const measure = () => {
      const box = container.getBoundingClientRect();
      if (!box.width || !box.height) return false;
      renderer.dpr = dpr;
      renderer.setSize(box.width, box.height);
      layout.w = canvas.width;
      layout.h = canvas.height;
      layout.wide = box.width >= 640;
      uniforms.uRes.value = [layout.w, layout.h];
      uniforms.uDpr.value = dpr;
      uniforms.uCell.value = (layout.wide ? 11 : 10) * dpr;

      const sinkEl = callbacksEl.sink();
      const s = sinkEl ? rectIn(sinkEl, box) : { x: layout.w / 2, y: layout.h / 2, hw: 1, hh: 1 };
      layout.sink = s;
      uniforms.uSink.value = [s.x, s.y, s.hw, s.hh];
      uniforms.uSinkR.value = sinkEl ? Math.min(parseFloat(getComputedStyle(sinkEl).borderTopLeftRadius) || 0, s.hh / dpr) * dpr : 0;

      const quietEl = callbacksEl.quiet();
      const q = quietEl ? rectIn(quietEl, box) : { x: 0, y: 0, hw: 0, hh: 0 };
      uniforms.uQuiet.value = [q.x, q.y, q.hw, q.hh];
      return true;
    };

    // Packets and pulses.
    const packets = Array.from({ length: MAX_PACKETS }, () => ({ alive: false }));
    const pulses = Array.from({ length: MAX_PULSES }, () => ({ t0: -1, colorVar: '--foreground' }));
    let pulseIndex = 0;
    let clock = 0;
    let nextSpawn = 0.5;
    let burst = 0;

    const launch = (slot, t0, data) => {
      const { w, h, wide, sink } = layout;
      const pad = 24 * dpr;
      let start;
      let end;
      if (wide) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const y0 = Math.min(Math.max(sink.y + rand(-0.32, 0.55) * h, h * 0.06), h * 0.96);
        start = [side < 0 ? -pad : w + pad, y0];
        end = [sink.x + side * (sink.hw - 6 * dpr), sink.y + rand(-0.35, 0.35) * sink.hh];
      } else {
        start = [rand(0.04, 0.96) * w, h + pad];
        end = [sink.x + rand(-0.75, 0.75) * sink.hw, sink.y + sink.hh - 4 * dpr];
      }
      const dist = Math.hypot(end[0] - start[0], end[1] - start[1]);
      Object.assign(slot, { alive: true, arrived: false, t0, dur: Math.min(Math.max(dist / (560 * dpr), 1.2), 3), vertical: !wide, start, end, data });
    };

    const spawn = () => {
      const slot = packets.find((p) => !p.alive);
      const data = callbacks.current.pick?.();
      if (!slot || !data) return;
      launch(slot, clock, data);
    };

    const step = () => {
      if (clock >= nextSpawn) {
        spawn();
        // Now and then a provider retries or batches: a quick burst of two or three.
        if (burst > 0) {
          burst -= 1;
          nextSpawn = clock + rand(0.16, 0.3);
        } else {
          if (Math.random() < 0.18) burst = Math.random() < 0.5 ? 1 : 2;
          nextSpawn = clock + rand(0.9, 2.1);
        }
      }
      for (const p of packets) {
        if (!p.alive) continue;
        const prog = (clock - p.t0) / p.dur;
        if (!p.arrived && prog >= 1) {
          p.arrived = true;
          const pulse = pulses[pulseIndex];
          pulseIndex = (pulseIndex + 1) % MAX_PULSES;
          pulse.t0 = clock;
          pulse.colorVar = p.data.colorVar;
          callbacks.current.onArrive?.(p.data);
        }
        if (prog > 1.7) p.alive = false;
      }
    };

    const upload = () => {
      packets.forEach((p, i) => {
        const time = uniforms.uPkTime.value[i];
        time[3] = p.alive ? 1 : 0;
        if (!p.alive) return;
        uniforms.uPkPath.value[i].splice(0, 4, p.start[0], p.start[1], p.end[0], p.end[1]);
        time[0] = p.t0;
        time[1] = p.dur;
        time[2] = p.vertical ? 1 : 0;
        uniforms.uPkColor.value[i].splice(0, 3, ...colorOf(p.data.colorVar));
      });
      pulses.forEach((pl, i) => {
        uniforms.uPulse.value[i].splice(0, 4, pl.t0, ...colorOf(pl.colorVar));
      });
    };

    const mouse = { x: -1e4, y: -1e4, amt: 0, target: 0 };
    const smooth = { x: -1e4, y: -1e4 };
    let fade = reducedMotion ? 1 : 0;

    const draw = () => {
      upload();
      smooth.x += (mouse.x - smooth.x) * 0.12;
      smooth.y += (mouse.y - smooth.y) * 0.12;
      mouse.amt += (mouse.target - mouse.amt) * 0.06;
      uniforms.uMouse.value = [smooth.x, smooth.y];
      uniforms.uMouseAmt.value = mouse.amt;
      uniforms.uTime.value = clock;
      uniforms.uFade.value = fade;
      renderer.render({ scene: mesh });
    };

    // Reduced motion: one composed frame with a few requests mid-flight and one just landed.
    const still = () => {
      clock = 40;
      const progress = [0.38, 0.55, 0.7, 0.82, 0.92];
      progress.forEach((at, i) => {
        const data = callbacks.current.pick?.();
        if (!data) return;
        const slot = packets[i];
        launch(slot, 0, data);
        slot.t0 = clock - at * slot.dur;
        if (i === 0) Object.assign(pulses[0], { t0: clock - 0.22, colorVar: data.colorVar });
      });
    };

    let lost = false;
    const onLost = (e) => {
      e.preventDefault();
      lost = true;
      canvas.style.visibility = 'hidden';
    };
    canvas.addEventListener('webglcontextlost', onLost);

    const onMove = (e) => {
      if (e.pointerType === 'touch') return;
      const r = container.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * dpr;
      mouse.y = (r.bottom - e.clientY) * dpr;
      if (smooth.x < -1e3) Object.assign(smooth, { x: mouse.x, y: mouse.y });
      mouse.target = e.clientY >= r.top && e.clientY <= r.bottom ? 1 : 0;
    };
    const onLeave = () => {
      mouse.target = 0;
    };

    let visible = true;
    const io = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
    });
    io.observe(container);

    const redrawStill = () => {
      if (!lost && measure()) draw();
    };
    // Resizing clears the canvas, so a still frame has to be drawn again.
    let disposed = false;
    const remeasure = () => {
      if (disposed) return;
      if (reducedMotion) redrawStill();
      else measure();
    };
    const ro = new ResizeObserver(remeasure);
    ro.observe(container);
    [sinkRef?.current, quietRef?.current].forEach((el) => el && ro.observe(el));
    // Entrance animations move the hero copy for a moment after mount; measure again once they settle.
    const settle = window.setTimeout(remeasure, 1100);
    document.fonts?.ready.then(remeasure).catch(() => {});

    const mo = new MutationObserver(() => {
      applyTheme();
      if (reducedMotion) redrawStill();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    measure();

    let raf = 0;
    if (reducedMotion) {
      still();
      draw();
    } else {
      window.addEventListener('pointermove', onMove, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);

      // Sustained slow frames lower the resolution (2x -> 1x -> 0.5x). If even that is too slow, drawing stops on the
      // last frame while the simulation keeps feeding the hero's request list.
      const degrade = () => {
        const next = dpr > 1 ? 1 : dpr > 0.5 ? 0.5 : null;
        if (next === null) {
          frozen = true;
          return;
        }
        const ratio = next / dpr;
        dpr = next;
        packets.forEach((p) => {
          if (!p.alive) return;
          p.start = p.start.map((v) => v * ratio);
          p.end = p.end.map((v) => v * ratio);
        });
        measure();
      };

      let last = null;
      let slowFrames = 0;
      let frames = 0;
      let frozen = false;
      const loop = (t) => {
        raf = requestAnimationFrame(loop);
        if (!visible || document.hidden) {
          last = null;
          return;
        }
        const dt = last === null ? 1 / 60 : (t - last) / 1000;
        last = t;
        // The clock only runs while the hero is on screen, and never jumps more than a frame or two.
        clock += Math.min(dt, 1 / 20);
        step();
        if (lost || frozen) return;

        fade = Math.min(1, fade + dt / 1.2);
        if (frames++ > 30) {
          slowFrames = dt > 1 / 40 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
          if (slowFrames > 45) {
            slowFrames = 0;
            frames = 0;
            degrade();
          }
        }
        draw();
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('webglcontextlost', onLost);
      if (canvas.parentNode === container) container.removeChild(canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [sinkRef, quietRef]);

  return <div ref={containerRef} aria-hidden="true" className={cn('pointer-events-none absolute inset-0', className)} />;
}
