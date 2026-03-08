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
 * Fetch a remote image as a Blob.
 * Tries a direct fetch first; if that fails (e.g. CORS), falls back to
 * fetching through our own `/api/photo-proxy` route which fetches server-side.
 */
async function fetchImageBlob(url: string): Promise<Blob | null> {
  // Try direct fetch first
  try {
    const r = await fetch(url);
    if (r.ok) return r.blob();
  } catch { /* CORS or network error — try proxy */ }

  // Fallback: proxy through our API (server-side fetch, no CORS)
  try {
    const proxyUrl = `/api/photo-proxy?url=${encodeURIComponent(url)}`;
    const r = await fetch(proxyUrl);
    if (r.ok) return r.blob();
  } catch { /* proxy also failed */ }

  return null;
}

/**
 * If `photo` is a remote URL (not a data-URI), fetch it and convert
 * to a JPEG base64 data-URI so @react-pdf/renderer can embed it.
 * Returns undefined on failure so the PDF falls back to the initials circle.
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
    const blob = photo.startsWith("data:")
      ? await (await fetch(photo)).blob()
      : await fetchImageBlob(photo);
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
