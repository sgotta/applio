"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface EditModeContextValue {
  /** true = view mode (read-only); false = edit mode (interactive) */
  isViewMode: boolean;
  toggleEditMode: () => void;
}

export const EditModeContext = createContext<EditModeContextValue | null>(null);

export function EditModeProvider({ children }: { children: React.ReactNode }) {
  const [isViewMode, setIsViewMode] = useState(true);

  const toggleEditMode = useCallback(() => {
    setIsViewMode((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({ isViewMode, toggleEditMode }),
    [isViewMode, toggleEditMode]
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
