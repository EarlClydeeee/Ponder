# QA & Test Plan (QAD)

**Project:** CurioFrame — Living Portraits that teach through voice and visual story
**Date:** 2026-07-18
**Version:** 0.1
**Owner:** earlc [TBD — confirm]
**PRD:** [prd-curioframe.md](prd-curioframe.md)
**RFC(s):** [rfc-curioframe-living-portrait-engine.md](rfc-curioframe-living-portrait-engine.md)

---

## 1. Testing Strategy & Scope

**In Scope:**
- All Must-Have and Should-Have features from PRD §3
- Living Portrait engine (RFC): awaken, voice, slides, fallback
- Onboarding flow
- Session save/replay
- Offline cached session list (read-only)
- Auth: signup, login, session persistence, logout
- Daily free-tier limit enforcement

**Out of Scope:**
- Load testing above 1,000 concurrent Realtime sessions
- Full WCAG audit (spot-check only)
- AR live camera mode (v2)
- iOS <16 / Android <10

**Testing levels:**

| Level | Tooling | Owner |
|-------|---------|-------|
| Unit tests | Jest + React Native Testing Library | Engineer |
| Integration tests | Jest + mocked Realtime WS | Engineer |
| E2E tests | Maestro | Engineer / QA |
| Manual exploratory | Physical iOS + Android devices | earlc [TBD — confirm] |
| AI eval | Manual + scripted photo set | Engineer |

---

## 2. Test Environments & Data

**Staging URL:** Supabase staging + TestFlight / Play Internal
**Test credentials:** `qa-ios@curioframe.test`, `qa-android@curioframe.test` in `.env.test`
**Data policy:** Reset staging DB before major cycles; bundled eval photos in `tests/fixtures/portraits/`

**Test data setup:**
```bash
supabase db reset --linked
node scripts/seed-qa-users.ts
```

---

## 3. Core Test Scenarios

### Happy Paths (must all pass before launch)

| ID | Scenario | Steps | Expected Result | US-ID |
|----|----------|-------|-----------------|-------|
| H-01 | Onboarding → demo portrait | Launch → complete onboarding → tap demo Mona Lisa | Voice greeting + portrait alive within 5s | US-05 |
| H-02 | Capture awaken | Home → camera → capture statue → Awaken | Persona greeting matches subject type | US-01 |
| H-03 | Voice Q&A | Hold talk → "Who are you?" → release | In-character audio answer <2s after speech end | US-02 |
| H-04 | Slides on explanation | Ask "Tell me about your history" | ≥1 slide appears within 10s; caption matches topic | US-03 |
| H-05 | Follow-up thread | Ask 3 related follow-ups | No repeated intro; context coherent | US-04 |
| H-06 | Save session | End → Save → reopen from history | Transcript + slides restored | US-04 |
| H-07 | Cross-device sync | Session on iOS → login Android | Same session visible | — |

### Sad Paths (edge cases and error handling)

| ID | Scenario | Input / Trigger | Expected Behavior |
|----|----------|-----------------|-------------------|
| S-01 | Blurry photo | Low-light blurry capture | Awaken succeeds with hedged greeting; no crash |
| S-02 | Mic denied | Revoke mic → talk | Settings deep-link; text fallback offered |
| S-03 | Camera denied | Revoke camera | Gallery import path; demo portrait CTA |
| S-04 | Realtime disconnect | Kill WS mid-session | Fallback text within 3s; banner shown |
| S-05 | Slide gen failure | Mock 500 from generate-slides | Text summary card; conversation continues |
| S-06 | Daily limit hit | 4th session same day (free) | Paywall / wait until reset; no token mint |
| S-07 | App backgrounded | Background during speak | Audio completes or pauses cleanly; resume ok |
| S-08 | Kill app mid-session | Force quit during talk | On reopen: recover or offer discard draft |
| S-09 | Network drop mid-upload | Airplane during photo upload | Retry prompt; no duplicate sessions |
| S-10 | Inappropriate question | Offensive prompt | In-character refusal; no slides |

---

## 4. Automation vs. Manual Testing

### Automated (CI pipeline)

```yaml
- pnpm lint
- pnpm typecheck
- pnpm test              # Engine state machine, persona parser
- pnpm test:integration  # Mock Realtime + slide tool
# Maestro on main:
- maestro test flows/onboarding.yaml
- maestro test flows/demo-portrait.yaml
- maestro test flows/voice-question.yaml
```

**CI gate:** PR blocked on lint, typecheck, unit failures.

### Manual / Exploratory

- Full voice loop on physical devices with headphones (museum simulation)
- Noisy cafe mic test
- 15-min exploratory: random objects (shoe, plant, book)
- Share clip export visual check
- Wall-clock daily limit reset at midnight UTC

---

## 5. Bug Triage Protocol

| Severity | Definition | Action |
|----------|------------|--------|
| **P0 — Blocker** | Crash on awaken, data loss, API key leak | Block launch |
| **P1 — High** | No voice response, slides never appear, wrong user data | Fix before release |
| **P2 — Medium** | Lip-sync drift, slow slides, UI glitch | Ship with backlog |
| **P3 — Low** | Copy typo, minor animation | Backlog |

**Bug tracking:** GitHub Issues — labels `bug/P0` … `bug/P3`

---

## 6. Release Criteria (Definition of Done)

Launch approved when:

- [ ] All P0 and P1 bugs resolved
- [ ] H-01 through H-07 pass on iOS and Android physical devices
- [ ] S-01 through S-10 verified manually
- [ ] CI green: lint, typecheck, unit, integration
- [ ] Maestro flows green on staging
- [ ] AI eval AI-01–AI-08 pass (Section 7)
- [ ] Voice latency spot-check: median <2s on LTE (5 samples)
- [ ] App Store / Play internal track approved

---

## 7. AI / LLM Evaluation

**What makes an AI response "correct"?**

- Persona stays in first person without breaking character
- Educational claims factually plausible for eval subjects (expert spot-check)
- Slides visually relate to stated topic (human rating ≥3/5)
- No unsafe content (hard fail)

### Eval Suite

| Eval ID | Input | Expected Behavior | Pass Criterion |
|---------|-------|------------------|----------------|
| AI-01 | Bundled Mona Lisa photo | Female-toned Renaissance persona | Greeting mentions painting/Leonardo; voice match |
| AI-02 | Blank wall photo | Generic friendly guide persona | No false historical identity |
| AI-03 | Dog photo | Playful dog persona | First person as dog; no human historical claims |
| AI-04 | "Who are you?" voice | Short in-character intro | ≤4 sentences; audio plays |
| AI-05 | "Tell me your history" | Slides + speech on topic | ≥1 slide; topic match ≥3/5 human rating |
| AI-06 | Follow-up "Tell me more about that" | Uses prior context | No full re-introduction |
| AI-07 | Noisy mic mumble | Retry prompt | No hallucinated question |
| AI-08 | Realtime disabled mock | Text fallback | Answer within 5s text |

**Regression evals:** Re-run before any Realtime or image model version bump.

**Observability:**
- Metrics: session completion rate, fallback rate, avg slides/session
- Alert if fallback rate >15% over 7 days [TBD — confirm]

---

## Self-Check

- [ ] Every Must-Have PRD feature has at least one Happy Path scenario
- [ ] Every Happy Path has at least one corresponding Sad Path
- [ ] Automated checks defined for CI
- [ ] Section 7 filled
- [ ] Release criteria binary
- [ ] Test data setup documented

---

*Next document: [GTM](gtm-curioframe.md)*
