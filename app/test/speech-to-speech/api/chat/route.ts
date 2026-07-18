import { NextResponse } from "next/server";
import type { ChatRequest, ChatResponse } from "../../lib/types";

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 },
    );
  }

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { messages, systemPrompt, userMessage } = body;
  if (!userMessage?.trim()) {
    return NextResponse.json({ error: "userMessage required" }, { status: 400 });
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: userMessage },
      ],
      max_tokens: 512,
    }),
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "chat_failed", detail: await res.text() },
      { status: 502 },
    );
  }

  const data = await res.json();
  const text = String(data.choices?.[0]?.message?.content ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "empty_response" }, { status: 502 });
  }

  return NextResponse.json({ text } satisfies ChatResponse);
}
