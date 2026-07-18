/**
 * Routes assistant Realtime audio to speakers and an AnalyserNode for lip-sync.
 * Uses both Web Audio and a hidden <audio> element for reliable playback.
 * Owner: David.
 */
export class RealtimeAudioOutput {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gain: GainNode | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private raf = 0;
  private buffer: Uint8Array<ArrayBuffer> | null = null;

  /** Feed the remote (assistant) MediaStream after Realtime connects. */
  attach(stream: MediaStream): void {
    this.detach();
    this.ctx = new AudioContext();
    const source = this.ctx.createMediaStreamSource(stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.buffer = new Uint8Array(this.analyser.frequencyBinCount);
    source.connect(this.analyser);
    // Route playback through a gain node so barge-in can hard-mute locally
    // without touching the analyser branch.
    this.gain = this.ctx.createGain();
    source.connect(this.gain);
    this.gain.connect(this.ctx.destination);

    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
    this.audioEl.setAttribute("playsinline", "true");
    this.audioEl.srcObject = stream;
    void this.audioEl.play().catch(() => {});
  }

  /** Hard local mute — covers BOTH playback paths (Web Audio + element). */
  setMuted(muted: boolean): void {
    if (this.gain) this.gain.gain.value = muted ? 0 : 1;
    if (this.audioEl) this.audioEl.muted = muted;
  }

  /** Resume suspended AudioContext after a user gesture. */
  async resume(): Promise<void> {
    if (this.ctx?.state === "suspended") {
      await this.ctx.resume();
    }
    if (this.audioEl && this.audioEl.paused) {
      await this.audioEl.play().catch(() => {});
    }
  }

  /** Calls back with amplitude 0..1 every animation frame. Returns stop fn. */
  subscribe(onAmplitude: (level: number) => void): () => void {
    const tick = () => {
      if (this.analyser && this.buffer) {
        this.analyser.getByteFrequencyData(this.buffer);
        const avg =
          this.buffer.reduce((sum, v) => sum + v, 0) / this.buffer.length;
        onAmplitude(Math.min(1, avg / 140));
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(this.raf);
  }

  detach(): void {
    cancelAnimationFrame(this.raf);
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.srcObject = null;
      this.audioEl = null;
    }
    this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.analyser = null;
    this.gain = null;
    this.buffer = null;
  }
}
