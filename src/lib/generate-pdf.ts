/**
 * Client-side PDF generation using @react-pdf/renderer.
 *
 * Uses dynamic import so the heavy react-pdf bundle is only loaded
 * when the user actually clicks "Download PDF".
 */

import type { CVData } from "@/lib/types";
import type { ColorScheme } from "@/lib/color-schemes";
import type { PDFLabels } from "@/lib/pdf-document";
import { getPhotoFilter } from "@/lib/photo-filters";

export type { PDFLabels };

/**
 * Re-encode an image blob as JPEG via an offscreen canvas.
 * Needed because @react-pdf/renderer only supports JPEG and PNG —
 * WebP (and other formats) must be converted first.
 */
function reencodeAsJpeg(blob: Blob, canvasFilter?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      if (canvasFilter && canvasFilter !== "none") {
        ctx.filter = canvasFilter;
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to decode image"));
    };
    img.src = URL.createObjectURL(blob);
  });
}

/**
 * If `photo` is a remote URL (not a data-URI), fetch it and convert
 * to a JPEG base64 data-URI so @react-pdf/renderer can embed it.
 * Returns undefined on failure so the PDF falls back to the initials circle.
 *
 * For remote URLs, preloads the image via an `Image()` element first to warm
 * the browser cache — this prevents first-time failures from cold CDN edges.
 */
async function resolvePhoto(photo: string | undefined, canvasFilter?: string): Promise<string | undefined> {
  if (!photo) return undefined;
  // If it's already a compatible format AND no filter to apply, return as-is
  if (!canvasFilter || canvasFilter === "none") {
    if (photo.startsWith("data:image/jpeg") || photo.startsWith("data:image/png")) {
      return photo;
    }
  }

  try {
    // For remote URLs, preload the image first to warm the browser cache.
    // This prevents race conditions where the fetch below fails on a cold CDN edge
    // but succeeds on retry because the image is now cached.
    if (!photo.startsWith("data:")) {
      await new Promise<void>((resolve) => {
        const img = new globalThis.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve();
        img.onerror = () => resolve(); // continue anyway — fetch below will handle errors
        img.src = photo;
      });
    }

    const blob = photo.startsWith("data:")
      ? await (await fetch(photo)).blob()
      : await (async () => { const r = await fetch(photo); if (!r.ok) return null; return r.blob(); })();
    if (!blob) return undefined;
    return await reencodeAsJpeg(blob, canvasFilter);
  } catch {
    return undefined;
  }
}

export async function downloadPDF(
  data: CVData,
  filename: string,
  colors: ColorScheme,
  labels: PDFLabels,
  locale?: string,
  fontFamily?: string,
  fontScale?: number,
  isPremium?: boolean,
): Promise<void> {
  // Resolve remote photo URLs to base64 before passing to react-pdf
  // Also bake in the photo filter via canvas since react-pdf doesn't support CSS filters
  const filterDef = getPhotoFilter(data.personalInfo.photoFilter);
  const resolvedPhoto = await resolvePhoto(data.personalInfo.photoUrl, filterDef.canvasFilter);
  const pdfData: CVData = resolvedPhoto !== data.personalInfo.photoUrl
    ? { ...data, personalInfo: { ...data.personalInfo, photoUrl: resolvedPhoto } }
    : data;

  const { generatePDFBlob } = await import("./pdf-document");
  const blob = await generatePDFBlob({ data: pdfData, colors, labels, locale, fontFamily, fontScale, isPremium });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
