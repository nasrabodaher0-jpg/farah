class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientOscs: OscillatorNode[] = [];
  private ambientGain: GainNode | null = null;
  private isAmbientPlaying: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  // Realistic wooden door knock
  public playKnock(knockIndex = 1) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const baseFreq = knockIndex === 3 ? 120 : knockIndex === 2 ? 140 : 130;

      // Body thump oscillator
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.09);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);

      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);

      // Impact noise burst
      const bufferSize = this.ctx.sampleRate * 0.05;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(600, now);
      noiseFilter.Q.setValueAtTime(1.5, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(now);
    } catch {
      // Audio context might be restricted or unavailable
    }
  }

  // Grand celebration fanfare chord when the door swings open
  public playCelebrationChime() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Majestic Arabian Bayati / celebratory notes (D4, F#4, A4, D5, F#5, A5)
      const frequencies = [293.66, 370.0, 440.0, 587.33, 739.99, 880.0];

      frequencies.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteOsc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        noteOsc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        noteOsc.frequency.setValueAtTime(freq, now + idx * 0.08);

        const startTime = now + idx * 0.08;
        noteGain.gain.setValueAtTime(0.001, startTime);
        noteGain.gain.linearRampToValueAtTime(0.25, startTime + 0.04);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.8);

        noteOsc.connect(noteGain);
        noteGain.connect(this.ctx.destination);

        noteOsc.start(startTime);
        noteOsc.stop(startTime + 2.0);
      });
    } catch {
      // Audio restricted
    }
  }

  // Gentle soft click for UI interactions
  public playClick() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Audio restricted
    }
  }

  // Toggle ambient celebratory melodies
  public toggleAmbientMusic(shouldPlay?: boolean): boolean {
    this.initContext();
    if (!this.ctx) return false;

    const target = shouldPlay !== undefined ? shouldPlay : !this.isAmbientPlaying;
    if (!target || this.isMuted) {
      this.stopAmbient();
      return false;
    } else {
      this.startAmbient();
      return true;
    }
  }

  private startAmbient() {
    if (this.isAmbientPlaying || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.001, now);
      this.ambientGain.gain.linearRampToValueAtTime(0.08, now + 1.5);
      this.ambientGain.connect(this.ctx.destination);

      // Create an elegant calming oud/kanun arpeggio pattern
      const arpeggio = [220, 261.63, 293.66, 329.63, 392.0, 440, 523.25];
      let step = 0;

      const playNextTone = () => {
        if (!this.isAmbientPlaying || !this.ctx || !this.ambientGain) return;
        const toneTime = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(arpeggio[step % arpeggio.length], toneTime);

        noteGain.gain.setValueAtTime(0.001, toneTime);
        noteGain.gain.linearRampToValueAtTime(0.04, toneTime + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, toneTime + 0.9);

        osc.connect(noteGain);
        noteGain.connect(this.ambientGain);

        osc.start(toneTime);
        osc.stop(toneTime + 1.0);

        step++;
        if (this.isAmbientPlaying) {
          setTimeout(playNextTone, 450);
        }
      };

      this.isAmbientPlaying = true;
      playNextTone();
    } catch {
      this.isAmbientPlaying = false;
    }
  }

  private stopAmbient() {
    this.isAmbientPlaying = false;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
    }
  }

  public isMusicPlaying(): boolean {
    return this.isAmbientPlaying && !this.isMuted;
  }
}

export const soundEffects = new SoundManager();
