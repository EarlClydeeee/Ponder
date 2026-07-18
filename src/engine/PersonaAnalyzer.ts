/**
 * Vision pre-pass: photo → PersonaConfig via /api/analyze-portrait.
 * Owner: David (contract), Shello (route).
 */
import type { AwakenConfig, PersonaConfig } from "./types";

/** Canned persona so the demo works with zero network (RFC §7, onboarding demo). */
const DEMO_PERSONAS: Record<string, PersonaConfig> = {
  mona_lisa: {
    subjectLabel: "Mona Lisa",
    voice: "sage",
    systemPrompt: buildSystemPrompt("Mona Lisa"),
    styleHint: "Renaissance oil painting vignette, warm candlelit palette",
  },
};

/** RFC §5 prompt template — single source of truth for persona instructions. */
export function buildSystemPrompt(subjectLabel: string): string {
  return [
    `You are ${subjectLabel}, speaking in first person as the subject of the user's photo.`,
    "Educational, accurate, engaging for curious learners ages 10+.",
    "Keep answers 2-4 sentences unless asked to go deeper.",
    "When explaining history, process, or multi-step ideas, call generate_slides with a concise topic.",
    "Never break character. If unsure, say what historians believe and invite another question.",
  ].join("\n");
}

export async function analyzePortrait(
  config: AwakenConfig,
): Promise<PersonaConfig> {
  if (config.demoAsset && DEMO_PERSONAS[config.demoAsset]) {
    return DEMO_PERSONAS[config.demoAsset];
  }

  const res = await fetch("/api/analyze-portrait", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photoDataUrl: config.photoDataUrl }),
  });
  if (!res.ok) {
    throw new Error(`analyze-portrait failed: ${res.status}`);
  }
  return (await res.json()) as PersonaConfig;
}
