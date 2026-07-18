/**
 * Amplitude envelope from the assistant's audio stream → lip-sync / glow.
 * No video re-render (RFC §6) — UI maps amplitude to CSS transforms.
 * Owner: David (engine), Ivy (visual mapping).
 */
export class PortraitAnimator {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
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
    this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.analyser = null;
    this.buffer = null;
  }
}
