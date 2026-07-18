# Ponder — Team Workflow Plan

**Purpose:** Ship Living Portrait vertical slice in parallel for hackathon or 12-week build.
**Baseline docs:** [prd-Ponder.md](prd-Ponder.md), [sdd-Ponder.md](sdd-Ponder.md), [rfc-Ponder-living-portrait-engine.md](rfc-Ponder-living-portrait-engine.md), [dsd-Ponder.md](dsd-Ponder.md).

**Team size:** 2–4 (hackathon default)
**Persistence scope:** **Hybrid** — Supabase + local SQLite; cloud authoritative
**Mode:** **Hackathon (48h)** with 12-week notes where marked *(sprint)*

---

## 0. Operating mode

**Default timebox:** Ship **one vertical slice first**: demo Mona Lisa → push-to-talk "Who are you?" → voice answer → 2 slides appear → session saved.

**Simultaneous work rule:** First 45 minutes together on `CONTRACT.md` + `LivingPortraitEngine` interface stub, then split.

**Scope knives (hackathon):**

| If time is tight | Cut or defer |
|------------------|--------------|
| Auth | Anonymous UUID + local-only sessions |
| Slide gen | 1 slide max; mock second slide with placeholder |
| Portrait animation | Breathe only; skip lip-sync |
| Share clip | Screenshot export only |
| Pro tier | Hide paywall; show "Coming soon" |
| CI | Local `tsc` only |

**Demo checklist:** Judge sees Mona Lisa photo → awaken → asks question by voice → hears answer → slides appear → follow-up question works.

---

## 1. Principles

1. **Engine owner owns Realtime** — no one else opens WebSocket code.
2. **UI renders hook state only** — no business logic in screens.
3. **Merge every 2 hours** (hackathon) or daily *(sprint)*.
4. **Demo path is sacred** — polish Mona Lisa flow before supporting random objects.

---

## 2. Workstreams (ownership map)

| # | Workstream | Owner role | Scope |
|---|------------|-----------|-------|
| W1 | Platform & scaffold | Tech lead | Expo, env, EAS, secrets |
| W2 | Data & persistence | Backend dev | Supabase schema, Storage, sync |
| W3 | Auth & limits | Backend dev | Auth or anon mode; daily cap |
| W4 | Living Portrait engine | Senior eng | RFC implementation |
| W5 | App shell & routing | Frontend lead | Navigation, theme (DSD) |
| W6 | Conversation UI | Frontend dev | Portrait frame, talk button, carousel |
| W7 | Capture flow | Frontend dev | Camera, gallery, awaken CTA |
| W8 | Onboarding + demo assets | Frontend dev | Bundled Mona Lisa, first-run |
| W9 | Edge Functions | Backend dev | realtime-token, generate-slides |
| W10 | QA & demo script | QA / anyone | Maestro or manual script |

### Team size mapping

| Team size | Split |
|-----------|-------|
| **1 dev** | W1→W4→W6→W7→W8→demo |
| **2 devs** | A: W1+W2+W9+W4 engine · B: W5+W6+W7+W8 |
| **3–4 devs** | Platform (W1+W2+W9), Engine (W4), UI (W5+W6+W7), Onboarding+QA (W8+W10) |

---

## 3. Roles

- **Engine owner:** `LivingPortraitEngine`, Realtime, tool calls
- **Platform owner:** Supabase, secrets, builds
- **UI owner:** Conversation + capture screens, DSD tokens
- **Demo owner:** Script, fixtures, judge path rehearsal

---

## 4. Integration contracts (first 45 minutes)

| # | Contract | Owner | Consumers |
|---|----------|-------|-----------|
| C1 | `types.ts` — `PortraitSession`, `SlideDeck`, `PortraitPhase` | W4 | All |
| C2 | `LivingPortraitEngine` public API (RFC §3) | W4 | W6 |
| C3 | `useLivingPortrait()` hook shape | W4 | W6 |
| C4 | `POST /functions/v1/realtime-token` response `{ token, session_id }` | W9 | W4 |
| C5 | `POST /functions/v1/generate-slides` `{ topic, count }` → `{ deck_id, slides[] }` | W9 | W4 |
| C6 | Theme tokens from DSD in `theme.ts` | W5 | All |

Paste signatures into `CONTRACT.md` at repo root.

---

## 5. Time blocks (hackathon 48h)

| Block | Platform | Engine | UI | Onboarding |
|-------|----------|--------|-----|------------|
| **T0 (0–3h)** | Repo + Supabase + secrets | Engine stub + state machine | Shell + dark theme | Mona Lisa asset bundled |
| **T1 (3–18h)** | Token mint function | Realtime connect + voice loop | Conversation screen ugly | Demo question chips |
| **T2 (18–30h)** | generate-slides function | Tool call handler | Slide carousel | Onboarding 3 screens |
| **T3 (30–42h)** | Session save | Fallback text | Capture flow | Polish demo path |
| **T4 (42–48h)** | Freeze | Smoke test | Device pass | Rehearse judge script |

**Convergence rule:** T1 not done until Mona Lisa demo runs on one physical phone.

---

## 6. Git habits

- Trunk-based for ≤3 devs: merge to `main` frequently
- Conflict hotspots: `LivingPortraitEngine.ts`, `app.json`, Supabase migrations — one editor at a time

---

## 7. Sync cadence

| When | Hackathon | Sprint |
|------|-----------|--------|
| Every 2h | 5m merge check | — |
| Daily | — | 15m standup + demo |
| Pre-demo | 30m rehearsal | 60m QA pass |

---

## 8. Risk hotspots

- **OpenAI rate limits during demo:** Cache Mona Lisa audio + slides offline pack
- **Realtime flake on venue Wi‑Fi:** Pre-record fallback video + local text mode
- **Mic echo:** Headphones mandatory in demo script

---

## 9. Done definition

**Must-have for hackathon demo:**

- [ ] Mona Lisa demo path works on physical device
- [ ] Voice question → answer → ≥1 slide
- [ ] One follow-up question maintains context
- [ ] No crash on 5-min judge session

**Must-have for launch *(sprint)*:**

- [ ] [QAD release criteria](qad-Ponder.md#6-release-criteria-definition-of-done) green

---

*Related: [rfc-Ponder-living-portrait-engine.md](rfc-Ponder-living-portrait-engine.md)*
