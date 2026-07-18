"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type CameraState = "ready" | "requesting" | "live" | "captured" | "error";

export default function CameraTestPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>("ready");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  useEffect(() => stopCamera, []);

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
      const denied = error instanceof DOMException && error.name === "NotAllowedError";
      setErrorMessage(
        denied
          ? "Camera access is off. Allow it in your browser settings, then try again."
          : "We couldn’t start the camera. Please try again.",
      );
      setCameraState("error");
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);

    setPhotoUrl(canvas.toDataURL("image/jpeg", 0.9));
    stopCamera();
    setCameraState("captured");
  }

  function retakePhoto() {
    setPhotoUrl(null);
    void startCamera();
  }

  const hasPhoto = cameraState === "captured" && photoUrl;

  return (
    <main className="min-h-dvh bg-[var(--color-bg)] px-5 py-5 text-[var(--color-text)]">
      <div className="mx-auto flex min-h-[calc(100dvh-40px)] w-full max-w-[390px] flex-col">
        <header className="flex items-center justify-between">
          <a
            href="/app"
            className="rounded-full px-2 py-1 text-sm text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
          >
            ← Back
          </a>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-primary)]">
            New portrait
          </span>
          <span className="w-12" aria-hidden="true" />
        </header>

        <section className="mt-9 text-center">
          <p className="text-sm text-[var(--color-primary)]">Step 1 of 2</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl leading-tight">
            Frame what you’d like to meet
          </h1>
          <p className="mx-auto mt-3 max-w-[300px] text-sm leading-6 text-[var(--color-muted)]">
            Center one artwork, object, or face in the frame.
          </p>
        </section>

        <section className="relative mt-8 aspect-[3/4] overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]">
          {hasPhoto ? (
            <Image src={photoUrl} alt="Your captured portrait" fill unoptimized className="object-cover" />
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
                  <p className="mt-5 font-medium">
                    {cameraState === "requesting" ? "Opening camera…" : "Ready when you are"}
                  </p>
                  <p className="mt-2 text-sm leading-5 text-[var(--color-muted)]">
                    {errorMessage ?? "We’ll ask for camera access only when you tap below."}
                  </p>
                </div>
              )}
            </>
          )}

          {cameraState === "live" && (
            <div className="pointer-events-none absolute inset-5 rounded-[20px] border border-[rgba(245,240,232,0.75)]">
              <span className="absolute -left-px -top-px h-6 w-6 rounded-tl-[19px] border-l-2 border-t-2 border-[var(--color-primary)]" />
              <span className="absolute -right-px -bottom-px h-6 w-6 rounded-br-[19px] border-b-2 border-r-2 border-[var(--color-primary)]" />
            </div>
          )}

          {hasPhoto && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-5 pb-5 pt-14">
              <p className="text-sm font-medium">Looking good.</p>
              <p className="mt-1 text-xs text-white/70">Retake it if the subject isn’t centered.</p>
            </div>
          )}
        </section>

        <div className="mt-auto pt-7 pb-2">
          {cameraState === "live" ? (
            <button
              type="button"
              onClick={capturePhoto}
              className="mx-auto flex h-18 w-18 items-center justify-center rounded-full border-4 border-[var(--color-primary)] bg-transparent p-1 transition active:scale-95"
              aria-label="Capture photo"
            >
              <span className="h-12 w-12 rounded-full bg-[var(--color-primary)]" />
            </button>
          ) : hasPhoto ? (
            <div className="space-y-3">
              <button
                type="button"
                disabled
                className="w-full rounded-[14px] bg-[var(--color-primary)] px-6 py-4 font-semibold text-[var(--color-inverse)] opacity-60"
              >
                Awaken <span className="font-normal">· coming next</span>
              </button>
              <button
                type="button"
                onClick={retakePhoto}
                className="w-full rounded-[14px] border border-[var(--color-border)] px-6 py-3 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-primary)]"
              >
                Retake photo
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void startCamera()}
              disabled={cameraState === "requesting"}
              className="w-full rounded-[14px] bg-[var(--color-primary)] px-6 py-4 font-semibold text-[var(--color-inverse)] transition active:scale-[0.98] disabled:opacity-60"
            >
              {cameraState === "requesting" ? "Opening camera…" : errorMessage ? "Try camera again" : "Open camera"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
