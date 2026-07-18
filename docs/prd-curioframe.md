# Product Requirements Document (PRD)

**Project:** Ponder — Living Portraits that teach through voice and visual story
**Date:** 2026-07-18
**Version:** 0.1
**Owner:** earlc [TBD — confirm]
**Status:** Draft
**BRD:** [brd-curioframe.md](brd-curioframe.md)

---

## 1. Product Purpose & Value Proposition

Ponder lets anyone photograph an object or artwork and immediately talk with it in character. The portrait answers in a thematically matched voice (e.g., a measured female tone for Mona Lisa, a gravelly tone for an ancient statue), and while it explains, the app generates visual slides — maps, period scenes, diagrams — aligned to what is being said. Unlike static guides or text chatbots, Ponder keeps the subject visually present, makes learning feel like an interview, and supports endless follow-up questions so curiosity drives the session.

---

## 2. Target Personas

**Primary Persona — Curious Parent (Maya)**
- *Who they are:* 34, urban professional, visits museums and landmarks with children 7–12 on weekends.
- *Their core frustration:* Audio guides and plaques cannot answer her child's specific questions; she ends up Googling on the sidewalk and losing the moment.
- *What success looks like for them:* After one visit, her child remembers three facts because they "talked to" the exhibit; Maya saves the session to revisit before a school project.

**Secondary Persona — Visual Learner (Leo)**
- *Who they are:* 22, design/architecture student, photographs objects, buildings, and products for coursework.
- *Their core frustration:* Research is fragmented across tabs; no tool ties explanation to the exact photo he took.

---

## 3. Core Features & Priorities

| Feature | Description | Priority |
|---------|-------------|----------|
| Portrait Capture | Camera or gallery pick; crop/focus on single subject | Must-Have |
| Subject Awakening | Identify subject, assign persona, animate portrait with subtle "alive" treatment | Must-Have |
| Realtime Voice Chat | Bidirectional voice conversation in character via Realtime API | Must-Have |
| Visual Story Slides | Auto-generate sequential images during explanations | Must-Have |
| Continuous Q&A | Multi-turn conversation; context carries across turns | Must-Have |
| Session History | Save and reopen past portrait conversations | Must-Have |
| Slide Replay | Scroll generated slides synced to conversation transcript | Should-Have |
| Share Clip | Export 15–30s highlight (portrait + voice + slide) | Should-Have |
| Voice / Pace Settings | Slower speech, kid-friendly mode | Should-Have |
| Live AR Camera | Real-time overlay without capture | Could-Have |
| Custom Personas | User-defined characters | Won't-Have (v1) |

---

## 4. User Stories & Acceptance Criteria

**US-01 — Awaken a portrait**
> As Maya, I want to photograph the Mona Lisa (or any artwork) so that it comes alive and introduces itself in character.

Acceptance Criteria:
- Given camera permission granted, when I capture a photo and tap "Awaken", then the portrait displays within 5s with a subtle animation (blink, parallax, or lip-sync prep).
- Given a recognizable artwork, when awakening completes, then the app assigns an appropriate voice gender/tone and in-character greeting within 3s of connection.
- Given an unrecognizable object (e.g., my dog), when awakening completes, then the app still assigns a playful in-character persona based on visual analysis.

**US-02 — Voice conversation**
> As Maya, I want to ask "Who are you?" by voice so that the portrait answers naturally without typing.

Acceptance Criteria:
- Given an active session, when I hold the talk button and ask a question, then I hear an in-character spoken response within 2s of me finishing (network permitting).
- Given mic permission denied, when I try to talk, then I see browser-specific guidance to re-enable the mic (site permissions) and can fall back to text input.
- Given a noisy environment, when speech is unclear, then the app asks me to repeat once before failing gracefully.

**US-03 — Visual slides during explanation**
> As Leo, I want the app to show generated images while the portrait explains history so that I can follow complex topics visually.

Acceptance Criteria:
- Given the portrait is explaining a multi-part topic (e.g., Renaissance Florence), when key concepts are spoken, then 1–3 relevant slides appear in sequence within 10s of trigger.
- Given slides are generating, when I am still listening, then the portrait remains visible and slides appear in a carousel below or beside it.
- Given generation fails, when the portrait finishes speaking, then a text summary card appears instead of a blank area.

**US-04 — Follow-up questions**
> As Maya, I want to ask follow-up questions so that my child can dig deeper into whatever they are curious about.

Acceptance Criteria:
- Given an ongoing session, when I ask three follow-ups on different subtopics, then context from prior answers is reflected (no repeated introductions).
- Given I change topic abruptly, when the portrait responds, then new slides match the new topic without showing stale slides.

**US-05 — First-run onboarding**
> As a new user, I want a guided first portrait in under 3 minutes so that I understand capture → talk → slides before visiting a museum.

Acceptance Criteria:
- Given first launch, when onboarding starts, then I see ≤4 screens ending with a sample portrait demo (bundled asset if camera unavailable).
- Given onboarding completes, when I reach home, then I am prompted to capture or try the demo portrait immediately.

---

## 5. UX & Design Intent

**Design reference:** [dsd-curioframe.md](dsd-curioframe.md)

**Key flows:**
- Capture → Awaken → Talk — ≤3 taps from home to first voice response
- Explain → Slides — slides appear without user action during speech
- Session end → Save — one tap to save; name auto-suggested from subject

**Constraints:**
- Mobile-first; portrait orientation primary for conversation screen
- `/app` runs in a mobile-ratio shell: phone-frame (~390px, 9:19.5) centered on desktop viewports; full-viewport on phone browsers
- One-handed talk button reachable by thumb
- Portrait animation must not block slide carousel or captions
- Voice response perceived latency target <2s after user stops speaking on LTE
- Museum-friendly: subtle motion, no loud autoplay; headphones prompt on first voice

---

## 6. Out of Scope for This Release

- Live AR camera mode — deferred to v2
- Official museum content partnerships — deferred
- Multiplayer / classroom mode — deferred
- Offline mode — deferred (Realtime API requires network)
- Creator marketplace for custom personas — deferred

---

## 7. AI / Agent Feature Specifications

**AI Component:** Living Portrait engine — vision identification, persona voice agent, contextual slide generation

**Model(s) considered:** OpenAI Realtime API, Gemini Live, custom STT+TTS+LLM pipeline

**Selected model:** OpenAI Realtime API (gpt-4o-realtime) + GPT-4o / image generation for slides — *reason: single-vendor vision+voice latency, hackathon-ready SDK, strong persona adherence*

**What the AI does:**
1. **Vision:** Analyze captured image → subject label, era/domain, suggested persona traits
2. **Voice agent:** Maintain in-character system prompt; stream audio responses; tool-call slide generation
3. **Slide gen:** On topic segments, generate 1–3 educational images with consistent art direction

**Input → Output contract:**
- Input: JPEG/PNG photo (max 2048px), user audio stream or text, session transcript
- Output: Audio stream, optional transcript, slide URLs + captions, session metadata JSON
- Latency expectation: first voice byte <800ms after user end-of-speech; slide image <10s

**Human-in-the-loop points:**
- User initiates capture and each question (push-to-talk default)
- User can dismiss/regenerate a slide deck
- User confirms save to history

**Fallback behavior when AI fails or is unavailable:**
- Show static subject card with text Q&A (non-realtime GPT) if Realtime disconnects
- Pre-cached demo Mona Lisa session for conference/demo offline showcase
- Text-only mode with stock illustration icons if image gen fails

**Token / cost budget per operation:**
- ~$0.15–0.40 per 5-min session (Realtime + 3 slides) [TBD — confirm at scale]
- Free tier capped at 3 sessions/day to control burn

---

## 8. Dependencies & Assumptions

**Dependencies:**
- Next.js 15 (App Router) on Vercel — `/` landing, `/app` product, `/api/*` key-holding routes
- Browser Web APIs: `getUserMedia` (camera + mic), Web Audio, `localStorage`
- OpenAI Realtime API access (WebRTC transport)
- OpenAI image generation API (gpt-image-1 or DALL·E 3)
- Capacitor for Android (Google Play) packaging *(post-MVP)* — iOS stays web-only via Safari
- Supabase (auth, session sync, slide asset URLs) *(post-MVP)*
- Stripe / RevenueCat for Pro tier *(post-MVP)* [TBD — confirm]

**Assumptions:**
- Users grant camera + mic browser permissions on first meaningful prompt (HTTPS required)
- Network available during sessions (Wi‑Fi or LTE)
- Users accept AI-generated educational content may contain errors; disclaimer shown
- Subject matter is user-owned photo or public exhibit photography (no DRM bypass)

---

## 9. Milestones

| Milestone | Deliverable | Target Date |
|-----------|-------------|-------------|
| M0 — 3-hour MVP | Browser vertical slice live on Vercel: capture → voice reply → ≥1 slide → localStorage save | Hour 3 |
| M1 | Must-Haves polished; onboarding; fallback text mode | Week 2 |
| M2 | Should-Haves; QA staging; share clip; Supabase sync | Week 5 |
| M3 | Capacitor Android build; Google Play submission | Week 8 |
| Launch | Public release (web + Play Store); QAD passed; GTM live | Week 10 |

---

## Self-Check

- [ ] Every Must-Have feature in Section 3 has at least one user story in Section 4
- [ ] Acceptance criteria are testable (Given/When/Then format)
- [ ] Section 6 explicitly names things that were discussed but cut
- [ ] Section 7 is filled or marked N/A
- [ ] Section 9 has realistic dates
- [ ] This document answers *what* to build, not *how* (architecture goes in the SDD)

---

*Next document: [DSD](dsd-curioframe.md) | [SDD](sdd-curioframe.md)*
