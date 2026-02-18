"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface ToolbarFeatures {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  code: boolean;
  clearFormatting: boolean;
  textColor: boolean;
  highlight: boolean;
  moveBlocks: boolean;
  typeParagraph: boolean;
  typeHeading2: boolean;
  typeHeading3: boolean;
  typeHeading4: boolean;
  typeBulletList: boolean;
  typeOrderedList: boolean;
  typeBlockquote: boolean;
}

const STORAGE_KEY = "applio-toolbar-features";

const DEFAULT_FEATURES: ToolbarFeatures = {
  bold: true,
  italic: true,
  underline: false,
  strikethrough: false,
  code: false,
  clearFormatting: true,
  textColor: false,
  highlight: false,
  moveBlocks: true,
  typeParagraph: true,
  typeHeading2: true,
  typeHeading3: true,
  typeHeading4: true,
  typeBulletList: true,
  typeOrderedList: true,
  typeBlockquote: true,
};

/** Keys for inline formatting toggles (shown first in admin panel) */
export const TOOLBAR_INLINE_KEYS: (keyof ToolbarFeatures)[] = [
  "bold", "italic", "underline", "strikethrough", "code",
  "clearFormatting", "textColor", "highlight", "moveBlocks",
];

/** Keys for block type sub-options (shown under blockTypes in admin panel) */
export const TOOLBAR_BLOCK_TYPE_KEYS: (keyof ToolbarFeatures)[] = [
  "typeParagraph", "typeHeading2", "typeHeading3", "typeHeading4",
  "typeBulletList", "typeOrderedList", "typeBlockquote",
];

interface ToolbarFeaturesContextValue {
  features: ToolbarFeatures;
  toggleFeature: (key: keyof ToolbarFeatures) => void;
}

const ToolbarFeaturesContext = createContext<ToolbarFeaturesContextValue | null>(null);

function loadFeatures(): ToolbarFeatures {
  if (typeof window === "undefined") return DEFAULT_FEATURES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FEATURES;
    const parsed = JSON.parse(raw);
    // Merge with defaults so new keys added later get their default value
    return { ...DEFAULT_FEATURES, ...parsed };
  } catch {
    return DEFAULT_FEATURES;
  }
}

export function ToolbarFeaturesProvider({ children }: { children: React.ReactNode }) {
  const [features, setFeatures] = useState<ToolbarFeatures>(DEFAULT_FEATURES);

  useEffect(() => {
    setFeatures(loadFeatures());
  }, []);

  const toggleFeature = useCallback((key: keyof ToolbarFeatures) => {
    setFeatures((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <ToolbarFeaturesContext.Provider value={{ features, toggleFeature }}>
      {children}
    </ToolbarFeaturesContext.Provider>
  );
}

export function useToolbarFeatures(): ToolbarFeaturesContextValue {
  const context = useContext(ToolbarFeaturesContext);
  if (!context) {
    throw new Error("useToolbarFeatures must be used within a ToolbarFeaturesProvider");
  }
  return context;
}
