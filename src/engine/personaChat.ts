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
  PersonaChatStreamEvent,
  PersonaCitation,
  PersonaProfile,
  TranscriptTurn,
} from "@/src/engine/types";

export interface PersonaChatStreamHandlers {
  onDelta?: (delta: string) => void;
  onWebSearch?: () => void;
  onCitation?: (citation: PersonaCitation) => void;
}

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
  handlers: PersonaChatStreamHandlers = {},
): Promise<PersonaChatResponse> {
  const body: PersonaChatRequest = { profile, history, userMessage };
  const response = await fetch("/api/persona-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null);
    throw new Error(readErrorMessage(data, response.status));
  }
  if (!response.body) {
    throw new Error("The chat response did not include a stream.");
  }

  return consumePersonaChatStream(response.body, handlers);
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

async function consumePersonaChatStream(
  body: ReadableStream<Uint8Array>,
  handlers: PersonaChatStreamHandlers,
): Promise<PersonaChatResponse> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const citations = new Map<string, PersonaCitation>();
  let buffer = "";
  let reply = "";
  let usedWebSearch = false;
  let completed: PersonaChatResponse | null = null;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const drained = drainSseBlocks(buffer);
      buffer = drained.remainder;

      for (const block of drained.blocks) {
        const event = parseStreamEvent(block);
        if (!event) continue;

        if (event.type === "delta") {
          reply += event.delta;
          handlers.onDelta?.(event.delta);
        } else if (event.type === "web_search") {
          usedWebSearch = true;
          handlers.onWebSearch?.();
        } else if (event.type === "citation") {
          citations.set(event.citation.url, event.citation);
          handlers.onCitation?.(event.citation);
        } else if (event.type === "done") {
          completed = event.response;
        } else if (event.type === "error") {
          throw new Error(event.error);
        }
      }
    }

    const trailing = parseStreamEvent(buffer);
    if (trailing?.type === "error") throw new Error(trailing.error);
    if (trailing?.type === "done") completed = trailing.response;
  } finally {
    reader.releaseLock();
  }

  if (completed) return completed;
  if (!reply.trim()) throw new Error("The chat stream ended without a reply.");

  return {
    reply,
    usedWebSearch,
    citations: Array.from(citations.values()),
  };
}

function drainSseBlocks(input: string): {
  blocks: string[];
  remainder: string;
} {
  const blocks: string[] = [];
  let remainder = input;

  while (true) {
    const boundary = /\r?\n\r?\n/.exec(remainder);
    if (!boundary) break;
    blocks.push(remainder.slice(0, boundary.index));
    remainder = remainder.slice(boundary.index + boundary[0].length);
  }

  return { blocks, remainder };
}

function parseStreamEvent(block: string): PersonaChatStreamEvent | null {
  const data = block
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");

  if (!data) return null;
  try {
    return JSON.parse(data) as PersonaChatStreamEvent;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
