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

/** Capture pre-pass result used by the isolated Awaken portrait flow. */
export type AwakenResult = {
  subjectLabel: string;
  subjectType: "artwork" | "portrait" | "object" | "animal" | "unknown";
  /** Primary subject rectangle, normalized to the captured photo (0–1). */
  subjectBounds: { x: number; y: number; width: number; height: number };
  /** Whether a CSS face should be added to this capture. */
  faceMode: "native_face" | "suggested_face" | "uncertain";
  /** Vision-selected placement for a generated CSS face. */
  facePlacement?: { x: number; y: number; scale: number; rotation: number };
  personaName: string;
  personaTone: string;
  greeting: string;
  animationStyle: "parallax" | "blink" | "ambient";
  isFallback: boolean;
};

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

export type AnalyzePortraitResponse = AwakenResult;

// --- Persona-chat feature contracts (sandbox: /test/persona-chat) ---

export type PersonaCategory =
  | "artwork"
  | "landmark"
  | "food"
  | "animal"
  | "plant"
  | "product"
  | "vehicle"
  | "building"
  | "object"
  | "other";

export type IdentityConfidence = "high" | "medium" | "low";

export interface PersonaProfile {
  subjectLabel: string;
  category: PersonaCategory;
  identityConfidence: IdentityConfidence;
  personality: {
    traits: string[];
    demeanor: string;
    humorStyle: string;
    quirks: string[];
  };
  speakingStyle: string;
  /** Reserved for the later Realtime voice integration. */
  voice: RealtimeVoice;
  greeting: string;
  /** First-person, fact-grounded narrative memories. */
  memories: string[];
  keyFacts: string[];
  expertise: string[];
  boundaries: string[];
  /** Locked art direction for later slide generation. */
  styleHint: string;
  /** Deterministically composed by /api/generate-persona. */
  systemPrompt: string;
}

export interface GeneratePersonaRequest {
  photoDataUrl: string;
}

export type GeneratePersonaResponse = PersonaProfile;

export interface PersonaCitation {
  url: string;
  title: string;
}

export interface PersonaChatRequest {
  profile: PersonaProfile;
  history: TranscriptTurn[];
  userMessage: string;
}

export interface PersonaChatResponse {
  reply: string;
  usedWebSearch: boolean;
  citations: PersonaCitation[];
}

/** App-level SSE events emitted by /api/persona-chat. */
export type PersonaChatStreamEvent =
  | { type: "delta"; delta: string }
  | { type: "web_search" }
  | { type: "citation"; citation: PersonaCitation }
  | { type: "done"; response: PersonaChatResponse }
  | { type: "error"; error: string };
