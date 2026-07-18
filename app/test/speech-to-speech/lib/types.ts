export type RealtimeVoice =
  | "alloy"
  | "ash"
  | "ballad"
  | "coral"
  | "echo"
  | "sage"
  | "shimmer"
  | "verse";

export type VoiceAgentPhase =
  | "idle"
  | "connecting"
  | "alive"
  | "listening"
  | "speaking"
  | "fallback_text"
  | "error";

export interface TranscriptTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
  at: string;
}

export interface VoiceAgentConfig {
  title: string;
  systemPrompt: string;
  voice: RealtimeVoice;
  greeting?: string;
}

export interface VoiceAgentError {
  code: "token_failed" | "realtime_failed" | "mic_denied" | "unknown";
  message: string;
  recoverable: boolean;
}

export interface VoiceAgentEvents {
  phase: VoiceAgentPhase;
  transcript: TranscriptTurn;
  error: VoiceAgentError;
}

export interface RealtimeTokenResponse {
  token: string;
  session_id: string;
}

export interface ChatRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  systemPrompt: string;
  userMessage: string;
}

export interface ChatResponse {
  text: string;
}
