/**
 * Shared client helpers for the persona-chat sandbox and future /app reuse.
 * Owner: David (client integration), Shello (API contracts).
 * Source of truth: C1 persona-chat additions in CONTRACT.md.
 */
import type {
  GeneratePersonaRequest,
  GeneratePersonaResponse,
  PersonaChatRequest,
  PersonaChatResponse,
  PersonaProfile,
  TranscriptTurn,
} from "@/src/engine/types";

export async function generatePersona(
  photoDataUrl: string,
): Promise<GeneratePersonaResponse> {
  const body: GeneratePersonaRequest = { photoDataUrl };
  return postJson<GeneratePersonaResponse>("/api/generate-persona", body);
}

export async function sendPersonaChat(
  profile: PersonaProfile,
  history: TranscriptTurn[],
  userMessage: string,
): Promise<PersonaChatResponse> {
  const body: PersonaChatRequest = { profile, history, userMessage };
  return postJson<PersonaChatResponse>("/api/persona-chat", body);
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readErrorMessage(data, response.status));
  }

  return data as T;
}

function readErrorMessage(data: unknown, status: number): string {
  if (isRecord(data)) {
    if (typeof data.detail === "string" && data.detail.trim()) {
      return data.detail;
    }
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
  }
  return `Request failed (${status})`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
