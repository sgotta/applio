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
  type SidebarPatternName,
  type SidebarPattern,
  type PatternIntensity,
  type PatternScope,
  type PatternSettings,
  DEFAULT_PATTERN_SETTINGS,
  SIDEBAR_PATTERN_NAMES,
  PATTERN_SCOPES,
  getSidebarPattern,
} from "./sidebar-patterns";

const STORAGE_KEY = "applio-pattern";
const OLD_STORAGE_KEY = "applio-sidebar-pattern";

interface SidebarPatternContextValue {
  patternName: SidebarPatternName;
  pattern: SidebarPattern;
  sidebarIntensity: PatternIntensity;
  mainIntensity: PatternIntensity;
  scope: PatternScope;
  setPattern: (name: SidebarPatternName) => void;
  setSidebarIntensity: (level: PatternIntensity) => void;
  setMainIntensity: (level: PatternIntensity) => void;
  setScope: (scope: PatternScope) => void;
  /** Full settings object for serialization (export/share) */
  patternSettings: PatternSettings;
  /** Restore full settings (import/shared view) */
  setPatternSettings: (settings: PatternSettings) => void;
}

const SidebarPatternContext = createContext<SidebarPatternContextValue | null>(null);

function isValidIntensity(v: unknown): v is PatternIntensity {
  return typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5;
}

function isValidScope(v: unknown): v is PatternScope {
  return typeof v === "string" && PATTERN_SCOPES.includes(v as PatternScope);
}

function getInitialSettings(): PatternSettings {
  if (typeof window === "undefined") return DEFAULT_PATTERN_SETTINGS;

  // Try new key first (JSON object)
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Migrate from old single `intensity` field
      const hasSplit = isValidIntensity(parsed.sidebarIntensity);
      return {
        name: SIDEBAR_PATTERN_NAMES.includes(parsed.name) ? parsed.name : DEFAULT_PATTERN_SETTINGS.name,
        sidebarIntensity: hasSplit ? parsed.sidebarIntensity : (isValidIntensity(parsed.intensity) ? parsed.intensity : DEFAULT_PATTERN_SETTINGS.sidebarIntensity),
        mainIntensity: hasSplit ? (isValidIntensity(parsed.mainIntensity) ? parsed.mainIntensity : DEFAULT_PATTERN_SETTINGS.mainIntensity) : (isValidIntensity(parsed.intensity) ? parsed.intensity : DEFAULT_PATTERN_SETTINGS.mainIntensity),
        scope: isValidScope(parsed.scope) ? parsed.scope : DEFAULT_PATTERN_SETTINGS.scope,
      };
    } catch { /* fall through */ }
  }

  // Migrate from old key (plain string)
  const oldSaved = localStorage.getItem(OLD_STORAGE_KEY);
  if (oldSaved && SIDEBAR_PATTERN_NAMES.includes(oldSaved as SidebarPatternName)) {
    const migrated: PatternSettings = {
      ...DEFAULT_PATTERN_SETTINGS,
      name: oldSaved as SidebarPatternName,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    localStorage.removeItem(OLD_STORAGE_KEY);
    return migrated;
  }

  return DEFAULT_PATTERN_SETTINGS;
}

function persist(settings: PatternSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function SidebarPatternProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<PatternSettings>(DEFAULT_PATTERN_SETTINGS);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe: read localStorage after mount
    setSettings(getInitialSettings());
  }, []);

  const setPattern = useCallback((name: SidebarPatternName) => {
    setSettings((prev) => {
      const next = { ...prev, name };
      persist(next);
      return next;
    });
  }, []);

  const setSidebarIntensity = useCallback((sidebarIntensity: PatternIntensity) => {
    setSettings((prev) => {
      const next = { ...prev, sidebarIntensity };
      persist(next);
      return next;
    });
  }, []);

  const setMainIntensity = useCallback((mainIntensity: PatternIntensity) => {
    setSettings((prev) => {
      const next = { ...prev, mainIntensity };
      persist(next);
      return next;
    });
  }, []);

  const setScope = useCallback((scope: PatternScope) => {
    setSettings((prev) => {
      const next = { ...prev, scope };
      persist(next);
      return next;
    });
  }, []);

  const setPatternSettings = useCallback((newSettings: PatternSettings) => {
    setSettings(newSettings);
    persist(newSettings);
  }, []);

  const value = useMemo(
    () => ({
      patternName: settings.name,
      pattern: getSidebarPattern(settings.name),
      sidebarIntensity: settings.sidebarIntensity,
      mainIntensity: settings.mainIntensity,
      scope: settings.scope,
      setPattern,
      setSidebarIntensity,
      setMainIntensity,
      setScope,
      patternSettings: settings,
      setPatternSettings,
    }),
    [settings, setPattern, setSidebarIntensity, setMainIntensity, setScope, setPatternSettings]
  );

  return (
    <SidebarPatternContext.Provider value={value}>
      {children}
    </SidebarPatternContext.Provider>
  );
}

export function useSidebarPattern(): SidebarPatternContextValue {
  const context = useContext(SidebarPatternContext);
  if (!context) {
    throw new Error(
      "useSidebarPattern must be used within a SidebarPatternProvider"
    );
  }
  return context;
}
