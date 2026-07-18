# Pitch Document

**Project:** Ponder — Living Portraits that teach through voice and visual story
**Date:** 2026-07-18
**Version:** 0.1
**Owner:** earlc [TBD — confirm]
**Status:** Draft

---

## 1. Hook

> "Point your camera at the Mona Lisa — and she answers your questions out loud while the app paints the story of what she's explaining."

---

## 2. Problem

**The pain:** Every year, hundreds of millions of people visit museums and landmarks, but most leave remembering almost nothing. Plaques are static. Audio guides can't hear you. Kids and curious adults disengage when learning is one-way. Googling on your phone breaks the moment — you stare at text, not the exhibit.

**Why existing solutions fail:**
- **Museum audio guides:** Linear, non-interactive, expensive to rent
- **Google Lens / visual search:** Facts as text links, no character or narrative
- **ChatGPT / voice assistants:** Generic voice, no persistent portrait, no synced visual slides tied to speech

**Market signal:** Google Arts & Culture surpassed 100M downloads; #MuseumTok and educational travel content consistently hit millions of views — demand for experiential culture learning is proven, but interaction is still passive.

---

## 3. Solution

**What it does:** Ponder captures a photo of any subject — artwork, statue, landmark, product, pet — and awakens it as a Living Portrait. The subject speaks in a thematically matched voice, answers follow-up questions in real time, and generates sequential visual slides that illustrate its explanations. It's a conversation with what you're looking at, not a lecture about it.

**The differentiator:** The photo stays alive on screen, speaks in character, and auto-generates educational visuals mid-conversation — no other consumer app combines Realtime vision-voice with on-the-fly story slides bound to a user capture.

**Demo / screenshot:** 30 seconds — tap Awaken on Mona Lisa photo → she says hello → user asks "Who painted you?" → voice answer plays → Renaissance Florence slide fades in → user asks follow-up → second slide on sfumato technique.

---

## 4. Market Size

| Segment | Size | Source |
|---------|------|--------|
| TAM | $12B+ global ed-tech apps + cultural tourism digital | HolonIQ ed-tech + tourism digital spend [TBD — confirm] |
| SAM | ~$800M mobile museum/edutainment apps (US+EU) | App Annie category estimates [TBD — confirm] |
| SOM (Year 1) | $1.2M ARR (15k Pro subs × $6.99/mo blended) | 0.5% of SAM curious-learner segment |

**Why this market now:** OpenAI Realtime API (2024–2025) finally makes sub-2s vision-voice loops consumer-viable; image generation is cheap enough for per-session slides; post-pandemic museum digitization budgets seek engagement tools.

---

## 5. Product

**Core feature set (V1):**

| Feature | What it does | Why it matters |
|---------|-------------|----------------|
| Portrait Capture | Photo → Living Portrait | Binds AI to user's real context |
| Realtime Voice Chat | In-character duplex audio | Feels like an interview, not reading |
| Visual Story Slides | Auto-generated explainer images | Dual coding boosts retention |
| Session History | Save & replay conversations | Extends value beyond visit |

**Platform:** Web-first — runs in any phone browser at `/app`, no install; Android (Google Play) app via Capacitor next, iOS stays web

**Tech approach:** Next.js 15 web app (landing + `/app` + key-holding API routes) + OpenAI Realtime over WebRTC (vision/voice) + image API for slides; localStorage sessions, Supabase sync post-MVP; details in [sdd-curioframe.md](sdd-curioframe.md).

---

## 6. Business Model

**Revenue model:** Freemium subscription

| Tier | Price | What's included |
|------|-------|-----------------|
| Free | $0 | 3 sessions/day, 5 saved sessions |
| Pro | $6.99/mo | Unlimited sessions + history + HD share |

**Unit economics (projected):**
- CAC: $8 [TBD — confirm]
- LTV: $42 (6-mo avg retention × $6.99) [TBD — confirm]
- LTV:CAC: ~5:1 [TBD — confirm]
- Payback: 2 months [TBD — confirm]

---

## 7. Traction

Pre-launch. Forward milestones:

| Milestone | Target | Timeline |
|-----------|--------|----------|
| 3-hour MVP | Living Portrait vertical slice live on the web | Day 1 |
| Beta testers | 100 | Week 10 |
| Public launch | 5k installs | Week 12 |

**What we learned:** *(Post-beta — document interview insights here.)*

---

## 8. Competition

| Competitor | Their approach | Our advantage |
|------------|---------------|---------------|
| Google Arts & Culture | AR filters, static stories | We offer conversational voice + custom slides from *your* photo |
| Smartify / museum apps | Institution-specific content | Works on any object, anywhere, user-initiated |
| ChatGPT / Gemini | General voice/text AI | Portrait-forward UX, in-character voice, synced visuals |
| Wikipedia / audio guides | Passive content | Interactive Q&A tied to captured subject |

**Moat:** Session library + persona quality tuning per subject category; future museum partnerships; slide style consistency engine.

---

## 9. Go-To-Market (Summary)

**Launch surface:** Shareable web link (`/app`) + TikTok/Reels demo videos + Product Hunt; Google Play post-Capacitor

**First 1,000 users:** "Mona Lisa answers my kid" short-form video → r/SideProject + museum subreddits + homeschool groups

**Growth loop:** Share clips (portrait + voice + slide) → viewers ask "what app?" → download

Full plan: [gtm-curioframe.md](gtm-curioframe.md)

---

## 10. Team

| Person | Role | Relevant background |
|--------|------|---------------------|
| earlc [TBD — confirm] | Founder / Full-stack | [TBD — confirm: mobile, AI integrations, hackathon builds] |

**Why us:** [TBD — confirm: lived museum/ed-tech interest + ability to ship Realtime multimodal demo fast]

---

## 11. The Ask

**Seeking:** Hackathon validation + beta users + optional pre-seed conversations after 5k installs

**Amount / scope:** $250k pre-seed [TBD — confirm] OR 3 museum/ed-tech design partners for pilot

**Use of funds / next milestone:**

| Milestone | Timeline | Resource needed |
|-----------|----------|-----------------|
| Public launch | Month 3 | Engineering + API costs |
| 5k users / Pro conversion proof | Month 6 | Growth + part-time educator advisor |
| Museum pilot | Month 9 | BD + content accuracy review |

---

## Self-Check

- [ ] Section 1 hook is one sentence and non-technical readers understand it
- [ ] Section 2 names real competitors and structural failures
- [ ] Section 4 has source placeholders flagged TBD
- [ ] Section 6 has concrete price
- [ ] Section 11 ask is specific

---

*Related documents:*
- *[BRD](brd-curioframe.md) — Business case and scope*
- *[GTM](gtm-curioframe.md) — Full launch strategy*
- *[PRD](prd-curioframe.md) — Feature detail*
