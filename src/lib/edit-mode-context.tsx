"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface EditModeContextValue {
  /** true = view mode (read-only); false = edit mode (interactive) */
  isViewMode: boolean;
  toggleEditMode: () => void;
  enterEditMode: () => void;
  exitEditMode: () => void;
  /** Ref to attach to the CV container — used for click-outside detection */
  cvContainerRef: React.RefObject<HTMLDivElement | null>;
}

export const EditModeContext = createContext<EditModeContextValue | null>(null);

export function EditModeProvider({ children }: { children: React.ReactNode }) {
  const [isViewMode, setIsViewMode] = useState(true);
  const cvContainerRef = useRef<HTMLDivElement | null>(null);

  const toggleEditMode = useCallback(() => {
    setIsViewMode((prev) => !prev);
    toast.dismiss();
  }, []);

  const enterEditMode = useCallback(() => {
    setIsViewMode(false);
    toast.dismiss();
  }, []);

  const exitEditMode = useCallback(() => {
    setIsViewMode(true);
  }, []);

  const value = useMemo(
    () => ({ isViewMode, toggleEditMode, enterEditMode, exitEditMode, cvContainerRef }),
    [isViewMode, toggleEditMode, enterEditMode, exitEditMode]
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
