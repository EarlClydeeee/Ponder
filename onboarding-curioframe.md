# Onboarding Strategy & Flow: Ponder First Portrait Experience (ONBOARDING.md)

## 1. The Strategy: One Magic Demo Before the Museum

Ponder's onboarding must deliver the "Living Portrait" moment before asking for camera access in a crowded place. New users are skeptical of AI hype and cautious about mic permissions. The flow uses a **2-Question Pivot + Instant Demo**: two quick preference taps, then a bundled Mona Lisa portrait awakens and answers one scripted question — so users feel wonder before friction. Camera and mic permissions are requested only after the demo proves value.

---

## 2. The 2-Question Personalization Flow

### Question 1: Learning Style
* **Prompt:** "How do you like to learn?"
* **Choice A: Show me while you talk.**
    * *Philosophy:* Visual learners need slides and imagery during explanation.
    * *UI Impact:* Slide carousel prominent in conversation layout.
    * *Product Impact:* `preferSlides: true`; auto-trigger slides on longer answers.
* **Choice B: Just let me ask questions.**
    * *Philosophy:* Dialogue-first; visuals on demand.
    * *UI Impact:* Portrait larger; slides appear only when user asks "show me."
    * *Product Impact:* `preferSlides: false`; agent tool calls only on explicit visual cues.

### Question 2: Where You'll Use Ponder
* **Prompt:** "Where will you use this most?"
* **Choice A: Museum or gallery.**
    * *Logic:* Quiet environment; headphones likely.
    * *Impact:* Enable headphones tip; default push-to-talk; dim UI (gallery mode).
* **Choice B: At home or classroom.**
    * *Logic:* More time, possibly speaker audio.
    * *Impact:* Louder default volume; suggest trying objects around the room.
* **Choice C: Everywhere — travel, street, random objects.**
    * *Logic:* Variable noise and lighting.
    * *Impact:* Show noise tip; encourage gallery import when camera awkward.

### Question 3: First Subject (Demo Anchor)
* **Prompt:** "Meet your first Living Portrait."
* **Input:** Auto-launch bundled Mona Lisa demo (no camera yet)
* **Impact:** User hears in-character greeting; tap suggested chip "Who are you?" → voice answer + 2 slides on Leonardo/Renaissance. **Behavioral hook:** peak-end rule — end onboarding on the slide reveal, not the permission screen.

---

## 3. Onboarding Walkthrough Guide

| Step | User Interaction | Visual/Hero State | UI Palette |
| :--- | :--- | :--- | :--- |
| **0. Welcome** | App Launch | Ponder logo + gold frame animation | Gallery dark |
| **1. Learning Style** | Selects visual or dialogue | Portrait frame empty, shimmer | Gold accent |
| **2. Use Context** | Selects museum/home/everywhere | Map icons fade in | Muted + gold |
| **3. Demo Portrait** | Taps "Who are you?" chip | Mona Lisa awakens, speaks, slides appear | Full expressive |
| **4. Ready** | "Capture your own" or "Try demo again" | Home with CTA | Gold CTA |

**Post-demo permissions (sequential, not stacked):**
1. Camera — "Photograph what you want to talk to"
2. Mic — "Ask questions with your voice"

---

## 4. User Story: "The Museum Trip That Didn't Bore Him"

**Persona:** Maya, 34, at home planning Saturday museum visit with son Noah (9).

**The Experience:**
1. **Opening:** No signup form — just "Point. Capture. Learn." and a gold frame.
2. **Engagement:** She picks "Show me while you talk" and "Museum." Mona Lisa appears and says hello in a calm female voice.
3. **The Hook:** Noah taps "Who are you?" — Mona Lisa answers and a Renaissance Florence slide fades in. Noah laughs: "She talked!"
4. **Verification:** Maya taps "Capture your own" — camera opens; she photographs a vase on the shelf; it introduces itself as a Ming-era vessel [demo-quality dependent on API].
5. **Closure:** Session saves automatically. Maya sees "Bring this to the museum Saturday" tip. She feels ready, not configured.

---

## 5. Design Principles for Onboarding
* **Demo before permissions:** Never lead with camera/mic system dialogs.
* **One screen per question:** No scrolling onboarding carousel.
* **Immediate mechanism:** User must hear a Living Portrait speak before home screen.
* **Kid-safe copy:** Persona greetings educational; parental disclaimer on AI accuracy on final onboarding card.

---

*Related: [prd-Ponder.md](prd-Ponder.md) US-05 · [dsd-Ponder.md](dsd-Ponder.md)*
