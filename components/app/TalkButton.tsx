/**
 * Push-to-talk control — 72px circle (DSD §4). Hold to speak, release to send.
 * Owner: Ivy.
 */
"use client";

import { useRef } from "react";
import type { PortraitPhase } from "@/src/engine/types";

interface Props {
  phase: PortraitPhase;
  enabled: boolean;
  onStart: () => void;
  onStop: () => void;
  showLabel?: boolean;
}

export function TalkButton({
  phase,
  enabled,
  onStart,
  onStop,
  showLabel = false,
}: Props) {
  const listening = phase === "listening";
  const speaking = phase === "speaking";
  const holdingRef = useRef(false);

  const label = speaking
    ? "Hold to interrupt"
    : listening
      ? "Release to send"
      : "Hold to talk";

  function handleDown(e: React.PointerEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (!enabled) return;
    holdingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    onStart();
  }

  function handleUp(e: React.PointerEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (!holdingRef.current) return;
    holdingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    // Engine no-ops unless actually listening, so releasing is always safe.
    onStop();
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={!enabled}
        onPointerDown={handleDown}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        onLostPointerCapture={() => {
          if (holdingRef.current) {
            holdingRef.current = false;
            onStop();
          }
        }}
        aria-label={label}
        className={`
          flex h-[72px] w-[72px] touch-none select-none items-center justify-center rounded-full
          border-4 border-[var(--color-primary)] text-[var(--color-inverse)]
          transition disabled:opacity-40
          ${listening ? "animate-talk-pulse bg-[var(--color-primary-hover)]" : "bg-[var(--color-primary)]"}
        `}
      >
        <MicIcon />
      </button>
      {showLabel && (
        <p className="text-center text-xs text-[var(--color-muted)]">{label}</p>
      )}
    </div>
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
