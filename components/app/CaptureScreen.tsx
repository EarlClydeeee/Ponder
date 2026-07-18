/**
 * Capture flow — file upload / camera + the bundled Mona Lisa demo.
 * Hands off to the engine via AwakenConfig (RFC §3). Owner: Elton.
 */
"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { fileToDownscaledDataUrl } from "@/src/lib/image";
import type { AwakenConfig } from "@/src/engine/types";

// Ships as an SVG placeholder — drop a real mona-lisa.jpg here and update this
// path for a production-quality demo (the Realtime vision pass needs a real photo).
const DEMO_PHOTO = "/demo/mona-lisa.svg";

export function CaptureScreen({
  onAwaken,
}: {
  onAwaken: (config: AwakenConfig) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const photoDataUrl = await fileToDownscaledDataUrl(file);
      onAwaken({ photoDataUrl, demoAsset: null });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-between p-6 text-center">
      <header className="pt-8">
        <h1 className="font-[family-name:var(--font-display)] text-[28px] leading-tight text-[var(--color-text)]">
          Point. Capture. Learn.
        </h1>
        <p className="mt-2 text-[13px] text-[var(--color-muted)]">
          Photograph anything and interview it.
        </p>
      </header>

      {/* Demo anchor — peak-end onboarding (onboarding doc §2) */}
      <button
        type="button"
        onClick={() =>
          onAwaken({ photoDataUrl: DEMO_PHOTO, demoAsset: "mona_lisa" })
        }
        className="group relative aspect-square w-48 overflow-hidden rounded-[20px] border-4 border-[var(--color-primary)] shadow-[var(--shadow-md)] transition active:scale-95"
      >
        <Image
          src={DEMO_PHOTO}
          alt="Meet the Mona Lisa"
          fill
          unoptimized
          className="object-cover"
        />
        <span className="absolute inset-x-0 bottom-0 bg-[rgba(0,0,0,0.6)] py-2 text-[13px] font-medium text-[var(--color-text)]">
          Meet the Mona Lisa →
        </span>
      </button>

      <div className="w-full space-y-3 pb-4">
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-[14px] bg-[var(--color-primary)] px-6 py-4 font-medium text-[var(--color-inverse)] transition active:bg-[var(--color-primary-hover)] disabled:opacity-40"
        >
          {busy ? "Preparing…" : "Capture your own"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="hidden"
        />
        <p className="text-[13px] text-[var(--color-muted)]">
          Free · 3 sessions/day · no install
        </p>
      </div>
    </div>
  );
}
