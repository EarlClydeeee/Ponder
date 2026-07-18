# Design System Document (DSD)

**System Name:** CurioFrame Foundation
**Date:** 2026-07-18
**Version:** 0.1
**Owner:** earlc [TBD — confirm]
**PRD:** [prd-curioframe.md](prd-curioframe.md)

---

## 1. Design Philosophy & Vision

**Core aesthetic:** Gallery-dark immersive UI — the captured portrait is always the hero, framed like a painting in a dim exhibition hall. UI chrome recedes into deep charcoal; warm gold accents signal "alive" moments and CTAs. Typography pairs a classical serif display (art/history gravitas) with a clean sans body (modern app clarity). The product should feel like a magic museum guide, not a chatbot dashboard.

**Emotional intent:**
- **Anticipation** (capture screen) → **Wonder** (portrait awakens) → **Dialogue** (conversation) → **Discovery** (slides reveal) → **Satisfaction** (saved session)
- Motion reinforces life: subtle portrait pulse on idle; slide transitions feel like turning pages in an illuminated manuscript.

**Aesthetic references:** Apple Vision Pro spatial gallery demos, Google Arts & Culture, Duolingo's character warmth (tone only), Linear's dark polish (chrome only)

**What this system explicitly avoids:**
- Generic purple-gradient "AI app" look
- Chat bubble UI that hides the portrait
- Cluttered toolbars during conversation
- Cartoon mascots unrelated to the subject photo
- Aggressive neon gamification

---

## 2. Brand Primitives

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#0F0E0C` | Page/screen background (gallery dark) |
| `--color-surface` | `#1A1814` | Cards, slide carousel panels |
| `--color-border` | `#2E2A24` | Dividers, frame edges |
| `--color-primary` | `#C9A227` | CTAs, awaken button, active talk ring |
| `--color-primary-hover` | `#E0B83D` | Pressed/hover state |
| `--color-accent` | `#8B5CF6` | AI processing shimmer, slide gen indicator |
| `--color-text` | `#F5F0E8` | Body copy on dark backgrounds |
| `--color-text-inverse` | `#0F0E0C` | Body on gold CTAs |
| `--color-text-muted` | `#9C958A` | Secondary text, timestamps |
| `--color-success` | `#4ADE80` | Session saved, connection ok |
| `--color-warning` | `#FBBF24` | Low network, retry |
| `--color-error` | `#F87171` | Mic denied, API failure |

**Note on inverted screens:** Share/export modal uses `--color-surface` background with gold primary; error states use muted red border on portrait frame, never full-screen red flash.

### Typography

| Role | Font | Weight | Size | Line Height |
|------|------|--------|------|-------------|
| Heading 1 / Display | Fraunces | 700 | 40px | 1.1 |
| Heading 2 / Section Header | Fraunces | 600 | 28px | 1.2 |
| Heading 3 / Sub-header | Inter | 600 | 18px | 1.3 |
| Body | Inter | 400 | 16px | 1.5 |
| Small / Caption / Label | Inter | 500 | 13px | 1.4 |
| Stat / Number Display | Fraunces | 700 | 48px | 1.0 |
| Mono / Code | JetBrains Mono | 400 | 13px | 1.5 |

**Font loading:** Google Fonts via `expo-font` — preload Fraunces + Inter on splash; swap on load.

### Elevation & Depth

| Level | CSS / Shadow Value | Usage |
|-------|--------------------|-------|
| `--shadow-sm` | `0 2px 8px rgba(0,0,0,0.45)` | Portrait frame, slide cards |
| `--shadow-md` | `0 8px 24px rgba(0,0,0,0.55)` | Active conversation panel |
| `--shadow-lg` | `0 16px 48px rgba(0,0,0,0.65)` | Full-screen slide viewer |

---

## 3. Layout & Spatial System

**Base unit:** `4px`

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | Icon gaps |
| `--space-2` | `8px` | Tight padding |
| `--space-3` | `12px` | List spacing |
| `--space-4` | `16px` | Default padding |
| `--space-6` | `24px` | Section gaps |
| `--space-8` | `32px` | Screen margins |
| `--space-12` | `48px` | Hero portrait breathing room |

**Grid:** Single-column mobile; conversation screen = portrait 55% height top, slides 30%, talk control 15% bottom safe area.

**Breakpoints:**
- Mobile — `360px` min
- Tablet — `768px` (portrait left, slides right split)
- Desktop web demo — `1024px` [TBD — confirm]

---

## 4. Core Component Specs

### Buttons

| Variant | Background | Text | Border | Pressed | Disabled |
|---------|-----------|------|--------|---------|----------|
| Primary (CTA) | `--color-primary` | `--color-text-inverse` | none | `--color-primary-hover` | 40% opacity |
| Danger / Destructive | `--color-error` | white | none | darkened | 40% opacity |
| Ghost | transparent | `--color-primary` | `1px solid --color-primary` | `--color-surface` bg | 40% opacity |
| Secondary | `--color-surface` | `--color-text` | `1px solid --color-border` | darkened | 40% opacity |

**Border radius:** `14px` (CTA), `12px` (secondary)
**Padding:** `16px 24px`
**Minimum tap target:** `56px` height (talk button: `72px` circle)

### Inputs & Forms

- Background: `--color-surface`
- Border: `1px solid --color-border`
- Border radius: `12px`
- Focus ring: `2px solid --color-primary`
- Error state: `--color-error` border + caption below

### Surfaces (Cards, Modals, Panels)

- Background: `--color-surface`
- Border: `1px solid --color-border`
- Border radius: `20px` (portrait frame), `16px` (slides)
- Modal backdrop: `rgba(0,0,0,0.80)`

### Living Portrait Frame (signature component)

- Ornamental 4px gold border on `--color-bg` with inner `--shadow-md`
- Subtle breathing scale animation (1.0 → 1.008) on idle when "alive"
- Lip-sync or eye-blink overlay driven by audio amplitude
- Loading: purple accent shimmer on border while awakening
- States: `dormant` | `awakening` | `listening` | `speaking` | `generating-slides` | `error`

### Slide Carousel

- Horizontal snap scroll; 16:9 slide cards with caption bar (Inter 13px muted)
- Active slide: gold bottom indicator 3px
- Generating placeholder: skeleton + "Painting the story…" caption

---

## 5. Motion & Micro-interactions

**Transition default:** `all 200ms ease-out`

| Interaction | Duration | Easing | Notes |
|-------------|----------|--------|-------|
| Awaken flash | `400ms` | ease-out | Gold ring expands from center |
| Portrait breathe | `3000ms` | ease-in-out loop | Only when alive + idle |
| Talk button pulse | `1200ms` | ease-in-out loop | While user holds |
| Slide enter | `350ms` | spring | Slide up + fade |
| Slide crossfade | `250ms` | ease | During replay |
| Success save | `500ms` | spring | Checkmark on frame corner |

**Avoid:** Excessive parallax that causes motion sickness; autoplay voice without user gesture; slides that cover the portrait entirely during conversation.

---

## 6. Accessibility (a11y)

- **Contrast minimum:** WCAG AA — `#F5F0E8` on `#0F0E0C` ≈ 15:1; gold CTA verified for inverse text
- **Focus indicators:** 2px gold ring on all controls
- **Touch targets:** Minimum 56×56px; talk button 72×72px
- **Screen reader:** Portrait state announced ("Mona Lisa is speaking"); slides have alt text from captions
- **Reduced motion:** Disable breathe loop and awaken flash; instant slide cuts
- **Dark/Light mode:** Dark-only by design (gallery); high-contrast mode doubles border weight [TBD — confirm]

---

## 7. Taste-Skill Settings

```
DESIGN_VARIANCE:    6   (expressive hero, restrained chrome)
MOTION_INTENSITY:   5   (life without carnival)
VISUAL_DENSITY:     4   (portrait-forward, minimal lists)
```

**Chosen variant:** `gallery-expressive`
**Reason:** Product magic lives in the portrait + slides; UI must not compete.

---

## 8. Anti-Pattern Register

| Pattern | Status | Location | Fix Applied |
|---------|--------|----------|-------------|
| — | — | — | — |

---

## Self-Check

- [ ] Section 2 has exact HEX values — not "a muted blue"
- [ ] Section 3 spacing scale is consistent (all multiples of 4px base unit)
- [ ] Section 4 defines all component states including Disabled and Pressed
- [ ] Section 7 taste-skill dials are set and a variant is chosen
- [ ] WCAG AA contrast verified for primary text/background pairings
- [ ] This document exists in code as CSS variables or a config file

---

*Next document: [SDD](sdd-curioframe.md)*
