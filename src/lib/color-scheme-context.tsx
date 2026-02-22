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
  getColorScheme,
} from "./color-schemes";

const STORAGE_KEY = "applio-color-scheme";

interface ColorSchemeContextValue {
  colorSchemeName: ColorSchemeName;
  colorScheme: ColorScheme;
  setColorScheme: (name: ColorSchemeName) => void;
}

const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);

function getInitialScheme(): ColorSchemeName {
  if (typeof window === "undefined") return DEFAULT_COLOR_SCHEME;
  let saved = localStorage.getItem(STORAGE_KEY);
  // Migrate legacy name
  if (saved === "ivory") saved = "default";
  if (saved && COLOR_SCHEME_NAMES.includes(saved as ColorSchemeName)) {
    return saved as ColorSchemeName;
  }
  return DEFAULT_COLOR_SCHEME;
}

export function ColorSchemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [name, setName] = useState<ColorSchemeName>(DEFAULT_COLOR_SCHEME);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe: read localStorage after mount
    setName(getInitialScheme());
  }, []);

  const setColorScheme = useCallback((newName: ColorSchemeName) => {
    setName(newName);
    localStorage.setItem(STORAGE_KEY, newName);
  }, []);

  const value = useMemo(
    () => ({
      colorSchemeName: name,
      colorScheme: getColorScheme(name),
      setColorScheme,
    }),
    [name, setColorScheme]
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
