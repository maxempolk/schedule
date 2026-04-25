export const PX = 66;
export const START = 7;
export const END = 23;

export const toTop = (h: number, m: number): number => ((h - START) + m / 60) * PX;
export const toH = (dur: number): number => dur * PX;

export interface Event {
  h: number;
  m: number;
  dur: number;
  label: string;
  type: string;
}

export const evtStartMin = (e: Event): number => e.h * 60 + e.m;
export const evtEndMin = (e: Event): number => evtStartMin(e) + e.dur * 60;

export function fmt(h: number, m: number, dur: number): string {
  const endMin = h * 60 + m + Math.round(dur * 60);
  const eh = Math.floor(endMin / 60);
  const em = endMin % 60;
  return `${h}:${String(m).padStart(2, '0')} — ${eh}:${String(em).padStart(2, '0')}`;
}

export const pad2 = (n: number): string => String(n).padStart(2, '0');

let audioCtx: AudioContext | null = null;

export function playBell(): void {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    [880, 1100, 660].forEach((freq, i) => {
      const osc = audioCtx!.createOscillator();
      const gain = audioCtx!.createGain();
      osc.connect(gain);
      gain.connect(audioCtx!.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = audioCtx!.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.start(t);
      osc.stop(t + 0.65);
    });
  } catch (e) {
    // Ignore audio context errors
  }
}
