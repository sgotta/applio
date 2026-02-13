"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type MarginLevel = 1 | 2 | 3 | 4 | 5;

const MARGIN_SCALES: Record<MarginLevel, number> = {
  1: 0.4,
  2: 0.7,
  3: 1,
  4: 1.3,
  5: 1.6,
};

const DEFAULT_LEVEL: MarginLevel = 3;
const STORAGE_KEY = "applio-margin";
const VALID_LEVELS: MarginLevel[] = [1, 2, 3, 4, 5];

interface MarginContextValue {
  marginLevel: MarginLevel;
  setMarginLevel: (level: MarginLevel) => void;
  marginScale: number;
}

const MarginContext = createContext<MarginContextValue | null>(null);

function getInitialLevel(): MarginLevel {
  if (typeof window === "undefined") return DEFAULT_LEVEL;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const parsed = Number(saved);
    if (VALID_LEVELS.includes(parsed as MarginLevel)) {
      return parsed as MarginLevel;
    }
  }
  return DEFAULT_LEVEL;
}

export function MarginProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [level, setLevel] = useState<MarginLevel>(DEFAULT_LEVEL);

  useEffect(() => {
    setLevel(getInitialLevel());
  }, []);

  const setMarginLevel = useCallback((newLevel: MarginLevel) => {
    setLevel(newLevel);
    localStorage.setItem(STORAGE_KEY, String(newLevel));
  }, []);

  const value = useMemo(
    () => ({
      marginLevel: level,
      setMarginLevel,
      marginScale: MARGIN_SCALES[level],
    }),
    [level, setMarginLevel]
  );

  return (
    <MarginContext.Provider value={value}>
      {children}
    </MarginContext.Provider>
  );
}

export function useMargin(): MarginContextValue {
  const context = useContext(MarginContext);
  if (!context) {
    throw new Error("useMargin must be used within a MarginProvider");
  }
  return context;
}
