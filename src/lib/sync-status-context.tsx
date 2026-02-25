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

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

interface SyncStatusContextValue {
  status: SyncStatus;
  lastError: string | null;
  setStatus: (s: SyncStatus) => void;
  setLastError: (msg: string | null) => void;
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
  const [lastError, setLastErrorRaw] = useState<string | null>(null);

  const setStatus = useCallback((s: SyncStatus) => setStatusRaw(s), []);
  const setLastError = useCallback((msg: string | null) => setLastErrorRaw(msg), []);

  const value = useMemo(
    () => ({ status, lastError, setStatus, setLastError }),
    [status, lastError, setStatus, setLastError],
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
