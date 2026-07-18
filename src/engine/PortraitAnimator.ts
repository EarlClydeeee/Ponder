/**
 * Amplitude envelope from the assistant's audio stream → lip-sync / glow.
 * Delegates playback routing to RealtimeAudioOutput (RFC §6).
 * Owner: David (engine), Ivy (visual mapping).
 */
import { RealtimeAudioOutput } from "./RealtimeAudioOutput";

export class PortraitAnimator {
  private output = new RealtimeAudioOutput();

  attach(stream: MediaStream): void {
    this.output.attach(stream);
  }

  resume(): Promise<void> {
    return this.output.resume();
  }

  setMuted(muted: boolean): void {
    this.output.setMuted(muted);
  }

  subscribe(onAmplitude: (level: number) => void): () => void {
    return this.output.subscribe(onAmplitude);
  }

  detach(): void {
    this.output.detach();
  }
}
