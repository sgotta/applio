"use client";

import { useState, useEffect, type RefObject } from "react";

/**
 * Detects when the content inside a fixed-size container overflows vertically.
 * Used to warn the user when their CV exceeds one A4 page.
 */
export function useOverflowDetection(containerRef: RefObject<HTMLDivElement | null>) {
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function check() {
      if (!el) return;
      // scrollHeight includes the full content height;
      // clientHeight is the visible (clipped) height (297mm for A4).
      // A small tolerance (2px) avoids false positives from sub-pixel rounding.
      setIsOverflowing(el.scrollHeight > el.clientHeight + 2);
    }

    // Initial check
    check();

    // Re-check whenever the content resizes
    const observer = new ResizeObserver(check);
    // Observe the inner content (first child) so we detect when IT grows,
    // not just the fixed outer container.
    const inner = el.firstElementChild;
    if (inner) {
      observer.observe(inner);
    }
    // Also observe the container itself as a fallback
    observer.observe(el);

    return () => observer.disconnect();
  }, [containerRef]);

  return { isOverflowing };
}
