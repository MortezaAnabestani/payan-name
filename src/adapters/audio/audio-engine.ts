type Timeout = ReturnType<typeof setTimeout>;

export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private hum: OscillatorNode | null = null;
  private lamp: OscillatorNode | null = null;
  private roomNoise: AudioBufferSourceNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private muted = false;
  private hushTimer: Timeout | null = null;

  ensure(): void {
    if (this.context) {
      if (this.context.state === "suspended") {
        void this.context.resume();
      }
      return;
    }
    if (typeof window === "undefined") return;
    const Context =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return;

    this.context = new Context();
    this.master = this.context.createGain();
    this.master.gain.value = this.muted ? 0 : 0.55;
    this.master.connect(this.context.destination);
    this.noiseBuffer = this.createNoise();
    this.startRoom();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(
        muted ? 0 : 0.55,
        this.context.currentTime,
        0.04,
      );
    }
  }

  scratch(): void {
    this.noiseBurst({
      duration: 0.06,
      volume: 0.1,
      filter: "bandpass",
      frequency: 1700 + Math.random() * 1300,
      q: 0.8,
    });
  }

  crumple(): void {
    this.noiseBurst({
      duration: 0.5,
      volume: 0.3,
      filter: "lowpass",
      frequency: 760,
      playbackRate: 0.7,
    });
  }

  footstep(intensity = 0.4, pan = 0): void {
    if (!this.context || !this.master || !this.noiseBuffer) return;
    const now = this.context.currentTime;
    const source = this.context.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.playbackRate.value = 0.55;
    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 300 + intensity * 300;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.02 + intensity * 0.16, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    const panner = this.context.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    source.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.master);
    source.start(now);
    source.stop(now + 0.18);
  }

  knock(): void {
    this.thump(92, 0.2, 0.34, 0);
    this.thump(86, 0.24, 0.3, 0.19);
  }

  drawer(): void {
    this.noiseBurst({
      duration: 0.22,
      volume: 0.2,
      filter: "bandpass",
      frequency: 620,
      q: 1.3,
    });
    this.tone(164, 0.1, 0.05, 0.06);
  }

  tear(): void {
    this.noiseBurst({
      duration: 0.34,
      volume: 0.26,
      filter: "highpass",
      frequency: 1100,
      playbackRate: 1.2,
    });
    this.noiseBurst({
      duration: 0.2,
      volume: 0.15,
      filter: "highpass",
      frequency: 1700,
      delay: 0.08,
    });
  }

  stamp(): void {
    this.thump(70, 0.16, 0.3, 0);
    this.noiseBurst({
      duration: 0.05,
      volume: 0.12,
      filter: "bandpass",
      frequency: 1400,
      delay: 0.01,
    });
  }

  penDown(): void {
    this.thump(120, 0.12, 0.16, 0);
    this.noiseBurst({
      duration: 0.08,
      volume: 0.08,
      filter: "bandpass",
      frequency: 900,
      delay: 0.02,
    });
  }

  motif(): void {
    this.tone(330, 1.6, 0.035, 0);
    this.tone(440, 1.8, 0.03, 0.16);
    this.tone(392, 2.1, 0.022, 0.34);
  }

  /** خشِ برس روی کاغذِ درهم (U2). */
  brush(intensity = 0.5): void {
    this.noiseBurst({
      duration: 0.05 + Math.min(0.05, intensity * 0.05),
      volume: 0.06 + Math.min(0.06, intensity * 0.06),
      filter: "bandpass",
      frequency: 850 + Math.random() * 950,
      q: 0.7,
      playbackRate: 1.05,
    });
  }

  /** ذراتِ تازه که نویز را از نو می‌سازند (U2). */
  dust(): void {
    this.noiseBurst({
      duration: 0.16,
      volume: 0.05,
      filter: "highpass",
      frequency: 2500,
      playbackRate: 1.3,
    });
  }

  /** لحظهٔ خوانا شدن عبارت روی کاغذِ درهم (U2). */
  surface(): void {
    this.tone(520, 0.9, 0.03, 0);
    this.tone(780, 1.2, 0.022, 0.12);
    this.tone(624, 1.5, 0.015, 0.3);
  }

  /** نسیمِ حیاط آسایشگاه (U3). */
  wind(): void {
    this.noiseBurst({
      duration: 0.7,
      volume: 0.03,
      filter: "bandpass",
      frequency: 480,
      q: 0.5,
      playbackRate: 0.85,
    });
  }

  /** همهمهٔ زیرزمین (U3). */
  murmur(): void {
    this.noiseBurst({
      duration: 0.5,
      volume: 0.045,
      filter: "lowpass",
      frequency: 700,
      playbackRate: 0.9,
    });
    this.tone(196, 0.5, 0.012, 0.08);
  }

  /** انژکسیون در درمانگاه (U3). */
  needle(): void {
    this.noiseBurst({
      duration: 0.06,
      volume: 0.05,
      filter: "highpass",
      frequency: 3200,
      playbackRate: 1.2,
    });
    this.tone(1320, 0.12, 0.02, 0.02);
  }

  /** ناله از حیاط — فقط صدا، بی‌حضور (U3). */
  wail(): void {
    this.tone(233, 1.5, 0.026, 0);
    this.tone(196, 1.8, 0.02, 0.22);
    this.tone(261, 1.2, 0.012, 0.5);
  }

  /** درِ چوبی حیاط (U3). */
  door(): void {
    this.noiseBurst({
      duration: 0.28,
      volume: 0.05,
      filter: "bandpass",
      frequency: 340,
      q: 0.9,
      playbackRate: 0.8,
    });
  }

  chime(): void {
    this.tone(660, 0.22, 0.05, 0);
    this.tone(990, 0.35, 0.035, 0.08);
  }

  thud(): void {
    this.thump(110, 0.3, 0.25, 0);
  }

  hush(duration = 1800): void {
    if (!this.context || !this.master) return;
    if (this.hushTimer) clearTimeout(this.hushTimer);
    this.master.gain.setTargetAtTime(0.0001, this.context.currentTime, 0.03);
    this.hushTimer = setTimeout(() => {
      if (!this.context || !this.master) return;
      this.master.gain.setTargetAtTime(
        this.muted ? 0 : 0.55,
        this.context.currentTime,
        0.45,
      );
    }, duration);
  }

  dispose(): void {
    if (this.hushTimer) clearTimeout(this.hushTimer);
    this.hum?.stop();
    this.hum?.disconnect();
    this.lamp?.stop();
    this.lamp?.disconnect();
    this.roomNoise?.stop();
    this.roomNoise?.disconnect();
    this.hum = null;
    this.lamp = null;
    this.roomNoise = null;
    if (this.context) {
      void this.context.close();
    }
    this.context = null;
    this.master = null;
    this.noiseBuffer = null;
  }

  private startRoom(): void {
    if (!this.context || !this.master || !this.noiseBuffer) return;
    const now = this.context.currentTime;

    this.hum = this.context.createOscillator();
    const humGain = this.context.createGain();
    this.hum.type = "sine";
    this.hum.frequency.value = 47;
    humGain.gain.value = 0.016;
    this.hum.connect(humGain);
    humGain.connect(this.master);
    this.hum.start(now);

    this.lamp = this.context.createOscillator();
    const lampGain = this.context.createGain();
    this.lamp.type = "triangle";
    this.lamp.frequency.value = 100;
    lampGain.gain.value = 0.0035;
    this.lamp.connect(lampGain);
    lampGain.connect(this.master);
    this.lamp.start(now);

    this.roomNoise = this.context.createBufferSource();
    this.roomNoise.buffer = this.noiseBuffer;
    this.roomNoise.loop = true;
    this.roomNoise.playbackRate.value = 0.4;
    const roomFilter = this.context.createBiquadFilter();
    roomFilter.type = "lowpass";
    roomFilter.frequency.value = 260;
    const roomGain = this.context.createGain();
    roomGain.gain.value = 0.012;
    this.roomNoise.connect(roomFilter);
    roomFilter.connect(roomGain);
    roomGain.connect(this.master);
    this.roomNoise.start(now);
  }

  private noiseBurst({
    duration,
    volume,
    filter,
    frequency,
    q = 0.7,
    playbackRate = 1,
    delay = 0,
  }: {
    duration: number;
    volume: number;
    filter: BiquadFilterType;
    frequency: number;
    q?: number;
    playbackRate?: number;
    delay?: number;
  }): void {
    if (!this.context || !this.master || !this.noiseBuffer) return;
    const start = this.context.currentTime + delay;
    const source = this.context.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.playbackRate.value = playbackRate;
    const node = this.context.createBiquadFilter();
    node.type = filter;
    node.frequency.value = frequency;
    node.Q.value = q;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(node);
    node.connect(gain);
    gain.connect(this.master);
    source.start(start);
    source.stop(start + duration + 0.02);
  }

  private thump(
    frequency: number,
    duration: number,
    volume: number,
    delay: number,
  ): void {
    if (!this.context || !this.master) return;
    const start = this.context.currentTime + delay;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, start);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(36, frequency * 0.5),
      start + duration,
    );
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  private tone(
    frequency: number,
    duration: number,
    volume: number,
    delay = 0,
  ): void {
    if (!this.context || !this.master) return;
    const start = this.context.currentTime + delay;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  private createNoise(): AudioBuffer | null {
    if (!this.context) return null;
    const length = this.context.sampleRate * 2;
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
}
