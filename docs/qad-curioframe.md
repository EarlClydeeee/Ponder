# QA & Test Plan (QAD)

**Project:** Ponder — Living Portraits that teach through voice and visual story
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
- Offline cached session list (read-only, `localStorage`)
- Daily free-tier limit enforcement (device-ID soft limit)
- Auth: signup, login, session persistence, logout *(post-MVP, with Supabase sync)*

**Out of Scope:**
- Load testing above 1,000 concurrent Realtime sessions
- Full WCAG audit (spot-check only)
- AR live camera mode (v2)
- Browsers older than iOS 16 Safari / Chrome 110; IE/legacy Edge

**Testing levels:**

| Level | Tooling | Owner |
|-------|---------|-------|
| Unit tests | Vitest + React Testing Library | Engineer |
| Integration tests | Vitest + mocked Realtime session | Engineer |
| E2E tests | Playwright | Engineer / QA |
| Manual exploratory | Desktop mobile shell + phone browsers (iOS Safari, Android Chrome) | earlc [TBD — confirm] |
| AI eval | Manual + scripted photo set | Engineer |

---

## 2. Test Environments & Data

**Staging URL:** Vercel preview deployment per PR (shareable on any phone browser)
**Test credentials:** None in MVP (anonymous); OpenAI test key in `.env.test`
**Data policy:** Clear `localStorage` between runs (`Clear my sessions` button or DevTools); bundled eval photos in `tests/fixtures/portraits/`

**Test data setup:**
```bash
npm run dev                       # local, .env.local key
npx playwright test --project=chromium
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
| H-06 | Save session | End → Save → reopen from history | Transcript + slides restored from localStorage | US-04 |
| H-07 | Desktop mobile shell | Open `/app` on ≥768px viewport | App renders inside phone-ratio frame; fully functional | — |
| H-08 *(post-MVP)* | Cross-device sync | Session on iPhone → login Android | Same session visible | — |

### Sad Paths (edge cases and error handling)

| ID | Scenario | Input / Trigger | Expected Behavior |
|----|----------|-----------------|-------------------|
| S-01 | Blurry photo | Low-light blurry capture | Awaken succeeds with hedged greeting; no crash |
| S-02 | Mic denied | Block mic permission → talk | Browser re-enable guidance; text fallback offered |
| S-03 | Camera denied | Block camera permission | File upload path; demo portrait CTA |
| S-04 | Realtime disconnect | Kill WebRTC mid-session | Fallback text within 3s; banner shown |
| S-05 | Slide gen failure | Mock 500 from `/api/generate-slides` | Text summary card; conversation continues |
| S-06 | Daily limit hit | 4th session same day (free) | Paywall / wait until reset; no token mint |
| S-07 | Tab backgrounded | Switch tab during speak | Audio completes or pauses cleanly; mic released; resume ok |
| S-08 | Tab closed mid-session | Close tab during talk | On revisit: last flushed turns recovered from localStorage |
| S-09 | Network drop mid-analyze | Airplane mode during persona pre-pass | Retry prompt; no duplicate sessions |
| S-10 | Inappropriate question | Offensive prompt | In-character refusal; no slides |

---

## 4. Automation vs. Manual Testing

### Automated (CI pipeline)

```yaml
- pnpm lint
- pnpm typecheck
- pnpm test              # Vitest: engine state machine, persona parser, sessionStore
- pnpm test:integration  # Mock Realtime + slide tool
# Playwright on main:
- npx playwright test e2e/onboarding.spec.ts
- npx playwright test e2e/demo-portrait.spec.ts
- npx playwright test e2e/voice-question.spec.ts
```

**CI gate:** PR blocked on lint, typecheck, unit failures.

### Manual / Exploratory

- Full voice loop on phone browsers (iOS Safari + Android Chrome) with headphones (museum simulation)
- Noisy cafe mic test
- 15-min exploratory: random objects (shoe, plant, book)
- Desktop mobile shell check at 768px boundary
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
- [ ] H-01 through H-07 pass on iOS Safari + Android Chrome + desktop mobile shell
- [ ] S-01 through S-10 verified manually
- [ ] CI green: lint, typecheck, unit, integration
- [ ] Playwright flows green on Vercel preview
- [ ] AI eval AI-01–AI-08 pass (Section 7)
- [ ] Voice latency spot-check: median <2s on LTE (5 samples)
- [ ] Vercel production deploy live (Google Play submission post-Capacitor, Android-only)

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
