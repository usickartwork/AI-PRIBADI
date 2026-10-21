// Neon Drift Audio Synthesizer via Web Audio API
// 0 audio files, 0 bandwidth, 100% offline

let audioCtx: AudioContext | null = null;
let engineOsc: OscillatorNode | null = null;
let engineGain: GainNode | null = null;
let driftGain: GainNode | null = null;
let driftOsc: OscillatorNode | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function startEngineSound(enabled = true): void {
  if (!enabled) return;
  const ctx = getContext();
  if (!ctx) return;

  if (!engineOsc) {
    try {
      engineOsc = ctx.createOscillator();
      engineGain = ctx.createGain();

      engineOsc.type = "sawtooth";
      engineOsc.frequency.setValueAtTime(45, ctx.currentTime);
      engineGain.gain.setValueAtTime(0.04, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(350, ctx.currentTime);

      engineOsc.connect(filter);
      filter.connect(engineGain);
      engineGain.connect(ctx.destination);

      engineOsc.start();
    } catch {}
  }
}

export function updateEnginePitch(speedRatio: number, enabled = true): void {
  if (!enabled || !engineOsc || !audioCtx) return;
  try {
    const clamped = Math.max(0, Math.min(1, speedRatio));
    const targetFreq = 45 + clamped * 120; // 45Hz idle to 165Hz max rev
    engineOsc.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.05);
  } catch {}
}

export function stopEngineSound(): void {
  if (engineOsc) {
    try {
      engineOsc.stop();
      engineOsc.disconnect();
    } catch {}
    engineOsc = null;
  }
  if (engineGain) {
    try {
      engineGain.disconnect();
    } catch {}
    engineGain = null;
  }
  stopDriftSound();
}

export function startDriftSound(enabled = true): void {
  if (!enabled) return;
  const ctx = getContext();
  if (!ctx) return;

  if (!driftOsc) {
    try {
      driftOsc = ctx.createOscillator();
      driftGain = ctx.createGain();

      driftOsc.type = "square";
      driftOsc.frequency.setValueAtTime(480, ctx.currentTime);
      driftGain.gain.setValueAtTime(0.05, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.Q.setValueAtTime(3, ctx.currentTime);

      driftOsc.connect(filter);
      filter.connect(driftGain);
      driftGain.connect(ctx.destination);

      driftOsc.start();
    } catch {}
  }
}

export function stopDriftSound(): void {
  if (driftOsc) {
    try {
      driftOsc.stop();
      driftOsc.disconnect();
    } catch {}
    driftOsc = null;
  }
  if (driftGain) {
    try {
      driftGain.disconnect();
    } catch {}
    driftGain = null;
  }
}

export function playCountdownBeep(isGo = false, enabled = true): void {
  if (!enabled) return;
  const ctx = getContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = "sine";
    const freq = isGo ? 880 : 440;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.35 : 0.18));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + (isGo ? 0.36 : 0.2));
  } catch {}
}

export function playLapFanfare(enabled = true): void {
  if (!enabled) return;
  const ctx = getContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.08;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.32);
    });
  } catch {}
}
