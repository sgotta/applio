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
  ColorSchemeName,
  ColorScheme,
  DEFAULT_COLOR_SCHEME,
  COLOR_SCHEME_NAMES,
  migrateColorSchemeName,
  resolveColorScheme,
} from "./color-schemes";

const STORAGE_KEY = "applio-color-scheme";
const ACCENT_STORAGE_KEY = "applio-accent-color";

interface ColorSchemeContextValue {
  colorSchemeName: ColorSchemeName;
  accentColor: string | null;
  colorScheme: ColorScheme;
  setColorScheme: (name: ColorSchemeName) => void;
  setAccentColor: (color: string | null) => void;
}

const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);

function getInitialValues(): {
  baseName: ColorSchemeName;
  accent: string | null;
} {
  if (typeof window === "undefined")
    return { baseName: DEFAULT_COLOR_SCHEME, accent: null };

  let saved = localStorage.getItem(STORAGE_KEY);

  // Migrate legacy "ivory"
  if (saved === "ivory") saved = "default";

  // Migrate old 5-scheme names (peterRiver, emerald, carrot)
  if (saved && !COLOR_SCHEME_NAMES.includes(saved as ColorSchemeName)) {
    const migrated = migrateColorSchemeName(saved);
    localStorage.setItem(STORAGE_KEY, migrated.baseName);
    if (migrated.accentColor) {
      localStorage.setItem(ACCENT_STORAGE_KEY, migrated.accentColor);
    }
    return { baseName: migrated.baseName, accent: migrated.accentColor };
  }

  const baseName =
    saved && COLOR_SCHEME_NAMES.includes(saved as ColorSchemeName)
      ? (saved as ColorSchemeName)
      : DEFAULT_COLOR_SCHEME;

  const accent = localStorage.getItem(ACCENT_STORAGE_KEY) || null;

  return { baseName, accent };
}

export function ColorSchemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [name, setName] = useState<ColorSchemeName>(DEFAULT_COLOR_SCHEME);
  const [accentColor, setAccentColorState] = useState<string | null>(null);

  useEffect(() => {
    const initial = getInitialValues();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe: read localStorage after mount
    setName(initial.baseName);
    setAccentColorState(initial.accent);
  }, []);

  const setColorScheme = useCallback((newName: ColorSchemeName) => {
    setName(newName);
    localStorage.setItem(STORAGE_KEY, newName);
  }, []);

  const setAccentColor = useCallback((color: string | null) => {
    setAccentColorState(color);
    if (color) {
      localStorage.setItem(ACCENT_STORAGE_KEY, color);
    } else {
      localStorage.removeItem(ACCENT_STORAGE_KEY);
    }
  }, []);

  const value = useMemo(
    () => ({
      colorSchemeName: name,
      accentColor,
      colorScheme: resolveColorScheme(name, accentColor),
      setColorScheme,
      setAccentColor,
    }),
    [name, accentColor, setColorScheme, setAccentColor]
  );

  return (
    <ColorSchemeContext.Provider value={value}>
      {children}
    </ColorSchemeContext.Provider>
  );
}

export function useColorScheme(): ColorSchemeContextValue {
  const context = useContext(ColorSchemeContext);
  if (!context) {
    throw new Error(
      "useColorScheme must be used within a ColorSchemeProvider"
    );
  }
  return context;
}
