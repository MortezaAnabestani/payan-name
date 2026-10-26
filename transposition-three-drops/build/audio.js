window.TD = window.TD || {};
(function (TD) {
  "use strict";

  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.ambientFilter = null;
      this.noiseBuffer = null;
      this.muted = false;
      this.suspicion = 0;
      this.heartTimer = 0;
      this.ready = false;
    }

    ensure() {
      if (!this.ctx) {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) return;
        this.ctx = new AudioCtor();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.55;
        this.master.connect(this.ctx.destination);
        this.makeNoise();
        this.buildAmbient();
        this.ready = true;
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    }

    makeNoise() {
      const length = Math.floor(this.ctx.sampleRate * 2);
      const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buffer;
    }

    buildAmbient() {
      const audio = this.ctx;
      this.ambientFilter = audio.createBiquadFilter();
      this.ambientFilter.type = "lowpass";
      this.ambientFilter.frequency.value = 340;
      this.ambientFilter.Q.value = 1.2;
      const ambientGain = audio.createGain();
      ambientGain.gain.value = 0.075;
      this.ambientFilter.connect(ambientGain);
      ambientGain.connect(this.master);

      [55, 82.5, 110].forEach((freq, index) => {
        const osc = audio.createOscillator();
        osc.type = index === 2 ? "triangle" : "sine";
        osc.frequency.value = freq;
        const gain = audio.createGain();
        gain.gain.value = index === 2 ? 0.012 : 0.04;
        osc.connect(gain);
        gain.connect(this.ambientFilter);
        osc.start();
      });

      const wind = audio.createBufferSource();
      wind.buffer = this.noiseBuffer;
      wind.loop = true;
      const windFilter = audio.createBiquadFilter();
      windFilter.type = "bandpass";
      windFilter.frequency.value = 520;
      windFilter.Q.value = 0.65;
      const windGain = audio.createGain();
      windGain.gain.value = 0.016;
      wind.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(this.master);
      wind.start();

      const lfo = audio.createOscillator();
      lfo.frequency.value = 0.08;
      const lfoGain = audio.createGain();
      lfoGain.gain.value = 0.01;
      lfo.connect(lfoGain);
      lfoGain.connect(windGain.gain);
      lfo.start();

      const shimmer = audio.createOscillator();
      shimmer.type = "sine";
      shimmer.frequency.value = 1320;
      const shimmerGain = audio.createGain();
      shimmerGain.gain.value = 0.0022;
      shimmer.connect(shimmerGain);
      shimmerGain.connect(this.master);
      shimmer.start();
    }

    setMuted(value) {
      this.muted = value;
      if (this.master && this.ctx) {
        this.master.gain.setTargetAtTime(value ? 0 : 0.55, this.ctx.currentTime, 0.05);
      }
    }

    setSuspicion(value) {
      this.suspicion = value;
    }

    setListening(value) {
      if (!this.ambientFilter || !this.ctx) return;
      this.ambientFilter.frequency.setTargetAtTime(value ? 980 : 340, this.ctx.currentTime, 0.18);
    }

    tone(options) {
      if (!this.ctx || this.muted) return;
      const {
        freq = 440,
        dur = 0.2,
        type = "sine",
        gain = 0.05,
        pan = 0,
        slide = null,
        attack = 0.008
      } = options;
      const start = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const envelope = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slide), start + dur);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + attack);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(envelope);
      let output = envelope;
      if (this.ctx.createStereoPanner) {
        const panner = this.ctx.createStereoPanner();
        panner.pan.value = TD.clamp(pan, -1, 1);
        envelope.connect(panner);
        output = panner;
      }
      output.connect(this.master);
      osc.start(start);
      osc.stop(start + dur + 0.03);
    }

    noise(options) {
      if (!this.ctx || this.muted) return;
      const {
        dur = 0.16,
        gain = 0.025,
        freq = 400,
        q = 0.8,
        pan = 0,
        type = "bandpass"
      } = options;
      const start = this.ctx.currentTime;
      const source = this.ctx.createBufferSource();
      source.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = freq;
      filter.Q.value = q;
      const envelope = this.ctx.createGain();
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(gain, start + 0.012);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      source.connect(filter);
      filter.connect(envelope);
      let output = envelope;
      if (this.ctx.createStereoPanner) {
        const panner = this.ctx.createStereoPanner();
        panner.pan.value = TD.clamp(pan, -1, 1);
        envelope.connect(panner);
        output = panner;
      }
      output.connect(this.master);
      source.start(start);
      source.stop(start + dur + 0.02);
    }

    step(pan) {
      this.noise({ dur: 0.09, gain: 0.018, freq: 190, q: 0.8, pan });
      this.tone({ freq: 90, slide: 60, dur: 0.08, gain: 0.018, pan });
    }

    cat(pan) {
      this.tone({ freq: 720, slide: 430, dur: 0.5, gain: 0.035, pan, attack: 0.03 });
      this.tone({ freq: 1120, slide: 760, dur: 0.34, gain: 0.012, pan, attack: 0.02 });
    }

    tar(pan) {
      this.tone({ freq: 196, dur: 0.42, type: "triangle", gain: 0.026, pan });
      this.tone({ freq: 146.8, dur: 0.5, type: "triangle", gain: 0.018, pan, attack: 0.015 });
      this.tone({ freq: 220, dur: 0.7, type: "sine", gain: 0.009, pan, attack: 0.02 });
    }

    chime(pan) {
      this.tone({ freq: 660, dur: 0.6, gain: 0.025, pan });
      this.tone({ freq: 990, dur: 0.9, gain: 0.012, pan });
    }

    whisper(pan) {
      this.noise({ dur: 0.55, gain: 0.018, freq: 900, q: 1.8, pan });
      this.tone({ freq: 180, slide: 140, dur: 0.5, gain: 0.012, pan, attack: 0.04 });
    }

    caught(pan) {
      this.tone({ freq: 70, slide: 38, dur: 0.8, gain: 0.09, pan });
      this.noise({ dur: 0.45, gain: 0.04, freq: 280, q: 0.7, pan });
    }

    heartbeat() {
      this.tone({ freq: 58, slide: 42, dur: 0.18, gain: 0.06 });
      this.tone({ freq: 48, slide: 36, dur: 0.22, gain: 0.035, attack: 0.01 });
    }

    update(dt) {
      if (!this.ctx) return;
      if (this.suspicion > 0.28) {
        this.heartTimer -= dt;
        if (this.heartTimer <= 0) {
          this.heartbeat();
          this.heartTimer = TD.lerp(0.95, 0.34, this.suspicion);
        }
      } else {
        this.heartTimer = 0;
      }
    }
  }

  TD.audio = new AudioEngine();
})(window.TD);
