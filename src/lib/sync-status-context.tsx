"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SyncStatus = "idle" | "synced";

interface SyncStatusContextValue {
  status: SyncStatus;
  setStatus: (s: SyncStatus) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const SyncStatusContext = createContext<SyncStatusContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function SyncStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatusRaw] = useState<SyncStatus>("idle");

  const setStatus = useCallback((s: SyncStatus) => setStatusRaw(s), []);

  const value = useMemo(
    () => ({ status, setStatus }),
    [status, setStatus],
  );

  return (
    <SyncStatusContext.Provider value={value}>
      {children}
    </SyncStatusContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSyncStatus() {
  const context = useContext(SyncStatusContext);
  if (!context) {
    throw new Error("useSyncStatus must be used within a SyncStatusProvider");
  }
  return context;
}
