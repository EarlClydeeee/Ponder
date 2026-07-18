# CONTRACT.md — integration contracts

Signatures the whole team codes against (dev-workflow plan §5). Change these only
with the owner's review.

| # | Contract | Owner | Consumers | Location |
|---|----------|-------|-----------|----------|
| C1 | `StoredSession`, `SlideDeck`, `PortraitPhase`, `PersonaConfig`, `AwakenResult` types | David | All | [src/engine/types.ts](src/engine/types.ts) |
| C2 | `LivingPortraitEngine` public API | David | Ivy, Elton | [src/engine/LivingPortraitEngine.ts](src/engine/LivingPortraitEngine.ts) |
| C3 | `useLivingPortrait()` hook shape | David | Ivy | [src/hooks/useLivingPortrait.ts](src/hooks/useLivingPortrait.ts) |
| C4 | `POST /api/realtime-token` → `{ token, session_id }` | Shello | David | [app/api/realtime-token/route.ts](app/api/realtime-token/route.ts) |
| C5 | `POST /api/generate-slides` → `{ deck_id, topic, slides[] }` | Shello | David | [app/api/generate-slides/route.ts](app/api/generate-slides/route.ts) |
| C6 | DSD theme tokens | Ivy | All | [app/globals.css](app/globals.css) + [lib/theme.ts](lib/theme.ts) |

Extra route: `POST /api/analyze-portrait` → `AwakenResult` (persona pre-pass).

Speech-to-speech test harness (self-contained): [app/test/speech-to-speech/](app/test/speech-to-speech/) — not part of C1–C6; reintegrate piecemeal from there.

## Engine public API (C2)

```ts
engine.awaken(config: AwakenConfig): Promise<void>
engine.startListening(): void
engine.stopListening(): void
engine.sendText(text: string): void
engine.regenerateSlides(deckId: string): Promise<void>
engine.endSession(): void
engine.on(event, handler): () => void   // 'phase' | 'transcript' | 'slides' | 'error'
```

## Hook shape (C3)

```ts
const { phase, subjectLabel, transcript, decks, activeDeck, error,
        talkEnabled, amplitude,
        awaken, startListening, stopListening, sendText,
        regenerateSlides, endSession } = useLivingPortrait();
```

## Ownership hotspots (no cross-edits without owner review)

- `src/engine/*` — David (no one else opens WebRTC code)
- `app/globals.css`, `lib/theme.ts` — Ivy
- `app/api/*` — Shello
- `next.config.ts`, `package.json` — Earl Clyde

## Feature sandboxes (`app/test/<feature>`)

Build a new feature as an isolated route (`/test/realtime`, `/test/camera`, …)
that consumes these C1–C6 contracts — never fork `types.ts` or copy the engine.
Integrate into `/app` once it works; `/test/*` routes stay dev-only (not linked
from `/app` or `/`). Owner→route map in
[docs/plan-dev-workflow-curioframe.md](docs/plan-dev-workflow-curioframe.md).
