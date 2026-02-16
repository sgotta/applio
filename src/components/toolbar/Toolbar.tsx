"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { useAppLocale, LOCALES, LOCALE_NAMES } from "@/lib/locale-context";
import { filenameDateStamp } from "@/lib/utils";
import { CVData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme, Theme } from "@/lib/theme-context";
import { useColorScheme } from "@/lib/color-scheme-context";
import { useSidebarPattern } from "@/lib/sidebar-pattern-context";
import { useFontSettings } from "@/lib/font-context";
import { FONT_FAMILIES, FONT_SIZE_LEVEL_IDS, CJK_LOCALES, getFontDefinition, type FontFamilyId, type FontSizeLevel } from "@/lib/fonts";
import { SIDEBAR_PATTERN_NAMES, SIDEBAR_PATTERNS, PATTERN_SCOPES, type PatternScope, type PatternIntensity } from "@/lib/sidebar-patterns";
import { Slider } from "@/components/ui/slider";
import { COLOR_SCHEME_NAMES, COLOR_SCHEMES, type ColorSchemeName } from "@/lib/color-schemes";
import { useEditMode } from "@/lib/edit-mode-context";
import { buildSharedData, compressSharedData, generateShareURL } from "@/lib/sharing";
import { toast } from "sonner";
import {
  Download, FileUp, FileDown, FileText, Globe, Type,
  SlidersHorizontal, Check, Sun, Moon, Monitor,
  Menu, X, ChevronRight, ChevronLeft, Palette, Layers,
  Loader2, MoreHorizontal, Link,
  PanelLeft, PanelRight, Square,
  Pencil, Eye,
} from "lucide-react";

const CACHE_EXPIRY_MS = 15 * 24 * 60 * 60 * 1000; // 15 days

function hashString(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

interface ImageUploadCache {
  hash: string;
  url: string;
  uploadedAt: number;
}

interface ToolbarProps {
  onPrintPDF: () => void | Promise<void>;
  isGeneratingPDF?: boolean;
}

function isValidCVData(data: unknown): data is CVData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.personalInfo === "object" &&
    d.personalInfo !== null &&
    typeof (d.personalInfo as Record<string, unknown>).fullName === "string" &&
    Array.isArray(d.experience) &&
    Array.isArray(d.education) &&
    Array.isArray(d.skills) &&
    typeof d.summary === "string"
  );
}

function SectionToggle({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-1 cursor-pointer">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </label>
  );
}

type MobileMenuPage = "main" | "language" | "theme" | "color" | "pattern" | "font" | "sections";

export function Toolbar({ onPrintPDF, isGeneratingPDF }: ToolbarProps) {
  const { data, importData, toggleSection } = useCV();
  const { isViewMode, toggleEditMode } = useEditMode();
  const t = useTranslations("toolbar");
  const te = useTranslations("editMode");
  const tl = useTranslations("languages");
  const { locale, setLocale } = useAppLocale();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { colorSchemeName, setColorScheme } = useColorScheme();
  const { patternName, setPattern, sidebarIntensity, mainIntensity, scope, setSidebarIntensity, setMainIntensity, setScope, patternSettings, setPatternSettings } = useSidebarPattern();
  const { fontFamilyId, fontSizeLevel, setFontFamily, setFontSizeLevel } = useFontSettings();
  const isCJKLocale = CJK_LOCALES.has(locale);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuPage, setMobileMenuPage] = useState<MobileMenuPage>("main");

  const THEME_OPTIONS: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: "light", icon: Sun, label: t("themeLight") },
    { value: "dark", icon: Moon, label: t("themeDark") },
    { value: "system", icon: Monitor, label: t("themeSystem") },
  ];

  const ThemeIcon = resolvedTheme === "dark" ? Moon : Sun;

  const exportToJSON = () => {
    const exportData = {
      ...data,
      settings: {
        colorScheme: colorSchemeName,
        fontFamily: fontFamilyId,
        fontSizeLevel,
        pattern: patternSettings,
      },
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    const name = data.personalInfo.fullName.replace(/\s+/g, "-");
    link.download = `CV-${name}_${filenameDateStamp(locale)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const parsed = JSON.parse(result);

        if (!isValidCVData(parsed)) {
          alert(t("importFormatError"));
          return;
        }

        if (confirm(t("importConfirm"))) {
          importData(parsed);
          // Restore visual settings if present
          const settings = (parsed as unknown as Record<string, unknown>).settings as
            | { colorScheme?: string; fontFamily?: string; fontSizeLevel?: number; pattern?: { name: string; sidebarIntensity?: number; mainIntensity?: number; intensity?: number; scope: string } }
            | undefined;
          if (settings) {
            if (settings.colorScheme) setColorScheme(settings.colorScheme as ColorSchemeName);
            if (settings.fontFamily) setFontFamily(settings.fontFamily as FontFamilyId);
            if (settings.fontSizeLevel) setFontSizeLevel(settings.fontSizeLevel as FontSizeLevel);
            if (settings.pattern) {
              setPatternSettings({
                name: settings.pattern.name as Parameters<typeof setPattern>[0],
                sidebarIntensity: (settings.pattern.sidebarIntensity ?? 3) as PatternIntensity,
                mainIntensity: (settings.pattern.mainIntensity ?? 2) as PatternIntensity,
                scope: settings.pattern.scope as PatternScope,
              });
            }
          }
        }
      } catch {
        alert(t("importReadError"));
      }
    };
    reader.readAsText(file);

    e.target.value = "";
  };

  const handleMobileMenuOpen = useCallback((open: boolean) => {
    setMobileMenuOpen(open);
    if (!open) setMobileMenuPage("main");
  }, []);

  const [isSharing, setIsSharing] = useState(false);
  const [showUploadOverlay, setShowUploadOverlay] = useState(false);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);

  // Mejora 2: Image upload cache
  const imageCache = useRef<ImageUploadCache | null>(null);
  const prevPhotoRef = useRef(data.personalInfo.photo);
  useEffect(() => {
    if (data.personalInfo.photo !== prevPhotoRef.current) {
      imageCache.current = null;
      prevPhotoRef.current = data.personalInfo.photo;
    }
  }, [data.personalInfo.photo]);


  // Mejora 1: Prevent tab close during upload
  useEffect(() => {
    if (!showUploadOverlay) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [showUploadOverlay]);

  // Mejora 6: Share requires name
  const canShare = data.personalInfo.fullName.trim().length > 0;

  const handleShare = useCallback(async () => {
    if (!canShare || isSharing) return;
    setIsSharing(true);
    setFileMenuOpen(false);

    const settings = { colorScheme: colorSchemeName, fontSizeLevel, marginLevel: 1, fontFamily: fontFamilyId, pattern: patternSettings };
    let photoUrl: string | undefined;

    if (data.personalInfo.photo) {
      const currentHash = hashString(data.personalInfo.photo);
      const cached = imageCache.current;

      if (cached && cached.hash === currentHash && (Date.now() - cached.uploadedAt) < CACHE_EXPIRY_MS) {
        photoUrl = cached.url;
      } else {
        setShowUploadOverlay(true);
        try {
          const res = await fetch(data.personalInfo.photo);
          const blob = await res.blob();
          const formData = new FormData();
          formData.append("photo", blob, "photo.jpg");

          const uploadRes = await fetch("/api/upload-photo", {
            method: "POST",
            body: formData,
          });
          const result = await uploadRes.json();
          if (result.success && result.url) {
            photoUrl = result.url;
            imageCache.current = { hash: currentHash, url: result.url, uploadedAt: Date.now() };
          }
        } catch {
          // Upload failed — continue without photo
        } finally {
          setShowUploadOverlay(false);
        }
      }
    }

    const shared = buildSharedData(data, settings, photoUrl);
    const compressed = compressSharedData(shared);
    const url = generateShareURL(compressed);

    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("shareLinkCopied"));
    } catch {
      // Clipboard not available — open link in new tab as fallback
      window.open(url, "_blank");
    }

    setIsSharing(false);
  }, [data, colorSchemeName, isSharing, canShare, patternSettings, fontFamilyId, fontSizeLevel, t]);

  const menuItemClass =
    "flex w-full items-center justify-between rounded-sm px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-accent transition-colors";

  const backButtonClass =
    "flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors";

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-border bg-white/80 dark:bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-1.5">
          <FileText className="h-5 w-5 text-gray-900 dark:text-gray-100" />
          <div className="flex items-baseline gap-2">
            <span className="font-display text-base font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Applio
            </span>
            <span className="hidden text-[11px] font-light tracking-wide text-gray-400 dark:text-gray-500 sm:inline">
              {t("tagline")}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Hidden file input for import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
            aria-label={t("importAriaLabel")}
          />

          {/* ===== DESKTOP BUTTONS (hidden on mobile) ===== */}
          <div className="hidden md:flex items-center gap-1">
            {/* Language selector */}
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      <Globe className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("language")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-48 p-1" align="end">
                <div className="space-y-0.5">
                  {LOCALES.map((code) => {
                    const translated = tl(code);
                    const native = LOCALE_NAMES[code];
                    return (
                    <button
                      key={code}
                      onClick={() => setLocale(code)}
                      className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-accent transition-colors"
                    >
                      <span>
                        {native}
                        <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">({translated})</span>
                      </span>
                      {locale === code && (
                        <Check className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                      )}
                    </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            {/* Theme toggle */}
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      <ThemeIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("theme")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-40 p-1" align="end">
                <div className="space-y-0.5">
                  {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => setTheme(value)}
                      className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-accent transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {label}
                      </span>
                      {theme === value && (
                        <Check className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                      )}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Color scheme picker */}
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      <Palette className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("colorScheme")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-auto p-3" align="end">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                  {t("colorScheme")}
                </p>
                <div className="flex gap-2">
                  {COLOR_SCHEME_NAMES.map((name) => {
                    const scheme = COLOR_SCHEMES[name];
                    const isLight = scheme.sidebarText !== "#ffffff";
                    return (
                      <Tooltip key={name}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setColorScheme(name)}
                            className={`relative h-7 w-7 rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 ${isLight ? "ring-1 ring-inset ring-black/10" : ""}`}
                            style={{ backgroundColor: scheme.sidebarBg }}
                          >
                            {colorSchemeName === name && (
                              <Check className={`absolute inset-0 m-auto h-3.5 w-3.5 drop-shadow-sm ${isLight ? "text-gray-800" : "text-white"}`} />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t(`colorScheme${name.charAt(0).toUpperCase() + name.slice(1)}` as Parameters<typeof t>[0])}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            {/* Pattern picker (pattern + intensity + scope) */}
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      <Layers className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("sidebarPattern")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-64 p-3 space-y-4" align="end">
                {/* Pattern selection */}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                    {t("sidebarPattern")}
                  </p>
                  <div className="flex gap-3">
                    {SIDEBAR_PATTERN_NAMES.map((name) => {
                      const isActive = patternName === name;
                      const isNone = name === "none";
                      return (
                        <div key={name} className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => setPattern(name)}
                            className={`relative h-9 w-9 rounded-md border overflow-hidden transition-all hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 ${
                              isActive
                                ? "border-gray-900 dark:border-gray-100 ring-1 ring-gray-900 dark:ring-gray-100"
                                : "border-gray-200 dark:border-gray-700"
                            }`}
                            style={{
                              backgroundColor: isNone ? "white" : COLOR_SCHEMES[colorSchemeName].sidebarBg,
                              ...(!isNone ? SIDEBAR_PATTERNS[name].getStyle(COLOR_SCHEMES[colorSchemeName].sidebarText, sidebarIntensity) : {}),
                            }}
                          >
                            {isNone && (
                              <span className="absolute inset-0" style={{ background: "linear-gradient(to top left, transparent calc(50% - 1px), #ef4444 calc(50% - 1px), #ef4444 calc(50% + 1px), transparent calc(50% + 1px))" }} />
                            )}
                            {isActive && !isNone && (
                              <Check className={`absolute inset-0 m-auto h-3.5 w-3.5 drop-shadow-sm ${
                                COLOR_SCHEMES[colorSchemeName].sidebarText === "#ffffff" ? "text-white" : "text-gray-800"
                              }`} />
                            )}
                          </button>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            {t(`pattern${name.charAt(0).toUpperCase() + name.slice(1)}` as Parameters<typeof t>[0])}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Intensity sliders */}
                <div className={patternName === "none" ? "opacity-40 pointer-events-none" : ""}>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                    {t("patternIntensity")}
                  </p>
                  <div className="space-y-2">
                    <div className={scope === "main" ? "opacity-40 pointer-events-none" : ""}>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">{t("patternScopeSidebar")}</p>
                      <div className="flex items-center gap-3">
                        <Slider min={1} max={5} step={1} value={[sidebarIntensity]} onValueChange={([v]) => setSidebarIntensity(v as PatternIntensity)} className="flex-1" />
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-5 text-center">{sidebarIntensity}</span>
                      </div>
                    </div>
                    <div className={scope === "sidebar" ? "opacity-40 pointer-events-none" : ""}>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">{t("patternScopeMain")}</p>
                      <div className="flex items-center gap-3">
                        <Slider min={1} max={5} step={1} value={[mainIntensity]} onValueChange={([v]) => setMainIntensity(v as PatternIntensity)} className="flex-1" />
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-5 text-center">{mainIntensity}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scope selector */}
                <div className={patternName === "none" ? "opacity-40 pointer-events-none" : ""}>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                    {t("patternScope")}
                  </p>
                  <div className="flex gap-1.5">
                    {PATTERN_SCOPES.map((s) => {
                      const ScopeIcon = s === "sidebar" ? PanelLeft : s === "main" ? PanelRight : Square;
                      return (
                        <Tooltip key={s}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setScope(s)}
                              className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors ${
                                scope === s
                                  ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-accent dark:text-gray-400 dark:hover:bg-accent/80"
                              }`}
                            >
                              <ScopeIcon className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t(`patternScope${s.charAt(0).toUpperCase() + s.slice(1)}` as Parameters<typeof t>[0])}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Font settings */}
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      <Type className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("fontSettings")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-56 p-3 space-y-4" align="end">
                {/* Font Family list (hidden for CJK locales) */}
                {!isCJKLocale && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                      {t("fontFamily")}
                    </p>
                    <div className="space-y-0.5 max-h-64 overflow-y-auto">
                      {FONT_FAMILIES.map((font) => (
                        <button
                          key={font.id}
                          onClick={() => setFontFamily(font.id)}
                          className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-accent transition-colors"
                          style={{ fontFamily: font.cssStack }}
                        >
                          <span>{font.displayName}</span>
                          {fontFamilyId === font.id && (
                            <Check className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Font Size */}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                    {t("fontSize")}
                  </p>
                  <div className="flex gap-1.5">
                    {FONT_SIZE_LEVEL_IDS.map((level) => {
                      const labels: Record<number, string> = { 1: "S", 2: "M", 3: "L" };
                      return (
                        <button
                          key={level}
                          onClick={() => setFontSizeLevel(level)}
                          className={`h-7 w-7 rounded-md flex items-center justify-center text-xs font-medium transition-colors ${
                            fontSizeLevel === level
                              ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-accent dark:text-gray-400 dark:hover:bg-accent/80"
                          }`}
                        >
                          {labels[level]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Sections toggle */}
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("sections")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">{t("sectionsTitle")}</p>
                    <SectionToggle label={t("sectionEmail")} checked={data.visibility.email} onToggle={() => toggleSection("email")} />
                    <SectionToggle label={t("sectionPhone")} checked={data.visibility.phone} onToggle={() => toggleSection("phone")} />
                    <SectionToggle label={t("sectionLocation")} checked={data.visibility.location} onToggle={() => toggleSection("location")} />
                    <SectionToggle label={t("sectionLinkedin")} checked={data.visibility.linkedin} onToggle={() => toggleSection("linkedin")} />
                    <SectionToggle label={t("sectionWebsite")} checked={data.visibility.website} onToggle={() => toggleSection("website")} />
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">{t("optionalSections")}</p>
                    <SectionToggle label={t("sectionCourses")} checked={data.visibility.courses} onToggle={() => toggleSection("courses")} />
                    <SectionToggle label={t("sectionCertifications")} checked={data.visibility.certifications} onToggle={() => toggleSection("certifications")} />
                    <SectionToggle label={t("sectionAwards")} checked={data.visibility.awards} onToggle={() => toggleSection("awards")} />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Divider between settings and file actions */}
            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Edit/View mode toggle — desktop only */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleEditMode}
                  className="hidden md:inline-flex h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  {isViewMode ? <Pencil className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isViewMode ? te("switchToEdit") : te("switchToView")}</TooltipContent>
            </Tooltip>

            {/* File actions menu */}
            <Popover open={fileMenuOpen} onOpenChange={setFileMenuOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1" align="end">
                <div className="space-y-0.5">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-accent transition-colors"
                  >
                    <FileUp className="h-4 w-4" />
                    <span className="flex items-baseline gap-2.5">
                      {t("import")}
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">{t("free")}</span>
                    </span>
                  </button>
                  <button
                    onClick={exportToJSON}
                    className="flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-accent transition-colors"
                  >
                    <FileDown className="h-4 w-4" />
                    <span className="flex items-baseline gap-2.5">
                      {t("export")}
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">{t("free")}</span>
                    </span>
                  </button>
                  <div className="my-1 border-t border-gray-100 dark:border-border" />
                  <button
                    onClick={handleShare}
                    disabled={isSharing || !canShare}
                    className={`flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-accent transition-colors ${!canShare ? "opacity-50" : ""}`}
                  >
                    <Link className="h-4 w-4" />
                    {t("share")}
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* ===== MOBILE HAMBURGER MENU (visible only on mobile) ===== */}
          <Popover open={mobileMenuOpen} onOpenChange={handleMobileMenuOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <span className="relative size-5">
                  <Menu
                    className={`size-5 absolute inset-0 transition-all duration-200 ${
                      mobileMenuOpen
                        ? "opacity-0 rotate-90 scale-75"
                        : "opacity-100 rotate-0 scale-100"
                    }`}
                  />
                  <X
                    className={`size-5 absolute inset-0 transition-all duration-200 ${
                      mobileMenuOpen
                        ? "opacity-100 rotate-0 scale-100"
                        : "opacity-0 -rotate-90 scale-75"
                    }`}
                  />
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-1.5" align="end">
              {mobileMenuPage === "main" && (
                <div className="space-y-0.5">
                  {/* Language */}
                  <button onClick={() => setMobileMenuPage("language")} className={menuItemClass}>
                    <span className="flex items-center gap-2.5">
                      <Globe className="h-4 w-4" />
                      {t("language")}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      {LOCALE_NAMES[locale]}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>

                  {/* Theme */}
                  <button onClick={() => setMobileMenuPage("theme")} className={menuItemClass}>
                    <span className="flex items-center gap-2.5">
                      <ThemeIcon className="h-4 w-4" />
                      {t("theme")}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      {THEME_OPTIONS.find((o) => o.value === theme)?.label}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>

                  {/* Color */}
                  <button onClick={() => setMobileMenuPage("color")} className={menuItemClass}>
                    <span className="flex items-center gap-2.5">
                      <Palette className="h-4 w-4" />
                      {t("colorScheme")}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLOR_SCHEMES[colorSchemeName].sidebarBg }}
                      />
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>

                  {/* Pattern */}
                  <button onClick={() => setMobileMenuPage("pattern")} className={menuItemClass}>
                    <span className="flex items-center gap-2.5">
                      <Layers className="h-4 w-4" />
                      {t("sidebarPattern")}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      {t(`pattern${patternName.charAt(0).toUpperCase() + patternName.slice(1)}` as Parameters<typeof t>[0])}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>

                  {/* Font */}
                  <button onClick={() => setMobileMenuPage("font")} className={menuItemClass}>
                    <span className="flex items-center gap-2.5">
                      <Type className="h-4 w-4" />
                      {t("fontSettings")}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      {getFontDefinition(fontFamilyId).displayName}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>

                  {/* Sections */}
                  <button onClick={() => setMobileMenuPage("sections")} className={menuItemClass}>
                    <span className="flex items-center gap-2.5">
                      <SlidersHorizontal className="h-4 w-4" />
                      {t("sections")}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                  </button>

                  {/* Divider */}
                  <div className="my-1.5 border-t border-gray-100 dark:border-border" />

                  {/* Import */}
                  <button onClick={() => fileInputRef.current?.click()} className={menuItemClass}>
                    <span className="flex items-center gap-2.5">
                      <FileUp className="h-4 w-4" />
                      <span className="flex items-baseline gap-2.5">
                        {t("import")}
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">{t("free")}</span>
                      </span>
                    </span>
                  </button>

                  {/* Export JSON */}
                  <button onClick={exportToJSON} className={menuItemClass}>
                    <span className="flex items-center gap-2.5">
                      <FileDown className="h-4 w-4" />
                      <span className="flex items-baseline gap-2.5">
                        {t("export")}
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">{t("free")}</span>
                      </span>
                    </span>
                  </button>

                  {/* Copy link */}
                  <button onClick={() => { setMobileMenuOpen(false); handleShare(); }} disabled={isSharing || !canShare} className={`${menuItemClass} ${!canShare ? "opacity-50" : ""}`}>
                    <span className="flex items-center gap-2.5">
                      <Link className="h-4 w-4" />
                      {t("share")}
                    </span>
                  </button>

                  {/* Divider */}
                  <div className="mt-1.5 mb-3 border-t border-gray-100 dark:border-border" />

                  {/* Export PDF — prominent */}
                  <button
                    onClick={onPrintPDF}
                    disabled={isGeneratingPDF}
                    className="mx-auto mb-1.5 flex items-center justify-center gap-2 rounded-md px-8 py-2.5 text-sm font-medium transition-colors bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 disabled:opacity-50"
                  >
                    {isGeneratingPDF ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    PDF
                  </button>
                </div>
              )}

              {mobileMenuPage === "language" && (
                <div>
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {t("language")}
                  </button>
                  <div className="space-y-0.5 mt-1">
                    {LOCALES.map((code) => {
                      const translated = tl(code);
                      const native = LOCALE_NAMES[code];
                      return (
                      <button
                        key={code}
                        onClick={() => {
                          setLocale(code);
                          setMobileMenuPage("main");
                        }}
                        className={menuItemClass}
                      >
                        <span>
                          {native}
                          {translated !== native && (
                            <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">({translated})</span>
                          )}
                        </span>
                        {locale === code && (
                          <Check className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                        )}
                      </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {mobileMenuPage === "theme" && (
                <div>
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {t("theme")}
                  </button>
                  <div className="space-y-0.5 mt-1">
                    {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        onClick={() => {
                          setTheme(value);
                          setMobileMenuPage("main");
                        }}
                        className={menuItemClass}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4" />
                          {label}
                        </span>
                        {theme === value && (
                          <Check className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mobileMenuPage === "color" && (
                <div>
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {t("colorScheme")}
                  </button>
                  <div className="flex flex-wrap gap-2 px-3 pt-2 pb-1">
                    {COLOR_SCHEME_NAMES.map((name) => {
                      const scheme = COLOR_SCHEMES[name];
                      const isLight = scheme.sidebarText !== "#ffffff";
                      return (
                        <button
                          key={name}
                          onClick={() => {
                            setColorScheme(name);
                            setMobileMenuPage("main");
                          }}
                          className="relative flex flex-col items-center gap-1"
                        >
                          <span
                            className={`relative h-8 w-8 rounded-full transition-transform hover:scale-110 ${isLight ? "ring-1 ring-inset ring-black/10" : ""}`}
                            style={{ backgroundColor: scheme.sidebarBg }}
                          >
                            {colorSchemeName === name && (
                              <Check className={`absolute inset-0 m-auto h-4 w-4 drop-shadow-sm ${isLight ? "text-gray-800" : "text-white"}`} />
                            )}
                          </span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            {t(`colorScheme${name.charAt(0).toUpperCase() + name.slice(1)}` as Parameters<typeof t>[0])}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {mobileMenuPage === "pattern" && (
                <div>
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {t("sidebarPattern")}
                  </button>
                  <div className="px-3 pt-2 pb-1 space-y-4">
                    {/* Pattern selection */}
                    <div className="flex flex-wrap gap-2">
                      {SIDEBAR_PATTERN_NAMES.map((name) => {
                        const isActive = patternName === name;
                        const scheme = COLOR_SCHEMES[colorSchemeName];
                        const isLight = scheme.sidebarText !== "#ffffff";
                        const isNone = name === "none";
                        return (
                          <button
                            key={name}
                            onClick={() => setPattern(name)}
                            className="relative flex flex-col items-center gap-1"
                          >
                            <span
                              className={`relative h-9 w-9 rounded-md border overflow-hidden transition-transform hover:scale-105 ${
                                isActive
                                  ? "border-gray-900 dark:border-gray-100 ring-1 ring-gray-900 dark:ring-gray-100"
                                  : "border-gray-200 dark:border-gray-700"
                              }`}
                              style={{
                                backgroundColor: isNone ? "white" : scheme.sidebarBg,
                                ...(!isNone ? SIDEBAR_PATTERNS[name].getStyle(scheme.sidebarText, sidebarIntensity) : {}),
                              }}
                            >
                              {isNone && (
                                <span className="absolute inset-0" style={{ background: "linear-gradient(to top left, transparent calc(50% - 1px), #ef4444 calc(50% - 1px), #ef4444 calc(50% + 1px), transparent calc(50% + 1px))" }} />
                              )}
                              {isActive && !isNone && (
                                <Check className={`absolute inset-0 m-auto h-4 w-4 drop-shadow-sm ${isLight ? "text-gray-800" : "text-white"}`} />
                              )}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                              {t(`pattern${name.charAt(0).toUpperCase() + name.slice(1)}` as Parameters<typeof t>[0])}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Intensity sliders */}
                    <div className={patternName === "none" ? "opacity-40 pointer-events-none" : ""}>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                        {t("patternIntensity")}
                      </p>
                      <div className="space-y-2">
                        <div className={scope === "main" ? "opacity-40 pointer-events-none" : ""}>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">{t("patternScopeSidebar")}</p>
                          <div className="flex items-center gap-3">
                            <Slider min={1} max={5} step={1} value={[sidebarIntensity]} onValueChange={([v]) => setSidebarIntensity(v as PatternIntensity)} className="flex-1" />
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-5 text-center">{sidebarIntensity}</span>
                          </div>
                        </div>
                        <div className={scope === "sidebar" ? "opacity-40 pointer-events-none" : ""}>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">{t("patternScopeMain")}</p>
                          <div className="flex items-center gap-3">
                            <Slider min={1} max={5} step={1} value={[mainIntensity]} onValueChange={([v]) => setMainIntensity(v as PatternIntensity)} className="flex-1" />
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-5 text-center">{mainIntensity}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Scope selector */}
                    <div className={patternName === "none" ? "opacity-40 pointer-events-none" : ""}>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                        {t("patternScope")}
                      </p>
                      <div className="flex gap-1.5">
                        {PATTERN_SCOPES.map((s) => {
                          const ScopeIcon = s === "sidebar" ? PanelLeft : s === "main" ? PanelRight : Square;
                          return (
                            <button
                              key={s}
                              onClick={() => setScope(s)}
                              className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors ${
                                scope === s
                                  ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-accent dark:text-gray-400 dark:hover:bg-accent/80"
                              }`}
                            >
                              <ScopeIcon className="h-3.5 w-3.5" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {mobileMenuPage === "font" && (
                <div>
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {t("fontSettings")}
                  </button>
                  <div className="px-3 pt-2 pb-1 space-y-4">
                    {/* Font Family (hidden for CJK locales) */}
                    {!isCJKLocale && (
                      <div className="space-y-0.5">
                        {FONT_FAMILIES.map((font) => (
                          <button
                            key={font.id}
                            onClick={() => setFontFamily(font.id)}
                            className={menuItemClass}
                            style={{ fontFamily: font.cssStack }}
                          >
                            <span>{font.displayName}</span>
                            {fontFamilyId === font.id && <Check className="h-4 w-4 text-gray-900 dark:text-gray-100" />}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Font Size */}
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                        {t("fontSize")}
                      </p>
                      <div className="flex gap-1.5">
                        {FONT_SIZE_LEVEL_IDS.map((level) => {
                          const labels: Record<number, string> = { 1: "S", 2: "M", 3: "L" };
                          return (
                            <button
                              key={level}
                              onClick={() => setFontSizeLevel(level)}
                              className={`h-7 w-7 rounded-md flex items-center justify-center text-xs font-medium transition-colors ${
                                fontSizeLevel === level
                                  ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-accent dark:text-gray-400 dark:hover:bg-accent/80"
                              }`}
                            >
                              {labels[level]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {mobileMenuPage === "sections" && (
                <div>
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {t("sections")}
                  </button>
                  <div className="px-2 pt-2 pb-1 space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">{t("sectionsTitle")}</p>
                      <SectionToggle label={t("sectionEmail")} checked={data.visibility.email} onToggle={() => toggleSection("email")} />
                      <SectionToggle label={t("sectionPhone")} checked={data.visibility.phone} onToggle={() => toggleSection("phone")} />
                      <SectionToggle label={t("sectionLocation")} checked={data.visibility.location} onToggle={() => toggleSection("location")} />
                      <SectionToggle label={t("sectionLinkedin")} checked={data.visibility.linkedin} onToggle={() => toggleSection("linkedin")} />
                      <SectionToggle label={t("sectionWebsite")} checked={data.visibility.website} onToggle={() => toggleSection("website")} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">{t("optionalSections")}</p>
                      <SectionToggle label={t("sectionCourses")} checked={data.visibility.courses} onToggle={() => toggleSection("courses")} />
                      <SectionToggle label={t("sectionCertifications")} checked={data.visibility.certifications} onToggle={() => toggleSection("certifications")} />
                      <SectionToggle label={t("sectionAwards")} checked={data.visibility.awards} onToggle={() => toggleSection("awards")} />
                    </div>
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Export PDF — desktop only (on mobile it's inside the hamburger menu) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="hidden md:inline-flex ml-1 bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                onClick={onPrintPDF}
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-1.5 h-4 w-4" />
                )}
                <span>PDF</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("pdfTitle")}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>

    {/* Full-screen overlay during photo upload */}
    {showUploadOverlay && (
      <div
        className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        role="alert"
        aria-busy="true"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-white" />
          <p className="text-sm font-medium text-white">
            {t("shareOverlayMessage")}
          </p>
        </div>
      </div>
    )}
    </>
  );
}
