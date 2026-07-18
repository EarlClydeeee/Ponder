# Website Plan — Ponder Landing Page

**Type:** Single-page informational website
**Framework:** Next.js 15 (App Router, static export)
**Folder:** `/website`
**Goal:** Communicate the Living Portrait magic, build trust, drive App Store / Play Store downloads.

---

## Philosophy

- **One job:** Get the visitor to imagine interviewing a painting — then tap Download.
- **Narrative first:** Hook (Mona Lisa speaks) → problem (passive museums) → solution (voice + slides) → proof → CTA.
- **No clutter:** No blog, pricing page, or login. Single scroll.
- **Brand exact:** Gallery dark `#0F0E0C`, gold `#C9A227`, Fraunces + Inter from [dsd-Ponder.md](dsd-Ponder.md).

---

## Tech Stack

| Decision | Choice | Reason |
|----------|--------|--------|
| Framework | Next.js 15 App Router | Static export; fast CDN deploy |
| Styling | Tailwind CSS v4 | Matches DSD tokens |
| Fonts | `next/font/google` — Fraunces, Inter | DSD spec |
| Icons | `lucide-react` | Lightweight |
| Animations | CSS keyframes | Portrait breathe, gold ring |
| Deployment | Vercel | Zero-config |

---

## Folder Structure

```
website/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Navbar.tsx
│   ├── HeroSection.tsx
│   ├── ProblemSection.tsx
│   ├── HowItWorksSection.tsx
│   ├── ScienceSection.tsx
│   ├── PortraitDemoSection.tsx
│   ├── CtaSection.tsx
│   └── Footer.tsx
├── lib/constants.ts
└── public/images/...
```

---

## Page Sections — Content & Design Spec

### 1. Navbar
**Left:** Ponder wordmark — Fraunces, gold
**Right:** "Download Free" → `#cta`

### 2. Hero Section
**Headline:**
> Interview anything
> you photograph.

**Subheadline:**
> Ponder brings paintings, statues, landmarks, and everyday objects to life. Ask questions by voice. Watch story slides appear as they teach.

**CTA:** App Store + Google Play badges
**Mockup:** Conversation screen — Mona Lisa frame + slide carousel

### 3. Problem Section
**Eyebrow:** THE PROBLEM
**Headline:** Museums weren't built for your questions.
**Body:** Plaques can't follow curiosity. Audio guides can't hear you. Search pulls you away from what you're looking at.
**Cards:** Static plaques | One-way audio | Text chat disconnected from the subject

### 4. How It Works Section
**Card 1 — Capture:** Photograph any subject
**Card 2 — Awaken:** It speaks in character with matched voice
**Card 3 — Discover:** Visual slides illustrate every explanation

### 5. Science / Proof Section
**Eyebrow:** WHY IT WORKS
**Headline:** Conversation + imagery beats reading alone.
**Blocks:** Dual coding (words + pictures) | Retrieval via questioning | Emotional engagement through character

### 6. Portrait Demo Section
**Headline:** From Mona Lisa to your morning coffee.
**Body:** Famous art, travel landmarks, museum exhibits, or objects at home — if you can photograph it, you can learn from it.
**Strip:** Mona Lisa → Roman statue → Eiffel Tower → Dog → Product

### 7. CTA Section `id="cta"`
**Headline:** What will you interview first?
**CTA:** Store badges — "Free · 3 sessions/day"

### 8. Footer
Privacy · Contact · © 2026 Ponder

---

## CSS Custom Properties (globals.css)

```css
:root {
  --color-bg:            #0F0E0C;
  --color-surface:       #1A1814;
  --color-border:        #2E2A24;
  --color-primary:       #C9A227;
  --color-primary-hover: #E0B83D;
  --color-accent:        #8B5CF6;
  --color-text:          #F5F0E8;
  --color-text-inverse:  #0F0E0C;
  --color-text-muted:    #9C958A;
}
```

---

## Metadata & SEO

```ts
export const metadata = {
  title: 'Ponder — Point. Capture. Learn.',
  description: 'Turn any photo into a Living Portrait that talks, teaches, and shows visual story slides. Interview the Mona Lisa. Ask a landmark its history.',
  openGraph: { images: ['/og-image.png'] },
}
```

---

## Build & Deploy

```bash
cd website && npm install && npm run dev
npm run build   # outputs to website/out/
vercel --prod   # root: website/
```

---

## What This Page Is NOT

Not a blog, docs site, waitlist form, or dashboard. One page. One scroll. Download.

---

*Related: [gtm-Ponder.md](gtm-Ponder.md) · [dsd-Ponder.md](dsd-Ponder.md)*
