/**
 * POST /api/persona-chat -> one in-character text turn with optional web search.
 * Stateless Responses API route; the client supplies persona instructions and
 * the complete transcript on every turn. Owner: Shello (route), David (prompt).
 */
import { NextResponse } from "next/server";
import type {
  PersonaChatRequest,
  PersonaChatResponse,
  PersonaCitation,
} from "@/src/engine/types";

const CHAT_MODEL = process.env.CHAT_MODEL ?? "gpt-5.5";

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
      body: JSON.stringify({
        model: CHAT_MODEL,
        reasoning: { effort: "low" },
        store: false,
        instructions: body.profile.systemPrompt,
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

    const data: unknown = await response.json();
    const parsed = parseResponse(data);
    if (!parsed.reply) {
      throw new Error("The model returned no chat reply.");
    }

    return NextResponse.json(parsed);
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
      return item.annotations
        .filter(isRecord)
        .filter((annotation) => annotation.type === "url_citation")
        .flatMap((annotation): PersonaCitation[] => {
          if (typeof annotation.url !== "string") return [];
          return [
            {
              url: annotation.url,
              title:
                typeof annotation.title === "string" && annotation.title.trim()
                  ? annotation.title
                  : annotation.url,
            },
          ];
        });
    }),
  );

  return { reply, usedWebSearch, citations };
}

function dedupeCitations(citations: PersonaCitation[]): PersonaCitation[] {
  return Array.from(new Map(citations.map((item) => [item.url, item])).values());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
