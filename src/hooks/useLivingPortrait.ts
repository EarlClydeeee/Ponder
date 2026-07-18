/**
 * C3 — React binding for the Living Portrait engine.
 * Screens render from this state only; no business logic in components
 * (workflow principle 2). RFC §3.
 * Owner: David. Consumer: Ivy.
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LivingPortraitEngine } from "@/src/engine/LivingPortraitEngine";
import type {
  AwakenConfig,
  AwakenResult,
  PortraitError,
  PortraitPhase,
  SlideDeck,
  TranscriptTurn,
} from "@/src/engine/types";

export interface LivingPortraitState {
  phase: PortraitPhase;
  subjectLabel: string;
  transcript: TranscriptTurn[];
  decks: SlideDeck[];
  activeDeck: SlideDeck | null;
  error: PortraitError | null;
  talkEnabled: boolean;
  amplitude: number;
  /** Face/animation pre-pass for the living-face overlay (may stay null). */
  awakenResult: AwakenResult | null;
  awaken: (config: AwakenConfig) => Promise<void>;
  startListening: () => void;
  stopListening: () => void;
  sendText: (text: string) => void;
  regenerateSlides: (deckId: string) => Promise<void>;
  endSession: () => void;
}

export function useLivingPortrait(): LivingPortraitState {
  const engineRef = useRef<LivingPortraitEngine | null>(null);
  if (engineRef.current === null) engineRef.current = new LivingPortraitEngine();
  const engine = engineRef.current;

  const [phase, setPhase] = useState<PortraitPhase>("idle");
  const [subjectLabel, setSubjectLabel] = useState("");
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [decks, setDecks] = useState<SlideDeck[]>([]);
  const [error, setError] = useState<PortraitError | null>(null);
  const [amplitude, setAmplitude] = useState(0);
  const [awakenResult, setAwakenResult] = useState<AwakenResult | null>(null);

  useEffect(() => {
    const offPhase = engine.on("phase", (p) => {
      setPhase(p);
      setSubjectLabel(engine.getSubjectLabel());
    });
    const offTranscript = engine.on("transcript", (turn) =>
      setTranscript((prev) => [...prev, turn]),
    );
    const offSlides = engine.on("slides", (deck) =>
      setDecks((prev) => {
        const rest = prev.filter((d) => d.deckId !== deck.deckId);
        return [...rest, deck];
      }),
    );
    const offError = engine.on("error", setError);
    const offFace = engine.on("face", setAwakenResult);
    const stopAmp = engine.animator.subscribe(setAmplitude);

    return () => {
      offPhase();
      offTranscript();
      offSlides();
      offError();
      offFace();
      stopAmp();
      engine.endSession();
    };
  }, [engine]);

  // Release the mic when the tab is hidden (RFC §6).
  useEffect(() => {
    const onHidden = () => {
      if (document.hidden && engine.getPhase() === "listening") {
        engine.stopListening();
      }
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, [engine]);

  const awaken = useCallback(
    (config: AwakenConfig) => {
      setError(null);
      setAwakenResult(null);
      setTranscript([]);
      return engine.awaken(config);
    },
    [engine],
  );

  const activeDeck = useMemo(
    () => decks.filter((d) => d.status === "ready").at(-1) ?? decks.at(-1) ?? null,
    [decks],
  );

  return {
    phase,
    subjectLabel,
    transcript,
    decks,
    activeDeck,
    error,
    talkEnabled:
      phase === "alive" || phase === "listening" || phase === "speaking",
    amplitude,
    awakenResult,
    awaken,
    startListening: useCallback(() => engine.startListening(), [engine]),
    stopListening: useCallback(() => engine.stopListening(), [engine]),
    sendText: useCallback((t: string) => engine.sendText(t), [engine]),
    regenerateSlides: useCallback(
      (id: string) => engine.regenerateSlides(id),
      [engine],
    ),
    endSession: useCallback(() => engine.endSession(), [engine]),
  };
}
