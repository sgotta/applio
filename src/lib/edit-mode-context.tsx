"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

interface EditModeContextValue {
  /** true = view mode (read-only); false = edit mode (interactive) */
  isViewMode: boolean;
  toggleEditMode: () => void;
  /** Whether the view-mode hint pill is visible */
  hintVisible: boolean;
  /** Show the hint pill (auto-dismisses after 2s) */
  showHint: () => void;
}

export const EditModeContext = createContext<EditModeContextValue | null>(null);

export function EditModeProvider({ children }: { children: React.ReactNode }) {
  const [isViewMode, setIsViewMode] = useState(true);
  const [hintVisible, setHintVisible] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleEditMode = useCallback(() => {
    setIsViewMode((prev) => !prev);
    setHintVisible(false);
  }, []);

  const showHint = useCallback(() => {
    setHintVisible(true);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHintVisible(false), 2000);
  }, []);

  useEffect(() => {
    return () => { if (hintTimer.current) clearTimeout(hintTimer.current); };
  }, []);

  const value = useMemo(
    () => ({ isViewMode, toggleEditMode, hintVisible, showHint }),
    [isViewMode, toggleEditMode, hintVisible, showHint]
  );

  return (
    <EditModeContext.Provider value={value}>
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode(): EditModeContextValue {
  const context = useContext(EditModeContext);
  if (!context) {
    throw new Error("useEditMode must be used within an EditModeProvider");
  }
  return context;
}
