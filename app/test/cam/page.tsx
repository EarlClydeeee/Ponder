"use client";

import Image from "next/image";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { PortraitFrame } from "@/components/app/PortraitFrame";
import type { AwakenResult, PortraitPhase } from "@/src/engine/types";

type CameraState =
  | "ready"
  | "requesting"
  | "live"
  | "captured"
  | "analyzing"
  | "awakening"
  | "awake"
  | "error";

type SubjectBounds = AwakenResult["subjectBounds"];

interface OpenCvMat {
  delete(): void;
}

interface OpenCvMatVector extends OpenCvMat {
  size(): number;
  get(index: number): OpenCvMat;
}

interface OpenCvModule {
  onRuntimeInitialized?: () => void;
  Mat: new () => OpenCvMat;
  MatVector: new () => OpenCvMatVector;
  imread(source: HTMLCanvasElement): OpenCvMat;
  cvtColor(source: OpenCvMat, target: OpenCvMat, conversion: number): void;
  GaussianBlur(source: OpenCvMat, target: OpenCvMat, size: unknown, sigmaX: number, sigmaY: number): void;
  Canny(source: OpenCvMat, target: OpenCvMat, threshold1: number, threshold2: number): void;
  findContours(image: OpenCvMat, contours: OpenCvMatVector, hierarchy: OpenCvMat, mode: number, method: number): void;
  boundingRect(contour: OpenCvMat): { x: number; y: number; width: number; height: number };
  Size: new (width: number, height: number) => unknown;
  COLOR_RGBA2GRAY: number;
  RETR_EXTERNAL: number;
  CHAIN_APPROX_SIMPLE: number;
}

declare global {
  interface Window {
    cv?: OpenCvModule;
  }
}

function portraitPhase(cameraState: CameraState): PortraitPhase {
  if (cameraState === "analyzing") return "analyzing";
  if (cameraState === "awakening") return "connecting";
  if (cameraState === "awake") return "alive";
  if (cameraState === "error") return "error";
  return "idle";
}

export default function CameraTestPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>("ready");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [awakenResult, setAwakenResult] = useState<AwakenResult | null>(null);
  const [openCvReady, setOpenCvReady] = useState(false);
  const [objectBounds, setObjectBounds] = useState<SubjectBounds | null>(null);
  const awakenTimerRef = useRef<number | null>(null);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  useEffect(
    () => () => {
      stopCamera();
      if (awakenTimerRef.current) window.clearTimeout(awakenTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (openCvReady && captureCanvasRef.current) {
      setObjectBounds(findObjectBounds(captureCanvasRef.current));
    }
    // findObjectBounds intentionally reads the latest OpenCV runtime from window.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCvReady, photoUrl]);

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
    captureCanvasRef.current = canvas;
    setObjectBounds(findObjectBounds(canvas));
    stopCamera();
    setCameraState("captured");
  }

  function retakePhoto() {
    setPhotoUrl(null);
    setAwakenResult(null);
    setObjectBounds(null);
    captureCanvasRef.current = null;
    setErrorMessage(null);
    void startCamera();
  }

  async function awakenPortrait() {
    if (!photoUrl) return;

    setErrorMessage(null);
    setCameraState("analyzing");

    try {
      const response = await fetch("/api/analyze-portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoDataUrl: photoUrl }),
      });
      if (!response.ok) throw new Error("Portrait analysis failed");

      const result = (await response.json()) as AwakenResult;
      const subjectBounds = objectBounds ?? result.subjectBounds;
      setAwakenResult({
        ...result,
        subjectBounds,
        ...(result.faceMode === "suggested_face"
          ? {
              facePlacement: {
                x: subjectBounds.x + subjectBounds.width / 2,
                y: subjectBounds.y + subjectBounds.height * 0.44,
                scale: Math.min(1.2, Math.max(0.45, Math.min(subjectBounds.width, subjectBounds.height) * 1.5)),
                rotation: 0,
              },
            }
          : {}),
      });
      setCameraState("awakening");
      awakenTimerRef.current = window.setTimeout(() => {
        setCameraState("awake");
        awakenTimerRef.current = null;
      }, 400);
    } catch {
      setErrorMessage("We couldn’t awaken this portrait. Please try again.");
      setCameraState("error");
    }
  }

  const hasPhoto = Boolean(photoUrl);
  const showPortrait = hasPhoto && ["analyzing", "awakening", "awake", "error"].includes(cameraState);
  const portraitStatus =
    cameraState === "analyzing"
      ? "Reading your photo…"
      : cameraState === "awakening"
        ? "Awakening…"
        : cameraState === "awake"
          ? awakenResult?.isFallback
            ? "Awake — a playful introduction"
            : "Awake"
          : errorMessage ?? undefined;

  function findObjectBounds(canvas: HTMLCanvasElement): SubjectBounds | null {
    const cv = window.cv;
    if (!openCvReady || !cv) return null;

    const source = cv.imread(canvas);
    const gray = new cv.Mat();
    const edges = new cv.Mat();
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    try {
      cv.cvtColor(source, gray, cv.COLOR_RGBA2GRAY);
      cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0, 0);
      cv.Canny(gray, edges, 50, 150);
      cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      const imageArea = canvas.width * canvas.height;
      let best: { x: number; y: number; width: number; height: number; score: number } | null = null;
      for (let index = 0; index < contours.size(); index += 1) {
        const contour = contours.get(index);
        const rect = cv.boundingRect(contour);
        contour.delete();
        const area = rect.width * rect.height;
        const touchesImageEdge =
          rect.x <= 2 ||
          rect.y <= 2 ||
          rect.x + rect.width >= canvas.width - 2 ||
          rect.y + rect.height >= canvas.height - 2;
        if (touchesImageEdge) continue;
        const centerDistance = Math.hypot(
          rect.x + rect.width / 2 - canvas.width / 2,
          rect.y + rect.height / 2 - canvas.height / 2,
        );
        const score = area - centerDistance * Math.min(canvas.width, canvas.height) * 0.2;
        if (area > imageArea * 0.04 && (!best || score > best.score)) {
          best = { ...rect, score };
        }
      }

      return best
        ? {
            x: best.x / canvas.width,
            y: best.y / canvas.height,
            width: best.width / canvas.width,
            height: best.height / canvas.height,
          }
        : null;
    } catch {
      return null;
    } finally {
      source.delete();
      gray.delete();
      edges.delete();
      contours.delete();
      hierarchy.delete();
    }
  }

  return (
    <main className="min-h-dvh bg-[var(--color-bg)] px-5 py-5 text-[var(--color-text)]">
      <Script
        src="https://docs.opencv.org/4.x/opencv.js"
        strategy="afterInteractive"
        onLoad={() => {
          const cv = window.cv;
          if (!cv) return;
          if (cv.Mat) {
            setOpenCvReady(true);
          } else {
            cv.onRuntimeInitialized = () => setOpenCvReady(true);
          }
        }}
      />
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
          <p className="text-sm text-[var(--color-primary)]">
            {cameraState === "awake" ? "Step 2 of 2" : "Step 1 of 2"}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl leading-tight">
            Frame what you’d like to meet
          </h1>
          <p className="mx-auto mt-3 max-w-[300px] text-sm leading-6 text-[var(--color-muted)]">
            Center one artwork, object, or face in the frame.
          </p>
        </section>

        <section className={`relative mt-8 overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] ${showPortrait ? "p-3" : "aspect-[3/4]"}`}>
          {showPortrait ? (
            <PortraitFrame
              photoUrl={photoUrl}
              phase={portraitPhase(cameraState)}
              subjectLabel={awakenResult?.subjectLabel ?? "Your portrait"}
              amplitude={0}
              awakenResult={awakenResult}
              status={portraitStatus}
            />
          ) : photoUrl ? (
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

          {cameraState === "captured" && hasPhoto && (
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
          ) : cameraState === "captured" && hasPhoto ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => void awakenPortrait()}
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
            </div>
          ) : cameraState === "analyzing" || cameraState === "awakening" ? (
            <button
              type="button"
              disabled
              className="w-full rounded-[14px] bg-[var(--color-primary)] px-6 py-4 font-semibold text-[var(--color-inverse)] opacity-60"
            >
              {cameraState === "analyzing" ? "Reading your photo…" : "Awakening…"}
            </button>
          ) : cameraState === "awake" ? (
            <button
              type="button"
              onClick={retakePhoto}
              className="w-full rounded-[14px] border border-[var(--color-border)] px-6 py-3 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-primary)]"
            >
              Capture another portrait
            </button>
          ) : cameraState === "error" && hasPhoto ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => void awakenPortrait()}
                className="w-full rounded-[14px] bg-[var(--color-primary)] px-6 py-4 font-semibold text-[var(--color-inverse)] transition active:scale-[0.98]"
              >
                Try awakening again
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
