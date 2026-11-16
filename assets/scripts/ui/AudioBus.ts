interface ToneOscillator {
  type: string;
  frequency: { value: number };
  connect(target: unknown): void;
  start(): void;
  stop(time: number): void;
}

interface ToneGain {
  gain: {
    setValueAtTime(value: number, time: number): void;
    exponentialRampToValueAtTime(value: number, time: number): void;
  };
  connect(target: unknown): void;
}

interface ToneContext {
  currentTime: number;
  destination: unknown;
  state: string;
  resume(): Promise<void>;
  createOscillator(): ToneOscillator;
  createGain(): ToneGain;
}

type AudioHost = {
  AudioContext?: new () => ToneContext;
  webkitAudioContext?: new () => ToneContext;
};

/**
 * 不依赖音频文件。浏览器和预览环境里用振荡器播放音效和循环背景音。
 */
export class AudioBus {
  soundOn = true;
  musicOn = true;
  private ctx: ToneContext | null = null;
  private unlocked = false;
  private musicClock = 0;
  private musicStep = 0;
  private readonly notes = [262, 294, 330, 392, 349, 330, 294, 262];

  unlock(): void {
    const ctx = this.context();
    if (!ctx) return;
    this.unlocked = true;
    if (ctx.state === 'suspended') void ctx.resume();
  }

  tick(dt: number): void {
    if (!this.unlocked || !this.musicOn) return;
    this.musicClock += dt;
    if (this.musicClock < 0.48) return;
    this.musicClock = 0;
    this.beep(this.notes[this.musicStep % this.notes.length], 0.32, 'sine', 0.018, true);
    this.musicStep += 1;
  }

  playPlace(): void {
    this.beep(540, 0.07, 'triangle', 0.05, this.soundOn);
  }

  playClear(lines: number): void {
    if (!this.soundOn) return;
    this.beep(620, 0.08, 'triangle', 0.05, true);
    this.beep(740 + lines * 20, 0.12, 'sine', 0.05, true);
  }

  playCombo(combo: number): void {
    this.beep(880 + combo * 30, 0.16, 'square', 0.04, this.soundOn);
  }

  playGameOver(): void {
    if (!this.soundOn) return;
    this.beep(392, 0.16, 'sine', 0.05, true);
    this.beep(262, 0.28, 'triangle', 0.05, true);
  }

  playButton(): void {
    this.beep(660, 0.05, 'square', 0.03, this.soundOn);
  }

  private beep(freq: number, duration: number, type: string, volume: number, enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.context();
    if (!ctx || !this.unlocked) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + duration + 0.02);
  }

  private context(): ToneContext | null {
    if (this.ctx) return this.ctx;
    const host = Function('return this')() as AudioHost;
    const Factory = host.AudioContext || host.webkitAudioContext;
    if (!Factory) return null;
    this.ctx = new Factory();
    return this.ctx;
  }
}
