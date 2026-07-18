---
name: e2e
description: >-
  Drive the Ponder web app in a real browser via the Playwright MCP server to
  smoke-test the core flows. Use when asked to E2E test, browser-test, smoke
  test, or "click through" the app, verify the /app mobile shell, or reproduce a
  QAD scenario (H-01..H-07, S-01..S-10). Requires the `playwright` MCP server
  (see .mcp.json) and a running dev server.
argument-hint: "[scenario e.g. H-02 or 'demo path']"
---

# E2E: drive Ponder via Playwright MCP

Exercise the app end-to-end in a browser using the **Playwright MCP** tools
(`browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`,
`browser_resize`, `browser_take_screenshot`, `browser_console_messages`,
`browser_wait_for`). Reference: [docs/qad-curioframe.md](../../../docs/qad-curioframe.md).

## 0. Preconditions

1. **Dev server running.** If nothing is on `http://localhost:3000`, start it:
   `npm run dev` (background). Wait for it to be reachable before navigating.
2. **Playwright MCP available.** Tools appear as `mcp__playwright__browser_*`.
   If missing, the `playwright` server in [.mcp.json](../../../.mcp.json) needs
   approval — tell the user to run `claude` interactively and approve it once.
3. **`OPENAI_API_KEY` in `.env.local`** is needed only for live voice/slides.
   For deterministic UI checks, prefer the demo + text paths below.

## 1. Enter the mobile shell

- `browser_resize` to **390 × 844** first — `/app` only renders the phone frame
  and mobile layout at that width class; a desktop viewport shows the centered
  bezel, which is fine but test the content at phone size.
- `browser_navigate` to `http://localhost:3000/app`.
- `browser_snapshot` and confirm the capture screen: heading **"Point. Capture.
  Learn."**, the **Meet the Mona Lisa** demo tile, and **Capture your own**.

## 2. Core demo path (QAD H-01/H-02 shape, no network needed)

1. `browser_click` the **Meet the Mona Lisa** tile.
2. `browser_snapshot` — the portrait frame should mount and the phase label
   should progress (`Reading the photo…` → `Awakening…`). The demo persona is
   canned (`src/engine/PersonaAnalyzer.ts`), so this works offline; the top bar
   should read **Mona Lisa**.
3. Without a live key the Realtime connect will fail and the engine drops to
   **fallback text mode** — that is expected and itself a valid check
   (QAD S-04). A text input ("Type your question…") should appear.
4. In fallback, `browser_type` a question (e.g. "Who are you?") and submit;
   confirm the turn is appended to the transcript.

## 3. What to assert

- No uncaught errors in `browser_console_messages` (warnings from font/image
  optimization are fine).
- `browser_take_screenshot` at the capture screen and after awaken for a visual
  diff / to show the user.
- Landing page: `browser_navigate` to `/`, confirm hero **"Interview anything
  you photograph."** and that the **Open Ponder** buttons link to `/app`.

## 4. Live voice path (only with a real key + user present)

Voice needs mic permission and a WebRTC connection — Playwright can grant
`microphone` permission but cannot speak. Use it to verify the **push-to-talk**
button enables/pulses and that `/api/realtime-token` returns 200 (watch the
network / console), not to validate audio. Drive conversation via the question
chips and text input instead.

## 5. Report

Summarize per scenario: **pass / fail / blocked**, with the console line or
screenshot that proves it. Map findings back to QAD IDs where relevant. Never
claim a flow passed without a snapshot or console check that actually observed
it.
