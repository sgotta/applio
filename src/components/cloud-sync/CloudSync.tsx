"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Cloud } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCV } from "@/lib/cv-context";
import { useColorScheme } from "@/lib/color-scheme-context";
import { useFontSettings } from "@/lib/font-context";
import { useSidebarPattern } from "@/lib/sidebar-pattern-context";
import { useTheme } from "@/lib/theme-context";
import { useAppLocale } from "@/lib/locale-context";
import { useSyncStatus } from "@/lib/sync-status-context";
import {
  ensureProfile,
  fetchUserCV,
  createCV,
  updateCV,
  type CloudSettings,
  type CVRow,
} from "@/lib/supabase/db";
import type { CVData } from "@/lib/types";
import type { ColorSchemeName } from "@/lib/color-schemes";
import type { FontFamilyId, FontSizeLevel } from "@/lib/fonts";
import type { PatternSettings } from "@/lib/sidebar-patterns";
import type { Theme } from "@/lib/theme-context";
import type { Locale } from "@/lib/locale-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
// Conflict detection helpers
// ---------------------------------------------------------------------------

/**
 * JSON.stringify with recursively sorted object keys so that key insertion
 * order (which can differ after a JSONB round-trip through Supabase) does
 * not affect the output.
 */
function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  // Object — sort keys, skip undefined values (like JSON.stringify)
  const obj = value as Record<string, unknown>;
  const parts = Object.keys(obj)
    .sort()
    .filter((k) => obj[k] !== undefined)
    .map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k]));
  return "{" + parts.join(",") + "}";
}

/**
 * Create a fingerprint of the "content" fields of a CVData object.
 * Excludes photo, visibility, and sidebarOrder to avoid false positives.
 * Uses stableStringify so key ordering differences from JSONB don't matter.
 */
function cvContentFingerprint(data: CVData): string {
  const { photo: _photo, ...personalInfoWithoutPhoto } = data.personalInfo;
  return stableStringify({
    personalInfo: personalInfoWithoutPhoto,
    summary: data.summary,
    experience: data.experience,
    education: data.education,
    skills: data.skills,
    courses: data.courses,
    certifications: data.certifications,
    awards: data.awards,
  });
}

function areMeaningfullyDifferent(local: CVData, cloud: CVData): boolean {
  return cvContentFingerprint(local) !== cvContentFingerprint(cloud);
}

// ---------------------------------------------------------------------------
// Conflict state type
// ---------------------------------------------------------------------------

interface ConflictState {
  localData: CVData;
  cloudData: CVData;
  cloudRow: CVRow;
  cloudSettings: CloudSettings | null;
  cloudUpdatedAt: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Render-null component that synchronises CV data and settings with Supabase.
 * Must be placed inside all context providers (CVProvider, AuthProvider, etc.).
 *
 * When local and cloud data differ at login, renders a friendly dialog
 * so the user can choose which version to keep.
 */
export function CloudSync() {
  const t = useTranslations("syncConflict");

  // ---- Contexts ----
  const { user, loading: authLoading } = useAuth();
  const { data, importData, hadSavedData } = useCV();
  const { colorSchemeName, setColorScheme } = useColorScheme();
  const { fontFamilyId, fontSizeLevel, setFontFamily, setFontSizeLevel } = useFontSettings();
  const { patternSettings, setPatternSettings } = useSidebarPattern();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useAppLocale();
  const { setStatus } = useSyncStatus();

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

  // ---- Conflict state ----
  const [conflictState, setConflictState] = useState<ConflictState | null>(null);

  // ------------------------------------------------------------------
  // Activate sync (shared by both resolution paths)
  // ------------------------------------------------------------------
  const activateSync = useCallback(() => {
    justLoadedRef.current = true;
    clearTimeout(justLoadedTimerRef.current);
    justLoadedTimerRef.current = setTimeout(() => {
      justLoadedRef.current = false;
    }, 4000);

    initialLoadDoneRef.current = true;
    setConflictState(null);
    setStatus("synced");
  }, [setStatus]);

  // ------------------------------------------------------------------
  // Conflict resolution handler
  // ------------------------------------------------------------------
  const handleConflictResolution = useCallback((choice: "local" | "cloud") => {
    if (!conflictState) return;

    const { localData, cloudData, cloudSettings } = conflictState;

    // Save the discarded version as safety-net backup in localStorage
    const discardedData = choice === "local" ? cloudData : localData;
    try {
      localStorage.setItem("cv-builder-backup", JSON.stringify({
        data: discardedData,
        backupReason: "sync-conflict",
        discardedSource: choice === "local" ? "cloud" : "local",
        timestamp: new Date().toISOString(),
      }));
    } catch {
      console.warn("[CloudSync] Failed to save backup to localStorage");
    }

    if (choice === "cloud") {
      // User chose cloud data — hydrate it
      const finalCloudData = { ...cloudData };
      const localPhoto = localData.personalInfo.photo;
      if (localPhoto?.startsWith("data:") && !finalCloudData.personalInfo.photo) {
        finalCloudData.personalInfo.photo = localPhoto;
      }
      importData(finalCloudData);

      if (cloudSettings) {
        hydrateSettings(
          cloudSettings,
          setColorScheme,
          setFontFamily,
          setFontSizeLevel,
          setTheme,
          setLocale,
          setPatternSettings,
        );
      }
    } else {
      // User chose local data — push it to Supabase now so the conflict
      // doesn't reappear on the next page load. Effect 2 won't fire because
      // `data` didn't change, so we must explicitly save here.
      if (cvIdRef.current) {
        const cleanData = stripBase64Photo(localData);
        const cur = settingsRef.current;
        const settings = collectSettings(
          cur.colorSchemeName,
          cur.fontFamilyId,
          cur.fontSizeLevel,
          cur.theme,
          cur.locale,
          cur.patternSettings,
        );
        updateCV(cvIdRef.current, { cv_data: cleanData, settings });
      }
    }

    activateSync();
  }, [conflictState, importData, setColorScheme, setFontFamily, setFontSizeLevel, setTheme, setLocale, setPatternSettings, activateSync]);

  // ------------------------------------------------------------------
  // Helper: hydrate cloud data silently (no conflict)
  // ------------------------------------------------------------------
  const hydrateCloudSilently = useCallback((row: CVRow, cloudData: CVData) => {
    justLoadedRef.current = true;
    clearTimeout(justLoadedTimerRef.current);
    justLoadedTimerRef.current = setTimeout(() => {
      justLoadedRef.current = false;
    }, 4000);

    // Merge local photo back in if cloud has none
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
  }, [importData, setColorScheme, setFontFamily, setFontSizeLevel, setTheme, setLocale, setPatternSettings]);

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
      setConflictState(null);
      setStatus("idle");
      return;
    }

    // Login — fetch from Supabase
    let cancelled = false;
    (async () => {
      const row = await fetchUserCV(userId);
      if (cancelled) return;

      if (row) {
        // Supabase has data
        cvIdRef.current = row.id;
        const cloudData = row.cv_data as CVData;
        const localData = dataRef.current;

        // If local data is default/unedited, or same as cloud → hydrate silently
        if (!hadSavedData || !areMeaningfullyDifferent(localData, cloudData)) {
          hydrateCloudSilently(row, cloudData);

          if (!cancelled) {
            initialLoadDoneRef.current = true;
            setStatus("synced");
          }
        } else {
          // Data differs — show friendly dialog
          // initialLoadDoneRef stays false → Effects 2 & 3 won't save
          if (!cancelled) {
            const hasSettings = row.settings && typeof row.settings === "object" && Object.keys(row.settings).length > 0;
            setConflictState({
              localData: { ...localData },
              cloudData,
              cloudRow: row,
              cloudSettings: hasSettings ? row.settings : null,
              cloudUpdatedAt: row.updated_at,
            });
          }
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

        if (!cancelled) {
          initialLoadDoneRef.current = true;
          setStatus("synced");
        }
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

  // ------------------------------------------------------------------
  // Render: version choice dialog or nothing
  // ------------------------------------------------------------------
  if (!conflictState) return null;

  const formattedDate = new Date(conflictState.cloudUpdatedAt).toLocaleString(locale, {
    dateStyle: "long",
  });

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) handleConflictResolution("local"); }}>
      <DialogContent
        showCloseButton
        className="max-w-[calc(100vw-3rem)] sm:max-w-xs py-8 px-6 sm:p-6"
      >
        <div className="flex flex-col items-center text-center gap-4 sm:gap-3">
          <div className="w-16 h-16 sm:w-12 sm:h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center">
            <Cloud className="w-8 h-8 sm:w-6 sm:h-6 text-sky-500" />
          </div>
          <DialogHeader className="items-center">
            <DialogTitle className="text-base">
              {t("title")}
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              {t("description", { date: formattedDate })}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col gap-2 mt-2 sm:mt-1">
          <Button
            onClick={() => handleConflictResolution("cloud")}
            className="w-full"
          >
            {t("useCloud")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleConflictResolution("local")}
            className="w-full text-muted-foreground"
          >
            {t("useLocal")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
