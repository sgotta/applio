"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type FontSizeLevel = 1 | 2 | 3 | 4 | 5;

const FONT_SIZE_SCALES: Record<FontSizeLevel, number> = {
  1: 0.85,
  2: 0.92,
  3: 1,
  4: 1.08,
  5: 1.15,
};

const DEFAULT_LEVEL: FontSizeLevel = 3;
const STORAGE_KEY = "applio-font-size";
const VALID_LEVELS: FontSizeLevel[] = [1, 2, 3, 4, 5];

interface FontSizeContextValue {
  fontSizeLevel: FontSizeLevel;
  setFontSizeLevel: (level: FontSizeLevel) => void;
  fontScale: number;
}

const FontSizeContext = createContext<FontSizeContextValue | null>(null);

function getInitialLevel(): FontSizeLevel {
  if (typeof window === "undefined") return DEFAULT_LEVEL;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const parsed = Number(saved);
    if (VALID_LEVELS.includes(parsed as FontSizeLevel)) {
      return parsed as FontSizeLevel;
    }
  }
  return DEFAULT_LEVEL;
}

export function FontSizeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [level, setLevel] = useState<FontSizeLevel>(DEFAULT_LEVEL);

  useEffect(() => {
    setLevel(getInitialLevel());
  }, []);

  const setFontSizeLevel = useCallback((newLevel: FontSizeLevel) => {
    setLevel(newLevel);
    localStorage.setItem(STORAGE_KEY, String(newLevel));
  }, []);

  const value = useMemo(
    () => ({
      fontSizeLevel: level,
      setFontSizeLevel,
      fontScale: FONT_SIZE_SCALES[level],
    }),
    [level, setFontSizeLevel]
  );

  return (
    <FontSizeContext.Provider value={value}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize(): FontSizeContextValue {
  const context = useContext(FontSizeContext);
  if (!context) {
    throw new Error("useFontSize must be used within a FontSizeProvider");
  }
  return context;
}
