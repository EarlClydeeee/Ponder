# Request for Comments (RFC) / Tech Spec

**Title:** Living Portrait Engine — Realtime voice persona + visual story slides
**Date:** 2026-07-18
**Author:** earlc [TBD — confirm]
**Status:** `Draft`
**PRD Reference:** [prd-curioframe.md §7 — AI specs, US-01–04](prd-curioframe.md)
**SDD Reference:** [sdd-curioframe.md §8 — AI architecture](sdd-curioframe.md)
**RFC ID:** `Ponder-rfc-001`

---

## 1. Context & Objective

**The problem this solves:**

Ponder's core magic — a photographed subject speaking in character while educational visuals appear — requires orchestrating three pipelines (vision persona, duplex audio, async image generation) without breaking conversational flow. This is ambiguous enough to specify: latency budgets, tool-call timing, portrait animation states, and failure modes must be defined before implementation.

**Reference in PRD/SDD:**

Implements PRD US-01 through US-04 and PRD §7. Extends SDD §8 tool surface and Realtime integration.

**Success criteria:**

- Voice response begins within 2s of user end-of-speech in a mid-tier phone browser (iPhone 13 Safari / Pixel 6 Chrome) on LTE
- ≥90% of subject photos produce a coherent persona greeting without manual correction
- Slide deck appears within 10s of tool call for decks of 1–3 images
- Zero session crashes on Realtime disconnect; fallback activates within 3s
- False "wrong character" rate <5% on bundled eval set (Mona Lisa, David statue, Eiffel Tower, generic dog)

---

## 2. Proposed Solution

**Approach:**

Introduce a `LivingPortraitEngine` class in the browser that owns a state machine from capture through conversation. It (1) sends the photo to `/api/analyze-portrait` and fetches persona config, (2) opens an OpenAI Realtime **WebRTC** connection (ephemeral token from `/api/realtime-token`) with vision + tools, (3) streams audio to/from UI via Web Audio, (4) handles `generate_slides` tool calls by invoking `/api/generate-slides` and emitting deck events to the slide carousel. Portrait UI subscribes via `useLivingPortrait` hook — screens never talk to Realtime directly.

**Architecture changes:**

- Add `LivingPortraitEngine` class (`src/engine/LivingPortraitEngine.ts`)
- Add submodules: `PersonaAnalyzer`, `RealtimeSession` (WebRTC), `SlideDeckCoordinator`, `PortraitAnimator`
- Add `useLivingPortrait` hook (`src/hooks/useLivingPortrait.ts`)
- Add `ConversationScreen` rendering from hook state (`components/app/ConversationScreen.tsx`, rendered at `/app`)
- Add API routes `app/api/generate-slides/route.ts` + `app/api/realtime-token/route.ts` + `app/api/analyze-portrait/route.ts`
- Persist transcript and decks to `localStorage` on turn complete (Supabase sync post-MVP)

---

## 3. Technical Details & Contracts

### Data Model Changes

Uses the SDD's `localStorage` shape. Session store contract (`src/engine/sessionStore.ts`):

```typescript
interface SessionStore {
  list(): StoredSession[];                       // "ponder.sessions", newest first
  get(id: string): StoredSession | null;
  save(session: StoredSession): void;            // upsert; evict oldest past cap of 5
  remove(id: string): void;
  appendTurn(id: string, turn: TranscriptTurn): void;   // flush on turn complete
  appendDeck(id: string, deck: SlideDeck): void;
  usageToday(): number;                          // "ponder.usage" — 3/day soft limit
  incrementUsage(): void;
}
```

`synced` flags and background sync arrive with Supabase post-MVP; the interface stays stable so sync slots in behind `save()`.

### API Changes

New Next.js API routes (see SDD §4). Realtime session opened client-side over WebRTC with a server-minted ephemeral token.

```typescript
interface LivingPortraitEngine {
  awaken(config: AwakenConfig): Promise<void>;
  startListening(): void;
  stopListening(): void;
  sendText(text: string): void;
  regenerateSlides(deckId: string): Promise<void>;
  endSession(): Promise<void>;

  on(event: 'phase', handler: (state: PortraitPhase) => void): void;
  on(event: 'transcript', handler: (turn: TranscriptTurn) => void): void;
  on(event: 'audio', handler: (chunk: ArrayBuffer) => void): void;
  on(event: 'slides', handler: (deck: SlideDeck) => void): void;
  on(event: 'error', handler: (error: PortraitError) => void): void;
}

interface AwakenConfig {
  photoUri: string;
  sessionId?: string;
  demoAsset?: 'mona_lisa' | 'statue' | null;
}

type PortraitPhase =
  | 'idle'
  | 'analyzing'
  | 'connecting'
  | 'alive'
  | 'listening'
  | 'speaking'
  | 'generating_slides'
  | 'fallback_text'
  | 'error';

interface PersonaConfig {
  subjectLabel: string;
  voice: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';
  systemPrompt: string;
  styleHint: string;
}

interface SlideDeck {
  deckId: string;
  topic: string;
  slides: Array<{ imageUrl: string; caption: string; orderIndex: number }>;
  status: 'generating' | 'ready' | 'failed';
}
```

### State Management

```
IDLE → ANALYZING → CONNECTING → ALIVE → LISTENING ⇄ SPEAKING → GENERATING_SLIDES → ALIVE
         ↓ fail          ↓ fail              ↓ Realtime drop
       ERROR          FALLBACK_TEXT ←────────────────────────
```

- `ANALYZING`: Upload photo; `PersonaAnalyzer` returns `PersonaConfig`
- `CONNECTING`: Mint token via `/api/realtime-token`; open Realtime WebRTC peer connection; send system prompt + image
- `ALIVE`: Portrait breathing animation; await user input
- `LISTENING`: Push-to-talk active; stream mic to Realtime
- `SPEAKING`: Play assistant audio; drive `PortraitAnimator` lip-sync
- `GENERATING_SLIDES`: Tool call in flight; show carousel skeleton
- `FALLBACK_TEXT`: HTTP chat completion via API route if WebRTC dead
- `ERROR`: User-facing message + retry

`useLivingPortrait` exposes `{ phase, subjectLabel, transcript, activeDeck, decks, talkEnabled, error }`.

---

## 4. Alternatives Considered

| Option | Why Rejected |
|--------|-------------|
| **Expo React Native client** | 3-hour timebox; native toolchain + build overhead; browser ships instantly and Capacitor wraps the same web build for stores later |
| **STT → LLM → TTS pipeline** | 3–5s turn latency; breaks conversational magic |
| **Gemini Live only** | Less hackathon sample code; team familiarity with OpenAI Realtime [TBD — confirm] |
| **On-device SLM for persona** | Cannot do quality vision + voice + slides in V1 on mobile |
| **Pre-authored slide templates only** | Fails open-ended Q&A; user questions won't match templates |
| **Always-on listening** | Privacy concerns in museums; accidental triggers |

---

## 5. AI / Agent Implementation Notes

**Model used:** gpt-4o-realtime-preview + gpt-image-1 for slides

**Prompt strategy:**

System prompt template:
```
You are {subjectLabel}, speaking in first person as the subject of the user's photo.
Educational, accurate, engaging for curious learners ages 10+.
Keep answers 2–4 sentences unless asked to go deeper.
When explaining history, process, or multi-step ideas, call generate_slides with a concise topic.
Never break character. If unsure, say what historians believe and invite another question.
```

**Tool calls:** `generate_slides({ topic: string, count: 1|2|3, style_hint: string })`

**Edge cases specific to ML behavior:**

- **Famous artwork:** Prefer widely accepted facts; disclaimer if attribution debated
- **Generic object (dog, coffee cup):** Playful persona still calls slides for "how it's made" topics if user asks educational questions
- **Low confidence vision:** Greeting uses "I appear to be…" phrasing; no false historical claims
- **Slide style drift:** `style_hint` locked per session from persona (e.g., "Renaissance oil painting vignette")
- **User asks for inappropriate content:** Refuse in character; no slides

**Token budget:** ~$0.35/session all-in at 5 min + 3 slides [TBD — confirm]

---

## 6. Security, Privacy & Performance

**Security surface:**

- Mic active only while push-to-talk held
- Photo sent to OpenAI only after user taps Awaken (explicit consent screen first launch)
- Realtime tokens expire in 60s if unused; single session scope
- Rate limit: 3 sessions/day free tier at token mint

**Performance:**

- Downscale photo to max 1024px (canvas) before upload
- Slide gen parallelized (Promise.all) for count ≤3
- Release mic stream on push-to-talk release and on tab hidden (`visibilitychange`)
- Lip-sync uses amplitude envelope (AnalyserNode), not video re-render

**Privacy:**

- Photos stored user-scoped; deleted with account
- Transcripts user-deletable
- Analytics: event counts only, no transcript content in V1

---

## 7. Execution Plan

**Can this ship behind a feature flag?** Yes — `LIVING_PORTRAIT_ENABLED`. Off → demo video only.

**Ticket breakdown:**

| Ticket | Description | Size | 3-hour cut |
|--------|-------------|------|------------|
| `CF-01` | Scaffold `LivingPortraitEngine` + state machine | S | Core |
| `CF-02` | `PersonaAnalyzer` + `/api/analyze-portrait` | M | Core |
| `CF-03` | `RealtimeSession` WebRTC client + `/api/realtime-token` | L | Core |
| `CF-04` | Push-to-talk audio I/O (`getUserMedia` + Web Audio) | M | Core |
| `CF-05` | `SlideDeckCoordinator` + `/api/generate-slides` | L | Core (1 slide min) |
| `CF-06` | `PortraitAnimator` lip-sync / breathe | M | Breathe only |
| `CF-07` | `useLivingPortrait` + ConversationScreen in mobile shell | M | Core |
| `CF-08` | `localStorage` persistence + session list | S | Core |
| `CF-09` | Fallback text mode | S | Stretch |
| `CF-10` | Eval suite AI-01–AI-08 | M | Post-MVP |

**Rollout order:** CF-01 → CF-02 → CF-03 → CF-04 → CF-07 (vertical slice) → CF-05 → CF-06 → CF-08 → CF-09 → CF-10

---

## Self-Check

- [ ] Section 3 has exact TypeScript interface contracts — not vague descriptions
- [ ] Section 3 schema is exact DDL if changed
- [ ] Section 4 has real rejected alternatives with genuine reasoning
- [ ] Section 5 is filled or marked N/A
- [ ] Section 7 ticket list is specific enough to act on immediately after approval
- [ ] Nothing in this RFC duplicates PRD (features) or SDD (global architecture)

---

*Next document: [QAD](qad-curioframe.md)*
