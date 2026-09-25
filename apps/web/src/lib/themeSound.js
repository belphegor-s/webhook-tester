// A soft water-drop "bloop" for theme changes, synthesised with Web Audio so there's no asset to load.
// A short rising sine gives the drop, and two fainter, higher echoes give the ripple. Dark lands a little lower than light.

let ctx;

const context = () => {
  if (ctx) return ctx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  ctx = new AudioCtx();
  return ctx;
};

const drop = (ac, out, { at, from, to, peak, decay }) => {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(to, at + 0.07);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  osc.connect(gain).connect(out);
  osc.start(at);
  osc.stop(at + decay + 0.02);
};

// `soft` plays a quieter version, for a choice that doesn't change what's on screen.
export const playThemeSound = (resolved, { soft = false } = {}) => {
  try {
    const ac = context();
    if (!ac) return;
    if (ac.state === 'suspended') ac.resume();

    const base = resolved === 'dark' ? 330 : 440;
    const level = soft ? 0.5 : 1;
    const now = ac.currentTime + 0.01;

    // Rounds off any click and keeps the tone warm.
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2400;
    filter.connect(ac.destination);

    drop(ac, filter, { at: now, from: base, to: base * 2.4, peak: 0.07 * level, decay: 0.22 });
    drop(ac, filter, { at: now + 0.09, from: base * 1.5, to: base * 3, peak: 0.022 * level, decay: 0.18 });
    drop(ac, filter, { at: now + 0.17, from: base * 2, to: base * 3.6, peak: 0.009 * level, decay: 0.16 });
  } catch {
    // Audio is decoration: ignore autoplay policies and missing support.
  }
};
