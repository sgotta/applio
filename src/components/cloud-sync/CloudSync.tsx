"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCV } from "@/lib/cv-context";
import { useColorScheme } from "@/lib/color-scheme-context";
import { useFontSettings } from "@/lib/font-context";
import { useSidebarPattern } from "@/lib/sidebar-pattern-context";
import { useTheme } from "@/lib/theme-context";
import { useAppLocale } from "@/lib/locale-context";
import {
  ensureProfile,
  fetchUserCV,
  createCV,
  updateCV,
  type CloudSettings,
} from "@/lib/supabase/db";
import type { CVData } from "@/lib/types";
import type { ColorSchemeName } from "@/lib/color-schemes";
import type { FontFamilyId, FontSizeLevel } from "@/lib/fonts";
import type { PatternSettings } from "@/lib/sidebar-patterns";
import type { Theme } from "@/lib/theme-context";
import type { Locale } from "@/lib/locale-context";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Clone CVData and strip base64-encoded photos (keep URL photos intact) */
function stripBase64Photo(data: CVData): CVData {
  const photo = data.personalInfo.photo;
  if (!photo || !photo.startsWith("data:")) return data;
  return {
    ...data,
    personalInfo: { ...data.personalInfo, photo: undefined },
  };
}

/** Collect current settings from all contexts into a CloudSettings object */
function collectSettings(
  colorScheme: string,
  fontFamily: string,
  fontSizeLevel: number,
  theme: string,
  locale: string,
  pattern: PatternSettings,
): CloudSettings {
  return {
    colorScheme,
    fontFamily,
    fontSizeLevel,
    theme,
    locale,
    pattern: {
      name: pattern.name,
      sidebarIntensity: pattern.sidebarIntensity,
      mainIntensity: pattern.mainIntensity,
      scope: pattern.scope,
    },
  };
}

/** Apply cloud settings into each context via their setters */
function hydrateSettings(
  s: CloudSettings,
  setColorScheme: (n: ColorSchemeName) => void,
  setFontFamily: (id: FontFamilyId) => void,
  setFontSizeLevel: (l: FontSizeLevel) => void,
  setTheme: (t: Theme) => void,
  setLocale: (l: Locale) => void,
  setPatternSettings: (p: PatternSettings) => void,
) {
  if (s.colorScheme) setColorScheme(s.colorScheme as ColorSchemeName);
  if (s.fontFamily) setFontFamily(s.fontFamily as FontFamilyId);
  if (s.fontSizeLevel) setFontSizeLevel(s.fontSizeLevel as FontSizeLevel);
  if (s.theme) setTheme(s.theme as Theme);
  if (s.locale) setLocale(s.locale as Locale);
  if (s.pattern) {
    setPatternSettings(s.pattern as PatternSettings);
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Render-null component that synchronises CV data and settings with Supabase.
 * Must be placed inside all context providers (CVProvider, AuthProvider, etc.).
 */
export function CloudSync() {
  // ---- Contexts ----
  const { user, loading: authLoading } = useAuth();
  const { data, importData } = useCV();
  const { colorSchemeName, setColorScheme } = useColorScheme();
  const { fontFamilyId, fontSizeLevel, setFontFamily, setFontSizeLevel } = useFontSettings();
  const { patternSettings, setPatternSettings } = useSidebarPattern();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useAppLocale();

  // ---- Refs for sync control ----
  const cvIdRef = useRef<string | null>(null);
  const justLoadedRef = useRef(false);
  const justLoadedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const saveCVTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const saveSettingsTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevUserIdRef = useRef<string | null>(null);
  const initialLoadDoneRef = useRef(false);

  // Keep mutable refs of current values so async callbacks read fresh data
  const userRef = useRef(user);
  userRef.current = user;

  const dataRef = useRef(data);
  dataRef.current = data;

  const settingsRef = useRef({ colorSchemeName, fontFamilyId, fontSizeLevel, theme, locale, patternSettings });
  settingsRef.current = { colorSchemeName, fontFamilyId, fontSizeLevel, theme, locale, patternSettings };

  // ------------------------------------------------------------------
  // Effect 1: Load from Supabase on auth change (login / logout)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (authLoading) return;

    const userId = user?.id ?? null;
    if (userId === prevUserIdRef.current) return;
    prevUserIdRef.current = userId;

    // Logout — stop syncing
    if (!userId) {
      cvIdRef.current = null;
      initialLoadDoneRef.current = false;
      clearTimeout(saveCVTimerRef.current);
      clearTimeout(saveSettingsTimerRef.current);
      return;
    }

    // Login — fetch from Supabase
    let cancelled = false;
    (async () => {
      const row = await fetchUserCV(userId);
      if (cancelled) return;

      if (row) {
        // Supabase has data — hydrate state
        cvIdRef.current = row.id;

        // Set cooldown flag BEFORE triggering state changes
        justLoadedRef.current = true;
        clearTimeout(justLoadedTimerRef.current);
        justLoadedTimerRef.current = setTimeout(() => {
          justLoadedRef.current = false;
        }, 4000);

        // Hydrate CV data (merge local photo back in)
        const cloudData = row.cv_data as CVData;
        const localPhoto = dataRef.current.personalInfo.photo;
        if (localPhoto?.startsWith("data:") && !cloudData.personalInfo.photo) {
          cloudData.personalInfo.photo = localPhoto;
        }
        importData(cloudData);

        // Hydrate settings
        if (row.settings && typeof row.settings === "object" && Object.keys(row.settings).length > 0) {
          hydrateSettings(
            row.settings,
            setColorScheme,
            setFontFamily,
            setFontSizeLevel,
            setTheme,
            setLocale,
            setPatternSettings,
          );
        }
      } else {
        // First-ever login — ensure profile exists, then upload localStorage data
        const profileOk = await ensureProfile(userRef.current!);
        if (!profileOk || cancelled) return;

        const cur = settingsRef.current;
        const settings = collectSettings(
          cur.colorSchemeName,
          cur.fontFamilyId,
          cur.fontSizeLevel,
          cur.theme,
          cur.locale,
          cur.patternSettings,
        );
        const cleanData = stripBase64Photo(dataRef.current);
        const title = dataRef.current.personalInfo.fullName
          ? `CV - ${dataRef.current.personalInfo.fullName}`
          : "Mi CV";
        const created = await createCV(userId, cleanData, settings, title);
        if (created && !cancelled) {
          cvIdRef.current = created.id;
        }
      }

      if (!cancelled) {
        initialLoadDoneRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(justLoadedTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  // ------------------------------------------------------------------
  // Effect 2: Debounced save of CV data to Supabase
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!user || !cvIdRef.current || !initialLoadDoneRef.current || justLoadedRef.current) return;

    clearTimeout(saveCVTimerRef.current);
    saveCVTimerRef.current = setTimeout(async () => {
      if (!cvIdRef.current) return;
      const cleanData = stripBase64Photo(dataRef.current);
      await updateCV(cvIdRef.current, { cv_data: cleanData });
    }, 3000);

    return () => clearTimeout(saveCVTimerRef.current);
  }, [data, user]);

  // ------------------------------------------------------------------
  // Effect 3: Debounced save of settings to Supabase
  // ------------------------------------------------------------------
  const settingsFingerprint = user
    ? `${colorSchemeName}|${fontFamilyId}|${fontSizeLevel}|${theme}|${locale}|${patternSettings.name}|${patternSettings.sidebarIntensity}|${patternSettings.mainIntensity}|${patternSettings.scope}`
    : "";

  useEffect(() => {
    if (!user || !cvIdRef.current || !initialLoadDoneRef.current || justLoadedRef.current) return;

    clearTimeout(saveSettingsTimerRef.current);
    saveSettingsTimerRef.current = setTimeout(async () => {
      if (!cvIdRef.current) return;
      const cur = settingsRef.current;
      const settings = collectSettings(
        cur.colorSchemeName,
        cur.fontFamilyId,
        cur.fontSizeLevel,
        cur.theme,
        cur.locale,
        cur.patternSettings,
      );
      await updateCV(cvIdRef.current, { settings });
    }, 3000);

    return () => clearTimeout(saveSettingsTimerRef.current);
  }, [settingsFingerprint, user]);

  // ------------------------------------------------------------------
  // Cleanup on unmount
  // ------------------------------------------------------------------
  useEffect(() => {
    return () => {
      clearTimeout(saveCVTimerRef.current);
      clearTimeout(saveSettingsTimerRef.current);
      clearTimeout(justLoadedTimerRef.current);
    };
  }, []);

  return null;
}
