/**
 * Handles generate_slides tool calls → /api/generate-slides → deck events.
 * Owner: David (engine side); route owned by Shello.
 */
import type { GenerateSlidesResponse, SlideDeck } from "./types";

interface DeckRequest {
  topic: string;
  count: 1 | 2 | 3;
  styleHint: string;
}

export class SlideDeckCoordinator {
  private requests = new Map<string, DeckRequest>();

  constructor(private onDeck: (deck: SlideDeck) => void) {}

  /**
   * Kicks off generation. Emits a `generating` skeleton immediately
   * (UI shows "Painting the story…"), then `ready` or `failed`.
   * Returns the deck id so the engine can answer the tool call.
   */
  async generate(request: DeckRequest): Promise<SlideDeck> {
    const placeholderId = `pending-${crypto.randomUUID()}`;
    this.onDeck({
      deckId: placeholderId,
      topic: request.topic,
      slides: [],
      status: "generating",
    });

    try {
      const res = await fetch("/api/generate-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: request.topic,
          count: request.count,
          style_hint: request.styleHint,
        }),
      });
      if (!res.ok) throw new Error(`generate-slides failed: ${res.status}`);

      const data = (await res.json()) as GenerateSlidesResponse;
      const deck: SlideDeck = {
        deckId: data.deck_id,
        topic: data.topic,
        slides: data.slides,
        status: "ready",
      };
      this.requests.set(deck.deckId, request);
      // Replace the placeholder with the real deck.
      this.onDeck({ ...deck, deckId: placeholderId });
      return deck;
    } catch {
      const failed: SlideDeck = {
        deckId: placeholderId,
        topic: request.topic,
        slides: [],
        status: "failed",
      };
      this.onDeck(failed);
      return failed;
    }
  }

  /** User tapped regenerate on a deck (PRD HITL gate). */
  async regenerate(deckId: string): Promise<SlideDeck | null> {
    const request = this.requests.get(deckId);
    if (!request) return null;
    return this.generate(request);
  }
}
