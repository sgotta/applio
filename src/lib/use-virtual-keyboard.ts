"use client";

import { useEffect, useState } from "react";

interface VirtualKeyboardState {
  /** Whether the virtual keyboard is likely open */
  isOpen: boolean;
  /** Estimated keyboard height in pixels */
  height: number;
}

/** Minimum height difference (px) to consider the keyboard open.
 *  Avoids false positives from mobile address-bar show/hide (~60-80px). */
const KEYBOARD_THRESHOLD = 150;

/**
 * Detects when the mobile virtual keyboard is open using the visualViewport API.
 *
 * Works in combination with the `interactive-widget: resizes-visual` viewport
 * meta tag (set in layout.tsx), which tells iOS Safari to shrink the visual
 * viewport when the keyboard appears — matching Chrome's default behavior.
 *
 * On desktop or when visualViewport is unavailable, always returns
 * `{ isOpen: false, height: 0 }`.
 */
export function useVirtualKeyboard(): VirtualKeyboardState {
  const [state, setState] = useState<VirtualKeyboardState>({
    isOpen: false,
    height: 0,
  });

  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;

    function onResize() {
      // window.innerHeight stays fixed (layout viewport).
      // visualViewport.height shrinks when the keyboard opens.
      const diff = window.innerHeight - (vv as VisualViewport).height;
      const isOpen = diff > KEYBOARD_THRESHOLD;
      setState({ isOpen, height: isOpen ? diff : 0 });
    }

    vv.addEventListener("resize", onResize);
    // Run once to capture initial state (e.g. if keyboard was already open)
    onResize();

    return () => vv.removeEventListener("resize", onResize);
  }, []);

  return state;
}
