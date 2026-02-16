import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format today's date for use in filenames, adapted to the given locale. */
export function filenameDateStamp(locale: string): string {
  const formatted = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
  // Replace any separator (/, .) with dashes for filesystem safety
  return formatted.replace(/[\/\.\s]/g, "-");
}
