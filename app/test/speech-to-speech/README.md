# Speech-to-speech test harness

**Route:** `/test/speech-to-speech`  
**Status:** Self-contained sandbox — reintegrate into product piece by piece.

## Layout

```
app/test/speech-to-speech/
  page.tsx
  components/
    VoiceAgentScreen.tsx
    MicToggleButton.tsx
  lib/
    config.ts              # API_BASE, Realtime model/URLs
    types.ts
    RealtimeSession.ts     # WebRTC client
    RealtimeAudioOutput.ts
    VoiceAgentEngine.ts
    useVoiceAgent.ts
  api/
    token/route.ts         # POST /test/speech-to-speech/api/token
    chat/route.ts          # POST /test/speech-to-speech/api/chat (fallback)
```

## Run

1. `OPENAI_API_KEY` in `.env.local`
2. `npm run dev`
3. Open http://localhost:3000/test/speech-to-speech

## Reintegration notes

| Piece | Move to |
|-------|---------|
| `lib/RealtimeSession.ts` | `src/engine/` (merge with portrait session or share) |
| `lib/VoiceAgentEngine.ts` | `src/engine/` |
| `lib/useVoiceAgent.ts` | `src/hooks/` |
| `api/token/route.ts` | Keep shared `/api/realtime-token` or alias |
| `api/chat/route.ts` | `app/api/chat/` for global fallback |
| `components/*` | `components/app/` or product route |
