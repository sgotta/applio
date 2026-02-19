"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { useAppLocale, LOCALES, LOCALE_NAMES } from "@/lib/locale-context";
import { filenameDateStamp } from "@/lib/utils";
import { CVData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/lib/theme-context";
import { useColorScheme } from "@/lib/color-scheme-context";
import { useSidebarPattern } from "@/lib/sidebar-pattern-context";
import { useFontSettings } from "@/lib/font-context";
import { FONT_FAMILIES, FONT_SIZE_LEVEL_IDS, type FontFamilyId, type FontSizeLevel } from "@/lib/fonts";
import { SIDEBAR_PATTERN_NAMES, SIDEBAR_PATTERNS, PATTERN_SCOPES, type PatternScope, type PatternIntensity, type SidebarPatternName } from "@/lib/sidebar-patterns";
import { Slider } from "@/components/ui/slider";
import { COLOR_SCHEME_NAMES, COLOR_SCHEMES, type ColorSchemeName } from "@/lib/color-schemes";
import { buildSharedData, compressSharedData, generateShareURL } from "@/lib/sharing";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { usePlan } from "@/lib/plan-context";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { UpgradeDialog } from "@/components/premium/UpgradeDialog";
import {
  Download, FileUp, FileDown, FileText, FolderDown, Globe, Type,
  SlidersHorizontal, Check, Sun, Moon,
  Menu, X, ChevronRight, ChevronLeft, Palette,
  Loader2, Link, LogIn, LogOut, User, Copy, ExternalLink,
  PanelLeft, PanelRight, Square, Lock, HardDrive, Cloud, Layers, FlaskConical,
} from "lucide-react";

const CACHE_EXPIRY_MS = 15 * 24 * 60 * 60 * 1000; // 15 days

/* ── Free-tier feature limits ──────────────────────────── */
const FREE_COLORS: ColorSchemeName[] = ["default"];
const FREE_FONTS: FontFamilyId[] = ["inter", "lato"];

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
  locked,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  locked?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-1.5 cursor-pointer">
      <span className="flex items-center gap-2 text-[15px] text-gray-700 dark:text-gray-200">
        {label}
        {locked && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
            <Lock className="h-2.5 w-2.5" />
            PRO
          </span>
        )}
      </span>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </label>
  );
}

function UserAvatar({ url, size }: { url?: string; size: number }) {
  const [failed, setFailed] = useState(false);
  const sizeClass = size === 8 ? "h-8 w-8" : "h-7 w-7";
  const iconSize = size === 8 ? "h-4 w-4" : "h-3.5 w-3.5";

  if (url && !failed) {
    return (
      <img
        src={url}
        alt=""
        referrerPolicy="no-referrer"
        className={`${sizeClass} object-cover`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className={`${sizeClass} flex items-center justify-center bg-gray-100 dark:bg-accent`}>
      <User className={`${iconSize} text-gray-500`} />
    </div>
  );
}

function SyncStatusRow({
  expanded,
  onToggle,
  isPremium,
  t,
}: {
  expanded: boolean;
  onToggle: () => void;
  isPremium: boolean;
  t: (key: string) => string;
}) {
  const StatusIcon = isPremium ? Cloud : HardDrive;
  return (
    <button
      className="w-full px-4 py-2.5 border-b border-gray-100 dark:border-border text-left hover:bg-gray-50 dark:hover:bg-accent/50 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-center gap-2">
        <StatusIcon className="h-3.5 w-3.5 text-gray-400" />
        {isPremium ? (
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_1px_rgba(16,185,129,0.4)]" />
          </span>
        ) : (
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400/40 animate-pulse" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_2px_rgba(245,158,11,0.4)]" />
          </span>
        )}
        <span className="text-xs text-gray-400">
          {isPremium ? t("syncCloud") : t("syncLocal")}
        </span>
      </div>
      <div
        className="grid transition-[grid-template-rows,opacity] duration-200 ease-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr", opacity: expanded ? 1 : 0 }}
      >
        <div className="overflow-hidden">
          <p className="text-[11px] text-gray-400/80 mt-1.5 leading-relaxed">
            {isPremium ? t("syncCloudExplain") : t("syncLocalExplain")}
          </p>
          {!isPremium && (
            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1 leading-relaxed">
              {t("syncProHint")}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

/* ── Shared sub-components for Design content ──────────── */

function ColorSection({
  colorSchemeName,
  setColorScheme,
  isPremium,
  onUpgrade,
  t,
}: {
  colorSchemeName: ColorSchemeName;
  setColorScheme: (name: ColorSchemeName) => void;
  isPremium: boolean;
  onUpgrade: () => void;
  t: (key: string) => string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-400 mb-2">
        {t("colorScheme")}
      </p>
      <div className="flex gap-2">
        {COLOR_SCHEME_NAMES.map((name) => {
          const scheme = COLOR_SCHEMES[name];
          const isLight = scheme.sidebarText !== "#ffffff";
          const isLocked = !isPremium && !FREE_COLORS.includes(name);
          return (
            <Tooltip key={name}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    if (isLocked) { onUpgrade(); return; }
                    setColorScheme(name);
                  }}
                  className={`relative h-7 w-7 rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 ${isLight ? "ring-1 ring-inset ring-black/10" : ""}`}
                  style={{ backgroundColor: scheme.sidebarBg }}
                >
                  {colorSchemeName === name && (
                    <Check className={`absolute inset-0 m-auto h-3.5 w-3.5 drop-shadow-sm ${isLight ? "text-gray-800" : "text-white"}`} />
                  )}
                  {isLocked && (
                    <Lock className={`absolute inset-0 m-auto h-3 w-3 drop-shadow-sm ${isLight ? "text-gray-800/60" : "text-white/70"}`} />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {t(`colorScheme${name.charAt(0).toUpperCase() + name.slice(1)}`)}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

function PatternSection({
  colorSchemeName,
  patternName,
  setPattern,
  sidebarIntensity,
  mainIntensity,
  scope,
  setSidebarIntensity,
  setMainIntensity,
  setScope,
  isPremium,
  onUpgrade,
  t,
}: {
  colorSchemeName: ColorSchemeName;
  patternName: SidebarPatternName;
  setPattern: (name: SidebarPatternName) => void;
  sidebarIntensity: PatternIntensity;
  mainIntensity: PatternIntensity;
  scope: PatternScope;
  setSidebarIntensity: (v: PatternIntensity) => void;
  setMainIntensity: (v: PatternIntensity) => void;
  setScope: (s: PatternScope) => void;
  isPremium: boolean;
  onUpgrade: () => void;
  t: (key: string) => string;
}) {
  return (
    <>
      {/* Pattern selection */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-400 mb-2">
          {t("sidebarPattern")}
        </p>
        <div className="flex gap-3">
          {SIDEBAR_PATTERN_NAMES.map((name) => {
            const isActive = patternName === name;
            const isNone = name === "none";
            const isLocked = !isPremium && !isNone;
            return (
              <div key={name} className="flex flex-col items-center gap-1">
                <button
                  onClick={() => {
                    if (isLocked) { onUpgrade(); return; }
                    setPattern(name);
                  }}
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
                  {isLocked && (
                    <Lock className="absolute inset-0 m-auto h-3 w-3 text-white/70 drop-shadow-sm" />
                  )}
                </button>
                <span className="text-[10px] text-gray-500 dark:text-gray-300">
                  {t(`pattern${name.charAt(0).toUpperCase() + name.slice(1)}`)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Intensity sliders */}
      <div className={patternName === "none" ? "opacity-40 pointer-events-none" : ""}>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-400 mb-2">
          {t("patternIntensity")}
        </p>
        <div className="space-y-2">
          <div className={scope === "main" ? "opacity-40 pointer-events-none" : ""}>
            <p className="text-[10px] text-gray-400 dark:text-gray-400 mb-1">{t("patternScopeSidebar")}</p>
            <div className="flex items-center gap-3">
              <Slider min={1} max={5} step={1} value={[sidebarIntensity]} onValueChange={([v]) => setSidebarIntensity(v as PatternIntensity)} className="flex-1" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-300 w-5 text-center">{sidebarIntensity}</span>
            </div>
          </div>
          <div className={scope === "sidebar" ? "opacity-40 pointer-events-none" : ""}>
            <p className="text-[10px] text-gray-400 dark:text-gray-400 mb-1">{t("patternScopeMain")}</p>
            <div className="flex items-center gap-3">
              <Slider min={1} max={5} step={1} value={[mainIntensity]} onValueChange={([v]) => setMainIntensity(v as PatternIntensity)} className="flex-1" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-300 w-5 text-center">{mainIntensity}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scope selector */}
      <div className={patternName === "none" ? "opacity-40 pointer-events-none" : ""}>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-400 mb-2">
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
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-accent dark:text-gray-300 dark:hover:bg-accent/80"
                    }`}
                  >
                    <ScopeIcon className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {t(`patternScope${s.charAt(0).toUpperCase() + s.slice(1)}`)}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </>
  );
}

function FontSection({
  fontFamilyId,
  fontSizeLevel,
  setFontFamily,
  setFontSizeLevel,
  isPremium,
  onUpgrade,
  t,
}: {
  fontFamilyId: FontFamilyId;
  fontSizeLevel: FontSizeLevel;
  setFontFamily: (id: FontFamilyId) => void;
  setFontSizeLevel: (level: FontSizeLevel) => void;
  isPremium: boolean;
  onUpgrade: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-4">
      {/* Font Family list */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-400 mb-2">
          {t("fontFamily")}
        </p>
        <div className="space-y-0.5 max-h-48 overflow-y-auto scrollbar-thin">
          {FONT_FAMILIES.map((font) => {
            const isLocked = !isPremium && !FREE_FONTS.includes(font.id);
            return (
              <button
                key={font.id}
                onClick={() => {
                  if (isLocked) { onUpgrade(); return; }
                  setFontFamily(font.id);
                }}
                className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-accent transition-colors"
                style={{ fontFamily: font.cssStack }}
              >
                <span className="flex items-center gap-2">
                  {font.displayName}
                  {isLocked && <Lock className="h-3 w-3 text-gray-400" />}
                </span>
                {fontFamilyId === font.id && (
                  <Check className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-400 mb-2">
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
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-accent dark:text-gray-300 dark:hover:bg-accent/80"
                }`}
              >
                {labels[level]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectionsContent({
  data,
  toggleSection,
  isPremium,
  onUpgrade,
  t,
}: {
  data: CVData;
  toggleSection: (key: keyof import("@/lib/types").SectionVisibility) => void;
  isPremium: boolean;
  onUpgrade: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-400 mb-1">{t("sectionsTitle")}</p>
        <SectionToggle label={t("sectionLocation")} checked={data.visibility.location} onToggle={() => toggleSection("location")} />
        <SectionToggle label={t("sectionLinkedin")} checked={data.visibility.linkedin} onToggle={() => toggleSection("linkedin")} />
        <SectionToggle label={t("sectionWebsite")} checked={data.visibility.website} onToggle={() => toggleSection("website")} />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-400 mb-1">{t("optionalSections")}</p>
        <SectionToggle label={t("sectionSummary")} checked={data.visibility.summary} onToggle={() => toggleSection("summary")} />
        <SectionToggle label={t("sectionCourses")} checked={data.visibility.courses} locked={!isPremium} onToggle={() => { if (!isPremium) { onUpgrade(); return; } toggleSection("courses"); }} />
        <SectionToggle label={t("sectionCertifications")} checked={data.visibility.certifications} locked={!isPremium} onToggle={() => { if (!isPremium) { onUpgrade(); return; } toggleSection("certifications"); }} />
        <SectionToggle label={t("sectionAwards")} checked={data.visibility.awards} locked={!isPremium} onToggle={() => { if (!isPremium) { onUpgrade(); return; } toggleSection("awards"); }} />
      </div>
    </div>
  );
}

/* ── Main Toolbar ──────────────────────────────────────── */

type MobileMenuPage = "main" | "color" | "pattern" | "font" | "sections" | "language";

export function Toolbar({ onPrintPDF, isGeneratingPDF }: ToolbarProps) {
  const { data, importData, toggleSection } = useCV();
  const { user, signOut } = useAuth();
  const { isPremium, devOverride, setDevOverride } = usePlan();
  const t = useTranslations("toolbar");
  const tauth = useTranslations("auth");
  const tl = useTranslations("languages");
  const tsync = useTranslations("sync");
  const { locale, setLocale } = useAppLocale();
  const { theme, setTheme } = useTheme();
  const { colorSchemeName, setColorScheme } = useColorScheme();
  const { patternName, setPattern, sidebarIntensity, mainIntensity, scope, setSidebarIntensity, setMainIntensity, setScope, patternSettings, setPatternSettings } = useSidebarPattern();
  const { fontFamilyId, fontSizeLevel, setFontFamily, setFontSizeLevel } = useFontSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuPage, setMobileMenuPage] = useState<MobileMenuPage>("main");
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [syncExpanded, setSyncExpanded] = useState(false);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const openUpgrade = useCallback(() => setUpgradeDialogOpen(true), []);

  const exportToJSON = () => {
    const exportData = {
      ...data,
      settings: {
        colorScheme: colorSchemeName,
        fontFamily: fontFamilyId,
        fontSizeLevel,
        marginLevel: 1,
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

  const imageCache = useRef<ImageUploadCache | null>(null);
  const prevPhotoRef = useRef(data.personalInfo.photo);
  useEffect(() => {
    if (data.personalInfo.photo !== prevPhotoRef.current) {
      imageCache.current = null;
      prevPhotoRef.current = data.personalInfo.photo;
    }
  }, [data.personalInfo.photo]);

  useEffect(() => {
    if (!showUploadOverlay) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [showUploadOverlay]);

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

    setShareUrl(url);
    setShareCopied(false);
    setShareDialogOpen(true);
    setIsSharing(false);
  }, [data, colorSchemeName, isSharing, canShare, patternSettings, fontFamilyId, fontSizeLevel]);

  const handleCopyShareUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Fallback: select input text
    }
  }, [shareUrl]);

  const menuItemClass =
    "flex w-full items-center justify-between rounded-sm px-3.5 py-3 text-[15px] text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-accent transition-colors";

  const backButtonClass =
    "flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 transition-colors";

  /* ── Shared design section props ──────────────────────── */
  const colorProps = { colorSchemeName, setColorScheme, isPremium, onUpgrade: openUpgrade, t: t as (key: string) => string };
  const patternProps = {
    colorSchemeName, patternName, setPattern, sidebarIntensity, mainIntensity, scope,
    setSidebarIntensity, setMainIntensity, setScope, isPremium, onUpgrade: openUpgrade, t: t as (key: string) => string,
  };
  const fontProps = { fontFamilyId, fontSizeLevel, setFontFamily, setFontSizeLevel, isPremium, onUpgrade: openUpgrade, t: t as (key: string) => string };
  const sectionsProps = { data, toggleSection, isPremium, onUpgrade: openUpgrade, t: t as (key: string) => string };

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-border bg-white/80 dark:bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 md:h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: hamburger (mobile) + logo */}
        <div className="flex items-center gap-1.5">
          <Popover open={mobileMenuOpen} onOpenChange={handleMobileMenuOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
              >
                <span className="relative size-6">
                  <Menu
                    className={`size-6 absolute inset-0 transition-all duration-200 ${
                      mobileMenuOpen
                        ? "opacity-0 rotate-90 scale-75"
                        : "opacity-100 rotate-0 scale-100"
                    }`}
                  />
                  <X
                    className={`size-6 absolute inset-0 transition-all duration-200 ${
                      mobileMenuOpen
                        ? "opacity-100 rotate-0 scale-100"
                        : "opacity-0 -rotate-90 scale-75"
                    }`}
                  />
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2" align="start">

              {/* ── Mobile: Main page ── */}
              {mobileMenuPage === "main" && (
                <div className="space-y-0.5">
                  {/* ── CV style (visual impact order, matches desktop) ── */}

                  {/* Color */}
                  <button onClick={() => setMobileMenuPage("color")} className={menuItemClass}>
                    <span className="flex items-center gap-2.5">
                      <Palette className="h-4 w-4" />
                      {t("colorScheme")}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400 dark:text-gray-400" />
                  </button>

                  {/* Pattern */}
                  <button onClick={() => setMobileMenuPage("pattern")} className={menuItemClass}>
                    <span className="flex items-center gap-2.5">
                      <Layers className="h-4 w-4" />
                      {t("sidebarPattern")}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400 dark:text-gray-400" />
                  </button>

                  {/* Font */}
                  <button onClick={() => setMobileMenuPage("font")} className={menuItemClass}>
                    <span className="flex items-center gap-2.5">
                      <Type className="h-4 w-4" />
                      {t("fontFamily")}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400 dark:text-gray-400" />
                  </button>

                  {/* Sections */}
                  <button onClick={() => setMobileMenuPage("sections")} className={menuItemClass}>
                    <span className="flex items-center gap-2.5">
                      <SlidersHorizontal className="h-4 w-4" />
                      {t("sections")}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400 dark:text-gray-400" />
                  </button>

                  {/* Divider */}
                  <div className="my-1.5 border-t border-gray-100 dark:border-border" />

                  {/* ── App settings ── */}

                  {/* Theme toggle */}
                  <button onClick={toggleTheme} className={menuItemClass}>
                    <span className="flex items-center gap-2.5">
                      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      {theme === "dark" ? t("themeLight") : t("themeDark")}
                    </span>
                  </button>

                  {/* Language */}
                  <button onClick={() => setMobileMenuPage("language")} className={menuItemClass}>
                    <span className="flex items-center gap-2.5">
                      <Globe className="h-4 w-4" />
                      {t("language")}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-400">
                      {LOCALE_NAMES[locale]}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>

                  {/* Divider */}
                  <div className="my-1.5 border-t border-gray-100 dark:border-border" />

                  {/* PDF */}
                  <button onClick={() => { setMobileMenuOpen(false); onPrintPDF(); }} disabled={isGeneratingPDF} className={`${menuItemClass} disabled:opacity-50`}>
                    <span className="flex items-center gap-2.5">
                      {isGeneratingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      {t("pdfTitle")}
                    </span>
                  </button>
                  {!isPremium && (
                    <button
                      onClick={() => { setMobileMenuOpen(false); setUpgradeDialogOpen(true); }}
                      className="flex w-full items-center gap-2 rounded-sm px-3.5 py-1 text-[11px] text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    >
                      <Lock className="h-3 w-3 shrink-0" />
                      {t("pdfNoBranding")}
                    </button>
                  )}

                  {/* Export JSON */}
                  <button onClick={exportToJSON} className={menuItemClass}>
                    <span className="flex items-center gap-2.5">
                      <FileDown className="h-4 w-4" />
                      {t("export")}
                    </span>
                  </button>

                  {/* Import */}
                  <button onClick={() => fileInputRef.current?.click()} className={menuItemClass}>
                    <span className="flex items-center gap-2.5">
                      <FileUp className="h-4 w-4" />
                      {t("import")}
                    </span>
                  </button>

                  {/* Divider */}
                  <div className="my-1.5 border-t border-gray-100 dark:border-border" />

                  {/* Copy link */}
                  <button onClick={() => { setMobileMenuOpen(false); handleShare(); }} disabled={isSharing || !canShare} className={`${menuItemClass} ${!canShare ? "opacity-50" : ""}`}>
                    <span className="flex items-center gap-2.5">
                      <Link className="h-4 w-4" />
                      {t("share")}
                    </span>
                  </button>
                </div>
              )}

              {/* ── Mobile: Color page ── */}
              {mobileMenuPage === "color" && (
                <div>
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {t("colorScheme")}
                  </button>
                  <div className="px-3.5 pt-2.5 pb-1.5 max-h-[60vh] overflow-y-auto overscroll-contain scrollbar-thin">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-400 mb-2">
                        {t("colorScheme")}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {COLOR_SCHEME_NAMES.map((name) => {
                          const scheme = COLOR_SCHEMES[name];
                          const isLight = scheme.sidebarText !== "#ffffff";
                          const isLocked = !isPremium && !FREE_COLORS.includes(name);
                          return (
                            <button
                              key={name}
                              onClick={() => {
                                if (isLocked) { setUpgradeDialogOpen(true); return; }
                                setColorScheme(name);
                              }}
                              className="relative flex flex-col items-center gap-1.5"
                            >
                              <span
                                className={`relative h-9 w-9 rounded-full transition-transform hover:scale-110 ${isLight ? "ring-1 ring-inset ring-black/10" : ""}`}
                                style={{ backgroundColor: scheme.sidebarBg }}
                              >
                                {colorSchemeName === name && (
                                  <Check className={`absolute inset-0 m-auto h-4 w-4 drop-shadow-sm ${isLight ? "text-gray-800" : "text-white"}`} />
                                )}
                                {isLocked && (
                                  <Lock className={`absolute inset-0 m-auto h-3.5 w-3.5 drop-shadow-sm ${isLight ? "text-gray-800/60" : "text-white/70"}`} />
                                )}
                              </span>
                              <span className="text-[11px] text-gray-500 dark:text-gray-300">
                                {t(`colorScheme${name.charAt(0).toUpperCase() + name.slice(1)}` as Parameters<typeof t>[0])}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Mobile: Pattern page ── */}
              {mobileMenuPage === "pattern" && (
                <div>
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {t("sidebarPattern")}
                  </button>
                  <div className="px-3.5 pt-2.5 pb-1.5 space-y-4 max-h-[60vh] overflow-y-auto overscroll-contain scrollbar-thin">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-400 mb-2">
                        {t("sidebarPattern")}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {SIDEBAR_PATTERN_NAMES.map((name) => {
                          const isActive = patternName === name;
                          const scheme = COLOR_SCHEMES[colorSchemeName];
                          const isLight = scheme.sidebarText !== "#ffffff";
                          const isNone = name === "none";
                          const isLocked = !isPremium && !isNone;
                          return (
                            <button
                              key={name}
                              onClick={() => {
                                if (isLocked) { setUpgradeDialogOpen(true); return; }
                                setPattern(name);
                              }}
                              className="relative flex flex-col items-center gap-1.5"
                            >
                              <span
                                className={`relative h-10 w-10 rounded-md border overflow-hidden transition-transform hover:scale-105 ${
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
                                {isLocked && (
                                  <Lock className="absolute inset-0 m-auto h-3.5 w-3.5 text-white/70 drop-shadow-sm" />
                                )}
                              </span>
                              <span className="text-[11px] text-gray-500 dark:text-gray-300">
                                {t(`pattern${name.charAt(0).toUpperCase() + name.slice(1)}` as Parameters<typeof t>[0])}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Intensity sliders */}
                      <div className={`mt-3 ${patternName === "none" ? "opacity-40 pointer-events-none" : ""}`}>
                        <p className="text-[13px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-400 mb-2">
                          {t("patternIntensity")}
                        </p>
                        <div className="space-y-2">
                          <div className={scope === "main" ? "opacity-40 pointer-events-none" : ""}>
                            <p className="text-[11px] text-gray-400 dark:text-gray-400 mb-1">{t("patternScopeSidebar")}</p>
                            <div className="flex items-center gap-3">
                              <Slider min={1} max={5} step={1} value={[sidebarIntensity]} onValueChange={([v]) => setSidebarIntensity(v as PatternIntensity)} className="flex-1" />
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-300 w-5 text-center">{sidebarIntensity}</span>
                            </div>
                          </div>
                          <div className={scope === "sidebar" ? "opacity-40 pointer-events-none" : ""}>
                            <p className="text-[11px] text-gray-400 dark:text-gray-400 mb-1">{t("patternScopeMain")}</p>
                            <div className="flex items-center gap-3">
                              <Slider min={1} max={5} step={1} value={[mainIntensity]} onValueChange={([v]) => setMainIntensity(v as PatternIntensity)} className="flex-1" />
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-300 w-5 text-center">{mainIntensity}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Scope selector */}
                      <div className={`mt-3 ${patternName === "none" ? "opacity-40 pointer-events-none" : ""}`}>
                        <p className="text-[13px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-400 mb-2">
                          {t("patternScope")}
                        </p>
                        <div className="flex gap-2">
                          {PATTERN_SCOPES.map((s) => {
                            const ScopeIcon = s === "sidebar" ? PanelLeft : s === "main" ? PanelRight : Square;
                            return (
                              <button
                                key={s}
                                onClick={() => setScope(s)}
                                className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors ${
                                  scope === s
                                    ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-accent dark:text-gray-300 dark:hover:bg-accent/80"
                                }`}
                              >
                                <ScopeIcon className="h-4 w-4" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Mobile: Font page ── */}
              {mobileMenuPage === "font" && (
                <div>
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {t("fontFamily")}
                  </button>
                  <div className="px-3.5 pt-2.5 pb-1.5 space-y-4 max-h-[60vh] overflow-y-auto overscroll-contain scrollbar-thin">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-400 mb-2">
                        {t("fontFamily")}
                      </p>
                      <div className="space-y-0.5">
                        {FONT_FAMILIES.map((font) => {
                          const isLocked = !isPremium && !FREE_FONTS.includes(font.id);
                          return (
                            <button
                              key={font.id}
                              onClick={() => {
                                if (isLocked) { setUpgradeDialogOpen(true); return; }
                                setFontFamily(font.id);
                              }}
                              className={menuItemClass}
                              style={{ fontFamily: font.cssStack }}
                            >
                              <span className="flex items-center gap-2">
                                {font.displayName}
                                {isLocked && <Lock className="h-3 w-3 text-gray-400" />}
                              </span>
                              {fontFamilyId === font.id && <Check className="h-4 w-4 text-gray-900 dark:text-gray-100" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Font Size */}
                      <div className="mt-3">
                        <p className="text-[13px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-400 mb-2">
                          {t("fontSize")}
                        </p>
                        <div className="flex gap-2">
                          {FONT_SIZE_LEVEL_IDS.map((level) => {
                            const labels: Record<number, string> = { 1: "S", 2: "M", 3: "L" };
                            return (
                              <button
                                key={level}
                                onClick={() => setFontSizeLevel(level)}
                                className={`h-8 w-8 rounded-md flex items-center justify-center text-sm font-medium transition-colors ${
                                  fontSizeLevel === level
                                    ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-accent dark:text-gray-300 dark:hover:bg-accent/80"
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
                </div>
              )}

              {/* ── Mobile: Sections page ── */}
              {mobileMenuPage === "sections" && (
                <div>
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {t("sections")}
                  </button>
                  <div className="px-3.5 pt-2.5 pb-1.5">
                    <SectionsContent {...sectionsProps} />
                  </div>
                </div>
              )}

              {/* ── Mobile: Language page ── */}
              {mobileMenuPage === "language" && (
                <div>
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {t("language")}
                  </button>
                  <div className="space-y-0.5 mt-1 max-h-[60vh] overflow-y-auto overscroll-contain scrollbar-thin">
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
                              <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-400">({translated})</span>
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

            </PopoverContent>
          </Popover>
          <FileText className="hidden md:block h-5 w-5 text-gray-900 dark:text-gray-100" />
          <span className="font-display text-lg md:text-base font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Applio
          </span>
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

            {/* ── CV style (visual impact order) ── */}

            {/* Color scheme */}
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid="btn-color-scheme"
                      className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                    >
                      <Palette className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("colorScheme")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-auto p-3" align="end">
                <ColorSection {...colorProps} />
              </PopoverContent>
            </Popover>

            {/* Pattern */}
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid="btn-pattern"
                      className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                    >
                      <Layers className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("sidebarPattern")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-56 p-3 space-y-4 scrollbar-thin" align="end">
                <PatternSection {...patternProps} />
              </PopoverContent>
            </Popover>

            {/* Font */}
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid="btn-font"
                      className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                    >
                      <Type className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("fontFamily")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-48 p-3" align="end">
                <FontSection {...fontProps} />
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
                      data-testid="btn-sections"
                      className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("sections")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-64" align="end">
                <SectionsContent {...sectionsProps} />
              </PopoverContent>
            </Popover>

            {/* File actions menu (PDF + Export + Import) */}
            <Popover open={fileMenuOpen} onOpenChange={setFileMenuOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid="btn-file-menu"
                      className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                    >
                      <FolderDown className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("fileMenu")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-auto p-1" align="end">
                <div className="space-y-0.5">
                  <button
                    onClick={() => { setFileMenuOpen(false); onPrintPDF(); }}
                    disabled={isGeneratingPDF}
                    className="flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    {isGeneratingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {t("pdfTitle")}
                  </button>
                  {!isPremium && (
                    <button
                      onClick={() => { setFileMenuOpen(false); setUpgradeDialogOpen(true); }}
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1 text-[11px] text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    >
                      <Lock className="h-3 w-3 shrink-0" />
                      {t("pdfNoBranding")}
                    </button>
                  )}
                  <div className="my-1 border-t border-gray-100 dark:border-border" />
                  <button
                    onClick={exportToJSON}
                    className="flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-accent transition-colors"
                  >
                    <FileDown className="h-4 w-4" />
                    {t("export")}
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-accent transition-colors"
                  >
                    <FileUp className="h-4 w-4" />
                    {t("import")}
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Share button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  disabled={isSharing || !canShare}
                  className={`h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 ${!canShare ? "opacity-50" : ""}`}
                >
                  <Link className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("share")}</TooltipContent>
            </Tooltip>

            {/* Divider: CV tools | App settings */}
            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* ── App settings ── */}

            {/* Theme toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid="btn-theme"
                  onClick={toggleTheme}
                  className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{theme === "dark" ? t("themeLight") : t("themeDark")}</TooltipContent>
            </Tooltip>

            {/* Language selector */}
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid="btn-language"
                      className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                    >
                      <Globe className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("language")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-48 p-1" align="end">
                <div className="space-y-0.5 max-h-80 overflow-y-auto scrollbar-thin">
                  {LOCALES.map((code) => {
                    const translated = tl(code);
                    const native = LOCALE_NAMES[code];
                    return (
                      <button
                        key={code}
                        onClick={() => setLocale(code)}
                        className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-accent transition-colors"
                      >
                        <span>
                          {native}
                          <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-400">({translated})</span>
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

            {/* Divider: App settings | Account */}
            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* ── Account popover (sync status + auth + upgrade) ── */}
            <Popover>
              <PopoverTrigger asChild>
                {user ? (
                  <button
                    data-testid="btn-account"
                    className="h-8 w-8 items-center justify-center rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-gray-300 dark:hover:ring-gray-600 transition-all hidden md:flex"
                  >
                    <UserAvatar url={user.user_metadata?.avatar_url} size={8} />
                  </button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid="btn-account"
                    className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                )}
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0 overflow-hidden" align="end">
                {user ? (
                  <div>
                    {/* User info + sign out */}
                    <div className="px-4 py-4 border-b border-gray-100 dark:border-border">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {user.user_metadata?.full_name || user.email}
                          </p>
                          {user.email && user.user_metadata?.full_name && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                          )}
                        </div>
                        <button
                          onClick={() => signOut()}
                          className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-600 transition-colors"
                          title={tauth("signOut")}
                        >
                          <LogOut className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <SyncStatusRow expanded={syncExpanded} onToggle={() => setSyncExpanded(v => !v)} isPremium={isPremium} t={t as (key: string) => string} />
                    {!isPremium && (
                      <div className="px-4 py-3">
                        <button
                          onClick={() => setUpgradeDialogOpen(true)}
                          className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-gray-800 to-gray-900 px-3 py-2 text-xs font-medium text-white shadow-sm hover:from-gray-700 hover:to-gray-800 transition-colors dark:from-gray-100 dark:to-gray-200 dark:text-gray-900 dark:hover:from-gray-200 dark:hover:to-gray-300"
                        >
                          {tsync("upgrade")}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <SyncStatusRow expanded={syncExpanded} onToggle={() => setSyncExpanded(v => !v)} isPremium={isPremium} t={t as (key: string) => string} />
                    <div className="px-4 py-3 space-y-2.5">
                      <button
                        onClick={() => setLoginDialogOpen(true)}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-gray-800 to-gray-900 px-3 py-2 text-xs font-medium text-white shadow-sm hover:from-gray-700 hover:to-gray-800 transition-colors dark:from-gray-100 dark:to-gray-200 dark:text-gray-900 dark:hover:from-gray-200 dark:hover:to-gray-300"
                      >
                        <LogIn className="h-3.5 w-3.5" />
                        {tauth("login")}
                      </button>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        {t("syncLoginHint")}
                      </p>
                    </div>
                  </div>
                )}
              </PopoverContent>
            </Popover>

          </div>

          {/* ===== MOBILE: Account button (always visible) ===== */}
          <Popover>
            <PopoverTrigger asChild>
              {user ? (
                <button
                  className="md:hidden h-8 w-8 mr-1 items-center justify-center rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-gray-300 dark:hover:ring-gray-600 transition-all flex"
                >
                  <UserAvatar url={user.user_metadata?.avatar_url} size={8} />
                </button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-9 w-9 mr-1 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                >
                  <User className="h-5 w-5" />
                </Button>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0 overflow-hidden" align="end">
              {user ? (
                <div>
                  <div className="px-4 py-4 border-b border-gray-100 dark:border-border">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {user.user_metadata?.full_name || user.email}
                        </p>
                        {user.email && user.user_metadata?.full_name && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                        )}
                      </div>
                      <button
                        onClick={() => signOut()}
                        className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-600 transition-colors"
                        title={tauth("signOut")}
                      >
                        <LogOut className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <SyncStatusRow expanded={syncExpanded} onToggle={() => setSyncExpanded(v => !v)} isPremium={isPremium} t={t as (key: string) => string} />
                  {!isPremium && (
                    <div className="px-4 py-3">
                      <button
                        onClick={() => setUpgradeDialogOpen(true)}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-gray-800 to-gray-900 px-3 py-2 text-xs font-medium text-white shadow-sm hover:from-gray-700 hover:to-gray-800 transition-colors dark:from-gray-100 dark:to-gray-200 dark:text-gray-900 dark:hover:from-gray-200 dark:hover:to-gray-300"
                      >
                        {tsync("upgrade")}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <SyncStatusRow expanded={syncExpanded} onToggle={() => setSyncExpanded(v => !v)} isPremium={isPremium} t={t as (key: string) => string} />
                  <div className="px-4 py-3 space-y-2.5">
                    <button
                      onClick={() => setLoginDialogOpen(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-gray-800 to-gray-900 px-3 py-2 text-xs font-medium text-white shadow-sm hover:from-gray-700 hover:to-gray-800 transition-colors dark:from-gray-100 dark:to-gray-200 dark:text-gray-900 dark:hover:from-gray-200 dark:hover:to-gray-300"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      {tauth("login")}
                    </button>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      {t("syncLoginHint")}
                    </p>
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>

        </div>
      </div>
    </header>

    {/* Login dialog */}
    <LoginDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />

    {/* Upgrade dialog */}
    <UpgradeDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen} />

    {/* Share dialog */}
    <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("shareTitle")}</DialogTitle>
          <DialogDescription>{t("shareDescription")}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 min-w-0 rounded-md border border-input bg-muted px-3 py-2 text-xs text-muted-foreground truncate outline-none"
            onFocus={(e) => e.target.select()}
          />
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={handleCopyShareUrl}
          >
            {shareCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {shareCopied ? t("shareCopied") : t("shareCopyLink")}
          </Button>
        </div>
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {t("shareOpen")}
        </a>
      </DialogContent>
    </Dialog>

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

    {/* Dev-only floating plan toggle */}
    {process.env.NODE_ENV === "development" && (
      <button
        onClick={() => setDevOverride(devOverride === "premium" ? "free" : "premium")}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95 dark:border-gray-700 dark:bg-card"
      >
        <FlaskConical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span className={`text-xs font-semibold tracking-wide ${isPremium ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}`}>
          {isPremium ? "PRO" : "FREE"}
        </span>
        <span className={`h-2 w-2 rounded-full ${isPremium ? "bg-emerald-500 shadow-[0_0_6px_1px_rgba(16,185,129,0.4)]" : "bg-gray-300 dark:bg-gray-600"}`} />
      </button>
    )}
    </>
  );
}
