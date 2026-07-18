# Ponder — Team Workflow Plan

**Purpose:** Ship Living Portrait vertical slice in parallel for hackathon or 12-week build.
**Baseline docs:** [prd-curioframe.md](prd-curioframe.md), [sdd-curioframe.md](sdd-curioframe.md), [rfc-curioframe-living-portrait-engine.md](rfc-curioframe-living-portrait-engine.md), [dsd-curioframe.md](dsd-curioframe.md).

**Team size:** 5
**Persistence scope:** **Hybrid** — Supabase + local SQLite; cloud authoritative
**Mode:** **Hackathon (48h)** with 12-week notes where marked *(sprint)*

---

## 0. Operating mode

**Default timebox:** Ship **one vertical slice first**: demo Mona Lisa → push-to-talk "Who are you?" → voice answer → 2 slides appear → session saved.

**Simultaneous work rule:** First 45 minutes together on `CONTRACT.md` + `LivingPortraitEngine` interface stub, then split by owner below.

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

## 1. Team roster

| Person | Role | Primary ownership |
|--------|------|-------------------|
| **David** | AI Engineer | Living Portrait engine, Realtime, persona, slide tool calls, AI eval |
| **Earl Clyde** | Full-Stack (tech lead) | Platform scaffold, contracts, merges, integration checkpoints |
| **Shello** | Full-Stack | Supabase schema, auth/limits, Edge Functions, session sync |
| **Elton** | Full-Stack | Capture flow, engine↔UI wiring, device QA, Maestro flows |
| **Ivy** | Product UI/UX | DSD theme, app shell, conversation/capture/onboarding UI, demo script |

---

## 2. Principles

1. **David owns Realtime** — no one else opens WebSocket code.
2. **Ivy owns screens** — UI renders hook state only; no business logic in components.
3. **Earl Clyde owns merges** — trunk merges every 2 hours (hackathon) or daily *(sprint)*.
4. **Demo path is sacred** — polish Mona Lisa flow before supporting random objects.
5. **Contracts before code** — Shello and David align Edge Function shapes before either side ships.

---

## 3. Workstreams (ownership map)

| # | Workstream | Owner | Scope |
|---|------------|-------|-------|
| W1 | Platform & scaffold | Earl Clyde | Expo, env, EAS, secrets, repo hygiene |
| W2 | Data & persistence | Shello | Supabase schema, Storage, SQLite sync |
| W3 | Auth & limits | Shello | Auth or anon mode; daily cap |
| W4 | Living Portrait engine | David | RFC implementation — Realtime, persona, tools |
| W5 | App shell & routing | Ivy | Navigation, theme tokens from DSD |
| W6 | Conversation UI | Ivy | Portrait frame, talk button, slide carousel |
| W7 | Capture flow | Elton | Camera, gallery, Awaken CTA → engine |
| W8 | Onboarding + demo assets | Ivy | Bundled Mona Lisa, first-run, question chips |
| W9 | Edge Functions | Shello | `realtime-token`, `generate-slides` (David reviews contracts) |
| W10 | QA & demo script | Earl Clyde + Elton | Maestro or manual script; device matrix |

### 5-person split (default)

| Person | Workstreams | Hackathon focus |
|--------|-------------|-----------------|
| **David** | W4 | Engine stub → Realtime voice loop → tool calls → fallback text |
| **Earl Clyde** | W1, W10 | Repo + Supabase project → merge captain → judge rehearsal |
| **Shello** | W2, W3, W9 | Schema + token mint → slide function → session save |
| **Elton** | W7, integration | Capture → `awaken()` wiring → physical device pass |
| **Ivy** | W5, W6, W8 | Theme + shell → conversation UI → onboarding + demo polish |

**Pairing rules:**
- **David + Shello:** C4/C5 Edge Function contracts before T1 ends
- **David + Ivy:** C2/C3 hook shape before conversation UI goes pretty
- **Ivy + Elton:** Capture screen hands off to engine via agreed `AwakenConfig`
- **Earl Clyde + Elton:** Device QA on iOS + Android before T4 freeze

---

## 4. Named roles (decision owners)

| Role | Person | Decides |
|------|--------|---------|
| **Engine owner** | David | `LivingPortraitEngine`, Realtime, tool calls, persona prompts |
| **Platform owner** | Earl Clyde | Expo/EAS, env, merge order, hackathon scope cuts |
| **Backend owner** | Shello | Supabase, Edge Functions, auth, rate limits |
| **Integration owner** | Elton | Capture→engine wiring, hook consumption, E2E device tests |
| **UI/UX owner** | Ivy | All screens, DSD tokens, onboarding copy, demo script UX |
| **Demo owner** | Ivy + Earl Clyde | Judge path rehearsal, offline fallback pack, headphones rule |

---

## 5. Integration contracts (first 45 minutes)

Whole team in room. Earl Clyde drives; David writes signatures.

| # | Contract | Owner | Consumers |
|---|----------|-------|-----------|
| C1 | `types.ts` — `PortraitSession`, `SlideDeck`, `PortraitPhase` | David | All |
| C2 | `LivingPortraitEngine` public API (RFC §3) | David | Ivy, Elton |
| C3 | `useLivingPortrait()` hook shape | David | Ivy |
| C4 | `POST /functions/v1/realtime-token` → `{ token, session_id }` | Shello | David |
| C5 | `POST /functions/v1/generate-slides` → `{ deck_id, slides[] }` | Shello | David |
| C6 | Theme tokens from DSD in `theme.ts` | Ivy | All |

Paste signatures into `CONTRACT.md` at repo root.

---

## 6. Time blocks (hackathon 48h)

| Block | Earl Clyde | David | Shello | Elton | Ivy |
|-------|------------|-------|--------|-------|-----|
| **T0 (0–3h)** | Repo + Supabase + secrets | Engine stub + state machine | Schema + token function skeleton | Capture screen stub | Shell + DSD theme + Mona Lisa asset |
| **T1 (3–18h)** | Merge checks; unblock integrations | Realtime connect + voice loop | Token mint working end-to-end | Wire capture → `awaken()` | Conversation screen (functional, not pretty) |
| **T2 (18–30h)** | Integration standup every 2h | Tool call handler + slide events | `generate-slides` function | Device test on 1 phone | Slide carousel + onboarding screens |
| **T3 (30–42h)** | Scope knife calls | Fallback text mode | Session save + sync | iOS + Android device pass | Capture polish + demo path |
| **T4 (42–48h)** | Freeze + judge rehearsal | Smoke test engine | Backend freeze | Maestro / manual E2E | UI polish + demo script |

**Convergence rule:** T1 not done until Mona Lisa demo runs on one physical phone (Elton confirms, Ivy drives UX, David on engine).

---

## 7. Git habits

- Trunk-based: all five merge to `main` frequently; Earl Clyde resolves conflicts
- Conflict hotspots: `LivingPortraitEngine.ts` (David only), `theme.ts` (Ivy only), Supabase migrations (Shello only), `app.json` (Earl Clyde only)
- PR rule: no PR merges without owner of touched hotspot as reviewer

---

## 8. Sync cadence

| When | Hackathon | Sprint |
|------|-----------|--------|
| Every 2h | 5m merge check — Earl Clyde | — |
| T1/T2/T3 start | 10m contract check — whole team | — |
| Daily | — | 15m standup + demo (Ivy shows UI, David shows engine) |
| Pre-demo | 30m rehearsal — Ivy + Earl Clyde | 60m QA pass — Elton leads devices |

---

## 9. Risk hotspots

- **OpenAI rate limits during demo:** David caches Mona Lisa audio + slides; Shello serves offline pack via Storage
- **Realtime flake on venue Wi‑Fi:** David pre-records fallback; Elton verifies text mode on device
- **Mic echo:** Ivy adds headphones tip to onboarding; mandatory in demo script
- **UI/engine drift:** Elton is integration tie-breaker when hook state and screen disagree

---

## 10. Done definition

**Must-have for hackathon demo:**

- [ ] Mona Lisa demo path works on physical device (Elton sign-off)
- [ ] Voice question → answer → ≥1 slide (David + Ivy)
- [ ] One follow-up question maintains context (David)
- [ ] No crash on 5-min judge session (whole team)
- [ ] DSD theme applied on all demo screens (Ivy)

**Must-have for launch *(sprint)*:**

- [ ] [QAD release criteria](qad-curioframe.md#6-release-criteria-definition-of-done) green

---

*Related: [rfc-curioframe-living-portrait-engine.md](rfc-curioframe-living-portrait-engine.md)*
