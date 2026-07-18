# Business Requirements Document (BRD)

**Project:** Ponder — Living Portraits that teach through voice and visual story
**Date:** 2026-07-18
**Version:** 0.1
**Owner:** earlc [TBD — confirm]
**Status:** Draft

---

## 1. Executive Summary

Ponder is a mobile app that turns any photo into an educational conversation partner. A user points their camera at a painting, statue, landmark, product, or pet, captures a snapshot, and the subject comes alive with an in-character voice to answer questions. While explaining, the app generates sequential visual slides that illustrate what the portrait is talking about — history, context, science, or craft — so learning stays conversational and fun. The product exists because museum plaques, static Wikipedia pages, and generic chatbots fail curious learners who want to ask follow-up questions about the thing in front of them right now.

---

## 2. The Problem & Opportunity

**The Problem:**

Curious people — students, museum visitors, parents, travelers — encounter objects they want to understand but face passive information: small plaques, long articles, or video tours they cannot interrupt. Existing AI assistants answer in text and feel disconnected from the physical subject. Children and casual learners disengage when content is read-only or requires switching apps. An estimated 850M+ museum visits occur globally each year, yet most visitors spend under 30 seconds per exhibit and retain little because interaction is one-way.

**The Opportunity:**

Multimodal realtime AI (vision + voice) and on-demand image generation now make it possible to bind identity, personality, and visual explanation to a single captured photo. Post-COVID cultural institutions and ed-tech budgets prioritize experiential learning. A product that feels like interviewing the Mona Lisa — and seeing her history appear as slides while she speaks — fills a gap between entertainment (filters, AR gimmicks) and formal education (LMS, textbooks).

**Target Customer / User:**

**Maya, 34, museum parent.** Visits science and art museums with her 9-year-old. Tries audio guides once, then abandons them because her son asks questions the guide cannot answer. She wants something on her phone that makes exhibits feel like a conversation, not a lecture. She will share a 30-second clip if the Mona Lisa actually responds to her kid's question.

Secondary: **Leo, 22, design student** who photographs products and architecture for inspiration and wants quick contextual depth without opening five browser tabs.

---

## 3. Strategic Alignment

**Primary OKR (12 months):** Achieve ≥20% D30 retention among users who complete at least one full portrait conversation (≥3 voice turns + ≥1 generated slide deck) within their first session.

**Secondary goals:**
- Establish Ponder as the default "point and learn" demo in hackathon and ed-tech circles (Living Portrait category).
- Build a library of saved portrait sessions users return to (foundation for Pro tier).
- Validate freemium conversion via session limits and saved-history paywall.

---

## 4. Scope

**In Scope:**

- Camera capture or gallery import of a single subject photo
- Subject identification and in-character persona generation (voice, tone, knowledge domain)
- Realtime voice conversation with the "living portrait"
- Sequential slide/image generation triggered by explanation topics in the conversation
- Continuous multi-turn Q&A within a session
- Session history (local + cloud sync)
- Browser-first web app (Next.js): `/` landing page + `/app` mobile-ratio experience — works on any phone browser, no install
- Android store app via Capacitor wrap of the same web build (post-MVP); iOS served via mobile Safari (no native iOS build)
- Freemium usage limits (daily portrait sessions)

**Out of Scope (V1):**

- Live AR overlay on camera feed (snapshot-only in V1)
- Multi-subject collages or classroom broadcast mode
- User-created custom personas or marketplace of characters
- Official museum API partnerships and licensed artwork verification
- Offline voice (requires network for Realtime API)
- Native store builds in the initial 3-hour MVP (Capacitor packaging follows post-MVP)
- Desktop native apps
- Social feed / sharing beyond export clip
- Monetization beyond freemium subscription [TBD — confirm pricing]

---

## 5. Success Metrics

| Metric | Baseline | Target | Timeline |
|--------|----------|--------|----------|
| Installs + web app sessions | 0 | 5,000 | 90 days post-launch [TBD — confirm] |
| D7 retention | 0 | ≥35% | Measured from launch cohort |
| D30 retention | 0 | ≥20% | Measured from launch cohort |
| Sessions with ≥3 voice turns + ≥1 slide deck | 0 | ≥45% of first-time users | 60 days post-launch |
| Google Play rating *(post-Capacitor, Android-only)* | 0 | ≥4.3 | Ongoing after 100 reviews |
| Free → Pro conversion | 0 | ≥3% of MAU | 90 days post-launch [TBD — confirm] |

---

## 6. Stakeholders & Owners

| Role | Person | Responsibility |
|------|--------|----------------|
| Sponsor / Decision Maker | earlc [TBD — confirm] | Final approval, product direction, hackathon submission |
| Business Owner | earlc [TBD — confirm] | Retention, monetization, GTM |
| Product / Tech Lead | earlc [TBD — confirm] | Architecture, build, deployment |

---

## Self-Check

- [ ] Section 1 can be read by a non-technical person and makes immediate sense
- [ ] Section 2 quantifies the problem (not just describes it)
- [ ] Section 5 has at least one metric with a number and a timeline
- [ ] Section 4 explicitly names at least one thing that is out of scope
- [ ] Nothing in this document describes *how* to build the solution (that's the SDD's job)

---

*Next document: [PRD](prd-curioframe.md)*
