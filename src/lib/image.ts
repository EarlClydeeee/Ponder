/**
 * Downscale a captured/uploaded image to ≤1024px JPEG data URL before upload
 * (RFC §6 performance). Runs on the client via canvas.
 * Owner: Elton (capture flow).
 */
const MAX_DIM = 1024;

export async function fileToDownscaledDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

/** Capture the current <video> frame as a ≤1024px JPEG data URL (rule 11). */
export function videoFrameToDownscaledDataUrl(
  video: HTMLVideoElement,
  quality = 0.9,
): string {
  const scale = Math.min(1, MAX_DIM / Math.max(video.videoWidth, video.videoHeight));
  const w = Math.round(video.videoWidth * scale);
  const h = Math.round(video.videoHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.drawImage(video, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}
