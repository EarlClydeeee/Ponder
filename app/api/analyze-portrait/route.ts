/**
 * POST /api/analyze-portrait → PersonaConfig
 * Vision pre-pass: GPT-4o looks at the photo and drafts an in-character
 * persona (subject label, voice, system prompt, style hint). SDD §8.
 * Owner: Shello (route), David (contract).
 */
import { NextResponse } from "next/server";
import { buildSystemPrompt } from "@/src/engine/PersonaAnalyzer";
import type { AnalyzePortraitRequest, RealtimeVoice } from "@/src/engine/types";

const VISION_MODEL = "gpt-4o";
const VOICES: RealtimeVoice[] = [
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "sage",
  "shimmer",
  "verse",
];

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 },
    );
  }

  const { photoDataUrl } = (await req.json()) as AnalyzePortraitRequest;
  if (!photoDataUrl) {
    return NextResponse.json({ error: "photoDataUrl required" }, { status: 400 });
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You identify the subject of a photo so it can be brought to life as an educational character. " +
            "Return JSON: { subjectLabel, voice, styleHint }. " +
            `voice is one of: ${VOICES.join(", ")} (pick a tone that fits the subject). ` +
            "styleHint is a short art-direction phrase for illustration slides " +
            "(e.g. 'Renaissance oil painting vignette'). " +
            "If the subject is ambiguous, use a hedged label like 'a curious object'.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Identify this subject." },
            { type: "image_url", image_url: { url: photoDataUrl } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "analyze_failed", detail: await res.text() },
      { status: 502 },
    );
  }

  const data = await res.json();
  let parsed: { subjectLabel?: string; voice?: string; styleHint?: string } = {};
  try {
    parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
  } catch {
    /* fall through to defaults */
  }

  const subjectLabel = parsed.subjectLabel?.trim() || "a curious object";
  const voice: RealtimeVoice = VOICES.includes(parsed.voice as RealtimeVoice)
    ? (parsed.voice as RealtimeVoice)
    : "sage";

  return NextResponse.json({
    subjectLabel,
    voice,
    systemPrompt: buildSystemPrompt(subjectLabel),
    styleHint: parsed.styleHint?.trim() || "clean educational illustration",
  });
}
