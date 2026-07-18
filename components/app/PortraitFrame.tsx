/**
 * Living Portrait Frame — DSD §4 signature component.
 * Ornamental gold border; breathes when alive; glows with speech amplitude.
 * Owner: Ivy.
 */
import Image from "next/image";
import type { PortraitPhase } from "@/src/engine/types";

interface Props {
  photoUrl: string | null;
  phase: PortraitPhase;
  subjectLabel: string;
  amplitude: number;
}

const STATE_LABEL: Partial<Record<PortraitPhase, string>> = {
  analyzing: "Reading the photo…",
  connecting: "Awakening…",
  listening: "Listening…",
  speaking: "Speaking…",
  generating_slides: "Painting the story…",
};

export function PortraitFrame({
  photoUrl,
  phase,
  subjectLabel,
  amplitude,
}: Props) {
  const alive = phase !== "idle" && phase !== "analyzing";
  const awakening = phase === "connecting" || phase === "analyzing";
  const glow = phase === "speaking" ? 0.25 + amplitude * 0.6 : 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative aspect-square w-full overflow-hidden rounded-[20px] border-4 border-[var(--color-primary)] ${
          alive ? "animate-breathe" : ""
        } ${awakening ? "animate-shimmer" : ""}`}
        style={{
          boxShadow: glow
            ? `0 0 ${16 + glow * 40}px rgba(201,162,39,${glow})`
            : "var(--shadow-md)",
        }}
        role="img"
        aria-label={
          subjectLabel
            ? `${subjectLabel}${STATE_LABEL[phase] ? ` — ${STATE_LABEL[phase]}` : ""}`
            : "Living portrait"
        }
      >
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={subjectLabel || "Portrait"}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[var(--color-surface)] text-[var(--color-muted)]">
            No portrait yet
          </div>
        )}
      </div>
      {STATE_LABEL[phase] && (
        <p className="text-[13px] font-medium text-[var(--color-accent)]">
          {STATE_LABEL[phase]}
        </p>
      )}
    </div>
  );
}
