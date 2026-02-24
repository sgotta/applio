"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { useAppLocale, LOCALES, LOCALE_NAMES } from "@/lib/locale-context";
import { filenameDateStamp } from "@/lib/utils";
import { CVData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { usePlan } from "@/lib/plan-context";
import { useSyncStatus, type SyncStatus } from "@/lib/sync-status-context";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { UpgradeDialog } from "@/components/premium/UpgradeDialog";
import { PremiumBadge } from "@/components/premium/PremiumBadge";
import {
  Download, FileUp, FileDown, FileText, FolderDown, Globe, Type,
  SlidersHorizontal, Check, Sun, Moon,
  Menu, X, ChevronRight, ChevronLeft, Palette,
  Loader2, Share2, LogIn, LogOut, User, Copy, ExternalLink,
  PanelLeft, PanelRight, Square, Lock, HardDrive, Cloud, CloudOff, Layers, Sparkles,
} from "lucide-react";

/* ── Free-tier feature limits ──────────────────────────── */
const FREE_COLORS: ColorSchemeName[] = ["default"];
const FREE_FONTS: FontFamilyId[] = ["inter", "lato"];

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
    (Array.isArray(d.experiences) || Array.isArray(d.experience)) &&
    Array.isArray(d.education) &&
    (Array.isArray(d.skillCategories) || Array.isArray(d.skills)) &&
    typeof d.summary === "string"
  );
}

function SectionToggle({
  label,
  checked,
  onToggle,
  locked,
  mobile,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  locked?: boolean;
  mobile?: boolean;
}) {
  return (
    <label className={`flex items-center justify-between gap-3 cursor-pointer ${mobile ? "py-3.5 min-h-[52px]" : "py-2.5 px-4"}`}>
      <span className={`flex items-center gap-2 ${mobile ? "text-[17px]" : "text-[13px]"} text-gray-700 dark:text-gray-200`}>
        {label}
        {locked && <PremiumBadge />}
      </span>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </label>
  );
}

function UserAvatar({ url, size }: { url?: string | null; size: number }) {
  const [failed, setFailed] = useState(false);
  const sizeClass = size >= 10 ? "h-10 w-10" : size === 9 ? "h-9 w-9" : size === 8 ? "h-8 w-8" : "h-7 w-7";
  const iconSize = size >= 10 ? "h-5 w-5" : size >= 8 ? "h-4 w-4" : "h-3.5 w-3.5";

  if (url && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
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

/* ── Account popover content (shared between desktop & mobile) ── */

function AccountContent({
  user,
  isPremium,
  syncStatus,
  onSignOut,
  onUpgrade,
  onLogin,
  onClose,
  t,
  tauth,
  tsync,
  mobile = false,
}: {
  user: { id: string; name?: string | null; email?: string | null; image?: string | null } | null;
  isPremium: boolean;
  syncStatus: SyncStatus;
  onSignOut: () => void;
  onUpgrade: () => void;
  onLogin: () => void;
  onClose: () => void;
  t: (key: string) => string;
  tauth: (key: string) => string;
  tsync: (key: string) => string;
  mobile?: boolean;
}) {
  // Mobile: texto notablemente más grande para lectura cómoda sin zoom
  const nameSize    = mobile ? "text-xl"   : "text-[15px]";
  const emailSize   = mobile ? "text-base" : "text-[13px]";
  const bodyText    = mobile ? "text-base" : "text-[13px]";
  const hintText    = "text-sm";
  const iconSize    = mobile ? "h-5 w-5"   : "h-4 w-4";
  const iconBoxSize = mobile ? "h-9 w-9"   : "h-7 w-7";
  const hintLeading = mobile ? "leading-relaxed" : "leading-snug";
  // Spacing — más compacto en desktop
  const pad         = mobile ? "p-5"       : "p-4";
  const headerPx    = mobile ? "px-5"      : "px-4";
  const headerPt    = mobile ? "pt-5"      : "pt-4";
  const headerPb    = mobile ? "pb-4"      : "pb-3";
  const pillMx      = mobile ? "mx-4 mb-4" : "mx-3 mb-3";
  const rowPy       = mobile ? "py-2.5"    : "py-1.5";
  const rowMinH     = mobile ? "min-h-[44px]" : "min-h-[36px]";
  const btnPy       = mobile ? "py-3"      : "py-2.5";
  const statusMb    = mobile ? "mb-3"      : "mb-2.5";
  const hintMb      = mobile ? "mb-4"      : "mb-3";

  if (user) {
    return (
      <div>
        {/* Name + email */}
        <div className={`${headerPx} ${headerPt} ${headerPb}`}>
          <p className={`${nameSize} font-semibold text-gray-900 dark:text-gray-50 truncate leading-tight`}>
            {user.name || user.email}
          </p>
          {user.email && user.name && (
            <p className={`${emailSize} text-gray-400 dark:text-gray-500 truncate mt-1`}>
              {user.email}
            </p>
          )}
        </div>

        {/* Sync status pill */}
        <div data-testid="sync-status-badge" className={`${pillMx} flex items-center gap-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 px-3 py-2.5`}>
          {syncStatus === "syncing" ? (
            <Loader2 className={`${iconSize} text-blue-500 shrink-0 animate-spin`} />
          ) : syncStatus === "error" ? (
            <CloudOff className={`${iconSize} text-red-500 shrink-0`} />
          ) : syncStatus === "synced" ? (
            <Cloud className={`${iconSize} text-emerald-500 shrink-0`} />
          ) : (
            <HardDrive className={`${iconSize} text-amber-500 shrink-0`} />
          )}
          <span className={`${bodyText} text-gray-500 dark:text-gray-400`}>
            {syncStatus === "syncing" ? t("syncSyncing")
              : syncStatus === "error" ? t("syncError")
              : syncStatus === "synced" ? t("syncCloud")
              : t("syncLocal")}
          </span>
          <span className="ml-auto h-2 w-2 shrink-0 relative">
            <span className={`absolute inset-0 rounded-full animate-ping ${
              syncStatus === "syncing" ? "bg-blue-400/50"
              : syncStatus === "error" ? "bg-red-400/50"
              : syncStatus === "synced" ? "bg-emerald-400/50"
              : "bg-amber-400/50"
            }`} />
            <span className={`absolute inset-0 rounded-full ${
              syncStatus === "syncing" ? "bg-blue-500 shadow-[0_0_6px_1px_rgba(59,130,246,0.4)]"
              : syncStatus === "error" ? "bg-red-500 shadow-[0_0_6px_1px_rgba(239,68,68,0.4)]"
              : syncStatus === "synced" ? "bg-emerald-500 shadow-[0_0_6px_1px_rgba(16,185,129,0.4)]"
              : "bg-amber-500 shadow-[0_0_6px_1px_rgba(245,158,11,0.4)]"
            }`} />
          </span>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-2 py-2 space-y-0.5">
          {!isPremium && (
            <button
              onClick={() => { onClose(); onUpgrade(); }}
              className={`w-full cursor-pointer flex items-center gap-3 rounded-lg px-3 ${rowPy} ${rowMinH} ${bodyText} font-medium text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-gray-600`}
            >
              <span className={`${iconBoxSize} flex items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-500 shrink-0`}>
                <Sparkles className={iconSize} />
              </span>
              {tsync("upgrade")}
            </button>
          )}
          <button
            onClick={() => { onClose(); onSignOut(); }}
            className={`w-full cursor-pointer flex items-center gap-3 rounded-lg px-3 ${rowPy} ${rowMinH} ${bodyText} font-medium text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 dark:focus-visible:ring-red-800`}
          >
            <span className={`${iconBoxSize} flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 shrink-0`}>
              <LogOut className={iconSize} />
            </span>
            {tauth("signOut")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={pad}>
      {/* Status */}
      <div className={`flex items-center gap-3 ${statusMb}`}>
        <span className={`${iconBoxSize} flex items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-500 shrink-0`}>
          <HardDrive className={iconSize} />
        </span>
        <span className={`${bodyText} font-medium text-gray-600 dark:text-gray-300`}>{t("syncLocal")}</span>
        <span className="ml-auto h-2.5 w-2.5 shrink-0 relative">
          <span className="absolute inset-0 rounded-full bg-amber-400/50 animate-ping" />
          <span className="absolute inset-0 rounded-full bg-amber-500 shadow-[0_0_6px_1px_rgba(245,158,11,0.4)]" />
        </span>
      </div>

      <p className={`${hintText} text-gray-400 dark:text-gray-500 ${hintLeading} ${hintMb}`}>
        {t("syncLoginHint")}
      </p>

      {/* CTA */}
      <button
        onClick={() => { onClose(); onLogin(); }}
        className={`cursor-pointer w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gray-800 to-gray-900 px-4 ${btnPy} ${rowMinH} text-sm font-medium text-white shadow-sm hover:from-gray-700 hover:to-gray-800 transition-colors dark:from-gray-100 dark:to-gray-200 dark:text-gray-900 dark:hover:from-gray-200 dark:hover:to-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2`}
      >
        <LogIn className={iconSize} />
        {tauth("login")}
      </button>
    </div>
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
      <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-3">
        {t("colorScheme")}
      </p>
      <div className="flex gap-2.5">
        {COLOR_SCHEME_NAMES.map((name) => {
          const scheme = COLOR_SCHEMES[name];
          const isLight = scheme.sidebarText !== "#ffffff";
          const isLocked = !isPremium && !FREE_COLORS.includes(name);
          const label = t(`colorScheme${name.charAt(0).toUpperCase() + name.slice(1)}`);
          return (
            <div key={name} className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => {
                  if (isLocked) { onUpgrade(); return; }
                  setColorScheme(name);
                }}
                aria-label={label}
                className={`relative h-10 w-10 rounded-full transition-all hover:scale-105 focus:outline-none ${
                  colorSchemeName === name ? "ring-2 ring-offset-2 ring-gray-900 dark:ring-gray-100" : ""
                } ${isLight ? "ring-1 ring-inset ring-black/10" : ""}`}
                style={{ backgroundColor: scheme.sidebarBg }}
              >
                {colorSchemeName === name && !isLocked && (
                  <Check className={`absolute inset-0 m-auto h-4 w-4 drop-shadow-sm ${isLight ? "text-gray-800" : "text-white"}`} />
                )}
                {isLocked && (
                  <Lock className={`absolute inset-0 m-auto h-3.5 w-3.5 drop-shadow-sm ${isLight ? "text-gray-800/60" : "text-white/70"}`} />
                )}
              </button>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight text-center truncate max-w-[40px]">{label}</span>
            </div>
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
        <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-3">
          {t("sidebarPattern")}
        </p>
        <div className="flex gap-3">
          {SIDEBAR_PATTERN_NAMES.map((name) => {
            const isActive = patternName === name;
            const isNone = name === "none";
            const isLocked = !isPremium && !isNone;
            return (
              <div key={name} className="flex flex-col items-center gap-1.5">
                <button
                  onClick={() => {
                    if (isLocked) { onUpgrade(); return; }
                    setPattern(name);
                  }}
                  className={`relative h-10 w-10 rounded-lg border overflow-hidden transition-all hover:scale-105 focus:outline-none ${
                    isActive
                      ? "border-gray-900 dark:border-gray-100 ring-2 ring-gray-900 dark:ring-gray-100 ring-offset-1"
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
                <span className="text-[10px] text-gray-400 dark:text-gray-400">
                  {t(`pattern${name.charAt(0).toUpperCase() + name.slice(1)}`)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Intensity sliders */}
      <div className={patternName === "none" ? "opacity-40 pointer-events-none" : ""}>
        <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-3">
          {t("patternIntensity")}
        </p>
        <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
          <div className={`flex items-center gap-3 px-4 py-2.5 ${scope === "main" ? "opacity-40 pointer-events-none" : ""}`}>
            <span className="text-[13px] text-gray-600 dark:text-gray-300 shrink-0">{t("patternScopeSidebar")}</span>
            <Slider min={1} max={5} step={1} value={[sidebarIntensity]} onValueChange={([v]) => setSidebarIntensity(v as PatternIntensity)} className="flex-1" />
            <span className="text-[13px] font-medium text-gray-500 dark:text-gray-300 w-4 text-right shrink-0">{sidebarIntensity}</span>
          </div>
          <div className="h-px bg-gray-100 dark:bg-white/5" />
          <div className={`flex items-center gap-3 px-4 py-2.5 ${scope === "sidebar" ? "opacity-40 pointer-events-none" : ""}`}>
            <span className="text-[13px] text-gray-600 dark:text-gray-300 shrink-0">{t("patternScopeMain")}</span>
            <Slider min={1} max={5} step={1} value={[mainIntensity]} onValueChange={([v]) => setMainIntensity(v as PatternIntensity)} className="flex-1" />
            <span className="text-[13px] font-medium text-gray-500 dark:text-gray-300 w-4 text-right shrink-0">{mainIntensity}</span>
          </div>
        </div>
      </div>

      {/* Scope selector */}
      <div className={patternName === "none" ? "opacity-40 pointer-events-none" : ""}>
        <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-3">
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
                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
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
        <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-3">
          {t("fontFamily")}
        </p>
        <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
          {FONT_FAMILIES.map((font, idx) => {
            const isLocked = !isPremium && !FREE_FONTS.includes(font.id);
            return (
              <React.Fragment key={font.id}>
                {idx > 0 && <div className="h-px bg-gray-100 dark:bg-white/5" />}
                <button
                  onClick={() => {
                    if (isLocked) { onUpgrade(); return; }
                    setFontFamily(font.id);
                  }}
                  className="flex w-full items-center justify-between h-10 px-4 text-[13px] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  style={{ fontFamily: font.cssStack }}
                >
                  <span className="flex items-center gap-2">
                    {font.displayName}
                    {isLocked && <PremiumBadge />}
                  </span>
                  {fontFamilyId === font.id && (
                    <Check className="h-3.5 w-3.5 text-gray-900 dark:text-gray-100 shrink-0" />
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-3">
          {t("fontSize")}
        </p>
        <div className="flex gap-1.5">
          {FONT_SIZE_LEVEL_IDS.map((level) => {
            const labels: Record<number, string> = { 1: "S", 2: "M", 3: "L" };
            return (
              <button
                key={level}
                onClick={() => setFontSizeLevel(level)}
                className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
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
  mobile,
}: {
  data: CVData;
  toggleSection: (key: keyof import("@/lib/types").SectionVisibility) => void;
  isPremium: boolean;
  onUpgrade: () => void;
  t: (key: string) => string;
  mobile?: boolean;
}) {
  return (
    <div className={mobile ? "space-y-3" : "space-y-4"}>
      <div>
        <p className={`font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 ${mobile ? "text-[11px] pb-1" : "text-[10px] tracking-widest mb-3"}`}>{t("sectionsTitle")}</p>
        {mobile ? (
          <>
            <SectionToggle label={t("sectionLocation")} checked={data.visibility.location} onToggle={() => toggleSection("location")} mobile={mobile} />
            <SectionToggle label={t("sectionLinkedin")} checked={data.visibility.linkedin} onToggle={() => toggleSection("linkedin")} mobile={mobile} />
            <SectionToggle label={t("sectionWebsite")} checked={data.visibility.website} onToggle={() => toggleSection("website")} mobile={mobile} />
          </>
        ) : (
          <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <SectionToggle label={t("sectionLocation")} checked={data.visibility.location} onToggle={() => toggleSection("location")} mobile={mobile} />
            <div className="h-px bg-gray-100 dark:bg-white/5" />
            <SectionToggle label={t("sectionLinkedin")} checked={data.visibility.linkedin} onToggle={() => toggleSection("linkedin")} mobile={mobile} />
            <div className="h-px bg-gray-100 dark:bg-white/5" />
            <SectionToggle label={t("sectionWebsite")} checked={data.visibility.website} onToggle={() => toggleSection("website")} mobile={mobile} />
          </div>
        )}
      </div>
      <div>
        <p className={`font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 ${mobile ? "text-[11px] pt-3 pb-1" : "text-[10px] tracking-widest mb-3"}`}>{t("optionalSections")}</p>
        {mobile ? (
          <>
            <SectionToggle label={t("sectionSummary")} checked={data.visibility.summary} onToggle={() => toggleSection("summary")} mobile={mobile} />
            <SectionToggle label={t("sectionCourses")} checked={data.visibility.courses} locked={!isPremium} onToggle={() => { if (!isPremium) { onUpgrade(); return; } toggleSection("courses"); }} mobile={mobile} />
            <SectionToggle label={t("sectionCertifications")} checked={data.visibility.certifications} locked={!isPremium} onToggle={() => { if (!isPremium) { onUpgrade(); return; } toggleSection("certifications"); }} mobile={mobile} />
            <SectionToggle label={t("sectionAwards")} checked={data.visibility.awards} locked={!isPremium} onToggle={() => { if (!isPremium) { onUpgrade(); return; } toggleSection("awards"); }} mobile={mobile} />
          </>
        ) : (
          <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <SectionToggle label={t("sectionSummary")} checked={data.visibility.summary} onToggle={() => toggleSection("summary")} mobile={mobile} />
            <div className="h-px bg-gray-100 dark:bg-white/5" />
            <SectionToggle label={t("sectionCourses")} checked={data.visibility.courses} locked={!isPremium} onToggle={() => { if (!isPremium) { onUpgrade(); return; } toggleSection("courses"); }} mobile={mobile} />
            <div className="h-px bg-gray-100 dark:bg-white/5" />
            <SectionToggle label={t("sectionCertifications")} checked={data.visibility.certifications} locked={!isPremium} onToggle={() => { if (!isPremium) { onUpgrade(); return; } toggleSection("certifications"); }} mobile={mobile} />
            <div className="h-px bg-gray-100 dark:bg-white/5" />
            <SectionToggle label={t("sectionAwards")} checked={data.visibility.awards} locked={!isPremium} onToggle={() => { if (!isPremium) { onUpgrade(); return; } toggleSection("awards"); }} mobile={mobile} />
          </div>
        )}
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
  const { status: syncStatus } = useSyncStatus();
  const { locale, setLocale } = useAppLocale();
  const { theme, setTheme } = useTheme();
  const { colorSchemeName, setColorScheme } = useColorScheme();
  const { patternName, setPattern, sidebarIntensity, mainIntensity, scope, setSidebarIntensity, setMainIntensity, setScope, patternSettings, setPatternSettings } = useSidebarPattern();
  const { fontFamilyId, fontSizeLevel, setFontFamily, setFontSizeLevel } = useFontSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isClosingMenu, setIsClosingMenu] = useState(false);
  const [mobileMenuPage, setMobileMenuPage] = useState<MobileMenuPage>("main");
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareCopied, setShareCopied] = useState(false);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const openUpgrade = useCallback(() => setUpgradeDialogOpen(true), []);

  const exportToJSON = async () => {
    // If photo is an R2 URL, embed it as base64 so the JSON is self-contained
    let photoUrl = data.personalInfo.photoUrl;
    if (photoUrl && !photoUrl.startsWith("data:")) {
      try {
        const res = await fetch(photoUrl);
        const blob = await res.blob();
        photoUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch {
        // Keep the original URL if fetch fails
      }
    }

    const exportData = {
      ...data,
      personalInfo: { ...data.personalInfo, photoUrl },
      settings: {
        colorScheme: colorSchemeName,
        fontFamily: fontFamilyId,
        fontSizeLevel,
        marginLevel: 2,
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

  const handleCloseMenu = useCallback(() => {
    setIsClosingMenu(true);
    setTimeout(() => {
      setIsClosingMenu(false);
      handleMobileMenuOpen(false);
    }, 200);
  }, [handleMobileMenuOpen]);

  const [isSharing, setIsSharing] = useState(false);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [accountDesktopOpen, setAccountDesktopOpen] = useState(false);
  const [accountMobileOpen, setAccountMobileOpen] = useState(false);

  // ── Auto-hide toolbar on mobile ──────────────────────────
  const [toolbarHidden, setToolbarHidden] = useState(false);
  const menuOpenRef = useRef(false);

  useEffect(() => {
    menuOpenRef.current = mobileMenuOpen || accountMobileOpen;
  }, [mobileMenuOpen, accountMobileOpen]);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let cumulativeDelta = 0;
    const THRESHOLD = 25;

    const onScroll = () => {
      if (window.innerWidth >= 768) return;

      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      // Always show at top of page
      if (currentScrollY < 10) {
        setToolbarHidden(false);
        cumulativeDelta = 0;
        return;
      }

      // Don't hide while a menu popover is open
      if (menuOpenRef.current) {
        cumulativeDelta = 0;
        return;
      }

      // Accumulate in same direction, reset on direction change
      if ((delta > 0 && cumulativeDelta >= 0) || (delta < 0 && cumulativeDelta <= 0)) {
        cumulativeDelta += delta;
      } else {
        cumulativeDelta = delta;
      }

      if (cumulativeDelta > THRESHOLD) {
        setToolbarHidden(true);
      } else if (cumulativeDelta < -THRESHOLD) {
        setToolbarHidden(false);
      }
    };

    // Hide when a contenteditable element gets focus (editing started)
    const onFocusIn = (e: FocusEvent) => {
      if (window.innerWidth >= 768) return;
      const target = e.target as HTMLElement;
      if (
        target.getAttribute("contenteditable") === "true" ||
        target.closest("[contenteditable]")
      ) {
        setToolbarHidden(true);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, []);


  const canShare = data.personalInfo.fullName.trim().length > 0;

  const handleShare = useCallback(async () => {
    if (!user || !canShare || isSharing) return;
    setIsSharing(true);
    setFileMenuOpen(false);
    setMobileMenuOpen(false);

    try {
      const res = await fetch("/api/cv/publish", { method: "POST" });
      const result = res.ok ? await res.json() : null;
      const slug: string | null = result?.slug ?? null;

      if (slug) {
        setShareUrl(`${window.location.origin}/cv/${slug}`);
        setShareCopied(false);
        setShareDialogOpen(true);
      } else {
        toast.error(t("shareError"));
      }
    } catch {
      toast.error(t("shareError"));
    } finally {
      setIsSharing(false);
    }
  }, [user, isSharing, canShare, t]);

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
    "flex w-full items-center justify-between px-4 py-2.5 text-[15px] font-medium text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-accent/60 transition-colors cursor-pointer";

  const backButtonClass =
    "w-full flex items-center gap-2 px-4 h-14 border-b border-gray-100 dark:border-border text-[17px] font-bold text-gray-900 dark:text-gray-100 tracking-tight hover:bg-gray-50 dark:hover:bg-accent/40 transition-colors cursor-pointer shrink-0";

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
    <header className={`sticky top-0 z-50 border-b border-border bg-white/95 dark:bg-card/95 backdrop-blur-sm transition-transform duration-300 ease-out ${toolbarHidden ? "-translate-y-full md:translate-y-0" : "translate-y-0"}`}>
      <div className="mx-auto flex h-16 md:h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: hamburger (mobile) + logo */}
        <div className="flex items-center gap-0 md:gap-1.5">
          <Sheet open={mobileMenuOpen} onOpenChange={handleMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
              >
                <Menu className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" showCloseButton={false} className="w-72 p-0 gap-0">
              <SheetTitle className="sr-only">Menú</SheetTitle>

              {/* ── Mobile: Main page ── */}
              {mobileMenuPage === "main" && (
                <>
                  {/* Sheet header */}
                  <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 dark:border-border shrink-0">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                      <span className="font-bold text-[17px] text-gray-900 dark:text-gray-100 tracking-tight">Applio</span>
                    </div>
                    <button
                      onClick={handleCloseMenu}
                      className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-accent transition-colors cursor-pointer active:scale-90"
                    >
                      <X
                        key={mobileMenuOpen ? 1 : 0}
                        className={`h-5 w-5 text-gray-500 dark:text-gray-400 ${isClosingMenu ? "animate-spin-out" : "animate-spin-in"}`}
                      />
                    </button>
                  </div>

                  {/* Scrollable content */}
                  <div className="flex-1 overflow-y-auto overscroll-contain py-2">

                    {/* ── DISEÑO ── */}
                    <p className="px-4 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                      {t("design")}
                    </p>

                    <button onClick={() => setMobileMenuPage("color")} className={menuItemClass}>
                      <span className="flex items-center gap-3">
                        <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-pink-50 dark:bg-pink-900/20 text-pink-500 shrink-0">
                          <Palette className="h-[18px] w-[18px]" />
                        </span>
                        {t("colorScheme")}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
                    </button>

                    <button onClick={() => setMobileMenuPage("pattern")} className={menuItemClass}>
                      <span className="flex items-center gap-3">
                        <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-500 shrink-0">
                          <Layers className="h-[18px] w-[18px]" />
                        </span>
                        {t("sidebarPattern")}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
                    </button>

                    <button onClick={() => setMobileMenuPage("font")} className={menuItemClass}>
                      <span className="flex items-center gap-3">
                        <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-500 shrink-0">
                          <Type className="h-[18px] w-[18px]" />
                        </span>
                        {t("fontFamily")}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
                    </button>

                    <button onClick={() => setMobileMenuPage("sections")} className={menuItemClass}>
                      <span className="flex items-center gap-3">
                        <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 shrink-0">
                          <SlidersHorizontal className="h-[18px] w-[18px]" />
                        </span>
                        {t("sections")}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
                    </button>

                    {/* ── PREFERENCIAS ── */}
                    <p className="px-4 pt-5 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                      {t("menuPreferences")}
                    </p>

                    <div className={`${menuItemClass} cursor-default`} onClick={toggleTheme}>
                      <span className="flex items-center gap-3">
                        <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 shrink-0">
                          <Moon className="h-[18px] w-[18px]" />
                        </span>
                        {t("themeDark")}
                      </span>
                      <Switch
                        checked={theme === "dark"}
                        onCheckedChange={toggleTheme}
                        onClick={(e) => e.stopPropagation()}
                        className="pointer-events-none"
                      />
                    </div>

                    <button onClick={() => setMobileMenuPage("language")} className={menuItemClass}>
                      <span className="flex items-center gap-3">
                        <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 shrink-0">
                          <Globe className="h-[18px] w-[18px]" />
                        </span>
                        {t("language")}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500">
                        {LOCALE_NAMES[locale]}
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </button>

                    {/* ── ARCHIVO ── */}
                    <p className="px-4 pt-5 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                      {t("fileMenu")}
                    </p>

                    <button onClick={() => { setMobileMenuOpen(false); onPrintPDF(); }} disabled={isGeneratingPDF} className={`${menuItemClass} disabled:opacity-50`}>
                      <span className="flex items-center gap-3">
                        <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 shrink-0">
                          {isGeneratingPDF ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Download className="h-[18px] w-[18px]" />}
                        </span>
                        {t("pdfTitle")}
                      </span>
                    </button>

                    <button onClick={exportToJSON} className={menuItemClass}>
                      <span className="flex items-center gap-3">
                        <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 shrink-0">
                          <FileDown className="h-[18px] w-[18px]" />
                        </span>
                        {t("export")}
                      </span>
                    </button>

                    <button onClick={() => fileInputRef.current?.click()} className={menuItemClass}>
                      <span className="flex items-center gap-3">
                        <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 shrink-0">
                          <FileUp className="h-[18px] w-[18px]" />
                        </span>
                        {t("import")}
                      </span>
                    </button>

                    {user ? (
                      <button onClick={handleShare} disabled={isSharing || !canShare} className={`${menuItemClass} ${!canShare ? "opacity-50" : ""}`}>
                        <span className="flex items-center gap-3">
                          <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20 text-green-500 shrink-0">
                            {isSharing ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Share2 className="h-[18px] w-[18px]" />}
                          </span>
                          {t("share")}
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => { setMobileMenuOpen(false); setLoginDialogOpen(true); }}
                        className={`${menuItemClass} opacity-50`}
                      >
                        <span className="flex items-center gap-3">
                          <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20 text-green-500 shrink-0">
                            <Share2 className="h-[18px] w-[18px]" />
                          </span>
                          {t("share")}
                        </span>
                        <Lock className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
                      </button>
                    )}

                    <div className="h-4" />
                  </div>

                  {/* Footer: Account (fixed at bottom) */}
                  <div className="border-t border-gray-100 dark:border-border shrink-0">
                    {user ? (
                      <div className="flex items-center gap-3 px-5 py-4">
                        <span className="h-10 w-10 rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700 shrink-0">
                          <UserAvatar url={user.image} size={10} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-semibold text-gray-800 dark:text-gray-100 truncate leading-tight">
                            {user.name || user.email}
                          </p>
                          {user.email && user.name && (
                            <p className="text-[13px] text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                          )}
                        </div>
                        <button
                          onClick={() => { setMobileMenuOpen(false); signOut(); }}
                          className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer shrink-0"
                          title={tauth("signOut")}
                        >
                          <LogOut className="h-[18px] w-[18px]" />
                        </button>
                      </div>
                    ) : (
                      <div className="px-5 py-4">
                        <button
                          onClick={() => { setMobileMenuOpen(false); setLoginDialogOpen(true); }}
                          className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[15px] font-semibold cursor-pointer hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                        >
                          <LogIn className="h-4.5 w-4.5" />
                          {tauth("login")}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── Mobile: Color page ── */}
              {mobileMenuPage === "color" && (
                <div className="flex flex-col h-full">
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    {t("colorScheme")}
                  </button>
                  <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin px-5 pt-5 pb-4">
                    <div className="flex flex-wrap gap-4">
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
                            className="relative flex flex-col items-center gap-2"
                          >
                            <span
                              className={`relative h-[52px] w-[52px] rounded-full transition-transform hover:scale-105 ${isLight ? "ring-1 ring-inset ring-black/10" : ""} ${colorSchemeName === name ? "ring-2 ring-offset-2 ring-gray-900 dark:ring-gray-100" : ""}`}
                              style={{ backgroundColor: scheme.sidebarBg }}
                            >
                              {colorSchemeName === name && (
                                <Check className={`absolute inset-0 m-auto h-4.5 w-4.5 drop-shadow-sm ${isLight ? "text-gray-800" : "text-white"}`} />
                              )}
                              {isLocked && (
                                <Lock className={`absolute inset-0 m-auto h-3.5 w-3.5 drop-shadow-sm ${isLight ? "text-gray-800/60" : "text-white/70"}`} />
                              )}
                            </span>
                            <span className="text-[12px] text-gray-500 dark:text-gray-300">
                              {t(`colorScheme${name.charAt(0).toUpperCase() + name.slice(1)}` as Parameters<typeof t>[0])}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Mobile: Pattern page ── */}
              {mobileMenuPage === "pattern" && (
                <div className="flex flex-col h-full">
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    {t("sidebarPattern")}
                  </button>
                  <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin px-4 pt-4 pb-4 space-y-4">
                    <div>
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
                                className={`relative h-[52px] w-[52px] rounded-xl border overflow-hidden transition-transform hover:scale-105 ${
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
                      <div className={`mt-6 ${patternName === "none" ? "opacity-40 pointer-events-none" : ""}`}>
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
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
                      <div className={`mt-6 ${patternName === "none" ? "opacity-40 pointer-events-none" : ""}`}>
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                          {t("patternScope")}
                        </p>
                        <div className="flex gap-2">
                          {PATTERN_SCOPES.map((s) => {
                            const ScopeIcon = s === "sidebar" ? PanelLeft : s === "main" ? PanelRight : Square;
                            return (
                              <button
                                key={s}
                                onClick={() => setScope(s)}
                                className={`h-11 w-11 rounded-xl flex items-center justify-center transition-colors ${
                                  scope === s
                                    ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-accent dark:text-gray-300 dark:hover:bg-accent/80"
                                }`}
                              >
                                <ScopeIcon className="h-5 w-5" />
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
                <div className="flex flex-col h-full">
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    {t("fontFamily")}
                  </button>
                  <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin px-4 pt-4 pb-4 space-y-4">
                    <div>
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
                                {isLocked && <PremiumBadge />}
                              </span>
                              {fontFamilyId === font.id && <Check className="h-4 w-4 text-gray-900 dark:text-gray-100" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Font Size */}
                      <div className="mt-6">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                          {t("fontSize")}
                        </p>
                        <div className="flex gap-2">
                          {FONT_SIZE_LEVEL_IDS.map((level) => {
                            const labels: Record<number, string> = { 1: "S", 2: "M", 3: "L" };
                            return (
                              <button
                                key={level}
                                onClick={() => setFontSizeLevel(level)}
                                className={`h-11 w-11 rounded-xl flex items-center justify-center text-sm font-medium transition-colors ${
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
                <div className="flex flex-col h-full">
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    {t("sections")}
                  </button>
                  <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-4">
                    <SectionsContent {...sectionsProps} mobile />
                  </div>
                </div>
              )}

              {/* ── Mobile: Language page ── */}
              {mobileMenuPage === "language" && (
                <div className="flex flex-col h-full">
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    {t("language")}
                  </button>
                  <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin py-2">
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
                          className="flex w-full items-center justify-between px-4 py-3.5 min-h-[52px] text-[15px] font-medium text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-accent/60 transition-colors cursor-pointer"
                        >
                          <span className="flex items-baseline gap-1.5">
                            {native}
                            <span className="text-[13px] text-gray-400 dark:text-gray-500">({translated})</span>
                          </span>
                          {locale === code && (
                            <Check className="h-4.5 w-4.5 text-gray-900 dark:text-gray-100 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            </SheetContent>
          </Sheet>
          <button
            className="flex items-center gap-1.5 md:pointer-events-none"
            onClick={() => handleMobileMenuOpen(true)}
            aria-label="Abrir menú"
          >
            <FileText className="hidden md:block h-5 w-5 text-gray-900 dark:text-gray-100" />
            <span className="font-display text-lg md:text-base font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Applio
            </span>
          </button>
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
                      aria-label={t("colorScheme")}
                      data-testid="btn-color-scheme"
                      className="h-10 w-10"
                    >
                      <span className="h-8 w-8 flex items-center justify-center rounded-lg bg-pink-50 dark:bg-pink-900/20 text-pink-500">
                        <Palette className="h-4 w-4" />
                      </span>
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("colorScheme")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-auto p-4" align="end">
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
                      aria-label={t("sidebarPattern")}
                      data-testid="btn-pattern"
                      className="h-10 w-10"
                    >
                      <span className="h-8 w-8 flex items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-500">
                        <Layers className="h-4 w-4" />
                      </span>
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("sidebarPattern")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-72 p-4 space-y-5" align="end">
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
                      aria-label={t("fontFamily")}
                      data-testid="btn-font"
                      className="h-10 w-10"
                    >
                      <span className="h-8 w-8 flex items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-900/20 text-sky-500">
                        <Type className="h-4 w-4" />
                      </span>
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("fontFamily")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-56 p-4" align="end">
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
                      aria-label={t("sections")}
                      data-testid="btn-sections"
                      className="h-10 w-10"
                    >
                      <span className="h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500">
                        <SlidersHorizontal className="h-4 w-4" />
                      </span>
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("sections")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-72 p-4" align="end">
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
                      aria-label={t("fileMenu")}
                      data-testid="btn-file-menu"
                      className="h-10 w-10"
                    >
                      <span className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500">
                        <FolderDown className="h-4 w-4" />
                      </span>
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("fileMenu")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-52 p-3 space-y-2" align="end">
                <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => { setFileMenuOpen(false); onPrintPDF(); }}
                    disabled={isGeneratingPDF}
                    className="flex w-full items-center gap-3 h-10 px-4 text-[13px] font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingPDF ? <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-red-500" /> : <Download className="h-3.5 w-3.5 shrink-0 text-red-500" />}
                    {t("pdfTitle")}
                  </button>
                </div>
                <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                  <button
                    onClick={exportToJSON}
                    className="flex w-full items-center gap-3 h-10 px-4 text-[13px] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <FileDown className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    {t("export")}
                  </button>
                  <div className="h-px bg-gray-100 dark:bg-white/5" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center gap-3 h-10 px-4 text-[13px] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <FileUp className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    {t("import")}
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Share button (only for logged-in users) */}
            {user && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("share")}
                    onClick={handleShare}
                    disabled={isSharing || !canShare}
                    className={`h-10 w-10 ${!canShare ? "opacity-50" : ""}`}
                  >
                    <span className="h-8 w-8 flex items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20 text-green-500">
                      {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("share")}</TooltipContent>
              </Tooltip>
            )}

            {/* Divider: CV tools | App settings */}
            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* ── App settings ── */}

            {/* Theme toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={theme === "dark" ? t("themeLight") : t("themeDark")}
                  data-testid="btn-theme"
                  onClick={toggleTheme}
                  className="h-10 w-10"
                >
                  <span className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500">
                    {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </span>
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
                      aria-label={t("language")}
                      data-testid="btn-language"
                      className="h-10 w-10"
                    >
                      <span className="h-8 w-8 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500">
                        <Globe className="h-4 w-4" />
                      </span>
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("language")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-52 p-3" align="end">
                <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                  {LOCALES.map((code, idx) => {
                    const translated = tl(code);
                    const native = LOCALE_NAMES[code];
                    return (
                      <React.Fragment key={code}>
                        {idx > 0 && <div className="h-px bg-gray-100 dark:bg-white/5" />}
                        <button
                          onClick={() => setLocale(code)}
                          className="flex w-full items-center justify-between h-10 px-4 text-[13px] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                          <span>
                            {native}
                            <span className="ml-1.5 text-[11px] text-gray-400 dark:text-gray-500">({translated})</span>
                          </span>
                          {locale === code && (
                            <Check className="h-3.5 w-3.5 text-gray-900 dark:text-gray-100 shrink-0" />
                          )}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            {/* Divider: App settings | Account */}
            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* ── Account popover (sync status + auth + upgrade) ── */}
            <Popover open={accountDesktopOpen} onOpenChange={setAccountDesktopOpen}>
              <PopoverTrigger asChild>
                <button
                  data-testid="btn-account"
                  aria-label={user ? (user.name || user.email || "Account") : "Sign in"}
                  className="relative cursor-pointer h-8 w-8 items-center justify-center rounded-full overflow-visible transition-all hidden md:flex group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-1"
                >
                  {user ? (
                    <span className="h-8 w-8 rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700 group-hover:ring-gray-400 dark:group-hover:ring-gray-500 transition-all block">
                      <UserAvatar url={user.image} size={8} />
                    </span>
                  ) : (
                    <span className="h-8 w-8 rounded-full ring-1 ring-gray-200 dark:ring-gray-700 group-hover:ring-gray-400 dark:group-hover:ring-gray-500 transition-all flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                      <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </span>
                  )}
                  {/* Sync status badge */}
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3">
                    <span className={`absolute inset-0 rounded-full animate-pulse ${
                      syncStatus === "syncing" ? "bg-blue-400/40"
                      : syncStatus === "error" ? "bg-red-400/40"
                      : syncStatus === "synced" ? "bg-emerald-400/40"
                      : "bg-amber-400/40"
                    }`} />
                    <span className={`absolute inset-0 rounded-full ${
                      syncStatus === "syncing" ? "bg-blue-500 shadow-[0_0_8px_2px_rgba(59,130,246,0.4)]"
                      : syncStatus === "error" ? "bg-red-500 shadow-[0_0_8px_2px_rgba(239,68,68,0.4)]"
                      : syncStatus === "synced" ? "bg-emerald-500 shadow-[0_0_8px_2px_rgba(16,185,129,0.4)]"
                      : "bg-amber-500 shadow-[0_0_8px_2px_rgba(245,158,11,0.4)]"
                    }`} />
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className={`${user ? "w-64" : "w-60"} p-0 overflow-hidden`} align="end">
                <AccountContent
                  user={user}
                  isPremium={isPremium}
                  syncStatus={syncStatus}
                  onSignOut={signOut}
                  onUpgrade={() => setUpgradeDialogOpen(true)}
                  onLogin={() => setLoginDialogOpen(true)}
                  onClose={() => setAccountDesktopOpen(false)}
                  t={t as (key: string) => string}
                  tauth={tauth as (key: string) => string}
                  tsync={tsync as (key: string) => string}
                />
              </PopoverContent>
            </Popover>

          </div>

          {/* ===== MOBILE: Account button (always visible) ===== */}
          <Popover open={accountMobileOpen} onOpenChange={setAccountMobileOpen}>
            <PopoverTrigger asChild>
              <button
                aria-label={user ? (user.name || user.email || "Account") : "Sign in"}
                className="relative cursor-pointer md:hidden h-[44px] w-[44px] mr-1 items-center justify-center rounded-full overflow-visible transition-all flex group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-1"
              >
                {user ? (
                  <span className="h-9 w-9 rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700 group-hover:ring-gray-400 dark:group-hover:ring-gray-500 transition-all block">
                    <UserAvatar url={user.image} size={9} />
                  </span>
                ) : (
                  <span className="h-9 w-9 rounded-full ring-1 ring-gray-200 dark:ring-gray-700 group-hover:ring-gray-400 dark:group-hover:ring-gray-500 transition-all flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </span>
                )}
                {/* Sync badge — consistent with desktop: pulse animation */}
                <span className="absolute bottom-1 right-1 h-3 w-3">
                  <span className={`absolute inset-0 rounded-full animate-ping ${
                    syncStatus === "syncing" ? "bg-blue-400/50"
                    : syncStatus === "error" ? "bg-red-400/50"
                    : syncStatus === "synced" ? "bg-emerald-400/50"
                    : "bg-amber-400/50"
                  }`} />
                  <span className={`absolute inset-0 rounded-full ${
                    syncStatus === "syncing" ? "bg-blue-500 shadow-[0_0_6px_1px_rgba(59,130,246,0.4)]"
                    : syncStatus === "error" ? "bg-red-500 shadow-[0_0_6px_1px_rgba(239,68,68,0.4)]"
                    : syncStatus === "synced" ? "bg-emerald-500 shadow-[0_0_6px_1px_rgba(16,185,129,0.4)]"
                    : "bg-amber-500 shadow-[0_0_6px_1px_rgba(245,158,11,0.4)]"
                  }`} />
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0 overflow-hidden" align="end" sideOffset={6}>
              <AccountContent
                user={user}
                isPremium={isPremium}
                syncStatus={syncStatus}
                onSignOut={signOut}
                onUpgrade={() => setUpgradeDialogOpen(true)}
                onLogin={() => setLoginDialogOpen(true)}
                onClose={() => setAccountMobileOpen(false)}
                t={t as (key: string) => string}
                tauth={tauth as (key: string) => string}
                tsync={tsync as (key: string) => string}
                mobile
              />
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
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-xl">{t("shareTitle")}</DialogTitle>
          <DialogDescription>{t("shareDescription")}</DialogDescription>
        </DialogHeader>

        {/* URL + botón copiar */}
        <div className="flex items-center gap-1.5 rounded-xl border border-input bg-muted overflow-hidden px-1 py-1">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 min-w-0 bg-transparent pl-2.5 pr-1 py-2 text-[13px] text-muted-foreground truncate outline-none cursor-default select-all"
            onFocus={(e) => e.target.select()}
          />
          <button
            onClick={handleCopyShareUrl}
            className={`h-9 w-9 flex items-center justify-center shrink-0 rounded-lg transition-colors cursor-pointer ${
              shareCopied
                ? "bg-green-500 text-white"
                : "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200"
            }`}
          >
            {shareCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        {/* Abrir en nueva pestaña */}
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-input"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          {t("shareOpen")}
        </a>
      </DialogContent>
    </Dialog>


    {/* Floating plan toggle (visible while Stripe is not integrated) */}
    {(
      <button
        onClick={() => setDevOverride(devOverride === "premium" ? "free" : "premium")}
        className="fixed bottom-5 right-4 md:bottom-6 md:right-6 z-50 flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-card/90 backdrop-blur-sm pl-2 pr-3.5 py-2 shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95"
      >
        <span className="h-7 w-7 flex items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-500 shrink-0">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <span className={`text-xs font-semibold tracking-wide ${isPremium ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}`}>
          {isPremium ? "PRO" : "FREE"}
        </span>
        <span className={`h-2 w-2 rounded-full shrink-0 ${isPremium ? "bg-emerald-500 shadow-[0_0_6px_1px_rgba(16,185,129,0.4)]" : "bg-gray-300 dark:bg-gray-600"}`} />
      </button>
    )}
    </>
  );
}
