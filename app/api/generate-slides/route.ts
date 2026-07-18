/**
 * C5 — POST /api/generate-slides → { deck_id, topic, slides[] }
 * Tool handler: topic → N educational illustrations (gpt-image-1), generated
 * in parallel (RFC §6). SDD §8.
 * Owner: Shello (route), David (contract).
 */
import { NextResponse } from "next/server";
import type {
  GenerateSlidesRequest,
  Slide,
} from "@/src/engine/types";

const IMAGE_MODEL = "gpt-image-1";

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 },
    );
  }

  const { topic, count, style_hint } =
    (await req.json()) as GenerateSlidesRequest;
  if (!topic) {
    return NextResponse.json({ error: "topic required" }, { status: 400 });
  }

  const n = Math.min(3, Math.max(1, count || 1));
  const captions = captionsFor(topic, n);

  try {
    const slides = await Promise.all(
      captions.map(async (caption, orderIndex): Promise<Slide> => {
        const res = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: IMAGE_MODEL,
            prompt: `${caption}. Style: ${style_hint}. Educational illustration, no text.`,
            size: "1024x1024",
            n: 1,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const b64 = data.data?.[0]?.b64_json;
        const url = data.data?.[0]?.url;
        return {
          imageUrl: b64 ? `data:image/png;base64,${b64}` : url,
          caption,
          orderIndex,
        };
      }),
    );

    return NextResponse.json({
      deck_id: crypto.randomUUID(),
      topic,
      slides,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "slides_failed", detail: String(err) },
      { status: 502 },
    );
  }
}

/** Split a topic into N sequential slide captions. */
function captionsFor(topic: string, n: number): string[] {
  if (n === 1) return [topic];
  if (n === 2) return [`${topic} — overview`, `${topic} — a key detail`];
  return [
    `${topic} — the setting`,
    `${topic} — the main idea`,
    `${topic} — why it matters`,
  ];
}
