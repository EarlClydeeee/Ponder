/**
 * POST /api/analyze-portrait → AwakenResult
 * Vision pre-pass: GPT-4o looks at a captured photo and drafts an
 * image-grounded, in-character awakening. SDD §8; cam PLAN.md.
 * Owner: Shello (route), David (contract).
 */
import { NextResponse } from "next/server";
import type { AnalyzePortraitRequest, AwakenResult } from "@/src/engine/types";

/** Vision calls can exceed Vercel Hobby's 10s default function window. */
export const maxDuration = 30;

const VISION_MODEL = "gpt-4o";
const SUBJECT_TYPES = ["artwork", "portrait", "object", "animal", "unknown"] as const;
const ANIMATION_STYLES = ["parallax", "blink", "ambient"] as const;
const CENTER_BOUNDS = { x: 0.2, y: 0.2, width: 0.6, height: 0.6 };
const CENTER_FACE = { x: 0.5, y: 0.5, scale: 0.8, rotation: 0 };

function fallbackResult(
  subjectLabel = "your captured subject",
  subjectType: AwakenResult["subjectType"] = "unknown",
): AwakenResult {
  return {
    subjectLabel,
    subjectType,
    subjectBounds: CENTER_BOUNDS,
    // Keeps /test/cam demonstrable when vision credentials are unavailable.
    faceMode: "suggested_face",
    facePlacement: CENTER_FACE,
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

function numberField(value: unknown, min: number, max: number): number | null {
  return typeof value === "number" && value >= min && value <= max ? value : null;
}

function boundsField(value: unknown): AwakenResult["subjectBounds"] | null {
  if (!value || typeof value !== "object") return null;
  const valueAsRecord = value as Record<string, unknown>;
  const x = numberField(valueAsRecord.x, 0, 1);
  const y = numberField(valueAsRecord.y, 0, 1);
  const width = numberField(valueAsRecord.width, 0.05, 1);
  const height = numberField(valueAsRecord.height, 0.05, 1);
  if (x === null || y === null || width === null || height === null || x + width > 1 || y + height > 1) return null;
  return { x, y, width, height };
}

function placementField(value: unknown): NonNullable<AwakenResult["facePlacement"]> | null {
  if (!value || typeof value !== "object") return null;
  const valueAsRecord = value as Record<string, unknown>;
  const x = numberField(valueAsRecord.x, 0, 1);
  const y = numberField(valueAsRecord.y, 0, 1);
  const scale = numberField(valueAsRecord.scale, 0.2, 1.5);
  const rotation = numberField(valueAsRecord.rotation, -45, 45);
  if (x === null || y === null || scale === null || rotation === null) return null;
  return { x, y, scale, rotation };
}

/** Places features in the upper-middle of the detected object when vision omits a finer anchor. */
function placementFromBounds(
  bounds: AwakenResult["subjectBounds"],
): NonNullable<AwakenResult["facePlacement"]> {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height * 0.44,
    scale: Math.min(1.2, Math.max(0.45, Math.min(bounds.width, bounds.height) * 1.5)),
    rotation: 0,
  };
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
  const subjectBounds = boundsField(candidate.subjectBounds);
  const faceMode = candidate.faceMode === "native_face" || candidate.faceMode === "suggested_face"
    ? candidate.faceMode
    : "uncertain";
  const facePlacement = placementField(candidate.facePlacement);
  const resolvedFacePlacement =
    faceMode === "suggested_face" ? (facePlacement ?? placementFromBounds(subjectBounds ?? CENTER_BOUNDS)) : null;

  if (!subjectLabel || !personaName || !personaTone || !greeting || !subjectBounds) {
    return fallbackResult(subjectLabel ?? "your captured subject", subjectType);
  }

  return {
    subjectLabel,
    subjectType,
    subjectBounds,
    faceMode,
    ...(resolvedFacePlacement ? { facePlacement: resolvedFacePlacement } : {}),
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
              "Return only JSON with: subjectLabel, subjectType, subjectBounds, faceMode, facePlacement, personaName, personaTone, greeting, animationStyle, isFallback. " +
              "subjectType must be artwork, portrait, object, animal, or unknown. animationStyle must be parallax, blink, or ambient. " +
              "subjectBounds is the primary subject rectangle as normalized x, y, width, height values. " +
              "Use native_face for people, portraits, paintings, photos, or any visible face. Use suggested_face only for face-free objects and include facePlacement: normalized x/y on the object surface (prefer its upper-middle), scale 0.2–1.5, rotation -45–45. Otherwise use uncertain. " +
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
