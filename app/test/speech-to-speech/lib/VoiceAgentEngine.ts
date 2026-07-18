/** Speech-to-speech engine — self-contained under app/test/speech-to-speech. */
import { API_BASE } from "./config";
import { RealtimeAudioOutput } from "./RealtimeAudioOutput";
import { RealtimeSession } from "./RealtimeSession";
import type {
  TranscriptTurn,
  VoiceAgentConfig,
  VoiceAgentError,
  VoiceAgentEvents,
  VoiceAgentPhase,
} from "./types";

type Handler<E extends keyof VoiceAgentEvents> = (
  payload: VoiceAgentEvents[E],
) => void;

const SPEECH_INSTRUCTION =
  " Always respond with spoken voice audio. Never reply with text only.";

export class VoiceAgentEngine {
  private handlers: { [E in keyof VoiceAgentEvents]: Set<Handler<E>> } = {
    phase: new Set(),
    transcript: new Set(),
    error: new Set(),
  };

  private phase: VoiceAgentPhase = "idle";
  private config: VoiceAgentConfig | null = null;
  private realtime: RealtimeSession | null = null;
  private transcript: TranscriptTurn[] = [];
  readonly audioOutput = new RealtimeAudioOutput();

  on<E extends keyof VoiceAgentEvents>(
    event: E,
    handler: Handler<E>,
  ): () => void {
    this.handlers[event].add(handler);
    return () => this.handlers[event].delete(handler);
  }

  private emit<E extends keyof VoiceAgentEvents>(
    event: E,
    payload: VoiceAgentEvents[E],
  ): void {
    this.handlers[event].forEach((h) => h(payload));
  }

  private setPhase(phase: VoiceAgentPhase): void {
    this.phase = phase;
    this.emit("phase", phase);
  }

  private fail(error: VoiceAgentError): void {
    this.emit("error", error);
    this.setPhase(
      error.code === "realtime_failed" ? "fallback_text" : "error",
    );
  }

  getPhase(): VoiceAgentPhase {
    return this.phase;
  }

  getTitle(): string {
    return this.config?.title ?? "";
  }

  async start(config: VoiceAgentConfig): Promise<void> {
    this.config = config;
    this.transcript = [];
    this.setPhase("connecting");

    this.realtime = new RealtimeSession({
      onRemoteStream: (stream) => {
        this.audioOutput.attach(stream);
        void this.audioOutput.resume();
      },
      onUserTranscript: (text) => this.recordTurn("user", text),
      onAssistantTranscript: (text, final) => {
        if (final) this.recordTurn("assistant", text);
      },
      onSpeakingStart: () => {
        if (this.phase !== "listening") this.setPhase("speaking");
      },
      onSpeakingEnd: () => {
        if (this.phase === "speaking") this.setPhase("alive");
      },
      onClose: () => {
        if (this.phase !== "idle" && this.phase !== "error") {
          this.fail({
            code: "realtime_failed",
            message: "Voice dropped — switched to text mode.",
            recoverable: true,
          });
        }
      },
    });

    try {
      await this.realtime.connect({
        persona: {
          voice: config.voice,
          systemPrompt: config.systemPrompt + SPEECH_INSTRUCTION,
        },
        sendGreeting: config.greeting === undefined,
      });

      if (config.greeting) this.realtime.sendText(config.greeting);

      void this.audioOutput.resume();
      this.setPhase("alive");
    } catch (err) {
      const code = (err as Error).message;
      this.fail({
        code:
          code === "mic_denied"
            ? "mic_denied"
            : code === "token_failed"
              ? "token_failed"
              : "realtime_failed",
        message:
          code === "mic_denied"
            ? "Microphone access is off. Allow it in browser settings, or use text below."
            : code === "token_failed"
              ? "Voice service unavailable — check your API key and Realtime access."
              : "Couldn't start the voice connection.",
        recoverable: true,
      });
      this.realtime?.close();
      this.realtime = null;
    }
  }

  startListening(): void {
    if (!this.realtime) return;
    void this.audioOutput.resume();
    this.realtime.startListening();
    this.setPhase("listening");
  }

  stopListening(): void {
    if (!this.realtime) return;
    this.realtime.stopListening();
    this.setPhase("alive");
  }

  async sendText(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;

    this.recordTurn("user", trimmed);

    if (this.phase === "fallback_text") {
      await this.sendFallbackChat(trimmed);
      return;
    }

    this.realtime?.sendText(trimmed);
  }

  endSession(): void {
    this.realtime?.close();
    this.audioOutput.detach();
    this.realtime = null;
    this.config = null;
    this.transcript = [];
    this.setPhase("idle");
  }

  private async sendFallbackChat(userMessage: string): Promise<void> {
    if (!this.config) return;

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: this.transcript
            .slice(0, -1)
            .map((t) => ({ role: t.role, content: t.text })),
          systemPrompt: this.config.systemPrompt,
          userMessage,
        }),
      });

      if (!res.ok) throw new Error("chat_failed");
      const { text } = (await res.json()) as { text: string };
      this.recordTurn("assistant", text);
    } catch {
      this.fail({
        code: "unknown",
        message: "Text fallback failed. Try again.",
        recoverable: true,
      });
    }
  }

  private recordTurn(role: TranscriptTurn["role"], text: string): void {
    if (!text.trim()) return;
    const turn: TranscriptTurn = {
      id: crypto.randomUUID(),
      role,
      text,
      at: new Date().toISOString(),
    };
    this.transcript.push(turn);
    this.emit("transcript", turn);
  }
}
