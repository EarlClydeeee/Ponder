/**
 * POST /api/generate-persona -> PersonaProfile
 * High-reasoning Responses API vision pass with strict structured output.
 * Owner: Shello (route), David (persona contract and prompt).
 */
import { NextResponse } from "next/server";
import type {
  GeneratePersonaRequest,
  IdentityConfidence,
  PersonaCategory,
  PersonaProfile,
  RealtimeVoice,
} from "@/src/engine/types";

const PERSONA_MODEL = process.env.PERSONA_MODEL ?? "gpt-5.6";

const CATEGORIES: PersonaCategory[] = [
  "artwork",
  "landmark",
  "food",
  "animal",
  "plant",
  "product",
  "vehicle",
  "building",
  "object",
  "other",
];

const CONFIDENCE_LEVELS: IdentityConfidence[] = ["high", "medium", "low"];

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

type GeneratedPersonaFields = Omit<PersonaProfile, "systemPrompt">;

const PERSONA_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "subjectLabel",
    "category",
    "identityConfidence",
    "personality",
    "speakingStyle",
    "voice",
    "greeting",
    "memories",
    "keyFacts",
    "expertise",
    "boundaries",
    "styleHint",
  ],
  properties: {
    subjectLabel: { type: "string" },
    category: { type: "string", enum: CATEGORIES },
    identityConfidence: { type: "string", enum: CONFIDENCE_LEVELS },
    personality: {
      type: "object",
      additionalProperties: false,
      required: ["traits", "demeanor", "humorStyle", "quirks"],
      properties: {
        traits: {
          type: "array",
          minItems: 3,
          maxItems: 6,
          items: { type: "string" },
        },
        demeanor: { type: "string" },
        humorStyle: { type: "string" },
        quirks: {
          type: "array",
          minItems: 1,
          maxItems: 4,
          items: { type: "string" },
        },
      },
    },
    speakingStyle: { type: "string" },
    voice: { type: "string", enum: VOICES },
    greeting: { type: "string" },
    memories: {
      type: "array",
      minItems: 5,
      maxItems: 8,
      items: { type: "string" },
    },
    keyFacts: {
      type: "array",
      minItems: 8,
      maxItems: 15,
      items: { type: "string" },
    },
    expertise: {
      type: "array",
      minItems: 3,
      maxItems: 8,
      items: { type: "string" },
    },
    boundaries: {
      type: "array",
      minItems: 3,
      maxItems: 8,
      items: { type: "string" },
    },
    styleHint: { type: "string" },
  },
} as const;

const PERSONA_INSTRUCTIONS = `You create a robust educational persona from one photo.

First identify the visible primary subject, choose exactly one allowed category, and report identityConfidence honestly:
- high: distinctive visual evidence supports a specific identity;
- medium: the category or likely identity is supported, but exact attribution is uncertain;
- low: the photo is ambiguous, generic, low-signal, or lacks evidence for a specific identity.

Never invent a creator, date, location, provenance, species, brand, nutritional claim, or historical event. For medium confidence, label likely details as likely. For low confidence, use a hedged subjectLabel and only visually supported or category-general facts. Empty visual evidence is not permission to guess.

Apply the category lens that fits:
- artwork: artist or maker only when supported, era, medium, technique, composition, historical context, and interpretation;
- landmark or building: location only when supported, history, architecture, materials, cultural role, and preservation;
- food: nutrition with sensible caveats, origin, cultivation or production, cooking, storage, and cultural uses;
- animal: species only when supported, habitat, behavior, anatomy, diet, welfare, and conservation;
- plant: species only when supported, habitat, growth, ecology, care, and cultural uses;
- product or object: materials, design, manufacture, operation, maintenance, history, and safe use;
- vehicle: design, engineering, operation, history, and safety.

Create a distinctive but respectful personality. The greeting and every memory must be in first person and in character. Memories are vivid narrative viewpoints grounded in known facts or ordinary visible experience; do not present imagined scenes as documented evidence. Produce 5-8 memories, 8-15 concise key facts, practical expertise topics, honest boundaries, and a short slide-art styleHint. Choose one allowed Realtime voice. The result must suit curious learners ages 10+ and must follow the supplied JSON schema.`;

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 },
    );
  }

  let body: GeneratePersonaRequest;
  try {
    body = (await req.json()) as GeneratePersonaRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isImageDataUrl(body.photoDataUrl)) {
    return NextResponse.json(
      { error: "photoDataUrl must be an image data URL" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: PERSONA_MODEL,
        reasoning: { effort: "high" },
        store: false,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: PERSONA_INSTRUCTIONS },
              {
                type: "input_image",
                image_url: body.photoDataUrl,
                detail: "high",
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "persona_profile",
            strict: true,
            schema: PERSONA_SCHEMA,
          },
        },
      }),
    });

    if (!response.ok) {
      return upstreamError("persona_generation_failed", response);
    }

    const data: unknown = await response.json();
    const refusal = extractRefusal(data);
    if (refusal) {
      return NextResponse.json(
        { error: "persona_generation_refused", detail: refusal },
        { status: 422 },
      );
    }

    const outputText = extractOutputText(data);
    if (!outputText) {
      throw new Error("The model returned no persona profile.");
    }

    const generated = JSON.parse(outputText) as GeneratedPersonaFields;
    const profile: PersonaProfile = {
      ...generated,
      systemPrompt: composeSystemPrompt(generated),
    };

    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json(
      { error: "persona_generation_failed", detail: readableError(error) },
      { status: 502 },
    );
  }
}

function composeSystemPrompt(profile: GeneratedPersonaFields): string {
  const confidenceRule = {
    high:
      "You may state the supplied identity and key facts directly, while still acknowledging genuine scholarly or scientific uncertainty.",
    medium:
      "Treat the identity as likely rather than certain. Use phrases such as 'I appear to be' or 'I am probably,' and distinguish established facts from inference.",
    low:
      "Do not claim a specific identity, maker, date, place, species, or provenance. Speak as the visible subject in general terms and explicitly hedge every uncertain detail.",
  }[profile.identityConfidence];

  return [
    `You are ${profile.subjectLabel}, the ${profile.category} shown in the user's photo. Speak in first person as that subject.`,
    "",
    `IDENTITY CONFIDENCE: ${profile.identityConfidence}. ${confidenceRule}`,
    "",
    "PERSONALITY",
    `Traits: ${profile.personality.traits.join(", ")}.`,
    `Demeanor: ${profile.personality.demeanor}`,
    `Humor: ${profile.personality.humorStyle}`,
    `Quirks: ${profile.personality.quirks.join("; ")}`,
    `Speaking style: ${profile.speakingStyle}`,
    "",
    "FIRST-PERSON MEMORIES",
    ...profile.memories.map((memory) => `- ${memory}`),
    "Use these as lived, in-character perspective. They are not independent evidence; never expand them into unsupported concrete claims.",
    "",
    "GROUNDING KNOWLEDGE",
    ...profile.keyFacts.map((fact) => `- ${fact}`),
    "Treat these key facts as your baked-in knowledge. Do not contradict them or invent additional specifics.",
    "",
    `EXPERTISE: ${profile.expertise.join("; ")}`,
    "",
    "BOUNDARIES",
    ...profile.boundaries.map((boundary) => `- ${boundary}`),
    "If a request is unsafe, inappropriate, or outside these boundaries, refuse briefly while staying in character and offer a safe educational direction.",
    "",
    "CONVERSATION RULES",
    "- Be accurate, warm, and educational for curious learners ages 10 and up.",
    "- Default to 2-4 sentences unless the user asks for more depth.",
    "- Stay in character, but never sacrifice honesty for theatricality.",
    "- Use the web_search tool for current events, recent news, changing facts, or questions beyond the grounding knowledge above.",
    "- Do not use web search when the supplied grounding knowledge already answers the question.",
    "- When web search is used, weave the sourced answer naturally into your first-person voice and do not imply you personally witnessed recent events.",
  ].join("\n");
}

async function upstreamError(code: string, response: Response) {
  const detail = await response.text();
  return NextResponse.json(
    { error: code, detail: detail || `OpenAI request failed (${response.status})` },
    { status: 502 },
  );
}

function isImageDataUrl(value: unknown): value is string {
  return typeof value === "string" && /^data:image\/(jpeg|png|webp);base64,/i.test(value);
}

function extractOutputText(data: unknown): string {
  if (!isRecord(data) || !Array.isArray(data.output)) return "";
  return data.output
    .filter(isRecord)
    .flatMap((item) => (Array.isArray(item.content) ? item.content : []))
    .filter(isRecord)
    .filter((content) => content.type === "output_text")
    .map((content) => (typeof content.text === "string" ? content.text : ""))
    .join("\n")
    .trim();
}

function extractRefusal(data: unknown): string {
  if (!isRecord(data) || !Array.isArray(data.output)) return "";
  return data.output
    .filter(isRecord)
    .flatMap((item) => (Array.isArray(item.content) ? item.content : []))
    .filter(isRecord)
    .filter((content) => content.type === "refusal")
    .map((content) => (typeof content.refusal === "string" ? content.refusal : ""))
    .join(" ")
    .trim();
}

function readableError(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown persona generation error";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
