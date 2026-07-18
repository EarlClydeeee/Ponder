/**
 * C1 — Shared contracts for the Living Portrait engine.
 * Owner: David. Consumers: everyone. Changes require David's review.
 * Source of truth: docs/rfc-curioframe-living-portrait-engine.md §3.
 */

export type PortraitPhase =
  | "idle"
  | "analyzing"
  | "connecting"
  | "alive"
  | "listening"
  | "speaking"
  | "generating_slides"
  | "fallback_text"
  | "error";

export type RealtimeVoice =
  | "alloy"
  | "ash"
  | "ballad"
  | "coral"
  | "echo"
  | "sage"
  | "shimmer"
  | "verse";

export interface PersonaConfig {
  subjectLabel: string;
  voice: RealtimeVoice;
  systemPrompt: string;
  /** Locked per session; keeps slide art direction consistent (RFC §5). */
  styleHint: string;
}

export interface TranscriptTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** ISO 8601 */
  at: string;
}

export interface Slide {
  imageUrl: string;
  caption: string;
  orderIndex: number;
}

export interface SlideDeck {
  deckId: string;
  topic: string;
  slides: Slide[];
  status: "generating" | "ready" | "failed";
}

export type DemoAsset = "mona_lisa";

export interface AwakenConfig {
  /** Downscaled capture (≤1024px) as a data URL, or a public path for demo assets. */
  photoDataUrl: string;
  sessionId?: string;
  demoAsset?: DemoAsset | null;
}

export interface PortraitError {
  code:
    | "analyze_failed"
    | "token_failed"
    | "daily_limit"
    | "realtime_failed"
    | "mic_denied"
    | "slides_failed"
    | "unknown";
  message: string;
  recoverable: boolean;
}

/** Persisted session — SDD §3 localStorage shape. */
export interface StoredSession {
  id: string;
  title: string;
  photoDataUrl: string;
  persona: PersonaConfig;
  transcript: TranscriptTurn[];
  decks: SlideDeck[];
  createdAt: string;
}

/** Engine event map — `engine.on(event, handler)`. */
export interface EngineEvents {
  phase: PortraitPhase;
  transcript: TranscriptTurn;
  slides: SlideDeck;
  error: PortraitError;
}

// --- API route contracts (C4/C5 — owner: Shello, consumer: David) ---

export interface RealtimeTokenResponse {
  token: string;
  session_id: string;
}

export interface GenerateSlidesRequest {
  topic: string;
  count: 1 | 2 | 3;
  style_hint: string;
}

export interface GenerateSlidesResponse {
  deck_id: string;
  topic: string;
  slides: Slide[];
}

export interface AnalyzePortraitRequest {
  photoDataUrl: string;
}

export type AnalyzePortraitResponse = PersonaConfig;
