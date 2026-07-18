/** Routes assistant Realtime audio to speakers + amplitude analyser. */
export class RealtimeAudioOutput {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private raf = 0;
  private buffer: Uint8Array<ArrayBuffer> | null = null;

  attach(stream: MediaStream): void {
    this.detach();
    this.ctx = new AudioContext();
    const source = this.ctx.createMediaStreamSource(stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.buffer = new Uint8Array(this.analyser.frequencyBinCount);
    source.connect(this.analyser);
    source.connect(this.ctx.destination);

    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
    this.audioEl.setAttribute("playsinline", "true");
    this.audioEl.srcObject = stream;
    void this.audioEl.play().catch(() => {});
  }

  async resume(): Promise<void> {
    if (this.ctx?.state === "suspended") await this.ctx.resume();
    if (this.audioEl?.paused) await this.audioEl.play().catch(() => {});
  }

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
    this.buffer = null;
  }
}
