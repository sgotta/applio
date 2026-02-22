"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type FontFamilyId,
  type FontSizeLevel,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE_LEVEL,
  FONT_FAMILY_IDS,
  FONT_SIZE_LEVEL_IDS,
  getFontDefinition,
} from "./fonts";

const FAMILY_STORAGE_KEY = "applio-font-family";
const SIZE_STORAGE_KEY = "applio-font-size";

interface FontSettingsContextValue {
  fontFamilyId: FontFamilyId;
  fontSizeLevel: FontSizeLevel;
  setFontFamily: (id: FontFamilyId) => void;
  setFontSizeLevel: (level: FontSizeLevel) => void;
}

const FontSettingsContext = createContext<FontSettingsContextValue | null>(null);

function getInitialFamily(): FontFamilyId {
  if (typeof window === "undefined") return DEFAULT_FONT_FAMILY;
  const saved = localStorage.getItem(FAMILY_STORAGE_KEY);
  if (saved && FONT_FAMILY_IDS.includes(saved as FontFamilyId)) {
    return saved as FontFamilyId;
  }
  return DEFAULT_FONT_FAMILY;
}

function getInitialSize(): FontSizeLevel {
  if (typeof window === "undefined") return DEFAULT_FONT_SIZE_LEVEL;
  const saved = localStorage.getItem(SIZE_STORAGE_KEY);
  if (saved) {
    const n = Number(saved);
    if (FONT_SIZE_LEVEL_IDS.includes(n as FontSizeLevel)) {
      return n as FontSizeLevel;
    }
  }
  return DEFAULT_FONT_SIZE_LEVEL;
}

export function FontSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [familyId, setFamilyId] = useState<FontFamilyId>(DEFAULT_FONT_FAMILY);
  const [sizeLevel, setSizeLevel] = useState<FontSizeLevel>(DEFAULT_FONT_SIZE_LEVEL);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe: read localStorage after mount
    setFamilyId(getInitialFamily());
    setSizeLevel(getInitialSize());
  }, []);

  /* Dynamic Google Fonts loading — inject <link> when font ≠ inter */
  useEffect(() => {
    if (familyId === "inter") return;
    const fontDef = getFontDefinition(familyId);
    if (!fontDef.googleFontsCss2Url) return;
    const existing = document.querySelector(`link[data-font-id="${familyId}"]`);
    if (existing) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontDef.googleFontsCss2Url;
    link.dataset.fontId = familyId;
    document.head.appendChild(link);
  }, [familyId]);

  const setFontFamily = useCallback((id: FontFamilyId) => {
    setFamilyId(id);
    localStorage.setItem(FAMILY_STORAGE_KEY, id);
  }, []);

  const setFontSizeLevel = useCallback((level: FontSizeLevel) => {
    setSizeLevel(level);
    localStorage.setItem(SIZE_STORAGE_KEY, String(level));
  }, []);

  const value = useMemo(
    () => ({
      fontFamilyId: familyId,
      fontSizeLevel: sizeLevel,
      setFontFamily,
      setFontSizeLevel,
    }),
    [familyId, sizeLevel, setFontFamily, setFontSizeLevel]
  );

  return (
    <FontSettingsContext.Provider value={value}>
      {children}
    </FontSettingsContext.Provider>
  );
}

export function useFontSettings(): FontSettingsContextValue {
  const context = useContext(FontSettingsContext);
  if (!context) {
    throw new Error(
      "useFontSettings must be used within a FontSettingsProvider"
    );
  }
  return context;
}
