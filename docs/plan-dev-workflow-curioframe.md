# Ponder — Team Workflow Plan

**Purpose:** Ship Living Portrait vertical slice in parallel in a 3-hour build.
**Baseline docs:** [prd-curioframe.md](prd-curioframe.md), [sdd-curioframe.md](sdd-curioframe.md), [rfc-curioframe-living-portrait-engine.md](rfc-curioframe-living-portrait-engine.md), [dsd-curioframe.md](dsd-curioframe.md).

**Team size:** 5
**Persistence scope:** **localStorage only** — no auth, no cloud; Supabase sync deferred post-MVP
**Stack:** One Next.js 15 project — `/` landing, `/app` mobile-shell app, `/api/*` key-holding routes; Capacitor wraps for Google Play (Android-only) post-MVP
**Mode:** **3-hour build** with post-MVP notes where marked *(post-MVP)*

---

## 0. Operating mode

**Default timebox:** Ship **one vertical slice first**: demo Mona Lisa → push-to-talk "Who are you?" → voice answer → 2 slides appear → session saved to localStorage. Everything runs in the browser at `/app`.

**Simultaneous work rule:** First 15 minutes together on `CONTRACT.md` + `LivingPortraitEngine` interface stub, then split by owner below.

**Scope knives (3-hour):**

| If time is tight | Cut or defer |
|------------------|--------------|
| Onboarding | Skip straight to demo portrait; chips only |
| Slide gen | 1 slide max; mock second slide with placeholder |
| Portrait animation | Breathe only; skip lip-sync |
| Capture flow | Gallery/file upload only; skip live camera |
| Landing page `/` | Hero + CTA only; other sections post-MVP |
| Share clip / Pro tier | Cut entirely; "Coming soon" |
| CI | Local `tsc` only |

**Demo checklist:** Judge opens `/app` in a browser (or the mobile shell on desktop) → Mona Lisa demo → asks question by voice → hears answer → slides appear → follow-up question works.

---

## 1. Team roster

| Person | Role | Primary ownership |
|--------|------|-------------------|
| **David** | AI Engineer | Living Portrait engine, Realtime, persona, slide tool calls, AI eval |
| **Earl Clyde** | Full-Stack (tech lead) | Platform scaffold, contracts, merges, integration checkpoints |
| **Shello** | Full-Stack | localStorage session store, usage limits, API routes |
| **Elton** | Full-Stack | Capture flow, engine↔UI wiring, browser/device QA, E2E pass |
| **Ivy** | Product UI/UX | DSD theme, app shell, conversation/capture/onboarding UI, demo script |

---

## 2. Principles

1. **David owns Realtime** — no one else opens WebSocket code.
2. **Ivy owns screens** — UI renders hook state only; no business logic in components.
3. **Earl Clyde owns merges** — trunk merges every 2 hours (hackathon) or daily *(sprint)*.
4. **Demo path is sacred** — polish Mona Lisa flow before supporting random objects.
5. **Contracts before code** — Shello and David align API route shapes before either side ships.

---

## 3. Workstreams (ownership map)

| # | Workstream | Owner | Scope |
|---|------------|-------|-------|
| W1 | Platform & scaffold | Earl Clyde | Next.js 15 project, env, Vercel, secrets, repo hygiene |
| W2 | Data & persistence | Shello | `sessionStore.ts` localStorage module, usage cap |
| W3 | Auth & limits | Shello | None in MVP — anonymous device ID; 3/day soft cap at token mint |
| W4 | Living Portrait engine | David | RFC implementation — Realtime WebRTC, persona, tools |
| W5 | App shell & routing | Ivy | `/` and `/app` routes, mobile shell frame, theme tokens from DSD |
| W6 | Conversation UI | Ivy | Portrait frame, talk button, slide carousel |
| W7 | Capture flow | Elton | `getUserMedia` camera, file upload, Awaken CTA → engine |
| W8 | Onboarding + demo assets | Ivy | Bundled Mona Lisa, first-run, question chips |
| W9 | API routes | Shello | `/api/realtime-token`, `/api/generate-slides`, `/api/analyze-portrait` (David reviews contracts) |
| W10 | QA & demo script | Earl Clyde + Elton | Manual script; desktop shell + phone browser via Vercel preview |

### 5-person split (default)

| Person | Workstreams | 3-hour focus |
|--------|-------------|-----------------|
| **David** | W4 | Engine stub → Realtime WebRTC voice loop → tool calls → fallback text |
| **Earl Clyde** | W1, W10 | Repo + Vercel project → merge captain → judge rehearsal |
| **Shello** | W2, W3, W9 | Token route → slide route → localStorage session save |
| **Elton** | W7, integration | Capture/upload → `awaken()` wiring → phone browser pass |
| **Ivy** | W5, W6, W8 | Theme + mobile shell → conversation UI → demo polish |

**Pairing rules:**
- **David + Shello:** C4/C5 API route contracts before T1 ends
- **David + Ivy:** C2/C3 hook shape before conversation UI goes pretty
- **Ivy + Elton:** Capture screen hands off to engine via agreed `AwakenConfig`
- **Earl Clyde + Elton:** Browser QA (desktop shell + iPhone/Android browser) before T3 freeze

---

### Feature sandboxes (`app/test/<feature>`)

To build in parallel without colliding on `/app`, each owner develops their
feature as an **isolated route** first, then integrates the working version into
`/app`. Sandboxes reuse the shared engine/hook/contracts (`src/engine/*`,
`useLivingPortrait`, `types.ts`) — never fork them. `/test/*` routes are dev
harnesses, never linked from `/app` or the landing page.

| Route | Owner | Feature |
|-------|-------|---------|
| `/test/realtime` | David | Realtime WebRTC voice loop |
| `/test/persona` · `/test/slides` | David / Shello | persona pre-pass · slide tool call |
| `/test/camera` | Elton | capture + downscale → `awaken()` |
| `/test/conversation` | Ivy | conversation UI against mocked hook state |

Earl Clyde owns pulling each green sandbox into `/app`.

## 4. Named roles (decision owners)

| Role | Person | Decides |
|------|--------|---------|
| **Engine owner** | David | `LivingPortraitEngine`, Realtime, tool calls, persona prompts |
| **Platform owner** | Earl Clyde | Next.js/Vercel, env, merge order, scope cuts |
| **Backend owner** | Shello | API routes, session store, rate limits |
| **Integration owner** | Elton | Capture→engine wiring, hook consumption, browser E2E pass |
| **UI/UX owner** | Ivy | All screens, DSD tokens, onboarding copy, demo script UX |
| **Demo owner** | Ivy + Earl Clyde | Judge path rehearsal, offline fallback pack, headphones rule |

---

## 5. Integration contracts (first 15 minutes)

Whole team in room. Earl Clyde drives; David writes signatures.

| # | Contract | Owner | Consumers |
|---|----------|-------|-----------|
| C1 | `types.ts` — `StoredSession`, `SlideDeck`, `PortraitPhase` | David | All |
| C2 | `LivingPortraitEngine` public API (RFC §3) | David | Ivy, Elton |
| C3 | `useLivingPortrait()` hook shape | David | Ivy |
| C4 | `POST /api/realtime-token` → `{ token, session_id }` | Shello | David |
| C5 | `POST /api/generate-slides` → `{ deck_id, slides[] }` | Shello | David |
| C6 | Theme tokens from DSD in `lib/theme.ts` + globals.css | Ivy | All |

Paste signatures into `CONTRACT.md` at repo root.

---

## 6. Time blocks (3-hour build)

| Block | Earl Clyde | David | Shello | Elton | Ivy |
|-------|------------|-------|--------|-------|-----|
| **T0 (0:00–0:20)** | Repo + Next.js scaffold + Vercel + secrets | Engine stub + state machine + `types.ts` | Token route skeleton | Capture screen stub | Mobile shell + DSD theme + Mona Lisa asset |
| **T1 (0:20–1:30)** | Merge checks; unblock integrations | Realtime WebRTC connect + voice loop | `/api/realtime-token` working end-to-end | Wire capture/upload → `awaken()` | Conversation screen (functional, not pretty) |
| **T2 (1:30–2:30)** | Integration standup every 30m | Tool call handler + slide events | `/api/generate-slides` + localStorage save | Phone browser test via preview URL | Slide carousel + question chips |
| **T3 (2:30–3:00)** | Freeze + judge rehearsal + prod deploy | Smoke test engine; fallback if time | Backend freeze | Manual E2E pass (desktop + phone) | UI polish + demo script |

**Convergence rule:** T1 not done until Mona Lisa demo runs in one phone browser via the Vercel preview URL (Elton confirms, Ivy drives UX, David on engine).

---

## 7. Git habits

- Trunk-based: all five merge to `main` frequently; Earl Clyde resolves conflicts
- Conflict hotspots: `LivingPortraitEngine.ts` (David only), `theme.ts` / `globals.css` (Ivy only), `app/api/*` (Shello only), `next.config.ts` / `package.json` (Earl Clyde only)
- Build features in `app/test/<feature>`; only touch `/app` when integrating a green sandbox (keeps `/app` merge contention low)
- PR rule: no PR merges without owner of touched hotspot as reviewer

---

## 8. Sync cadence

| When | 3-hour build | Post-MVP *(sprint)* |
|------|-----------|--------|
| Every 30–45m | 5m merge check — Earl Clyde | — |
| T1/T2/T3 start | 5m contract check — whole team | — |
| Daily | — | 15m standup + demo (Ivy shows UI, David shows engine) |
| Pre-demo | 15m rehearsal — Ivy + Earl Clyde | 60m QA pass — Elton leads browsers/devices |

---

## 9. Risk hotspots

- **OpenAI rate limits during demo:** David caches Mona Lisa audio + slides as bundled assets in `public/demo/`
- **Realtime flake on venue Wi‑Fi:** David pre-records fallback; Elton verifies text mode in browser
- **Mic echo (browser speakers):** Ivy adds headphones tip; mandatory in demo script
- **Browser mic permission blocked:** Elton verifies permission re-prompt path early; `localhost`/HTTPS only (`getUserMedia` requirement)
- **UI/engine drift:** Elton is integration tie-breaker when hook state and screen disagree

---

## 10. Done definition

**Must-have for the 3-hour demo:**

- [ ] Mona Lisa demo path works in desktop mobile shell **and** one phone browser via Vercel URL (Elton sign-off)
- [ ] Voice question → answer → ≥1 slide (David + Ivy)
- [ ] One follow-up question maintains context (David)
- [ ] Session saved to localStorage and reopens from history (Shello)
- [ ] No crash on 5-min judge session (whole team)
- [ ] DSD theme applied on all demo screens (Ivy)

**Must-have for launch *(post-MVP)*:**

- [ ] [QAD release criteria](qad-curioframe.md#6-release-criteria-definition-of-done) green

---

*Related: [rfc-curioframe-living-portrait-engine.md](rfc-curioframe-living-portrait-engine.md)*
