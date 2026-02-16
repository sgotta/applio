"use client";

import { useContext } from "react";
import { EditModeContext } from "@/lib/edit-mode-context";

/**
 * Returns true if the editor is in view mode (mobile read-only).
 * Returns false on desktop (where no EditModeProvider exists).
 */
export function useIsViewMode(): boolean {
  const context = useContext(EditModeContext);
  return context?.isViewMode ?? false;
}
