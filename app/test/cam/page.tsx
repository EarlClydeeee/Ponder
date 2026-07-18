"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type CameraState =
  | "ready"
  | "requesting"
  | "live"
  | "captured"
  | "analyzing"
  | "awakening"
  | "awake"
  | "error";

// Temporary route-local copy of the contract agreed in PLAN.md.
// Replace with the shared type import when Elton lands it.
type AwakenResult = {
  subjectLabel: string;
  subjectType: "artwork" | "portrait" | "object" | "animal" | "unknown";
  personaName: string;
  personaTone: string;
  greeting: string;
  animationStyle: "parallax" | "blink" | "ambient";
  isFallback: boolean;
};

type FlowError = {
  source: "camera" | "analysis";
  message: string;
};

function getCameraErrorMessage(error: unknown): string {
  if (!(error instanceof DOMException)) {
    return "We couldn't start the camera. Please try again.";
  }
  if (error.name === "NotAllowedError" || error.name === "SecurityError") {
    return "Camera access is off. Allow it in your browser settings, then try again.";
  }
  if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
    return "No camera was found on this device.";
  }
  if (error.name === "NotReadableError" || error.name === "TrackStartError") {
    return "The camera is in use by another app. Close it there, then try again.";
  }
  return "We couldn't start the camera. Please try again.";
}

function isAwakenResult(value: unknown): value is AwakenResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<AwakenResult>;
  return (
    typeof result.subjectLabel === "string" &&
    typeof result.personaName === "string" &&
    typeof result.personaTone === "string" &&
    typeof result.greeting === "string" &&
    typeof result.animationStyle === "string" &&
    typeof result.isFallback === "boolean"
  );
}

export default function CameraTestPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRequestRef = useRef(0);
  const analysisAbortRef = useRef<AbortController | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>("ready");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AwakenResult | null>(null);
  const [flowError, setFlowError] = useState<FlowError | null>(null);

  function stopCamera() {
    cameraRequestRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  useEffect(() => {
    const handlePageHide = () => stopCamera();
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      analysisAbortRef.current?.abort();
      stopCamera();
    };
  }, []);

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setFlowError({
        source: "camera",
        message: "This browser does not support live camera capture.",
      });
      setCameraState("error");
      return;
    }

    analysisAbortRef.current?.abort();
    stopCamera();
    const requestId = cameraRequestRef.current;
    setPhotoUrl(null);
    setResult(null);
    setFlowError(null);
    setCameraState("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      if (requestId !== cameraRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("camera preview unavailable");
      video.srcObject = stream;
      await video.play();
      setCameraState("live");
    } catch (error) {
      stopCamera();
      setFlowError({ source: "camera", message: getCameraErrorMessage(error) });
      setCameraState("error");
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setFlowError({
        source: "camera",
        message: "The camera is still focusing. Wait a moment and try again.",
      });
      return;
    }

    const maxDimension = 1024;
    const scale = Math.min(
      1,
      maxDimension / Math.max(video.videoWidth, video.videoHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext("2d");

    if (!context) {
      setFlowError({ source: "camera", message: "Photo capture is unavailable." });
      setCameraState("error");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhotoUrl(canvas.toDataURL("image/jpeg", 0.85));
    setFlowError(null);
    stopCamera();
    setCameraState("captured");
  }

  async function awakenPortrait() {
    if (!photoUrl) return;

    analysisAbortRef.current?.abort();
    const controller = new AbortController();
    analysisAbortRef.current = controller;
    setFlowError(null);
    setResult(null);
    setCameraState("analyzing");

    try {
      const response = await fetch("/api/analyze-portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoDataUrl: photoUrl }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`analysis failed with status ${response.status}`);
      }

      const payload: unknown = await response.json();
      if (!isAwakenResult(payload)) {
        throw new Error("analysis returned an invalid result");
      }

      setResult(payload);
      setCameraState("awakening");
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (!controller.signal.aborted) setCameraState("awake");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setFlowError({
        source: "analysis",
        message: "We couldn't read this photo. Try the analysis again or retake it.",
      });
      setCameraState("error");
    } finally {
      if (analysisAbortRef.current === controller) {
        analysisAbortRef.current = null;
      }
    }
  }

  function retakePhoto() {
    analysisAbortRef.current?.abort();
    setPhotoUrl(null);
    setResult(null);
    setFlowError(null);
    void startCamera();
  }

  const hasPhoto = photoUrl !== null;
  const isAnalyzing = cameraState === "analyzing";
  const isAwakening = cameraState === "awakening";
  const isAwake = cameraState === "awake" && result !== null;
  const analysisFailed = cameraState === "error" && flowError?.source === "analysis";

  return (
    <main className="min-h-dvh bg-[var(--color-bg)] px-5 py-5 text-[var(--color-text)]">
      <div className="mx-auto flex min-h-[calc(100dvh-40px)] w-full max-w-[390px] flex-col">
        <header className="flex items-center justify-between">
          <a
            href="/app"
            onClick={stopCamera}
            className="rounded-full px-2 py-1 text-sm text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
          >
            Back
          </a>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-primary)]">
            New portrait
          </span>
          <span className="w-12" aria-hidden="true" />
        </header>

        <section className="mt-7 text-center">
          <p className="text-sm text-[var(--color-primary)]">
            {isAwake ? "Portrait awakened" : hasPhoto ? "Step 2 of 2" : "Step 1 of 2"}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl leading-tight">
            {isAwake
              ? result.personaName
              : isAnalyzing
                ? "Reading your photo..."
                : isAwakening
                  ? "Something is stirring..."
                  : hasPhoto
                    ? "Ready to awaken?"
                    : "Frame what you'd like to meet"}
          </h1>
          <p className="mx-auto mt-3 max-w-[310px] text-sm leading-6 text-[var(--color-muted)]">
            {isAwake
              ? `${result.subjectLabel} - ${result.personaTone}`
              : hasPhoto
                ? "Your photo is analyzed only after you tap Awaken."
                : "Center one artwork, object, animal, or face in the frame."}
          </p>
        </section>

        <section className="relative mt-6 aspect-[3/4] overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]">
          {hasPhoto ? (
            <div className={`relative h-full w-full ${isAwake ? "animate-breathe" : ""}`}>
              <Image
                src={photoUrl}
                alt={isAwake ? result.subjectLabel : "Your captured portrait"}
                fill
                unoptimized
                className="object-cover"
              />
              {(isAnalyzing || isAwakening) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
                  <div className="text-center">
                    <span className="mx-auto block h-11 w-11 rounded-full border-2 border-white/30 border-t-[var(--color-primary)] motion-safe:animate-spin" />
                    <p className="mt-4 text-sm font-medium text-white">
                      {isAnalyzing ? "Reading your photo..." : "Awakening portrait..."}
                    </p>
                  </div>
                </div>
              )}
              {isAwake && (
                <>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[var(--color-primary)]/10 via-transparent to-white/10 motion-safe:animate-pulse" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/65 to-transparent px-5 pb-6 pt-20">
                    <p className="font-[family-name:var(--font-display)] text-xl text-white">
                      {result.greeting}
                    </p>
                    {result.isFallback && (
                      <p className="mt-2 text-xs text-white/65">
                        A playful interpretation of your photo
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                muted
                playsInline
                aria-label="Live camera preview"
                className={`h-full w-full object-cover ${cameraState === "live" ? "block" : "hidden"}`}
              />
              {cameraState !== "live" && (
                <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--color-primary)] text-3xl text-[var(--color-primary)]">
                    +
                  </div>
                  <p className="mt-5 font-medium">
                    {cameraState === "requesting" ? "Opening camera..." : "Ready when you are"}
                  </p>
                  <p className="mt-2 text-sm leading-5 text-[var(--color-muted)]" role="status">
                    {flowError?.message ?? "Camera access is requested only after you tap below."}
                  </p>
                </div>
              )}
            </>
          )}

          {cameraState === "live" && (
            <div className="pointer-events-none absolute inset-5 rounded-[20px] border border-white/70">
              <span className="absolute -left-px -top-px h-6 w-6 rounded-tl-[19px] border-l-2 border-t-2 border-[var(--color-primary)]" />
              <span className="absolute -bottom-px -right-px h-6 w-6 rounded-br-[19px] border-b-2 border-r-2 border-[var(--color-primary)]" />
            </div>
          )}
        </section>

        {flowError && (
          <p
            className="mt-3 rounded-[12px] border border-[var(--color-error)] px-3 py-2 text-center text-sm text-[var(--color-error)]"
            role="alert"
          >
            {flowError.message}
          </p>
        )}

        <div className="mt-auto pb-2 pt-5">
          {cameraState === "live" ? (
            <button
              type="button"
              onClick={capturePhoto}
              className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-[var(--color-primary)] p-1 transition active:scale-95"
              aria-label="Capture photo"
            >
              <span className="h-12 w-12 rounded-full bg-[var(--color-primary)]" />
            </button>
          ) : cameraState === "captured" ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => void awakenPortrait()}
                className="w-full rounded-[14px] bg-[var(--color-primary)] px-6 py-4 font-semibold text-[var(--color-inverse)] transition active:scale-[0.98]"
              >
                Awaken
              </button>
              <RetakeButton onClick={retakePhoto} />
            </div>
          ) : isAnalyzing || isAwakening ? (
            <button
              type="button"
              disabled
              className="w-full rounded-[14px] bg-[var(--color-primary)] px-6 py-4 font-semibold text-[var(--color-inverse)] opacity-60"
            >
              {isAnalyzing ? "Reading your photo..." : "Awakening..."}
            </button>
          ) : isAwake ? (
            <RetakeButton onClick={retakePhoto} />
          ) : analysisFailed ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => void awakenPortrait()}
                className="w-full rounded-[14px] bg-[var(--color-primary)] px-6 py-4 font-semibold text-[var(--color-inverse)]"
              >
                Try analysis again
              </button>
              <RetakeButton onClick={retakePhoto} />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void startCamera()}
              disabled={cameraState === "requesting"}
              className="w-full rounded-[14px] bg-[var(--color-primary)] px-6 py-4 font-semibold text-[var(--color-inverse)] transition active:scale-[0.98] disabled:opacity-60"
            >
              {cameraState === "requesting"
                ? "Opening camera..."
                : flowError
                  ? "Try camera again"
                  : "Open camera"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function RetakeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[14px] border border-[var(--color-border)] px-6 py-3 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-primary)]"
    >
      Retake photo
    </button>
  );
}
