# Request for Comments — Voice Agent (Speech-to-Speech Test Harness)

**Route:** `/test/speech-to-speech`  
**Location:** Self-contained under [`app/test/speech-to-speech/`](../../app/test/speech-to-speech/)  
**Status:** Sandbox — reintegrate piece by piece into product

See [`app/test/speech-to-speech/README.md`](../../app/test/speech-to-speech/README.md) for layout and reintegration map.

## APIs (scoped to test route)

- `POST /test/speech-to-speech/api/token` → `{ token, session_id }`
- `POST /test/speech-to-speech/api/chat` → `{ text }` (WebRTC fallback)

## State machine

`idle → connecting → alive ⇄ listening ⇄ speaking → fallback_text | error`

Mic toggle: on = `startListening`, off = `stopListening` (commit + spoken reply).
