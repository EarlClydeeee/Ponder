# Awaken a Portrait — implementation plan

## Scope

Build US-01 from the PRD: a visitor captures an artwork or object, taps **Awaken**, and sees the photo become a subtle living portrait with a text-based in-character introduction. Voice is deliberately out of scope for this phase.

Current route: `/app/test/cam`  
Current implementation: `page.tsx` supports camera permission, live framing, capture, preview, and retake. The Awaken control is intentionally disabled.

## Target user flow

```text
Open camera → grant permission → capture photo → review photo
→ tap Awaken → “Reading your photo…” → portrait subtly moves
→ subject/persona + in-character text greeting
```

The first visual response should appear immediately after tapping Awaken. Analysis should be asynchronous and must always yield a useful fallback persona.

## Work split

### Shello — camera flow and client states

- Update `app/test/cam/page.tsx` to enable **Awaken** after a successful capture.
- Add explicit UI states: `captured`, `analyzing`, `awakening`, `awake`, and `error`.
- Keep the captured image in state and pass it to the awakening view.
- Add a retry path when analysis fails and retain the Retake action.
- Ensure camera tracks are stopped when a photo is captured, when navigating away, and when the component unmounts.
- Respect `prefers-reduced-motion` in all added visual states.

### Elton — analysis contract and living-portrait UI (higher-complexity work)

- Define an `AwakenResult` type in `src/engine/types.ts` (or a focused shared type module):

  ```ts
  export type AwakenResult = {
    subjectLabel: string;
    subjectType: "artwork" | "portrait" | "object" | "animal" | "unknown";
    personaName: string;
    personaTone: string;
    greeting: string;
    animationStyle: "parallax" | "blink" | "ambient";
    isFallback: boolean;
  };
  ```

- Adapt or replace `app/api/analyze-portrait/route.ts` to accept the captured image and return this contract.
- Ensure unrecognizable inputs receive a playful, image-grounded persona rather than an error.
- Create or extend a presentation component (prefer `components/app/PortraitFrame.tsx`) for an image, status, label, persona name, and greeting.
- Start with CSS-only movement: gentle scale/translate parallax and an animated light overlay. Do not generate video or add audio in this phase.

## API contract

`POST /api/analyze-portrait`

Request:

```json
{ "photoDataUrl": "data:image/jpeg;base64,..." }
```

Success response:

```json
{
  "subjectLabel": "Mona Lisa",
  "subjectType": "artwork",
  "personaName": "La Gioconda",
  "personaTone": "mysterious, warm, measured",
  "greeting": "Ah, you found me at last.",
  "animationStyle": "parallax",
  "isFallback": false
}
```

Fallback response example:

```json
{
  "subjectLabel": "Golden retriever",
  "subjectType": "animal",
  "personaName": "Sir Biscuit",
  "personaTone": "cheerful and noble",
  "greeting": "Welcome, friend. I was just guarding the sunbeam.",
  "animationStyle": "ambient",
  "isFallback": true
}
```

## Integration sequence

1. Agree on and add `AwakenResult` before either implementation depends on it.
2. Elton makes the API return a mocked/static `AwakenResult` first, then connects image analysis.
3. Shello wires the enabled Awaken button to the API and manages loading/error states.
4. Elton plugs the response into the living-portrait component and animation.
5. Test the complete flow on a real mobile device over HTTPS; browser camera access is restricted on non-secure origins.

## Acceptance checklist

- [ ] Camera permission granted → user can capture and review a photo.
- [ ] Tapping Awaken shows immediate progress feedback.
- [ ] Portrait is visible with subtle motion within 5 seconds.
- [ ] Recognized artwork gets an appropriate identity/persona and written greeting.
- [ ] An arbitrary object or animal still receives a playful fallback persona and greeting.
- [ ] Camera-denied, network-failure, and analysis-failure states have clear recovery actions.
- [ ] No microphone, voice connection, or autoplay audio is introduced in this scope.

## Non-goals for this phase

- Realtime voice or lip-sync
- Generated video/avatar replacement
- Session persistence and history
- Slides and follow-up conversation
