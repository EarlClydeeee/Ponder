/**
 * Capture flow — live camera (ported from /test/cam) + gallery upload.
 * Hands off to the engine via AwakenConfig (RFC §3). Owner: Elton.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  fileToDownscaledDataUrl,
  videoFrameToDownscaledDataUrl,
} from "@/src/lib/image";
import type { AwakenConfig } from "@/src/engine/types";

type CameraState = "ready" | "requesting" | "live" | "captured" | "error";

export function CaptureScreen({
  onAwaken,
}: {
  onAwaken: (config: AwakenConfig) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cameraState, setCameraState] = useState<CameraState>("ready");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  useEffect(() => () => stopCamera(), []);

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("This browser does not support camera capture.");
      setCameraState("error");
      return;
    }

    setErrorMessage(null);
    setCameraState("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("live");
    } catch (error) {
      const denied =
        error instanceof DOMException && error.name === "NotAllowedError";
      setErrorMessage(
        denied
          ? "Camera access is off. Allow it in your browser settings, or upload a photo instead."
          : "We couldn't start the camera. Try again or upload a photo.",
      );
      setCameraState("error");
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    setPhotoDataUrl(videoFrameToDownscaledDataUrl(video));
    stopCamera();
    setCameraState("captured");
  }

  function retakePhoto() {
    setPhotoDataUrl(null);
    setErrorMessage(null);
    void startCamera();
  }

  function awaken() {
    if (!photoDataUrl) return;
    stopCamera();
    onAwaken({ photoDataUrl });
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await fileToDownscaledDataUrl(file);
      stopCamera();
      onAwaken({ photoDataUrl: dataUrl });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col p-6 text-center">
      <header className="pt-4">
        <h1 className="font-[family-name:var(--font-display)] text-[28px] leading-tight text-[var(--color-text)]">
          Point. Capture. Learn.
        </h1>
        <p className="mt-2 text-[13px] text-[var(--color-muted)]">
          Photograph any object and interview it.
        </p>
      </header>

      {/* Viewfinder */}
      <section className="relative mt-6 flex-1 overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]">
        {photoDataUrl ? (
          <Image
            src={photoDataUrl}
            alt="Your captured photo"
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              muted
              playsInline
              className={`h-full w-full object-cover ${cameraState === "live" ? "block" : "hidden"}`}
            />
            {cameraState !== "live" && (
              <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--color-primary)] text-3xl text-[var(--color-primary)]">
                  ◉
                </div>
                <p className="mt-5 font-medium text-[var(--color-text)]">
                  {cameraState === "requesting"
                    ? "Opening camera…"
                    : "Ready when you are"}
                </p>
                <p className="mt-2 text-sm leading-5 text-[var(--color-muted)]">
                  {errorMessage ??
                    "Center one artwork, object, or face in the frame."}
                </p>
              </div>
            )}
          </>
        )}

        {cameraState === "live" && (
          <div className="pointer-events-none absolute inset-5 rounded-[20px] border border-[rgba(245,240,232,0.75)]">
            <span className="absolute -left-px -top-px h-6 w-6 rounded-tl-[19px] border-l-2 border-t-2 border-[var(--color-primary)]" />
            <span className="absolute -bottom-px -right-px h-6 w-6 rounded-br-[19px] border-b-2 border-r-2 border-[var(--color-primary)]" />
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="space-y-3 pb-4 pt-6">
        {cameraState === "live" ? (
          <button
            type="button"
            onClick={capturePhoto}
            className="mx-auto flex h-18 w-18 items-center justify-center rounded-full border-4 border-[var(--color-primary)] bg-transparent p-1 transition active:scale-95"
            aria-label="Capture photo"
          >
            <span className="h-12 w-12 rounded-full bg-[var(--color-primary)]" />
          </button>
        ) : cameraState === "captured" && photoDataUrl ? (
          <>
            <button
              type="button"
              onClick={awaken}
              className="w-full rounded-[14px] bg-[var(--color-primary)] px-6 py-4 font-semibold text-[var(--color-inverse)] transition active:scale-[0.98]"
            >
              Awaken
            </button>
            <button
              type="button"
              onClick={retakePhoto}
              className="w-full rounded-[14px] border border-[var(--color-border)] px-6 py-3 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-primary)]"
            >
              Retake photo
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => void startCamera()}
              disabled={cameraState === "requesting"}
              className="w-full rounded-[14px] bg-[var(--color-primary)] px-6 py-4 font-medium text-[var(--color-inverse)] transition active:bg-[var(--color-primary-hover)] disabled:opacity-60"
            >
              {cameraState === "requesting"
                ? "Opening camera…"
                : errorMessage
                  ? "Try camera again"
                  : "Open camera"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-[14px] border border-[var(--color-border)] px-6 py-3 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-primary)] disabled:opacity-40"
            >
              {busy ? "Preparing…" : "Upload a photo"}
            </button>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          className="hidden"
        />
        <p className="text-[13px] text-[var(--color-muted)]">
          Free · no install
        </p>
      </div>
    </div>
  );
}
