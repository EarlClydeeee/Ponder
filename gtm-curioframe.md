# Go-To-Market (GTM) Strategy

**Project:** CurioFrame — Living Portraits that teach through voice and visual story
**Date:** 2026-07-18
**Version:** 0.1
**Owner:** earlc [TBD — confirm]
**PRD:** [prd-curioframe.md](prd-curioframe.md)

---

## 1. Product Summary (GTM View)

**What it does (one sentence):** CurioFrame turns any photo into a speaking character that teaches you through voice conversation and auto-generated story slides.

**Who it's for:** Curious learners, museum visitors, and parents who want exhibits to answer back — not just display a plaque.

**Core value proposition:** Interview the Mona Lisa. Ask a landmark its history. Learn by talking to what you're looking at.

**Category:** App Store Education / Google Play Education (secondary: Entertainment)

---

## 2. Target Audience

**Primary ICP:**
- *Who:* Parents 28–45 and curious teens/adults who visit museums, landmarks, or study visual subjects; already use Google Lens or ChatGPT but want something tied to their photo and voice.
- *Where they hang out:* r/museum, r/ArtHistory, #MuseumTok, travel Instagram, homeschool Facebook groups, ed-tech Twitter/X.
- *What they already believe:* "My kid learns better when they can ask questions." "Audio guides are boring."
- *What will make them try this:* A 30-second video of Mona Lisa answering "Who are you?" with slides appearing mid-sentence.

**Secondary audience:**
- *Who:* Teachers seeking demo hooks for history/art units
- *Why secondary:* Slower adoption cycle but high session depth once onboarded

---

## 3. Pricing Model

**Model:** Freemium

| Tier | Price | What's Included | Limit / Gate |
|------|-------|-----------------|--------------|
| Free | $0 | Full voice + slides experience | 3 portrait sessions per day; last 5 sessions saved |
| Pro | $6.99/mo or $49.99/yr [TBD — confirm] | Unlimited sessions, unlimited history, share clips HD, kid-slow-voice mode | No daily cap |

**Pricing rationale:** API cost ~$0.35/session caps free tier at 3/day; Pro targets museum members and homeschool parents who'll pay less than a single audio guide rental ($5–8).

**Payment processor:** RevenueCat + App Store / Google Play billing

---

## 4. Positioning & Messaging

**Tagline:** `"Point. Capture. Learn."`

**Primary message (landing page hero):**
Museums show you art. CurioFrame lets you talk to it. Photograph any painting, statue, landmark, or object — and it comes alive in character, answering your questions out loud while visual story slides illustrate what it's teaching. Learning finally feels like a conversation, not a lecture.

**Proof points:**
- Built on OpenAI Realtime vision + voice for natural dialogue
- Educational slides generated on the fly from what the portrait explains
- Designed for museums, classrooms, and curious minds — not generic chat

**Objection handling:**

| Objection | Response |
|-----------|----------|
| "Isn't this just ChatGPT with a picture?" | The portrait stays on screen, speaks in character with matched voice, and generates visual slides synced to its explanations — not a text box. |
| "Will it get facts wrong?" | It's an AI guide, not a textbook — great for curiosity and exploration; we show sources on slides where possible in v1.1. |
| "My kid will just play with silly photos." | Play is learning — asking a dog "what do you smell?" still builds inquiry skills; Pro parents get saved session history. |
| "I don't want to talk in a quiet museum." | Push-to-talk + headphones mode; text fallback available. |

---

## 5. Launch Channels & Tactics

**Owned channels:**

| Channel | Audience Size | Planned Action |
|---------|---------------|----------------|
| TikTok / Reels | TBD | "Mona Lisa answers my kid" demo series |
| X / Twitter | TBD | Build-in-public hackathon thread |
| Landing site curioframe.app [TBD — confirm] | — | Demo video + waitlist → store links |

**Community / earned channels:**

| Channel | Tactic | Timing |
|---------|--------|--------|
| r/SideProject, r/EdTech | Demo GIF + "I built Living Portraits" | Launch day |
| r/museum, r/ArtHistory | Educational angle post (not spammy) | Launch +1 week |
| Product Hunt | "Interview anything you photograph" | Public launch week |
| Hacker News Show HN | Technical Realtime + vision angle | Launch day 9am ET |
| Museum/ed-tech newsletters | Cold pitch with demo link | Beta phase |

**Content assets needed before launch:**

- [ ] Demo video (45 sec) — capture Mona Lisa poster → awaken → voice Q → slides
- [ ] App Store screenshots (5) — Capture, Awaken, Talk, Slides, History
- [ ] Store description copy (short + long)
- [ ] Landing page — see [plan-website-curioframe.md](plan-website-curioframe.md)
- [ ] Product Hunt listing + first comment
- [ ] Reddit post copy (2 variants)

---

## 6. Launch Phases

| Phase | Criteria to Enter | Target Date | Goal |
|-------|-------------------|-------------|------|
| **Alpha** | Vertical slice on device; demo portrait works | Week 8 | 10 testers (friends + teachers) |
| **Beta** | Must-Haves stable; onboarding done | Week 10 | 50–100 TestFlight users; D7 baseline |
| **Public Launch** | QAD passed; store assets ready | Week 12 | 5k installs in 90 days |
| **Post-launch (30 days)** | — | Week 16 | ≥35% D7; first Pro conversions |

---

## 7. Success Metrics (30-day post-launch)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| App installs | 5,000 | Store consoles |
| D7 retention | ≥35% | PostHog / Amplitude [TBD — confirm] |
| D30 retention | ≥20% | Same |
| Sessions with ≥3 turns + slides | ≥45% | Custom event |
| App Store rating | ≥4.3 | Store Connect |
| Pro conversion | ≥3% MAU | RevenueCat |
| Product Hunt rank | Top 5 Education | PH dashboard |

---

## Self-Check

- [ ] Section 2 ICP is specific enough
- [ ] Section 3 pricing has clear free/paid gate
- [ ] Section 5 content assets enumerated
- [ ] Section 6 has binary phase criteria
- [ ] Section 7 metrics measurable on day 1
- [ ] Drafted before launch

---

*Full FMD suite complete. Document index:*
- *[BRD](brd-curioframe.md) — Why build this*
- *[PRD](prd-curioframe.md) — What to build*
- *[DSD](dsd-curioframe.md) — How it looks*
- *[SDD](sdd-curioframe.md) — How it's built*
- *[RFC](rfc-curioframe-living-portrait-engine.md) — Living Portrait engine*
- *[QAD](qad-curioframe.md) — How we test it*
- *[GTM](gtm-curioframe.md) — How we launch it*
