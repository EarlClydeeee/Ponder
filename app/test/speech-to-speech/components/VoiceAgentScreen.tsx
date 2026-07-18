"use client";

import { useEffect, useRef, useState } from "react";
import { MicToggleButton } from "./MicToggleButton";
import type { VoiceAgentConfig } from "../lib/types";
import type { VoiceAgentState } from "../lib/useVoiceAgent";

const PRESETS: Array<{
  id: string;
  label: string;
  config: VoiceAgentConfig;
}> = [
  {
    id: "tutor",
    label: "Study buddy",
    config: {
      title: "Study buddy",
      voice: "sage",
      systemPrompt:
        "You are a friendly tutor. Explain concepts clearly in short spoken answers. Ask one follow-up question when helpful.",
    },
  },
  {
    id: "explainer",
    label: "Simple explainer",
    config: {
      title: "Simple explainer",
      voice: "coral",
      systemPrompt:
        "Explain any topic simply, as if speaking to a curious friend. Keep answers under four sentences unless asked for more.",
    },
  },
  {
    id: "guide",
    label: "Museum guide",
    config: {
      title: "Museum guide",
      voice: "ballad",
      systemPrompt:
        "You are an engaging museum guide. Answer questions with vivid, spoken storytelling. Stay in character.",
    },
  },
];

interface Props {
  agent: VoiceAgentState;
}

export function VoiceAgentScreen({ agent }: Props) {
  const {
    phase,
    title,
    transcript,
    error,
    micOn,
    amplitude,
    start,
    toggleMic,
    sendText,
    endSession,
  } = agent;

  const [selectedPreset, setSelectedPreset] = useState(PRESETS[1].id);
  const [textInput, setTextInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" });
  }, [transcript.length]);

  const inFallback = phase === "fallback_text";
  const isConnecting = phase === "connecting";
  const isIdle = phase === "idle" || phase === "error";
  const isSpeaking = phase === "speaking";
  const preset = PRESETS.find((p) => p.id === selectedPreset) ?? PRESETS[1];

  function statusLine(): string {
    if (isConnecting) return "Connecting…";
    if (inFallback) return "Voice unavailable — type to continue";
    if (isSpeaking) return "Listen…";
    if (micOn) return "Mic on — speak, then tap to send";
    return "Mic off — tap to speak";
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between px-4 py-3">
        <a
          href="/app"
          className="text-[13px] text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
        >
          ← Back
        </a>
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-primary)]">
          Speech-to-speech test
        </span>
        <button
          type="button"
          onClick={endSession}
          className="text-[13px] text-[var(--color-muted)]"
          disabled={phase === "idle"}
        >
          End
        </button>
      </header>

      {isIdle ? (
        <section className="flex flex-1 flex-col px-5 pb-6">
          <div className="mt-6 text-center">
            <h1 className="font-[family-name:var(--font-display)] text-2xl leading-tight">
              Speech-to-speech
            </h1>
            <p className="mx-auto mt-3 max-w-[300px] text-sm leading-6 text-[var(--color-muted)]">
              Turn the mic on to speak. Turn it off to send and hear a spoken
              reply. Headphones recommended.
            </p>
          </div>

          <div className="mt-8 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
              Choose a preset
            </p>
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPreset(p.id)}
                className={`w-full rounded-[14px] border px-4 py-3 text-left text-sm transition ${
                  selectedPreset === p.id
                    ? "border-[var(--color-primary)] bg-[var(--color-surface)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {error && (
            <p className="mt-4 text-center text-sm text-[var(--color-error,#c44)]">
              {error.message}
            </p>
          )}

          <div className="mt-auto pt-8">
            <button
              type="button"
              onClick={() => void start(preset.config)}
              className="w-full rounded-[14px] bg-[var(--color-primary)] px-6 py-4 font-semibold text-[var(--color-inverse)] transition active:scale-[0.98]"
            >
              Start conversation
            </button>
          </div>
        </section>
      ) : (
        <>
          <div className="px-4 pb-2">
            <p className="font-[family-name:var(--font-display)] text-[18px] text-[var(--color-text)]">
              {title || "Voice agent"}
            </p>
            <p className="text-xs text-[var(--color-muted)]">{statusLine()}</p>
            {(amplitude > 0.05 || isSpeaking) && !inFallback && (
              <div
                className="mt-2 h-1 rounded-full bg-[var(--color-primary)] transition-all"
                style={{
                  width: `${Math.max(8, Math.round(amplitude * 100))}%`,
                  opacity: isSpeaking ? 0.8 : 0.4,
                }}
                aria-hidden
              />
            )}
          </div>

          <div
            ref={scrollRef}
            className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-2 text-[13px]"
          >
            {transcript.map((turn) => (
              <p
                key={turn.id}
                className={
                  turn.role === "user"
                    ? "text-[var(--color-muted)]"
                    : "text-[var(--color-text)]"
                }
              >
                <span className="font-medium">
                  {turn.role === "user" ? "You" : title}:
                </span>{" "}
                {turn.text}
              </p>
            ))}
            {isConnecting && (
              <p className="text-[var(--color-muted)]">Connecting to Realtime…</p>
            )}
          </div>

          {error && (
            <p className="px-4 pb-2 text-center text-xs text-[var(--color-error,#c44)]">
              {error.message}
            </p>
          )}

          <div className="flex flex-col items-center gap-3 px-4 pb-6 pt-2">
            {inFallback ? (
              <form
                className="flex w-full gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendText(textInput).then(() => setTextInput(""));
                }}
              >
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type your message…"
                  className="min-w-0 flex-1 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim()}
                  className="rounded-[14px] bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-inverse)] disabled:opacity-40"
                >
                  Send
                </button>
              </form>
            ) : isConnecting ? (
              <p className="text-sm text-[var(--color-muted)]">Setting up voice…</p>
            ) : (
              <MicToggleButton
                micOn={micOn}
                disabled={isSpeaking}
                onToggle={toggleMic}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
