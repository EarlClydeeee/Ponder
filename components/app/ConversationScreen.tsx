/**
 * Conversation screen — portrait 55% / slides 30% / talk control 15% (DSD §3).
 * Renders from useLivingPortrait state only (workflow principle 2).
 * Owner: Ivy.
 */
"use client";

import { useEffect, useRef } from "react";
import { PortraitFrame } from "./PortraitFrame";
import { SlideCarousel } from "./SlideCarousel";
import { TalkButton } from "./TalkButton";
import type { LivingPortraitState } from "@/src/hooks/useLivingPortrait";

const QUESTION_CHIPS = [
  "Who are you?",
  "Tell me your history",
  "What should I notice?",
];

export function ConversationScreen({
  portrait,
  photoUrl,
  onExit,
}: {
  portrait: LivingPortraitState;
  photoUrl: string | null;
  onExit: () => void;
}) {
  const {
    phase,
    subjectLabel,
    transcript,
    activeDeck,
    amplitude,
    talkEnabled,
    error,
    awakenResult,
    startListening,
    stopListening,
    sendText,
  } = portrait;

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Depend on the array itself: streamed updates change content, not length.
    scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" });
  }, [transcript]);

  const inFallback = phase === "fallback_text";

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="font-[family-name:var(--font-display)] text-[18px] text-[var(--color-text)]">
          {subjectLabel || "Ponder"}
        </span>
        <button
          type="button"
          onClick={onExit}
          className="text-[13px] text-[var(--color-muted)]"
        >
          End
        </button>
      </div>

      {/* Portrait — capped so the conversation below always has room */}
      <div className="mx-auto w-full max-w-[34dvh] px-4">
        <PortraitFrame
          photoUrl={photoUrl}
          phase={phase}
          subjectLabel={subjectLabel}
          amplitude={amplitude}
          awakenResult={awakenResult}
          showIntroCard={false}
        />
      </div>

      {/* Conversation + slides */}
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 px-4 pb-2 pt-3">
        <div className="flex shrink-0 items-center justify-between px-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Conversation
          </p>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--color-muted)]">
            {inFallback ? (
              <>Text mode</>
            ) : (
              <>
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[var(--color-green-400)]"
                  aria-hidden="true"
                />
                Live
              </>
            )}
          </p>
        </div>
        <div
          ref={scrollRef}
          className="chat-scroll min-h-24 flex-1 space-y-1.5 overflow-y-auto rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 text-[13px] shadow-[var(--shadow-card)]"
        >
          {transcript.length === 0 && (
            <p className="py-4 text-center text-[var(--color-muted)]">
              Say hello — everything you both say shows up here.
            </p>
          )}
          {transcript.map((turn, i) => {
            const isUser = turn.role === "user";
            const groupStart = i === 0 || transcript[i - 1].role !== turn.role;
            return (
              <div
                key={turn.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"} ${
                  groupStart && i > 0 ? "pt-2.5" : ""
                }`}
              >
                {groupStart && (
                  <span className="mb-1 px-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                    {isUser ? "You" : subjectLabel || "Portrait"}
                  </span>
                )}
                <p
                  className={`max-w-[82%] whitespace-pre-wrap rounded-[16px] px-3.5 py-2 leading-5 ${
                    isUser
                      ? "rounded-br-[6px] bg-[var(--color-primary)] text-[var(--color-inverse)]"
                      : "rounded-bl-[6px] border border-[var(--color-honey-border)] bg-[var(--color-honey-100)] text-[var(--color-text)]"
                  } ${turn.text === "…" ? "animate-pulse" : ""}`}
                >
                  {turn.text}
                </p>
              </div>
            );
          })}
        </div>
        <div className="h-24 shrink-0">
          <SlideCarousel deck={activeDeck} />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mb-2 rounded-[12px] border border-[var(--color-error)] px-3 py-2 text-[13px] text-[var(--color-error)]">
          {error.message}
        </div>
      )}

      {/* Talk control ~15% */}
      <div className="flex flex-col items-center gap-3 px-4 pb-6 pt-2">
        {inFallback ? (
          <TextFallback onSend={sendText} />
        ) : (
          <>
            <div className="flex flex-wrap justify-center gap-2">
              {QUESTION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  disabled={!talkEnabled}
                  onClick={() => sendText(chip)}
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-[13px] text-[var(--color-text)] transition active:border-[var(--color-primary)] disabled:opacity-40"
                >
                  {chip}
                </button>
              ))}
            </div>
            <TalkButton
              phase={phase}
              enabled={talkEnabled}
              onStart={startListening}
              onStop={stopListening}
            />
            <p className="text-[13px] text-[var(--color-muted)]">
              Hold to talk · headphones recommended
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function TextFallback({ onSend }: { onSend: (text: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <form
      className="flex w-full gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const value = inputRef.current?.value.trim();
        if (value) {
          onSend(value);
          if (inputRef.current) inputRef.current.value = "";
        }
      }}
    >
      <input
        ref={inputRef}
        placeholder="Type your question…"
        className="flex-1 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
      />
      <button
        type="submit"
        className="rounded-[12px] bg-[var(--color-primary)] px-4 font-medium text-[var(--color-inverse)]"
      >
        Ask
      </button>
    </form>
  );
}
