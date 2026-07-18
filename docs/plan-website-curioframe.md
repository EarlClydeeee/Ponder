# Web App Plan — Ponder Landing + `/app`

**Type:** Single Next.js project — the whole product
**Framework:** Next.js 15 (App Router)
**Folder:** repo root
**Routes:** `/` = landing page · `/app` = the mobile app in a mobile-ratio shell · `/api/*` = key-holding routes
**Goal:** `/` communicates the Living Portrait magic and sends visitors into `/app`; `/app` *is* the product — no install needed. Capacitor wraps this same build for **Android (Google Play)** post-MVP; iOS users keep using the web app in Safari.

---

## Philosophy

- **One job:** Get the visitor to imagine interviewing a painting — then tap **Open Ponder** and actually do it at `/app`.
- **Narrative first:** Hook (Mona Lisa speaks) → problem (passive museums) → solution (voice + slides) → proof → CTA.
- **No clutter:** No blog, pricing page, or login. Single scroll.
- **Brand exact:** Gallery dark `#0F0E0C`, gold `#C9A227`, Fraunces + Inter from [dsd-curioframe.md](dsd-curioframe.md).

---

## Tech Stack

| Decision | Choice | Reason |
|----------|--------|--------|
| Framework | Next.js 15 App Router | One project: landing + app + API routes |
| Styling | Tailwind CSS v4 | Matches DSD tokens |
| Fonts | `next/font/google` — Fraunces, Inter | DSD spec |
| Icons | `lucide-react` | Lightweight |
| Animations | CSS keyframes | Portrait breathe, gold ring |
| Deployment | Vercel | Zero-config; preview URL = device-test build |
| Native packaging *(post-MVP)* | Capacitor — **Android only** | Wraps web build for Google Play; iOS stays web |

---

## Folder Structure

```
/  (repo root)
├── app/
│   ├── layout.tsx              # fonts, metadata, globals
│   ├── page.tsx                # landing (/)
│   ├── globals.css             # DSD tokens as CSS custom properties
│   ├── app/
│   │   └── page.tsx            # the product (/app) inside <MobileShell>
│   ├── api/
│   │   ├── realtime-token/route.ts
│   │   ├── analyze-portrait/route.ts
│   │   └── generate-slides/route.ts
│   └── test/                   # feature sandboxes → /test/<feature>
│       ├── realtime/page.tsx   #   built in isolation, integrated into /app
│       └── camera/page.tsx     #   when green (not user-facing)
├── components/
│   ├── landing/                # Navbar, HeroSection, ProblemSection,
│   │                           # HowItWorksSection, ScienceSection,
│   │                           # PortraitDemoSection, CtaSection, Footer
│   └── app/                    # MobileShell, CaptureScreen, ConversationScreen,
│                               # PortraitFrame, TalkButton, SlideCarousel, SessionList
├── src/
│   ├── engine/                 # LivingPortraitEngine, RealtimeSession,
│   │                           # PersonaAnalyzer, SlideDeckCoordinator,
│   │                           # PortraitAnimator, sessionStore.ts, types.ts
│   └── hooks/useLivingPortrait.ts
├── lib/theme.ts                # DSD tokens for TS consumers
└── public/demo/                # bundled Mona Lisa asset + cached demo audio/slides
```

**Mobile Shell (`components/app/MobileShell.tsx`):** on viewports ≥768px, `/app` renders centered in a phone-ratio frame — max-width 390px, 9:19.5 aspect, rounded bezel, `--shadow-lg`, gallery-dark backdrop. On mobile viewports it fills the screen. See [dsd-curioframe.md §4](dsd-curioframe.md).

**Feature sandboxes (`app/test/<feature>`):** build each feature as an isolated route (`/test/realtime`, `/test/camera`, …) that reuses the shared engine/hook/tokens, then integrate the working implementation into `/app`. `/test/*` routes are dev harnesses — never linked from `/app` or the landing page. Owner map in [plan-dev-workflow-curioframe.md](plan-dev-workflow-curioframe.md).

---

## Page Sections — Content & Design Spec

### 1. Navbar
**Left:** Ponder wordmark — Fraunces, gold
**Right:** "Open Ponder" → `/app`

### 2. Hero Section
**Headline:**
> Interview anything
> you photograph.

**Subheadline:**
> Ponder brings paintings, statues, landmarks, and everyday objects to life. Ask questions by voice. Watch story slides appear as they teach.

**CTA:** Gold "Open Ponder →" button → `/app` (Google Play badge post-Capacitor)
**Mockup:** Conversation screen — Mona Lisa frame + slide carousel (the real `/app` in a phone frame)

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
**CTA:** "Open Ponder →" button → `/app` — "Free · 3 sessions/day · no install"

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
npm install && npm run dev    # http://localhost:3000 → / and /app
npm run build                 # production build
vercel --prod                 # deploy from repo root
```

`OPENAI_API_KEY` in `.env.local` (dev) and Vercel project env (preview/prod).

---

## What This Page Is NOT

The landing page is not a blog, docs site, waitlist form, or dashboard. One page. One scroll. Open `/app`.

---

*Related: [gtm-curioframe.md](gtm-curioframe.md) · [dsd-curioframe.md](dsd-curioframe.md)*
