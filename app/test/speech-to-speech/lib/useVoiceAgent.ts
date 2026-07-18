"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VoiceAgentEngine } from "./VoiceAgentEngine";
import type {
  TranscriptTurn,
  VoiceAgentConfig,
  VoiceAgentError,
  VoiceAgentPhase,
} from "./types";

export interface VoiceAgentState {
  phase: VoiceAgentPhase;
  title: string;
  transcript: TranscriptTurn[];
  error: VoiceAgentError | null;
  micOn: boolean;
  amplitude: number;
  start: (config: VoiceAgentConfig) => Promise<void>;
  toggleMic: () => void;
  sendText: (text: string) => Promise<void>;
  endSession: () => void;
}

export function useVoiceAgent(): VoiceAgentState {
  const engineRef = useRef<VoiceAgentEngine | null>(null);
  if (engineRef.current === null) engineRef.current = new VoiceAgentEngine();
  const engine = engineRef.current;

  const [phase, setPhase] = useState<VoiceAgentPhase>("idle");
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [error, setError] = useState<VoiceAgentError | null>(null);
  const [amplitude, setAmplitude] = useState(0);

  useEffect(() => {
    const offPhase = engine.on("phase", (p) => {
      setPhase(p);
      setTitle(engine.getTitle());
    });
    const offTranscript = engine.on("transcript", (turn) =>
      setTranscript((prev) => [...prev, turn]),
    );
    const offError = engine.on("error", setError);
    const stopAmp = engine.audioOutput.subscribe(setAmplitude);

    return () => {
      offPhase();
      offTranscript();
      offError();
      stopAmp();
      engine.endSession();
    };
  }, [engine]);

  useEffect(() => {
    const onHidden = () => {
      if (document.hidden && engine.getPhase() === "listening") {
        engine.stopListening();
      }
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, [engine]);

  const start = useCallback(
    (config: VoiceAgentConfig) => {
      setError(null);
      setTranscript([]);
      return engine.start(config);
    },
    [engine],
  );

  const micOn = phase === "listening";

  const toggleMic = useCallback(() => {
    if (phase === "listening") engine.stopListening();
    else if (phase === "alive") engine.startListening();
  }, [engine, phase]);

  return {
    phase,
    title,
    transcript,
    error,
    micOn,
    amplitude,
    start,
    toggleMic,
    sendText: useCallback((t: string) => engine.sendText(t), [engine]),
    endSession: useCallback(() => engine.endSession(), [engine]),
  };
}
