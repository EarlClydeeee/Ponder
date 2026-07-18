# Ponder

Living Portraits that teach through voice and visual story. Photograph any
painting, statue, landmark, or object — it comes alive in character, answers
your questions out loud, and generates visual story slides while it explains.

One **Next.js 15** project:

- `/` — landing page
- `/app` — the product, inside a mobile-ratio shell (phone frame on desktop, full-screen on phones)
- `/api/*` — key-holding route handlers (OpenAI key never reaches the browser)

Full specs live in [docs/](docs/). Team contracts in [CONTRACT.md](CONTRACT.md).

## Stack

| Concern | Choice |
|---------|--------|
| Framework | Next.js 15 App Router · React 19 |
| Styling | Tailwind CSS v4 (DSD tokens in `app/globals.css`) |
| Voice + vision | OpenAI Realtime (`gpt-4o-realtime-preview`) over **WebRTC** |
| Persona pre-pass | GPT-4o vision |
| Slides | `gpt-image-1` |
| Persistence | `localStorage` (no auth in MVP) |
| Hosting | Vercel |
| Native (post-MVP) | Capacitor — Android/Google Play only; iOS stays web |

## Getting started

```bash
cp .env.example .env.local     # add your OPENAI_API_KEY
npm install
npm run dev                    # http://localhost:3000 → / and /app
```

> Camera/mic need HTTPS or `localhost`. The bundled **Meet the Mona Lisa** demo
> uses a canned persona so it works offline; for a production demo, drop a real
> `public/demo/mona-lisa.jpg` and point `DEMO_PHOTO` at it in
> `components/app/CaptureScreen.tsx`.

## Architecture

```
app/
  page.tsx              landing (/)
  app/page.tsx          product (/app) inside <MobileShell>
  api/*/route.ts        realtime-token · analyze-portrait · generate-slides
src/
  engine/               LivingPortraitEngine, RealtimeSession (WebRTC),
                        PersonaAnalyzer, SlideDeckCoordinator, PortraitAnimator,
                        sessionStore, types
  hooks/                useLivingPortrait
  lib/                  image downscale
components/app/         MobileShell, CaptureScreen, ConversationScreen,
                        PortraitFrame, TalkButton, SlideCarousel
lib/theme.ts            DSD tokens for TS
```

State flow (RFC §3): `idle → analyzing → connecting → alive → listening ⇄ speaking → generating_slides → alive`, with `fallback_text` / `error` degradation paths.

## Deploy

```bash
vercel --prod          # set OPENAI_API_KEY in project env
```
