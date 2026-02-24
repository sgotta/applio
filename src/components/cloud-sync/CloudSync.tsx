"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useCV } from "@/lib/cv-context";
import { useColorScheme } from "@/lib/color-scheme-context";
import { useFontSettings } from "@/lib/font-context";
import { useTheme } from "@/lib/theme-context";
import { useAppLocale } from "@/lib/locale-context";
import { useSidebarPattern } from "@/lib/sidebar-pattern-context";
import { useSyncStatus } from "@/lib/sync-status-context";
import type { CVData, CloudSettings } from "@/lib/types";
import { cvContentFingerprint } from "@/lib/cv-sync";

// ---------------------------------------------------------------------------
// API helpers (replaces server actions that didn't work with RSC protocol)
// ---------------------------------------------------------------------------

async function loadCV(): Promise<{
  id: string;
  cvData: CVData;
  settings: CloudSettings;
  isPublished: boolean;
  slug: string | null;
  updatedAt: string;
} | null> {
  const res = await fetch("/api/cv");
  if (!res.ok) throw new Error(`loadCV failed: ${res.status}`);
  return res.json();
}

async function saveCV(
  cvData: CVData,
  settings?: CloudSettings,
): Promise<{ id: string; updatedAt: string }> {
  const res = await fetch("/api/cv", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cvData, settings }),
  });
  if (!res.ok) throw new Error(`saveCV failed: ${res.status}`);
  return res.json();
}

/**
 * Upload a base64 photo to R2 via /api/upload-photo.
 * Returns the R2 URL on success, or null on failure.
 */
async function uploadBase64ToR2(base64: string): Promise<string | null> {
  try {
    const res = await fetch(base64);
    const blob = await res.blob();
    const formData = new FormData();
    formData.append("photo", blob, "photo.jpg");
    const uploadRes = await fetch("/api/upload-photo", { method: "POST", body: formData });
    const result = await uploadRes.json();
    if (result.success && result.url) return result.url;
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// CloudSync component — render-null, effects only
// ---------------------------------------------------------------------------

export function CloudSync() {
  const { user } = useAuth();
  const { data, loading: cvLoading, importData, updatePersonalInfo } = useCV();
  const { colorSchemeName, setColorScheme } = useColorScheme();
  const { fontFamilyId, fontSizeLevel, setFontFamily, setFontSizeLevel } = useFontSettings();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useAppLocale();
  const { patternSettings, setPatternSettings } = useSidebarPattern();
  const { setStatus, setLastError } = useSyncStatus();
  const t = useTranslations("syncConflict");
  const tSync = useTranslations("sync");

  // Conflict resolution state
  const [showConflict, setShowConflict] = useState(false);
  const [cloudData, setCloudData] = useState<{
    cvData: CVData;
    settings: CloudSettings;
  } | null>(null);

  // Refs for debounced saves
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadStarted = useRef(false);
  const initialSyncComplete = useRef(false);
  const lastSavedFingerprint = useRef<string>("");
  const lastSavedSettings = useRef<string>("");
  const uploadingPhoto = useRef(false);

  // -----------------------------------------------------------------------
  // Effect 1: On login — fetch cloud CV and detect conflicts
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!user || cvLoading) return;
    if (initialLoadStarted.current) return;
    initialLoadStarted.current = true;

    let cancelled = false;

    (async () => {
      try {
        setStatus("syncing");
        const cloud = await loadCV();
        if (cancelled) return;

        if (!cloud) {
          // No cloud data — first sync, just mark ready and let Effect 2 save
          lastSavedFingerprint.current = cvContentFingerprint(data);
          initialSyncComplete.current = true;
          setStatus("synced");
          return;
        }

        const localFingerprint = cvContentFingerprint(data);
        const cloudFingerprint = cvContentFingerprint(cloud.cvData);

        if (localFingerprint === cloudFingerprint) {
          // Same content — apply cloud settings if different
          applyCloudSettings(cloud.settings);
          lastSavedFingerprint.current = localFingerprint;
          initialSyncComplete.current = true;
          setStatus("synced");
          return;
        }

        // Conflict detected — show resolution dialog
        // (initialSyncComplete stays false until conflict is resolved)
        setCloudData({ cvData: cloud.cvData, settings: cloud.settings });
        setShowConflict(true);
        setStatus("idle");
      } catch (err) {
        console.error("CloudSync: failed to load cloud CV", err);
        setStatus("error");
        setLastError(tSync("loadError"));
        toast.error(tSync("loadError"));
        // On error, do NOT mark sync complete — prevent accidental overwrites
      }
    })();

    return () => {
      cancelled = true;
      // If cancelled before sync completed, allow retry on next render cycle
      if (!initialSyncComplete.current) {
        initialLoadStarted.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cvLoading]);

  // Reset on logout
  useEffect(() => {
    if (!user) {
      initialLoadStarted.current = false;
      initialSyncComplete.current = false;
      lastSavedFingerprint.current = "";
      lastSavedSettings.current = "";
      setStatus("idle");
      setLastError(null);
    }
  }, [user, setStatus, setLastError]);

  // -----------------------------------------------------------------------
  // Effect 2: Unified auto-save — CV data + settings (3s debounce)
  // Merged into a single effect to prevent race conditions where a settings
  // save could overwrite a photo URL that was just uploaded by a data save.
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!user || cvLoading || !initialSyncComplete.current || showConflict) return;

    const fingerprint = cvContentFingerprint(data);
    const settings = buildSettings();
    const settingsStr = JSON.stringify(settings);
    const hasBase64Photo = !!data.personalInfo.photoUrl?.startsWith("data:");

    const fingerprintChanged = fingerprint !== lastSavedFingerprint.current;
    const settingsChanged = settingsStr !== lastSavedSettings.current;

    // Skip if nothing changed — but always run if there's a base64 photo pending upload
    if (!fingerprintChanged && !settingsChanged && !hasBase64Photo) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setStatus("syncing");
    saveTimerRef.current = setTimeout(async () => {
      try {
        const dataToSave = await ensurePhotoUploaded(data);
        const currentSettings = buildSettings();
        await saveCV(dataToSave, currentSettings);
        lastSavedFingerprint.current = cvContentFingerprint(dataToSave);
        lastSavedSettings.current = JSON.stringify(currentSettings);
        setStatus("synced");
        setLastError(null);
      } catch (err) {
        console.error("CloudSync: save failed", err);
        setStatus("error");
        setLastError(tSync("saveError"));
        toast.error(tSync("saveError"));
      }
    }, 3000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, colorSchemeName, fontFamilyId, fontSizeLevel, theme, locale, patternSettings, user, cvLoading, showConflict]);

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  /**
   * If the CV has a base64 photo, upload it to R2 first and return
   * the updated data with the R2 URL. Otherwise return data as-is.
   */
  async function ensurePhotoUploaded(cvData: CVData): Promise<CVData> {
    const photoUrl = cvData.personalInfo.photoUrl;
    if (!photoUrl?.startsWith("data:") || uploadingPhoto.current) return cvData;

    uploadingPhoto.current = true;
    const r2Url = await uploadBase64ToR2(photoUrl);
    uploadingPhoto.current = false;

    if (r2Url) {
      updatePersonalInfo("photoUrl", r2Url);
      return { ...cvData, personalInfo: { ...cvData.personalInfo, photoUrl: r2Url } };
    }

    toast.warning(tSync("photoUploadFailed"));
    return cvData;
  }

  function buildSettings(): CloudSettings {
    return {
      colorScheme: colorSchemeName,
      fontFamily: fontFamilyId,
      fontSizeLevel,
      theme,
      locale,
      pattern: {
        name: patternSettings.name,
        sidebarIntensity: patternSettings.sidebarIntensity,
        mainIntensity: patternSettings.mainIntensity,
        scope: patternSettings.scope,
      },
    };
  }

  function applyCloudSettings(settings: CloudSettings) {
    if (settings.colorScheme) setColorScheme(settings.colorScheme as Parameters<typeof setColorScheme>[0]);
    if (settings.fontFamily) setFontFamily(settings.fontFamily as Parameters<typeof setFontFamily>[0]);
    if (settings.fontSizeLevel) setFontSizeLevel(settings.fontSizeLevel as Parameters<typeof setFontSizeLevel>[0]);
    if (settings.theme) setTheme(settings.theme as Parameters<typeof setTheme>[0]);
    if (settings.locale) setLocale(settings.locale as Parameters<typeof setLocale>[0]);
    if (settings.pattern) {
      setPatternSettings({
        name: settings.pattern.name as Parameters<typeof setPatternSettings>[0]["name"],
        sidebarIntensity: settings.pattern.sidebarIntensity as Parameters<typeof setPatternSettings>[0]["sidebarIntensity"],
        mainIntensity: settings.pattern.mainIntensity as Parameters<typeof setPatternSettings>[0]["mainIntensity"],
        scope: settings.pattern.scope as Parameters<typeof setPatternSettings>[0]["scope"],
      });
    }
  }

  const handleKeepLocal = useCallback(async () => {
    // Backup cloud data
    if (cloudData) {
      try {
        localStorage.setItem("cv-builder-backup", JSON.stringify(cloudData.cvData));
      } catch { /* ignore */ }
    }
    setShowConflict(false);
    setCloudData(null);
    // Upload base64 photo to R2 if needed, then save to cloud
    try {
      setStatus("syncing");
      const dataToSave = await ensurePhotoUploaded(data);
      const settings = buildSettings();
      await saveCV(dataToSave, settings);
      lastSavedFingerprint.current = cvContentFingerprint(dataToSave);
      lastSavedSettings.current = JSON.stringify(settings);
      initialSyncComplete.current = true;
      setStatus("synced");
      setLastError(null);
    } catch (err) {
      console.error("CloudSync: failed to push local to cloud", err);
      setStatus("error");
      setLastError(tSync("saveError"));
      toast.error(tSync("saveError"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, cloudData]);

  const handleUseCloud = useCallback(() => {
    if (!cloudData) return;
    // Backup local data
    try {
      localStorage.setItem("cv-builder-backup", JSON.stringify(data));
    } catch { /* ignore */ }
    // Apply cloud data
    importData(cloudData.cvData);
    applyCloudSettings(cloudData.settings);
    lastSavedFingerprint.current = cvContentFingerprint(cloudData.cvData);
    lastSavedSettings.current = JSON.stringify(cloudData.settings);
    initialSyncComplete.current = true;
    setShowConflict(false);
    setCloudData(null);
    setStatus("synced");
    setLastError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, cloudData, importData]);

  // -----------------------------------------------------------------------
  // Conflict resolution dialog
  // -----------------------------------------------------------------------
  if (showConflict && cloudData) {
    return (
      <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t("title")}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t("description", { date: "" })}
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={handleKeepLocal}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {t("useLocal")}
            </button>
            <button
              onClick={handleUseCloud}
              className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
            >
              {t("useCloud")}
            </button>
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
            {t("backup")}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
