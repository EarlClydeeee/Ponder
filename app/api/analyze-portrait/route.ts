/**
 * POST /api/analyze-portrait → AwakenResult
 * Vision pre-pass: GPT-4o looks at a captured photo and drafts an
 * image-grounded, in-character awakening. SDD §8; cam PLAN.md.
 * Owner: Shello (route), David (contract).
 */
import { NextResponse } from "next/server";
import type { AnalyzePortraitRequest, AwakenResult } from "@/src/engine/types";

const VISION_MODEL = "gpt-4o";
const SUBJECT_TYPES = ["artwork", "portrait", "object", "animal", "unknown"] as const;
const ANIMATION_STYLES = ["parallax", "blink", "ambient"] as const;

function fallbackResult(
  subjectLabel = "your captured subject",
  subjectType: AwakenResult["subjectType"] = "unknown",
): AwakenResult {
  return {
    subjectLabel,
    subjectType,
    personaName: subjectLabel,
    personaTone: "playful, curious, and warm",
    greeting: `Hello, friend. I’m ${subjectLabel}, and I have a story hiding in plain sight.`,
    animationStyle: subjectType === "animal" ? "ambient" : "parallax",
    isFallback: true,
  };
}

function stringField(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseResult(content: string): AwakenResult {
  let candidate: Record<string, unknown>;
  try {
    candidate = JSON.parse(content) as Record<string, unknown>;
  } catch {
    return fallbackResult();
  }

  const subjectLabel = stringField(candidate.subjectLabel);
  const subjectType = SUBJECT_TYPES.includes(candidate.subjectType as AwakenResult["subjectType"])
    ? (candidate.subjectType as AwakenResult["subjectType"])
    : "unknown";
  const personaName = stringField(candidate.personaName);
  const personaTone = stringField(candidate.personaTone);
  const greeting = stringField(candidate.greeting);
  const animationStyle = ANIMATION_STYLES.includes(
    candidate.animationStyle as AwakenResult["animationStyle"],
  )
    ? (candidate.animationStyle as AwakenResult["animationStyle"])
    : "parallax";

  if (!subjectLabel || !personaName || !personaTone || !greeting) {
    return fallbackResult(subjectLabel ?? "your captured subject", subjectType);
  }

  return {
    subjectLabel,
    subjectType,
    personaName,
    personaTone,
    greeting,
    animationStyle,
    isFallback: candidate.isFallback === true || subjectType === "unknown",
  };
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(fallbackResult());
  }

  let body: AnalyzePortraitRequest;
  try {
    body = (await req.json()) as AnalyzePortraitRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.photoDataUrl?.startsWith("data:image/")) {
    return NextResponse.json(
      { error: "photoDataUrl must be an image data URL" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: VISION_MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You identify the subject of a photo so it can be brought to life as an educational character. " +
              "Return only JSON with: subjectLabel, subjectType, personaName, personaTone, greeting, animationStyle, isFallback. " +
              "subjectType must be artwork, portrait, object, animal, or unknown. animationStyle must be parallax, blink, or ambient. " +
              "For a recognizable subject, make a specific, respectful in-character persona and set isFallback false. " +
              "For an unfamiliar or ambiguous subject, never refuse: use visible details for a playful, image-grounded persona and greeting, and set isFallback true.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Identify this subject." },
              { type: "image_url", image_url: { url: body.photoDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) return NextResponse.json(fallbackResult());
    const data = await res.json();
    return NextResponse.json(parseResult(data.choices?.[0]?.message?.content ?? ""));
  } catch {
    return NextResponse.json(fallbackResult());
  }
}
