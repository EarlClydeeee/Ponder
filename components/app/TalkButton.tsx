/**
 * Push-to-talk control — 72px circle (DSD §4). Hold to speak.
 * Owner: Ivy.
 */
"use client";

import type { PortraitPhase } from "@/src/engine/types";

interface Props {
  phase: PortraitPhase;
  enabled: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function TalkButton({ phase, enabled, onStart, onStop }: Props) {
  const listening = phase === "listening";

  return (
    <button
      type="button"
      disabled={!enabled}
      onPointerDown={(e) => {
        e.preventDefault();
        if (enabled) onStart();
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        if (listening) onStop();
      }}
      onPointerLeave={() => {
        if (listening) onStop();
      }}
      aria-label={listening ? "Release to send" : "Hold to talk"}
      className={`
        flex h-[72px] w-[72px] select-none items-center justify-center rounded-full
        border-4 border-[var(--color-primary)] text-[var(--color-inverse)]
        transition disabled:opacity-40
        ${listening ? "animate-talk-pulse bg-[var(--color-primary-hover)]" : "bg-[var(--color-primary)]"}
      `}
    >
      <MicIcon />
    </button>
  );
}

function MicIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z"
        fill="currentColor"
      />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
