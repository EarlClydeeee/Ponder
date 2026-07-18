/**
 * Living Portrait Frame — DSD §4 signature component.
 * Ornamental gold border; breathes when alive; glows with speech amplitude.
 * Owner: Ivy.
 */
import Image from "next/image";
import type { CSSProperties } from "react";
import type { AwakenResult, PortraitPhase } from "@/src/engine/types";

interface Props {
  photoUrl: string | null;
  phase: PortraitPhase;
  subjectLabel: string;
  amplitude: number;
  /** Optional pre-pass copy for the isolated capture-to-awaken flow. */
  awakenResult?: Pick<
    AwakenResult,
    | "personaName"
    | "greeting"
    | "animationStyle"
    | "subjectBounds"
    | "faceMode"
    | "facePlacement"
  > | null;
  /** Overrides the engine phase label while the camera harness is awakening. */
  status?: string;
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
  awakenResult,
  status,
}: Props) {
  const alive = phase !== "idle" && phase !== "analyzing";
  const awakening = phase === "connecting" || phase === "analyzing";
  const glow = phase === "speaking" ? 0.25 + amplitude * 0.6 : 0;
  const statusLabel = status ?? STATE_LABEL[phase];
  const animationStyle = awakenResult?.animationStyle ?? "parallax";
  const useAwakenPresentation = Boolean(awakenResult);
  const showLivingFace =
    awakenResult?.faceMode === "suggested_face" && awakenResult.facePlacement !== undefined;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative aspect-square w-full overflow-hidden rounded-[20px] border-4 border-[var(--color-primary)] ${
          alive ? "animate-breathe" : ""
        } ${awakening ? "animate-shimmer" : ""}`}
        style={{
          boxShadow: glow
            ? `0 0 ${16 + glow * 40}px var(--color-honey-border)`
            : "var(--shadow-md)",
        }}
        aria-label={
          subjectLabel
            ? `${subjectLabel}${statusLabel ? ` — ${statusLabel}` : ""}`
            : "Living portrait"
        }
      >
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={subjectLabel || "Portrait"}
            fill
            unoptimized
            className={`object-cover ${alive && useAwakenPresentation ? `portrait-image portrait-image--${animationStyle}` : ""}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[var(--color-surface)] text-[var(--color-muted)]">
            No portrait yet
          </div>
        )}
        {alive && useAwakenPresentation && (
          <div className="pointer-events-none portrait-light-overlay" aria-hidden="true" />
        )}
        {alive && showLivingFace && <LivingFace placement={awakenResult.facePlacement!} />}
      </div>
      {statusLabel && (
        <p aria-live="polite" className="text-[13px] font-medium text-[var(--color-accent)]">
          {statusLabel}
        </p>
      )}
      {awakenResult && (
        <div className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-center shadow-[var(--shadow-sm)]">
          <p className="text-[13px] font-semibold text-[var(--color-primary)]">
            {awakenResult.personaName}
          </p>
          <p className="mt-1 text-sm leading-5 text-[var(--color-text)]">
            {awakenResult.greeting}
          </p>
        </div>
      )}
    </div>
  );
}

function LivingFace({ placement }: { placement: NonNullable<AwakenResult["facePlacement"]> }) {
  return (
    <div
      className="pointer-events-none absolute"
      aria-hidden="true"
      style={{
        left: `${placement.x * 100}%`,
        top: `${placement.y * 100}%`,
        transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
        "--living-face-size": `${48 * placement.scale}px`,
      } as CSSProperties}
    >
      <div className="living-face">
        <div className="living-face__eyes"><span /><span /></div>
        <span className="living-face__smile" />
      </div>
    </div>
  );
}
