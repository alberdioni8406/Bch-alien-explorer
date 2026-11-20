/**
 * Unique Sound Engine using Web Audio API
 * Every alien has a deterministic, repeatable sound derived from its TXID.
 * Never autoplays before user interaction.
 */

type SoundCategory =
  | "select"
  | "whale"
  | "token"
  | "multi"
  | "appear"
  | "confirm"
  | "block"
  | "mothership";

interface SoundProfile {
  baseFreq: number;
  duration: number;
  waveType: OscillatorType;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  modulationFreq: number;
  modulationDepth: number;
  harmonicCount: number;
  filterFreq: number;
  detune: number;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private alienGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private muted = false;
  private activated = false;
  private volumes = {
    master: 0.7,
    alien: 0.8,
    ambient: 0.3,
  };

  /** Call after first user gesture */
  activate(): boolean {
    if (this.activated && this.ctx) return true;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.alienGain = this.ctx.createGain();
      this.ambientGain = this.ctx.createGain();

      this.masterGain.gain.value = this.volumes.master;
      this.alienGain.gain.value = this.volumes.alien;
      this.ambientGain.gain.value = this.volumes.ambient;

      this.alienGain.connect(this.masterGain);
      this.ambientGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.activated = true;
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      return true;
    } catch (e) {
      console.warn("Web Audio API not available", e);
      return false;
    }
  }

  isActivated(): boolean {
    return this.activated;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.masterGain) {
      this.masterGain.gain.value = m ? 0 : this.volumes.master;
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  setVolume(type: "master" | "alien" | "ambient", value: number) {
    this.volumes[type] = Math.max(0, Math.min(1, value));
    if (type === "master" && this.masterGain && !this.muted) {
      this.masterGain.gain.value = this.volumes.master;
    } else if (type === "alien" && this.alienGain) {
      this.alienGain.gain.value = this.volumes.alien;
    } else if (type === "ambient" && this.ambientGain) {
      this.ambientGain.gain.value = this.volumes.ambient;
    }
  }

  /** Deterministic profile from TXID */
  private profileFromTxid(txid: string, category: string = "select"): SoundProfile {
    let h = 0;
    for (let i = 0; i < txid.length; i++) {
      h = Math.imul(31, h) + txid.charCodeAt(i) | 0;
    }
    const rand = () => {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      h ^= h >>> 16;
      return (h >>> 0) / 4294967296;
    };

    const waves: OscillatorType[] = ["sine", "triangle", "sawtooth", "square"];
    const baseFreq = 110 + rand() * 440; // A2 to A4-ish
    const duration = 0.15 + rand() * 0.45;

    let profile: SoundProfile = {
      baseFreq,
      duration,
      waveType: waves[Math.floor(rand() * waves.length)],
      attack: 0.01 + rand() * 0.05,
      decay: 0.05 + rand() * 0.15,
      sustain: 0.3 + rand() * 0.4,
      release: 0.1 + rand() * 0.3,
      modulationFreq: 2 + rand() * 12,
      modulationDepth: 20 + rand() * 80,
      harmonicCount: 1 + Math.floor(rand() * 4),
      filterFreq: 400 + rand() * 2000,
      detune: (rand() - 0.5) * 40,
    };

    // Category character
    if (category === "whale" || category === "whale") {
      profile.baseFreq *= 0.55;
      profile.duration *= 1.6;
      profile.waveType = "sawtooth";
      profile.harmonicCount = 4;
      profile.filterFreq = 300 + rand() * 600;
    } else if (category === "token") {
      profile.baseFreq *= 1.4;
      profile.waveType = "triangle";
      profile.modulationFreq *= 1.8;
      profile.duration *= 0.9;
    } else if (category === "multi") {
      profile.harmonicCount = 5;
      profile.duration *= 1.2;
    }

    return profile;
  }

  playAlienSound(txid: string, category: AlienCategoryLike = "select") {
    if (!this.activated || !this.ctx || this.muted || !this.alienGain) return;

    const profile = this.profileFromTxid(txid, category);
    const now = this.ctx.currentTime;

    // Main oscillator + harmonics
    for (let i = 0; i < profile.harmonicCount; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = profile.waveType;
      osc.frequency.value = profile.baseFreq * (i + 1) * (1 + (i * 0.002));
      osc.detune.value = profile.detune + i * 3;

      // LFO modulation
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = profile.modulationFreq * (1 + i * 0.1);
      lfoGain.gain.value = profile.modulationDepth / (i + 1);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);
      lfo.stop(now + profile.duration + 0.1);

      filter.type = "lowpass";
      filter.frequency.value = profile.filterFreq / (i * 0.3 + 1);
      filter.Q.value = 1.2;

      // ADSR
      const peak = 0.18 / (i + 1);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peak, now + profile.attack);
      gain.gain.linearRampToValueAtTime(
        peak * profile.sustain,
        now + profile.attack + profile.decay
      );
      gain.gain.setValueAtTime(
        peak * profile.sustain,
        now + profile.duration - profile.release
      );
      gain.gain.linearRampToValueAtTime(0, now + profile.duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.alienGain);

      osc.start(now);
      osc.stop(now + profile.duration + 0.05);
    }

    // Soft noise burst for texture on certain categories
    if (category === "token" || category === "complex") {
      this.playNoiseBurst(now, profile.duration * 0.6, 0.04);
    }
  }

  private playNoiseBurst(start: number, duration: number, volume: number) {
    if (!this.ctx || !this.alienGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1200;
    filter.Q.value = 2;
    gain.gain.value = volume;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.alienGain);
    noise.start(start);
  }

  playAppear(txid: string) {
    this.playAlienSound(txid, "appear");
  }

  playSelect(txid: string, category?: string) {
    this.playAlienSound(txid, (category as AlienCategoryLike) || "select");
  }

  playBlockDiscovery() {
    if (!this.activated || !this.ctx || this.muted || !this.alienGain) return;
    const now = this.ctx.currentTime;
    // Deep resonant chord
    [55, 82.5, 110, 165].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12 / (i + 1), now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
      osc.connect(gain);
      gain.connect(this.alienGain!);
      osc.start(now);
      osc.stop(now + 1.5);
    });
  }

  /** Soft ambient drone (call once after activation if desired) */
  startAmbient() {
    // Minimal ambient for now – can expand later
  }
}

type AlienCategoryLike = string;

export const soundEngine = new SoundEngine();
