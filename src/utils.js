export const PX = 66;
export const START = 7;
export const END = 23;

export const toTop = (h, m) => ((h - START) + m / 60) * PX;
export const toH   = (dur)  => dur * PX;

export const evtStartMin = (e) => e.h * 60 + e.m;
export const evtEndMin   = (e) => evtStartMin(e) + e.dur * 60;

export function fmt(h, m, dur) {
  const endMin = h * 60 + m + Math.round(dur * 60);
  const eh = Math.floor(endMin / 60);
  const em = endMin % 60;
  return `${h}:${String(m).padStart(2,'0')} — ${eh}:${String(em).padStart(2,'0')}`;
}

export const pad2 = (n) => String(n).padStart(2, '0');

let audioCtx = null;
export function playBell() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1100, 660].forEach((freq, i) => {
      const osc  = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = audioCtx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.start(t);
      osc.stop(t + 0.65);
    });
  } catch (e) {}
}
