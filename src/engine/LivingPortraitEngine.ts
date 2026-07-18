/**
 * C2 — Living Portrait engine. Owns the state machine from capture through
 * conversation. Screens never touch RealtimeSession directly — they subscribe
 * via useLivingPortrait. RFC §2–3.
 * Owner: David.
 *
 * State flow (RFC §3):
 *   IDLE → ANALYZING → CONNECTING → ALIVE → LISTENING ⇄ SPEAKING
 *          → GENERATING_SLIDES → ALIVE
 *   fail paths → ERROR / FALLBACK_TEXT
 */
import { analyzePortrait } from "./PersonaAnalyzer";
import { PortraitAnimator } from "./PortraitAnimator";
import { RealtimeSession } from "./RealtimeSession";
import { sessionStore, DAILY_FREE_SESSIONS } from "./sessionStore";
import { SlideDeckCoordinator } from "./SlideDeckCoordinator";
import type {
  AwakenConfig,
  EngineEvents,
  GenerateSlidesRequest,
  PersonaConfig,
  PortraitError,
  PortraitPhase,
  SlideDeck,
  StoredSession,
  TranscriptTurn,
} from "./types";

type Handler<E extends keyof EngineEvents> = (payload: EngineEvents[E]) => void;

export class LivingPortraitEngine {
  private handlers: { [E in keyof EngineEvents]: Set<Handler<E>> } = {
    phase: new Set(),
    transcript: new Set(),
    slides: new Set(),
    error: new Set(),
  };

  private phase: PortraitPhase = "idle";
  private sessionId = "";
  private persona: PersonaConfig | null = null;
  private realtime: RealtimeSession | null = null;
  private slides: SlideDeckCoordinator | null = null;
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
    this.setPhase(error.code === "realtime_failed" ? "fallback_text" : "error");
  }

  getPhase(): PortraitPhase {
    return this.phase;
  }

  getSubjectLabel(): string {
    return this.persona?.subjectLabel ?? "";
  }

  async awaken(config: AwakenConfig): Promise<void> {
    // Enforce the free-tier daily cap before spending any tokens.
    if (sessionStore.usageToday() >= DAILY_FREE_SESSIONS) {
      this.fail({
        code: "daily_limit",
        message: `Free tier is ${DAILY_FREE_SESSIONS} sessions/day. Come back tomorrow or go Pro.`,
        recoverable: false,
      });
      return;
    }

    this.sessionId = config.sessionId ?? crypto.randomUUID();

    // 1. ANALYZING — persona pre-pass.
    this.setPhase("analyzing");
    try {
      this.persona = await analyzePortrait(config);
    } catch {
      this.fail({
        code: "analyze_failed",
        message: "Could not read that photo. Try another shot.",
        recoverable: true,
      });
      return;
    }

    // Persist the shell of the session immediately so a mid-session
    // tab close still leaves something to recover.
    this.persistShell(config.photoDataUrl);

    // 2. CONNECTING — open Realtime over WebRTC.
    this.setPhase("connecting");
    this.slides = new SlideDeckCoordinator((deck) => this.handleDeck(deck));
    this.realtime = new RealtimeSession({
      onRemoteStream: (stream) => {
        this.animator.attach(stream);
        this.setPhase("speaking");
      },
      onUserTranscript: (text) => this.recordTurn("user", text),
      onAssistantTranscript: (text) => {
        this.recordTurn("assistant", text);
        if (this.phase === "speaking") this.setPhase("alive");
      },
      onToolCall: (name, args, callId) => this.handleToolCall(name, args, callId),
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
      sessionStore.incrementUsage();
      await this.realtime.connect(this.persona, config.photoDataUrl);
      this.setPhase("alive");
    } catch (err) {
      const code = (err as Error).message;
      this.fail({
        code: code === "daily_limit" ? "daily_limit" : "realtime_failed",
        message:
          code === "daily_limit"
            ? "Daily session limit reached."
            : "Couldn't start the voice connection.",
        recoverable: true,
      });
    }
  }

  startListening(): void {
    if (!this.realtime) return;
    this.realtime.startListening();
    this.setPhase("listening");
  }

  stopListening(): void {
    if (!this.realtime) return;
    this.realtime.stopListening();
    this.setPhase("alive");
  }

  sendText(text: string): void {
    this.realtime?.sendText(text);
    this.recordTurn("user", text);
  }

  async regenerateSlides(deckId: string): Promise<void> {
    await this.slides?.regenerate(deckId);
  }

  endSession(): void {
    this.realtime?.close();
    this.animator.detach();
    this.realtime = null;
    this.setPhase("idle");
  }

  // --- internals ---

  private async handleToolCall(
    name: string,
    args: GenerateSlidesRequest,
    callId: string,
  ): Promise<void> {
    if (name !== "generate_slides" || !this.slides) return;
    const prev = this.phase;
    this.setPhase("generating_slides");
    const deck = await this.slides.generate({
      topic: args.topic,
      count: args.count,
      styleHint: this.persona?.styleHint ?? args.style_hint,
    });
    this.realtime?.respondToTool(callId, {
      status: deck.status,
      slide_count: deck.slides.length,
    });
    this.setPhase(prev === "generating_slides" ? "alive" : prev);
  }

  private handleDeck(deck: SlideDeck): void {
    this.emit("slides", deck);
    if (deck.status === "ready") sessionStore.appendDeck(this.sessionId, deck);
  }

  private recordTurn(role: TranscriptTurn["role"], text: string): void {
    if (!text.trim()) return;
    const turn: TranscriptTurn = {
      id: crypto.randomUUID(),
      role,
      text,
      at: new Date().toISOString(),
    };
    this.emit("transcript", turn);
    sessionStore.appendTurn(this.sessionId, turn);
  }

  private persistShell(photoDataUrl: string): void {
    if (!this.persona) return;
    const shell: StoredSession = {
      id: this.sessionId,
      title: this.persona.subjectLabel,
      photoDataUrl,
      persona: this.persona,
      transcript: [],
      decks: [],
      createdAt: new Date().toISOString(),
    };
    sessionStore.save(shell);
  }
}
