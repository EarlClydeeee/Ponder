# Ponder — agent guide

> This file and [AGENTS.md](AGENTS.md) are kept **identical** — edit both together.
> Claude Code auto-loads `CLAUDE.md`; Codex and other agents load `AGENTS.md`.

## What Ponder is

Ponder turns any photo into a **Living Portrait**: you photograph a painting,
statue, landmark, or object, it comes alive in character, answers your questions
by **voice**, and generates **visual story slides** while it explains. One
**Next.js 15** project:

- `/` — marketing landing page
- `/app` — the product (a phone-width column; capture → awaken → converse)
- `/api/*` — route handlers that hold the OpenAI key server-side

To *understand* the product or a subsystem before changing it, **read the docs
first** — they are the source of truth for intent. Don't reverse-engineer intent
from code when a doc explains it.

## Documentation map — read before you build

All in [docs/](docs/). Start with the one that matches your question.

| Doc | Answers | Read when |
|-----|---------|-----------|
| [brd-curioframe.md](docs/brd-curioframe.md) | Why we're building this; scope, metrics | Business/scope questions |
| [prd-curioframe.md](docs/prd-curioframe.md) | *What* to build; features, user stories, acceptance criteria | Adding/altering a feature |
| [sdd-curioframe.md](docs/sdd-curioframe.md) | *How* it's built; architecture, data, API, security, NFRs | Architecture/data/API work |
| [rfc-curioframe-living-portrait-engine.md](docs/rfc-curioframe-living-portrait-engine.md) | The engine deep-dive; state machine, contracts, tickets | Touching `src/engine/*` |
| [dsd-curioframe.md](docs/dsd-curioframe.md) | Design system; tokens, components, motion, a11y | Any UI/styling work |
| [qad-curioframe.md](docs/qad-curioframe.md) | Test plan; happy/sad scenarios (H-/S-), AI eval | Writing/running tests |
| [plan-dev-workflow-curioframe.md](docs/plan-dev-workflow-curioframe.md) | Team roles, 3-hour build order, contracts | Planning/ownership |
| [plan-website-curioframe.md](docs/plan-website-curioframe.md) | Single-project layout, landing sections | Landing/`/app` structure |
| gtm / pitch / onboarding | Launch, positioning, first-run flow | Marketing/onboarding |

Contracts the whole team codes against live in [CONTRACT.md](CONTRACT.md).

## Architecture at a glance

```
Browser (/app) ──WebRTC──────────────► OpenAI Realtime (voice)
      │  fetch                            ▲ ephemeral token
      ├──► /api/realtime-token ───────────┘
      ├──► /api/generate-persona ──► vision (PersonaProfile: systemPrompt+voice)
      ├──► /api/persona-chat ─────► SSE text fallback (web-search grounded)
      ├──► /api/generate-slides ────► gpt-image-1 (slides — dormant)
      └──► localStorage (sessions)
```

- **UI never talks to the network/Realtime directly.** It goes through the
  engine, which it consumes via the `useLivingPortrait` hook.
- **Keys never reach the browser** — only `app/api/*` read `OPENAI_API_KEY`.
- **State machine** (RFC §3): `idle → analyzing → connecting → alive →
  listening ⇄ speaking → generating_slides → alive`, degrading to
  `fallback_text` (Realtime drop) or `error`.
- Engine emits events `phase | transcript | slides | error | face`; the hook
  exposes `{ phase, subjectLabel, transcript, decks, activeDeck, error,
  talkEnabled, amplitude, awakenResult, awaken, startListening, stopListening,
  sendText, regenerateSlides, endSession }`.

Layout:
```
app/            page.tsx (/), app/page.tsx (/app), api/*/route.ts
src/engine/     LivingPortraitEngine, RealtimeSession (WebRTC), personaChat,
                SlideDeckCoordinator (dormant), PortraitAnimator, sessionStore, types
src/hooks/      useLivingPortrait          src/lib/  image downscale
components/app/ MobileShell, CaptureScreen, ConversationScreen, PortraitFrame,
                TalkButton, SlideCarousel
app/test/<feat> isolated feature harnesses → /test/<feat>, integrated into /app when green
lib/theme.ts    DSD tokens for TS          app/globals.css  DSD tokens as CSS vars
```

## Build & verification policy — IMPORTANT

**Do NOT run `npm run build` while iterating.** Only run it as the final
verification step *when you are about to commit*. A build is not part of the edit
loop.

- **In the edit loop** (fast, cheap): `npx tsc --noEmit` for types, `npm run lint`
  for lint, `npm run dev` for manual/visual checks.
- **At commit time only**: run `npm run build` once as the pre-commit gate; if it
  passes, commit. If you're not committing, don't build. (Docs-only changes need
  no build at all.)

| When | Command |
|------|---------|
| Dev server | `npm run dev` → http://localhost:3000 |
| Typecheck (in-loop) | `npx tsc --noEmit` |
| Lint (in-loop) | `npm run lint` |
| Build (commit gate only) | `npm run build` |

## Best practices for this codebase

These are the rules that keep the architecture intact — follow them:

1. **Contracts before code.** [src/engine/types.ts](src/engine/types.ts) is the
   source of truth for shared shapes. Change a contract only with the owner's
   review, and update [CONTRACT.md](CONTRACT.md) alongside it.
2. **Screens render from hook state only** — no business logic, no `fetch`, no
   direct engine wiring in components. Read state from `useLivingPortrait`, call
   its actions. (workflow principle 2)
3. **Only `RealtimeSession` opens WebRTC / talks to OpenAI Realtime.** No other
   file touches peer connections or Realtime events.
4. **Secrets stay server-side.** Only `app/api/*` may read `OPENAI_API_KEY`.
   Never import server env into a client component.
5. **Use DSD tokens, never hardcode.** Colors/spacing/radii come from
   `var(--color-*)` (globals.css) or [lib/theme.ts](lib/theme.ts). No raw hex.
6. **Persist only through `sessionStore`** — never touch `localStorage` directly.
   Keys: `ponder.sessions` (cap 5), `ponder.usage` (3/day), `ponder.prefs`.
7. **`"use client"` only where needed** (hooks, browser APIs, interactivity);
   keep components server-side by default.
8. **Graceful degradation is a feature, not a bug** — preserve the fallbacks:
   Realtime drop → `fallback_text` mode; slide gen fail → caption card.
9. **Respect a11y (DSD §6):** ≥56px tap targets (72px talk button), gold focus
   ring, honor `prefers-reduced-motion`, screen-reader labels on portrait state.
10. **Mind the latency budgets** (RFC/SDD): voice reply <2s, first awaken <5s,
    slide <10s. Keep pipelines async; never block the portrait render path.
11. **Downscale images to ≤1024px** before upload via
    [src/lib/image.ts](src/lib/image.ts).
12. **Match the surrounding code** — every module has a header comment naming its
    owner and the doc section it implements; keep that convention.
13. **Building a new feature? Start in `app/test/<feature>`** — validate it in an
    isolated route, then integrate into `/app`. See *Feature sandboxes* below.

General engineering hygiene: prefer editing existing files and reusing patterns
over adding new ones; keep changes small and focused; don't add dependencies
without a reason; leave the tree building and lint-clean at commit time.

## Feature sandboxes — `app/test/<feature>`

Five people build in parallel, so **don't develop new features directly in
`/app`.** Build each one as an isolated route first, then integrate.

- **Location:** `app/test/<feature-name>/page.tsx` → reachable at
  `/test/<feature-name>` (e.g. `/test/realtime`, `/test/camera`, `/test/slides`,
  `/test/persona`).
- **Reuse shared code** — import from `src/engine/*`,
  `src/hooks/useLivingPortrait`, `lib/theme.ts`. Don't fork `types.ts` or copy the
  engine; a sandbox is a harness, not a private branch of the code.
- **Keep it isolated** — a `/test/*` route must not be imported by `/app` or the
  landing page. `/app` stays the single integration target.
- **Integrate when green** — once it works in its sandbox, wire it into `/app`
  (or the relevant `components/app/*`); keep the test route as a regression
  harness or delete it.
- **Not user-facing** — never link `/test/*` from `/app` or `/`.

## Ownership hotspots (don't cross-edit without the owner)

- `src/engine/*` — David (no one else opens WebRTC code)
- `app/globals.css`, `lib/theme.ts` — Ivy
- `app/api/*` — Shello
- `next.config.ts`, `package.json` — Earl Clyde

## Testing

- **Unit/integration:** Vitest + React Testing Library (engine state machine,
  `sessionStore`, persona parsing). Mock Realtime for integration.
- **E2E / browser:** the [`/e2e` skill](.claude/skills/e2e/SKILL.md) drives the
  app via the **Playwright MCP** server ([.mcp.json](.mcp.json)); map runs to the
  QAD H-/S- scenarios. Playwright MCP is configured headed + 800 ms slow-mo
  ([playwright-mcp.config.json](playwright-mcp.config.json)) so runs are watchable.
- Never claim a flow passed without an observation (snapshot / console) proving
  it — see [qad-curioframe.md §6](docs/qad-curioframe.md).

## Git conventions

- Trunk-based; commit in small logical units. Owner of a touched hotspot reviews.
- Commit subjects: `type(scope): summary` (`feat` / `fix` / `docs` / `chore` /
  `refactor`). Commit/push only when asked.
- Never commit `.env.local`; `.env.example` is the template.

## Known gaps / gotchas

- **Slides are dormant** since the sandbox merge: `generating_slides` never
  fires, `regenerateSlides` is a no-op, `SlideDeckCoordinator` is unwired.
- **`RealtimeSession` is the proven `/test/speech-to-speech` port** (verified
  against the live GA API); the sandbox keeps frozen copies as a regression
  harness — don't "reconcile" them back together.
- **Mobile shell is now a plain phone-width column** (no device bezel);
  [dsd-curioframe.md §4](docs/dsd-curioframe.md) still describes the old bezel.
- Git on Windows warns `LF will be replaced by CRLF` — harmless.
