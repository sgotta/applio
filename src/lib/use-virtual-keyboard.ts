"use client";

import { useEffect, useState } from "react";

interface VirtualKeyboardState {
  /** Whether the virtual keyboard is likely open */
  isOpen: boolean;
  /** Bottom offset (px) to use with `position: fixed` to sit above the keyboard.
   *  Accounts for both resizes-visual and resizes-content browser behaviors. */
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
 * Key fix: stores the maximum observed `window.innerHeight` so that keyboard
 * detection works even on browsers where `innerHeight` also shrinks when the
 * keyboard opens (resizes-content fallback).  The returned `height` is the
 * correct `bottom` offset for `position: fixed` elements — it subtracts any
 * layout-viewport shrinkage to avoid double-offsetting.
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

    // Capture the full viewport height before any keyboard interaction.
    // Only update upward: keyboard-open shrinks must not corrupt the reference.
    let fullHeight = window.innerHeight;

    function onViewportChange() {
      fullHeight = Math.max(fullHeight, window.innerHeight);

      const diff = fullHeight - (vv as VisualViewport).height;
      const isOpen = diff > KEYBOARD_THRESHOLD;

      // When the browser also shrinks the layout viewport (resizes-content
      // behavior), position:fixed already accounts for part of the keyboard.
      // Subtract that to avoid pushing the toolbar off-screen.
      const layoutShrunk = fullHeight - window.innerHeight;
      const bottomOffset = isOpen ? Math.max(0, diff - layoutShrunk) : 0;

      setState((prev) => {
        if (prev.isOpen === isOpen && prev.height === bottomOffset) return prev;
        return { isOpen, height: bottomOffset };
      });
    }

    vv.addEventListener("resize", onViewportChange);
    vv.addEventListener("scroll", onViewportChange);
    onViewportChange();

    return () => {
      vv.removeEventListener("resize", onViewportChange);
      vv.removeEventListener("scroll", onViewportChange);
    };
  }, []);

  return state;
}
