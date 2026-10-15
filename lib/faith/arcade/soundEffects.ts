// =========================================================================
// POU AUTHENTIC WEB AUDIO SYNTHESIZED SOUND EFFECTS ENGINE
// Optimized for iOS (iPhone Safari / WebKit), Android & Desktop
// Automatically bypasses iOS silent/ambient switch muting using 'playback' session
// =========================================================================

let audioCtx: AudioContext | null = null;
let isAudioUnlocked = false;

// 44-byte silent WAV data URI for waking iOS WebKit audio pipeline
const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

/**
 * Configure audio session and retrieve or initialize AudioContext
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  // 1. Force iOS Safari audio session to 'playback' (iOS 16.4+)
  // This bypasses the physical Silent Switch / Mute ring switch on iPhone!
  if ('audioSession' in navigator) {
    try {
      (navigator as unknown as { audioSession: { type: string } }).audioSession.type = 'playback';
    } catch {}
  }

  try {
    if (!audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }

    if (audioCtx && (audioCtx.state === 'suspended' || (audioCtx.state as string) === 'interrupted')) {
      audioCtx.resume().catch(() => {});
    }

    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Explicit user-interaction audio unlocker for iOS Safari
 */
export function unlockAudio() {
  if (typeof window === 'undefined') return;

  // 1. Set playback session category for iOS
  if ('audioSession' in navigator) {
    try {
      (navigator as unknown as { audioSession: { type: string } }).audioSession.type = 'playback';
    } catch {}
  }

  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') {
      ctx.resume().catch(() => {});
    }

    // Play 1-sample silent buffer synchronously inside user gesture
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch {}
  }

  // Play silent HTML5 audio as fallback hardware wake-up for iOS WebKit
  if (!isAudioUnlocked) {
    try {
      const audio = new Audio(SILENT_WAV);
      audio.volume = 0.01;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            isAudioUnlocked = true;
          })
          .catch(() => {});
      }
    } catch {}
  }
}

// Auto-bind one-shot unlocker on first touch or click anywhere in the window
if (typeof window !== 'undefined') {
  const handleFirstGesture = () => {
    unlockAudio();
    window.removeEventListener('touchstart', handleFirstGesture);
    window.removeEventListener('touchend', handleFirstGesture);
    window.removeEventListener('click', handleFirstGesture);
  };

  window.addEventListener('touchstart', handleFirstGesture, { passive: true, capture: true });
  window.addEventListener('touchend', handleFirstGesture, { passive: true, capture: true });
  window.addEventListener('click', handleFirstGesture, { passive: true, capture: true });
}

/**
 * Helper to execute sound synthesis safely with resume fallback
 */
function runWithContext(fn: (ctx: AudioContext) => void) {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') {
    ctx
      .resume()
      .then(() => {
        try {
          fn(ctx);
        } catch {}
      })
      .catch(() => {});
  } else {
    try {
      fn(ctx);
    } catch {}
  }
}

/**
 * 1. POU CUTE TAP / SQUEAK ("Mbee! / Yay!")
 * Authentic high-pitch bouncy sine sweep with soft decay
 */
export function playPouHappy() {
  runWithContext((ctx) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    // Upward chirp and wobble
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(1150, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(820, now + 0.16);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.24);
  });
}

/**
 * 2. POU EAT / CHOMP ("Nom nom crunch!")
 * Two-stage crunchy bite with filtered noise & pitch drop
 */
export function playPouEat() {
  runWithContext((ctx) => {
    const now = ctx.currentTime;

    // Bite 1: Crunch noise
    const bufferSize = Math.floor(ctx.sampleRate * 0.08);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(3, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.28, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    // Bite 2: Tonal Chomp Tone
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.14);

    oscGain.gain.setValueAtTime(0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  });
}

/**
 * 3. POU SOAP BUBBLE BLOOP ("Bloop!")
 * Fast upward water bubble pop
 */
export function playPouBubble() {
  runWithContext((ctx) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const startFreq = 340 + Math.random() * 80;
    const endFreq = 880 + Math.random() * 120;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.07);

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  });
}

/**
 * 4. POU SHOWER WATER RUSH ("Shhhh-splash!")
 * Filtered continuous running water rush
 */
export function playPouShower() {
  runWithContext((ctx) => {
    const now = ctx.currentTime;
    const duration = 1.1;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.frequency.linearRampToValueAtTime(1600, now + 0.5);
    filter.frequency.linearRampToValueAtTime(800, now + duration);
    filter.Q.setValueAtTime(1.8, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.15);
    gain.gain.linearRampToValueAtTime(0.24, now + duration - 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + duration);
  });
}

/**
 * 5. POU CLEAN SPARKLE ("Tinkle ding!")
 * Magical 4-note ascending bell chime
 */
export function playPouSparkle() {
  runWithContext((ctx) => {
    const notes = [1046, 1318, 1567, 2093]; // C6, E6, G6, C7
    notes.forEach((freq, idx) => {
      const noteTime = ctx.currentTime + idx * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.38);
    });
  });
}

/**
 * 6. POU BEDSIDE LAMP CLICK ("Cl-click!")
 * Crisp tactile mechanical switch sound
 */
export function playPouLampClick() {
  runWithContext((ctx) => {
    const now = ctx.currentTime;

    // Click 1 (Snap)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(2600, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.03);

    // Click 2 (Spring body resonance, 35ms later)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(540, now + 0.035);
    gain2.gain.setValueAtTime(0.3, now + 0.035);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.035);
    osc2.stop(now + 0.1);
  });
}

/**
 * 7. POU ROOM SLIDE WHOOSH ("Swoosh!")
 * Gentle air displacement sound when switching rooms
 */
export function playPouSlide() {
  runWithContext((ctx) => {
    const now = ctx.currentTime;
    const duration = 0.22;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.linearRampToValueAtTime(950, now + 0.1);
    filter.frequency.linearRampToValueAtTime(320, now + duration);
    filter.Q.setValueAtTime(2, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + duration);
  });
}

/**
 * 8. POU BALL BOUNCE / CATCH ("Boi-ing!")
 * Playful springy boing
 */
export function playPouBallBounce() {
  runWithContext((ctx) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.09);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.18);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  });
}

/**
 * 9. POU COIN CLINK ("Ding!")
 * Bright twin high frequency pickup tone
 */
export function playPouCoin() {
  runWithContext((ctx) => {
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987, now); // B5
    osc1.frequency.setValueAtTime(1318, now + 0.07); // E6

    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.32);
  });
}

