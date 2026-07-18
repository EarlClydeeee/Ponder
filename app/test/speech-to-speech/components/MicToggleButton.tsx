"use client";

interface Props {
  micOn: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

export function MicToggleButton({ micOn, disabled, onToggle }: Props) {
  const label = micOn ? "Mic on · tap to send" : "Mic off · tap to speak";

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        aria-label={label}
        aria-pressed={micOn}
        className={`
          flex h-[72px] w-[72px] select-none items-center justify-center rounded-full
          border-4 text-[var(--color-inverse)] transition disabled:opacity-40
          ${
            micOn
              ? "animate-talk-pulse border-[var(--color-primary)] bg-[var(--color-primary-hover)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
          }
        `}
      >
        <MicIcon active={micOn} />
      </button>
      <p className="text-center text-xs text-[var(--color-muted)]">{label}</p>
    </div>
  );
}

function MicIcon({ active }: { active: boolean }) {
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
      {!active && (
        <path
          d="M4 4l16 16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
