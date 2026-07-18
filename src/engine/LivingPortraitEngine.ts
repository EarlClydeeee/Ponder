/**
 * C2 — Living Portrait engine. Owns the state machine from capture through
 * conversation. Screens never touch RealtimeSession directly — they subscribe
 * via useLivingPortrait. RFC §2–3.
 * Owner: David.
 *
 * Merged pipeline (proven in /test/persona-chat + /test/speech-to-speech):
 *   IDLE → ANALYZING (/api/generate-persona) → CONNECTING (Realtime WebRTC)
 *        → ALIVE → LISTENING ⇄ SPEAKING
 *   fail paths → ERROR / FALLBACK_TEXT (text replies via /api/persona-chat SSE)
 * Slides are deferred: generating_slides never fires and regenerateSlides is a
 * no-op until SlideDeckCoordinator is re-wired.
 */
import { generatePersona, sendPersonaChat } from "./personaChat";
import { PortraitAnimator } from "./PortraitAnimator";
import { RealtimeSession } from "./RealtimeSession";
import { sessionStore } from "./sessionStore";
import type {
  AwakenConfig,
  AwakenResult,
  EngineEvents,
  PersonaProfile,
  PortraitError,
  PortraitPhase,
  StoredSession,
  TranscriptTurn,
} from "./types";

type Handler<E extends keyof EngineEvents> = (payload: EngineEvents[E]) => void;

const SPEECH_INSTRUCTION =
  "\n\nVOICE MODE\n" +
  "Always respond with spoken voice audio. Never reply with text only. " +
  "You have no web search tool in voice mode; rely on your grounding " +
  "knowledge and say so briefly if asked about current events.";

function openingInstruction(greeting: string): string {
  return (
    "\n\nOPENING\n" +
    `When the session starts, greet the user by saying, in character: "${greeting}"`
  );
}

/** Same placement derivation as /test/cam when the route suggests a CSS face. */
function withFacePlacement(result: AwakenResult): AwakenResult {
  if (result.faceMode !== "suggested_face" || result.facePlacement) return result;
  const b = result.subjectBounds;
  return {
    ...result,
    facePlacement: {
      x: b.x + b.width / 2,
      y: b.y + b.height * 0.44,
      scale: Math.min(1.2, Math.max(0.45, Math.min(b.width, b.height) * 1.5)),
      rotation: 0,
    },
  };
}

export class LivingPortraitEngine {
  private handlers: { [E in keyof EngineEvents]: Set<Handler<E>> } = {
    phase: new Set(),
    transcript: new Set(),
    slides: new Set(),
    error: new Set(),
    face: new Set(),
  };

  private phase: PortraitPhase = "idle";
  private sessionId = "";
  private profile: PersonaProfile | null = null;
  private faceResult: AwakenResult | null = null;
  private realtime: RealtimeSession | null = null;
  private transcript: TranscriptTurn[] = [];
  readonly animator = new PortraitAnimator();

  on<E extends keyof EngineEvents>(event: E, handler: Handler<E>): () => void {
    this.handlers[event].add(handler);
    return () => this.handlers[event].delete(handler);
  }

  private emit<E extends keyof EngineEvents>(
    event: E,
    payload: EngineEvents[E],
  ): void {
    this.handlers[event].forEach((h) => h(payload));
  }

  private setPhase(phase: PortraitPhase): void {
    this.phase = phase;
    this.emit("phase", phase);
  }

  private fail(error: PortraitError): void {
    this.emit("error", error);
    // mic_denied joins realtime_failed in text mode: QAD S-02 requires a text
    // fallback to be offered when the mic is blocked.
    const fallback =
      error.code === "realtime_failed" || error.code === "mic_denied";
    this.setPhase(fallback ? "fallback_text" : "error");
    if (fallback && this.transcript.length === 0 && this.profile) {
      this.recordTurn("assistant", this.profile.greeting);
    }
  }

  getPhase(): PortraitPhase {
    return this.phase;
  }

  getSubjectLabel(): string {
    return this.profile?.subjectLabel ?? "";
  }

  async awaken(config: AwakenConfig): Promise<void> {
    this.sessionId = config.sessionId ?? crypto.randomUUID();
    this.transcript = [];

    // 1. ANALYZING — persona generation (proven /test/persona-chat pipeline),
    // with the /test/cam face pre-pass racing alongside (non-blocking).
    this.setPhase("analyzing");
    void this.fetchFace(config.photoDataUrl, this.sessionId);
    try {
      this.profile = await generatePersona(config.photoDataUrl);
      this.syncFace();
    } catch (err) {
      // Surface the route's reason (missing key, upstream error, timeout) —
      // "Try another shot" alone is undiagnosable in production.
      const detail =
        err instanceof Error && err.message.trim() ? ` ${err.message}` : "";
      this.fail({
        code: "analyze_failed",
        message: `Could not read that photo.${detail}`,
        recoverable: true,
      });
      return;
    }

    // Persist the shell of the session immediately so a mid-session
    // tab close still leaves something to recover.
    this.persistShell(config.photoDataUrl);

    // 2. CONNECTING — open Realtime over WebRTC (proven /test/speech-to-speech).
    this.setPhase("connecting");
    this.realtime = new RealtimeSession({
      onRemoteStream: (stream) => {
        this.animator.attach(stream);
        void this.animator.resume();
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
          voice: this.profile.voice,
          systemPrompt:
            this.profile.systemPrompt +
            openingInstruction(this.profile.greeting) +
            SPEECH_INSTRUCTION,
        },
        sendGreeting: true,
      });

      void this.animator.resume();
      this.setPhase("alive");
    } catch (err) {
      if (this.phase === "idle") return; // endSession() raced the connect
      const code = (err as Error).message;
      this.realtime?.close();
      this.realtime = null;
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
    }
  }

  startListening(): void {
    if (!this.realtime) return;
    // Barge-in: holding talk while the portrait speaks cancels its response.
    if (this.phase === "speaking") this.realtime.cancelResponse();
    void this.animator.resume();
    this.realtime.startListening();
    this.setPhase("listening");
  }

  stopListening(): void {
    if (!this.realtime || this.phase !== "listening") return;
    this.realtime.stopListening();
    this.setPhase("alive");
  }

  sendText(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;
    this.recordTurn("user", trimmed);

    if (this.phase === "fallback_text") {
      void this.sendFallbackChat(trimmed);
      return;
    }

    if (this.phase === "speaking") this.realtime?.cancelResponse();
    this.realtime?.sendText(trimmed);
  }

  async regenerateSlides(deckId: string): Promise<void> {
    // Slides deferred — SlideDeckCoordinator stays dormant until re-wired.
    void deckId;
  }

  endSession(): void {
    this.realtime?.close();
    this.animator.detach();
    this.realtime = null;
    this.profile = null;
    this.faceResult = null;
    this.transcript = [];
    this.setPhase("idle");
  }

  // --- internals ---

  /**
   * Face/animation pre-pass (ported from /test/cam): analyze-portrait supplies
   * faceMode/facePlacement/animationStyle for the living-face overlay. Runs in
   * parallel with generatePersona and is a progressive enhancement — failures
   * are swallowed and identity fields are overridden by the persona's.
   */
  private async fetchFace(
    photoDataUrl: string,
    sessionId: string,
  ): Promise<void> {
    try {
      const res = await fetch("/api/analyze-portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoDataUrl }),
      });
      if (!res.ok) return;
      const result = (await res.json()) as AwakenResult;
      if (this.sessionId !== sessionId || this.phase === "idle") return;
      this.faceResult = withFacePlacement(result);
      this.syncFace();
    } catch {
      // No face is better than a blocked awaken.
    }
  }

  /** Emit the face once both pre-pass and persona are in, identity-merged. */
  private syncFace(): void {
    if (!this.faceResult || !this.profile) return;
    this.emit("face", {
      ...this.faceResult,
      subjectLabel: this.profile.subjectLabel,
      personaName: this.profile.subjectLabel,
      greeting: this.profile.greeting,
    });
  }

  /**
   * Text fallback rides the proven /api/persona-chat SSE route with the same
   * PersonaProfile. The reply lands as one final turn; incremental deltas
   * would need upsert semantics in the C3 transcript reducer first.
   */
  private async sendFallbackChat(userMessage: string): Promise<void> {
    if (!this.profile) return;
    try {
      const history = this.transcript.slice(0, -1);
      const res = await sendPersonaChat(this.profile, history, userMessage);
      this.recordTurn("assistant", res.reply);
    } catch {
      // Stay in fallback_text — surface the error without a phase change.
      this.emit("error", {
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
    sessionStore.appendTurn(this.sessionId, turn);
  }

  private persistShell(photoDataUrl: string): void {
    if (!this.profile) return;
    const shell: StoredSession = {
      id: this.sessionId,
      title: this.profile.subjectLabel,
      photoDataUrl,
      persona: {
        subjectLabel: this.profile.subjectLabel,
        voice: this.profile.voice,
        systemPrompt: this.profile.systemPrompt,
        styleHint: this.profile.styleHint,
      },
      transcript: [],
      decks: [],
      createdAt: new Date().toISOString(),
    };
    sessionStore.save(shell);
  }
}
