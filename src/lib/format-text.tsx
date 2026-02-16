import React from "react";

/**
 * Renders text with **bold** markdown syntax.
 * Splits on ** delimiters and wraps alternating segments in <strong>.
 * Returns plain string if no ** found (optimization for React rendering).
 */
export function renderFormattedText(text: string): React.ReactNode {
  if (!text.includes("**")) return text;

  const parts = text.split("**");
  // Odd-indexed parts are bold
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}
