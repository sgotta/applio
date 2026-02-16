/**
 * Client-side PDF generation using @react-pdf/renderer.
 *
 * Uses dynamic import so the heavy react-pdf bundle is only loaded
 * when the user actually clicks "Download PDF".
 */

import type { CVData } from "@/lib/types";
import type { ColorScheme } from "@/lib/color-schemes";
import type { PDFLabels } from "@/lib/pdf-document";
import type { PatternSettings } from "@/lib/sidebar-patterns";

export type { PDFLabels };

/**
 * Re-encode an image blob as JPEG via an offscreen canvas.
 * Needed because @react-pdf/renderer only supports JPEG and PNG —
 * WebP (and other formats) must be converted first.
 */
function reencodeAsJpeg(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
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
 */
async function resolvePhoto(photo: string | undefined): Promise<string | undefined> {
  if (!photo) return undefined;
  if (photo.startsWith("data:image/jpeg") || photo.startsWith("data:image/png")) {
    return photo; // already a react-pdf compatible format
  }
  try {
    // For data URIs in unsupported formats (webp) or remote URLs,
    // fetch/decode and re-encode as JPEG via canvas.
    const blob = photo.startsWith("data:")
      ? await (await fetch(photo)).blob()
      : await (async () => { const r = await fetch(photo); if (!r.ok) return null; return r.blob(); })();
    if (!blob) return undefined;
    return await reencodeAsJpeg(blob);
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
  patternSettings?: PatternSettings,
  fontFamily?: string,
  fontScale?: number,
): Promise<void> {
  // Resolve remote photo URLs to base64 before passing to react-pdf
  const resolvedPhoto = await resolvePhoto(data.personalInfo.photo);
  const pdfData: CVData = resolvedPhoto !== data.personalInfo.photo
    ? { ...data, personalInfo: { ...data.personalInfo, photo: resolvedPhoto } }
    : data;

  const { generatePDFBlob } = await import("./pdf-document");
  const blob = await generatePDFBlob({ data: pdfData, colors, labels, locale, patternSettings, fontFamily, fontScale });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
