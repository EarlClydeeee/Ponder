# Ponder — agent guide

Living Portraits web app. One Next.js 15 project: `/` landing, `/app` product
(phone-width column), `/api/*` key-holding routes. Full specs in [docs/](docs/),
contracts in [CONTRACT.md](CONTRACT.md).

## Build policy — IMPORTANT

**Do NOT run `npm run build` while iterating.** Only run it as the final
verification step *when you are about to commit*. A build is not part of the
edit loop.

- **In the edit loop** (fast, cheap): `npx tsc --noEmit` for types, `npm run lint`
  for lint, `npm run dev` for manual/visual checks.
- **At commit time only**: run `npm run build` once as the pre-commit gate; if it
  passes, commit. If you are not committing, do not build.

## Commands

| When | Command |
|------|---------|
| Dev server | `npm run dev` → http://localhost:3000 |
| Typecheck (in-loop) | `npx tsc --noEmit` |
| Lint (in-loop) | `npm run lint` |
| Build (commit gate only) | `npm run build` |

## Ownership hotspots (don't cross-edit without the owner)

- `src/engine/*` — David (no one else opens WebRTC code)
- `app/globals.css`, `lib/theme.ts` — Ivy
- `app/api/*` — Shello
- `next.config.ts`, `package.json` — Earl Clyde

## Notes

- OpenAI key lives only in `app/api/*` (Vercel env / `.env.local`); never ship it
  to the browser.
- Sessions persist in `localStorage` (no auth in MVP).
