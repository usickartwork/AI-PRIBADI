// ─── Usick Survival — tiny procedural audio (WebAudio, no asset files) ───────

export type Sfx = "chop" | "gather" | "pickup" | "craft" | "eat" | "hurt" | "hit" | "step" | "build" | "swing" | "error" | "door";

export class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private ambientGain: GainNode | null = null;
  private ambientSrc: AudioBufferSourceNode | null = null;
  private fireGain: GainNode | null = null;
  private enabled = true;
  private volume = 0.6;
  private birdTimer = 0;
  private crackleTimer = 0;

  /** Must be called from a user gesture (autoplay policy). */
  unlock() {
    if (typeof window === "undefined") return;
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.enabled ? this.volume : 0;
        this.master.connect(this.ctx.destination);
        const len = this.ctx.sampleRate * 2;
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.startAmbient();
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  setEnabled(on: boolean, volume: number) {
    this.enabled = on;
    this.volume = volume;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(on ? volume : 0, this.ctx.currentTime, 0.05);
  }

  suspend() {
    if (this.ctx && this.ctx.state === "running") void this.ctx.suspend();
  }
  resume() {
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
  }

  private startAmbient() {
    if (!this.ctx || !this.master || !this.noiseBuf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    const g = this.ctx.createGain();
    g.gain.value = 0.05;
    src.connect(lp).connect(g).connect(this.master);
    src.start();
    this.ambientSrc = src;
    this.ambientGain = g;
    const fg = this.ctx.createGain();
    fg.gain.value = 0;
    fg.connect(this.master);
    this.fireGain = fg;
  }

  /** Called every frame with ambient context. */
  update(dt: number, isNight: boolean, fireProximity: number) {
    if (!this.ctx || !this.enabled || this.ctx.state !== "running") return;
    if (this.ambientGain) this.ambientGain.gain.setTargetAtTime(isNight ? 0.035 : 0.05, this.ctx.currentTime, 0.5);
    if (this.fireGain) this.fireGain.gain.setTargetAtTime(fireProximity * 0.5, this.ctx.currentTime, 0.2);
    this.birdTimer -= dt;
    if (this.birdTimer <= 0) {
      this.birdTimer = 4 + Math.random() * 9;
      if (!isNight) this.chirp();
      else this.cricket();
    }
    if (fireProximity > 0.05) {
      this.crackleTimer -= dt;
      if (this.crackleTimer <= 0) {
        this.crackleTimer = 0.05 + Math.random() * 0.25;
        this.noiseBurst(0.03, 2500 + Math.random() * 2500, 0.25, this.fireGain);
      }
    }
  }

  private chirp() {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const st = t + i * 0.13;
      const f = 2400 + Math.random() * 1600;
      o.frequency.setValueAtTime(f, st);
      o.frequency.exponentialRampToValueAtTime(f * 1.4, st + 0.07);
      g.gain.setValueAtTime(0, st);
      g.gain.linearRampToValueAtTime(0.025, st + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.09);
      o.connect(g).connect(this.master);
      o.start(st);
      o.stop(st + 0.1);
    }
  }

  private cricket() {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const st = t + i * 0.06;
      o.frequency.value = 4200;
      g.gain.setValueAtTime(0, st);
      g.gain.linearRampToValueAtTime(0.012, st + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.04);
      o.connect(g).connect(this.master);
      o.start(st);
      o.stop(st + 0.05);
    }
  }

  private noiseBurst(dur: number, freq: number, gain: number, dest?: AudioNode | null, type: BiquadFilterType = "bandpass") {
    if (!this.ctx || !this.master || !this.noiseBuf) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(dest ?? this.master);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.02);
  }

  private tone(freq: number, dur: number, gain: number, type: OscillatorType = "sine", slideTo?: number, delay = 0) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  play(s: Sfx) {
    if (!this.ctx || !this.enabled || this.ctx.state !== "running") return;
    switch (s) {
      case "chop":
        this.noiseBurst(0.12, 700, 0.6);
        this.tone(140, 0.12, 0.25, "triangle", 80);
        break;
      case "gather":
        this.noiseBurst(0.15, 1800, 0.35, null, "highpass");
        break;
      case "pickup":
        this.tone(660, 0.08, 0.15, "sine", 990);
        this.tone(990, 0.1, 0.12, "sine", 1320, 0.07);
        break;
      case "craft":
        this.tone(523, 0.12, 0.15, "triangle");
        this.tone(659, 0.12, 0.15, "triangle", undefined, 0.1);
        this.tone(784, 0.2, 0.15, "triangle", undefined, 0.2);
        break;
      case "eat":
        for (let i = 0; i < 3; i++) setTimeout(() => this.noiseBurst(0.06, 1200, 0.35), i * 110);
        break;
      case "hurt":
        this.tone(220, 0.25, 0.3, "sawtooth", 90);
        break;
      case "hit":
        this.noiseBurst(0.1, 400, 0.6, null, "lowpass");
        this.tone(180, 0.1, 0.2, "square", 60);
        break;
      case "step":
        this.noiseBurst(0.05, 350, 0.12, null, "lowpass");
        break;
      case "build":
        this.noiseBurst(0.1, 500, 0.5);
        this.tone(200, 0.15, 0.2, "triangle", 120, 0.05);
        break;
      case "swing":
        this.noiseBurst(0.12, 900, 0.15, null, "bandpass");
        break;
      case "error":
        this.tone(200, 0.15, 0.15, "square", 150);
        break;
      case "door":
        this.tone(160, 0.25, 0.12, "sawtooth", 260);
        break;
    }
  }

  dispose() {
    try {
      this.ambientSrc?.stop();
    } catch {
      /* ignore */
    }
    if (this.ctx) void this.ctx.close().catch(() => {});
    this.ctx = null;
  }
}

