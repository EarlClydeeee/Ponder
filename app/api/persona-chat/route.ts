/**
 * POST /api/persona-chat -> streamed in-character text with optional web search.
 * Stateless Responses API route; the client supplies persona instructions and
 * the complete transcript on every turn. Owner: Shello (route), David (prompt).
 */
import { NextResponse } from "next/server";
import type {
  PersonaChatRequest,
  PersonaChatResponse,
  PersonaChatStreamEvent,
  PersonaCitation,
} from "@/src/engine/types";

type ReasoningEffort = "none" | "low" | "medium" | "high" | "xhigh";

const CHAT_MODEL = process.env.CHAT_MODEL ?? "gpt-5.4-mini";
const CHAT_REASONING_EFFORT = readReasoningEffort(
  process.env.CHAT_REASONING_EFFORT,
  "low",
);

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 },
    );
  }

  let body: PersonaChatRequest;
  try {
    body = (await req.json()) as PersonaChatRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const userMessage = body.userMessage?.trim();
  if (!body.profile?.systemPrompt || !userMessage) {
    return NextResponse.json(
      { error: "profile.systemPrompt and userMessage are required" },
      { status: 400 },
    );
  }

  const history = Array.isArray(body.history) ? body.history : [];

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: req.signal,
      body: JSON.stringify({
        model: CHAT_MODEL,
        reasoning: { effort: CHAT_REASONING_EFFORT },
        store: false,
        stream: true,
        instructions: body.profile.systemPrompt,
        // Keeps repeat turns for one persona on the same cache route when possible.
        prompt_cache_key: promptCacheKey(body.profile.systemPrompt),
        tools: [{ type: "web_search" }],
        input: [
          ...history.map((turn) => ({
            role: turn.role,
            content: turn.text,
          })),
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json(
        {
          error: "persona_chat_failed",
          detail: detail || `OpenAI request failed (${response.status})`,
        },
        { status: 502 },
      );
    }

    if (!response.body) {
      throw new Error("OpenAI returned no response stream.");
    }

    return createPersonaChatStream(response.body);
  } catch (error) {
    return NextResponse.json(
      {
        error: "persona_chat_failed",
        detail: error instanceof Error ? error.message : "Unknown chat error",
      },
      { status: 502 },
    );
  }
}

function createPersonaChatStream(upstream: ReadableStream<Uint8Array>): Response {
  const encoder = new TextEncoder();
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let cancelled = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      reader = upstream.getReader();
      const decoder = new TextDecoder();
      const state = { webSearchSent: false };
      let buffer = "";
      let terminalSeen = false;

      try {
        while (!cancelled) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const drained = drainSseBlocks(buffer);
          buffer = drained.remainder;

          for (const block of drained.blocks) {
            const event = parseSseEvent(block);
            if (!event) continue;

            const forwarded = eventsFor(event, state);
            terminalSeen ||= forwarded.terminal;
            for (const clientEvent of forwarded.events) {
              enqueueEvent(controller, encoder, clientEvent);
            }
          }
        }

        const trailing = parseSseEvent(buffer);
        if (trailing) {
          const forwarded = eventsFor(trailing, state);
          terminalSeen ||= forwarded.terminal;
          for (const clientEvent of forwarded.events) {
            enqueueEvent(controller, encoder, clientEvent);
          }
        }

        if (!cancelled && !terminalSeen) {
          enqueueEvent(controller, encoder, {
            type: "error",
            error: "The model stream ended before completing the reply.",
          });
        }
      } catch (error) {
        if (!cancelled) {
          enqueueEvent(controller, encoder, {
            type: "error",
            error: error instanceof Error ? error.message : "Chat stream failed",
          });
        }
      } finally {
        reader.releaseLock();
        reader = null;
        if (!cancelled) controller.close();
      }
    },
    async cancel() {
      cancelled = true;
      await reader?.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function eventsFor(
  event: Record<string, unknown>,
  state: { webSearchSent: boolean },
): { events: PersonaChatStreamEvent[]; terminal: boolean } {
  const type = typeof event.type === "string" ? event.type : "";

  if (type === "response.output_text.delta" && typeof event.delta === "string") {
    return { events: [{ type: "delta", delta: event.delta }], terminal: false };
  }

  if (
    type.startsWith("response.web_search_call.") ||
    (type === "response.output_item.added" &&
      isRecord(event.item) &&
      event.item.type === "web_search_call")
  ) {
    if (state.webSearchSent) return { events: [], terminal: false };
    state.webSearchSent = true;
    return { events: [{ type: "web_search" }], terminal: false };
  }

  if (type === "response.output_text.annotation.added") {
    const citation = citationFrom(event.annotation);
    return citation
      ? { events: [{ type: "citation", citation }], terminal: false }
      : { events: [], terminal: false };
  }

  if (type === "response.completed") {
    const parsed = parseResponse(event.response);
    if (!parsed.reply) {
      return {
        events: [{ type: "error", error: "The model returned no chat reply." }],
        terminal: true,
      };
    }

    const events: PersonaChatStreamEvent[] = [];
    if (parsed.usedWebSearch && !state.webSearchSent) {
      state.webSearchSent = true;
      events.push({ type: "web_search" });
    }
    events.push({ type: "done", response: parsed });
    return { events, terminal: true };
  }

  if (type === "response.failed" || type === "error") {
    return {
      events: [{ type: "error", error: streamErrorMessage(event) }],
      terminal: true,
    };
  }

  return { events: [], terminal: false };
}

function enqueueEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  event: PersonaChatStreamEvent,
) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
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

function parseSseEvent(block: string): Record<string, unknown> | null {
  const data = block
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");

  if (!data || data === "[DONE]") return null;
  try {
    const parsed: unknown = JSON.parse(data);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function parseResponse(data: unknown): PersonaChatResponse {
  if (!isRecord(data) || !Array.isArray(data.output)) {
    return { reply: "", usedWebSearch: false, citations: [] };
  }

  const output = data.output.filter(isRecord);
  const usedWebSearch = output.some((item) => item.type === "web_search_call");
  const content = output.flatMap((item) =>
    Array.isArray(item.content) ? item.content.filter(isRecord) : [],
  );

  const reply = content
    .map((item) => {
      if (item.type === "output_text" && typeof item.text === "string") {
        return item.text;
      }
      if (item.type === "refusal" && typeof item.refusal === "string") {
        return item.refusal;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();

  const citations = dedupeCitations(
    content.flatMap((item) => {
      if (!Array.isArray(item.annotations)) return [];
      return item.annotations.flatMap((annotation): PersonaCitation[] => {
        const citation = citationFrom(annotation);
        return citation ? [citation] : [];
      });
    }),
  );

  return { reply, usedWebSearch, citations };
}

function citationFrom(value: unknown): PersonaCitation | null {
  if (!isRecord(value) || value.type !== "url_citation") return null;
  if (typeof value.url !== "string") return null;
  return {
    url: value.url,
    title:
      typeof value.title === "string" && value.title.trim()
        ? value.title
        : value.url,
  };
}

function dedupeCitations(citations: PersonaCitation[]): PersonaCitation[] {
  return Array.from(new Map(citations.map((item) => [item.url, item])).values());
}

function streamErrorMessage(event: Record<string, unknown>): string {
  if (typeof event.message === "string") return event.message;
  if (isRecord(event.error) && typeof event.error.message === "string") {
    return event.error.message;
  }
  if (isRecord(event.response) && isRecord(event.response.error)) {
    const message = event.response.error.message;
    if (typeof message === "string") return message;
  }
  return "The model could not complete the chat reply.";
}

function promptCacheKey(prompt: string): string {
  let hash = 2166136261;
  for (let index = 0; index < prompt.length; index += 1) {
    hash ^= prompt.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `persona-chat-${(hash >>> 0).toString(36)}`;
}

function readReasoningEffort(
  value: string | undefined,
  fallback: ReasoningEffort,
): ReasoningEffort {
  return value === "none" ||
    value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "xhigh"
    ? value
    : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
