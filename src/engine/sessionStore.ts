/**
 * localStorage session store — SDD §3, RFC §3 SessionStore contract.
 * Owner: Shello. Supabase sync slots in behind save() post-MVP.
 */
import type { SlideDeck, StoredSession, TranscriptTurn } from "./types";

const SESSIONS_KEY = "ponder.sessions";
const PREFS_KEY = "ponder.prefs";

/** Last 5 sessions kept; localStorage budget cap. */
const MAX_SESSIONS = 5;

export interface Prefs {
  preferSlides: boolean;
  useContext: "museum" | "home" | "everywhere";
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded — evict the oldest session and retry once.
    const sessions = readJson<StoredSession[]>(SESSIONS_KEY, []);
    if (sessions.length > 1) {
      window.localStorage.setItem(
        SESSIONS_KEY,
        JSON.stringify(sessions.slice(0, -1)),
      );
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* give up quietly; session stays in memory */
      }
    }
  }
}

export const sessionStore = {
  list(): StoredSession[] {
    return readJson<StoredSession[]>(SESSIONS_KEY, []);
  },

  get(id: string): StoredSession | null {
    return this.list().find((s) => s.id === id) ?? null;
  },

  /** Upsert, newest first; evicts past MAX_SESSIONS. */
  save(session: StoredSession): void {
    const rest = this.list().filter((s) => s.id !== session.id);
    writeJson(SESSIONS_KEY, [session, ...rest].slice(0, MAX_SESSIONS));
  },

  remove(id: string): void {
    writeJson(
      SESSIONS_KEY,
      this.list().filter((s) => s.id !== id),
    );
  },

  appendTurn(id: string, turn: TranscriptTurn): void {
    const session = this.get(id);
    if (!session) return;
    this.save({ ...session, transcript: [...session.transcript, turn] });
  },

  appendDeck(id: string, deck: SlideDeck): void {
    const session = this.get(id);
    if (!session) return;
    const rest = session.decks.filter((d) => d.deckId !== deck.deckId);
    this.save({ ...session, decks: [...rest, deck] });
  },

  getPrefs(): Prefs | null {
    return readJson<Prefs | null>(PREFS_KEY, null);
  },

  setPrefs(prefs: Prefs): void {
    writeJson(PREFS_KEY, prefs);
  },

  /** "Clear my sessions" — SDD §5 instant data wipe. */
  clearAll(): void {
    if (!isBrowser()) return;
    window.localStorage.removeItem(SESSIONS_KEY);
    window.localStorage.removeItem("ponder.usage");
    window.localStorage.removeItem(PREFS_KEY);
  },
};
