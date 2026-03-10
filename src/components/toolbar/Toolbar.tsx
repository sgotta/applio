"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
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
import { useFontSettings } from "@/lib/font-context";
import { FONT_FAMILIES, FONT_SIZE_LEVEL_IDS, type FontFamilyId, type FontSizeLevel } from "@/lib/fonts";
import { migrateColorSchemeName, COLOR_SCHEME_NAMES, type ColorSchemeName } from "@/lib/color-schemes";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { usePlan } from "@/lib/plan-context";
import { useSyncStatus, type SyncStatus } from "@/lib/sync-status-context";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { UpgradeDialog, type UpgradeFeatureKey } from "@/components/premium/UpgradeDialog";
import { PremiumBadge } from "@/components/premium/PremiumBadge";
import {
  Download, FileUp, FileDown, FileText, FolderDown, Globe, Type,
  SlidersHorizontal, Check, Sun, Moon,
  Menu, X, ChevronRight, ChevronLeft, Palette, Droplet,
  Loader2, Share2, LogIn, LogOut, User, Copy, ExternalLink,
  HardDrive, Cloud, CloudOff, Sparkles,
} from "lucide-react";
import { HexColorPicker } from "react-colorful";

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
    <label className={`flex items-center justify-between gap-3 cursor-pointer ${mobile ? "py-3.5 min-h-13" : "py-2.5 px-4"}`}>
      <span className={`flex items-center gap-2 ${mobile ? "text-mobile-title" : "text-menu"} text-on-subtle`}>
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
  const nameSize    = mobile ? "text-xl"   : "text-mobile-menu";
  const emailSize   = mobile ? "text-base" : "text-menu";
  const bodyText    = mobile ? "text-base" : "text-menu";
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
            <p className={`${emailSize} text-subtle truncate mt-1`}>
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

      <p className={`${hintText} text-subtle ${hintLeading} ${hintMb}`}>
        {t("syncLoginHint")}
      </p>

      {/* CTA */}
      <Button
        onClick={() => { onClose(); onLogin(); }}
        className="w-full gap-2"
      >
        <LogIn className={iconSize} />
        {tauth("login")}
      </Button>
    </div>
  );
}

/* ── Shared sub-components for Design content ──────────── */

/** Palette options: curated combinations of scheme + accent */
/** Palette option: each row sets both scheme + accent */
interface PaletteOption {
  id: string;
  schemeName: ColorSchemeName;
  accent: string | null;
  premium: boolean;
  labelKey: string;
  /** [sidebarBg, accentColor | null] — null = no accent (Asfalto) */
  stripColors: [string, string | null];
}

/** Free palettes — shown first */
const FREE_PALETTES: PaletteOption[] = [
  { id: "default",        schemeName: "default",     accent: null,      premium: false, labelKey: "colorSchemeDefault",       stripColors: ["#f5f5f5", "#1e293b"] },
  { id: "wetAsphalt",     schemeName: "wetAsphalt",  accent: null,      premium: false, labelKey: "colorSchemeWetAsphalt",    stripColors: ["#2c3e50", "#94a3b8"] },
];

/** Premium palette groups — each group has a creative title */
interface PaletteGroup {
  labelKey: string;
  palettes: PaletteOption[];
}

const PALETTE_GROUPS: PaletteGroup[] = [
  {
    labelKey: "paletteGroupClassic",
    palettes: [
      { id: "default-blue",   schemeName: "default",     accent: "#1a7ed6", premium: false, labelKey: "colorSchemeDefaultBlue",   stripColors: ["#f5f5f5", "#1a7ed6"] },
      { id: "default-green",  schemeName: "default",     accent: "#27ae60", premium: false, labelKey: "colorSchemeDefaultGreen",  stripColors: ["#f5f5f5", "#27ae60"] },
    ],
  },
  {
    labelKey: "paletteGroupNature",
    palettes: [
      { id: "esmeralda",      schemeName: "esmeralda",   accent: "#27ae60", premium: false, labelKey: "colorSchemeEsmeralda",     stripColors: ["#e8f5e9", "#27ae60"] },
      { id: "hielo",          schemeName: "hielo",        accent: "#1a7ed6", premium: false, labelKey: "colorSchemeHielo",         stripColors: ["#e8f0fe", "#1a7ed6"] },
      { id: "floral",         schemeName: "floral",       accent: "#ff4040", premium: false, labelKey: "colorSchemeFloral",        stripColors: ["#fce4ec", "#ff4040"] },
    ],
  },
  {
    labelKey: "paletteGroupBold",
    palettes: [
      { id: "rosa",           schemeName: "rosa",         accent: "#db2777", premium: false, labelKey: "colorSchemeRosa",          stripColors: ["#fdf2f8", "#db2777"] },
      { id: "violeta",        schemeName: "violeta",      accent: "#7c3aed", premium: false, labelKey: "colorSchemeVioleta",       stripColors: ["#f5f3ff", "#7c3aed"] },
      { id: "rojo",           schemeName: "rojo",          accent: "#dc2626", premium: false, labelKey: "colorSchemeRojo",          stripColors: ["#fef2f2", "#dc2626"] },
    ],
  },
];

interface AccentPickerProps {
  accentColor: string | null;
  setAccentColor: (color: string | null) => void;
  t: (key: string) => string;
}

function AccentPicker({ accentColor, setAccentColor, t }: AccentPickerProps) {
  return (
    <div className="w-[200px]">
      <p className="text-badge font-semibold tracking-widest uppercase text-subtle mb-3">
        {t("accentColor")}
      </p>
      <HexColorPicker
        color={accentColor ?? "#111827"}
        onChange={setAccentColor}
        style={{ width: "100%", height: 160 }}
      />
      <input
        type="text"
        value={accentColor ?? "#6366f1"}
        onChange={(e) => {
          const v = e.target.value;
          if (/^#[0-9a-fA-F]{6}$/.test(v)) setAccentColor(v);
        }}
        className="mt-2 w-full px-3 py-1.5 text-xs font-mono text-center rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-on-subtle focus:outline-none focus:ring-1 focus:ring-gray-400"
        maxLength={7}
        placeholder="#6366f1"
      />
    </div>
  );
}

interface PaletteSectionProps {
  colorSchemeName: ColorSchemeName;
  accentColor: string | null;
  setColorScheme: (name: ColorSchemeName) => void;
  setAccentColor: (color: string | null) => void;
  t: (key: string) => string;
}

/** Shared swatch button for a single palette option */
function PaletteSwatch({
  option,
  isActive,
  label,
  onClick,
}: {
  option: PaletteOption;
  isActive: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="group flex flex-col items-center gap-1.5 cursor-pointer"
    >
      {/* 2-color swatch */}
      <div
        className={`relative flex w-full aspect-[2/1] rounded-lg overflow-hidden border transition-all ${
          isActive
            ? "ring-2 ring-offset-2 ring-gray-900 dark:ring-gray-100 ring-offset-white dark:ring-offset-gray-950 border-transparent"
            : "border-gray-200/80 dark:border-gray-600/60 group-hover:border-gray-300 dark:group-hover:border-gray-500 group-hover:shadow-sm"
        }`}
      >
        <div className="flex-1" style={{ backgroundColor: option.stripColors[0] }} />
        <div className="flex-1" style={{ backgroundColor: option.stripColors[1] ?? option.stripColors[0] }} />
        {/* Active check overlay */}
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Check className="h-4 w-4 text-white drop-shadow-sm" />
          </div>
        )}
      </div>
      {/* Label */}
      <span className="text-badge font-medium text-gray-500 dark:text-gray-400 truncate w-full text-center leading-tight">
        {label}
      </span>
    </button>
  );
}

function PaletteSection({
  colorSchemeName,
  accentColor,
  setColorScheme,
  setAccentColor,
  t,
}: PaletteSectionProps) {
  const handleClick = (option: PaletteOption) => {
    setColorScheme(option.schemeName);
    setAccentColor(option.accent);
  };

  return (
    <div className="w-[240px]">
      <p className="text-badge font-semibold tracking-widest uppercase text-subtle mb-3">
        {t("colorPalette")}
      </p>

      {/* Free palettes */}
      <div className="grid grid-cols-3 gap-2">
        {FREE_PALETTES.map((option) => {
          const isActive = colorSchemeName === option.schemeName && accentColor === option.accent;
          return (
            <PaletteSwatch
              key={option.id}
              option={option}
              isActive={isActive}
              label={t(option.labelKey)}
              onClick={() => handleClick(option)}
            />
          );
        })}
      </div>

      {/* Palette groups */}
      {PALETTE_GROUPS.map((group) => (
        <div key={group.labelKey} className="mt-3">
          {/* Group divider + title */}
          <div className="flex items-center gap-2 mb-2.5">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-micro font-medium tracking-wide text-subtle whitespace-nowrap">
              {t(group.labelKey)}
            </span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {group.palettes.map((option) => {
              const isActive = colorSchemeName === option.schemeName && accentColor === option.accent;
              return (
                <PaletteSwatch
                  key={option.id}
                  option={option}
                  isActive={isActive}
                  label={t(option.labelKey)}
                  onClick={() => handleClick(option)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function FontSection({
  fontFamilyId,
  fontSizeLevel,
  setFontFamily,
  setFontSizeLevel,
  t,
}: {
  fontFamilyId: FontFamilyId;
  fontSizeLevel: FontSizeLevel;
  setFontFamily: (id: FontFamilyId) => void;
  setFontSizeLevel: (level: FontSizeLevel) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-4">
      {/* Font Family list */}
      <div>
        <p className="text-badge font-semibold tracking-widest uppercase text-subtle mb-3">
          {t("fontFamily")}
        </p>
        <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
          {FONT_FAMILIES.map((font, idx) => (
            <React.Fragment key={font.id}>
              {idx > 0 && <div className="h-px bg-gray-100 dark:bg-white/5" />}
              <button
                onClick={() => setFontFamily(font.id)}
                className="flex w-full items-center justify-between h-10 px-4 text-menu text-on-subtle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                style={{ fontFamily: font.cssStack }}
              >
                <span>{font.displayName}</span>
                {fontFamilyId === font.id && (
                  <Check className="h-3.5 w-3.5 text-gray-900 dark:text-gray-100 shrink-0" />
                )}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <p className="text-badge font-semibold tracking-widest uppercase text-subtle mb-3">
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
  t,
  mobile,
}: {
  data: CVData;
  toggleSection: (key: keyof import("@/lib/types").SectionVisibility) => void;
  t: (key: string) => string;
  mobile?: boolean;
}) {
  return (
    <div className={mobile ? "space-y-3" : "space-y-4"}>
      <div>
        <p className={`font-semibold uppercase tracking-widest text-subtle ${mobile ? "text-label pb-1" : "text-badge tracking-widest mb-3"}`}>{t("sectionsTitle")}</p>
        {mobile ? (
          <>
            <SectionToggle label={t("sectionPhoto")} checked={data.visibility.photo} onToggle={() => toggleSection("photo")} mobile={mobile} />
            <SectionToggle label={t("sectionLocation")} checked={data.visibility.location} onToggle={() => toggleSection("location")} mobile={mobile} />
            <SectionToggle label={t("sectionLinkedin")} checked={data.visibility.linkedin} onToggle={() => toggleSection("linkedin")} mobile={mobile} />
            <SectionToggle label={t("sectionWebsite")} checked={data.visibility.website} onToggle={() => toggleSection("website")} mobile={mobile} />
          </>
        ) : (
          <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <SectionToggle label={t("sectionPhoto")} checked={data.visibility.photo} onToggle={() => toggleSection("photo")} mobile={mobile} />
            <div className="h-px bg-gray-100 dark:bg-white/5" />
            <SectionToggle label={t("sectionLocation")} checked={data.visibility.location} onToggle={() => toggleSection("location")} mobile={mobile} />
            <div className="h-px bg-gray-100 dark:bg-white/5" />
            <SectionToggle label={t("sectionLinkedin")} checked={data.visibility.linkedin} onToggle={() => toggleSection("linkedin")} mobile={mobile} />
            <div className="h-px bg-gray-100 dark:bg-white/5" />
            <SectionToggle label={t("sectionWebsite")} checked={data.visibility.website} onToggle={() => toggleSection("website")} mobile={mobile} />
          </div>
        )}
      </div>
      <div>
        <p className={`font-semibold uppercase tracking-widest text-subtle ${mobile ? "text-label pt-3 pb-1" : "text-badge tracking-widest mb-3"}`}>{t("optionalSections")}</p>
        {mobile ? (
          <>
            <SectionToggle label={t("sectionSummary")} checked={data.visibility.summary} onToggle={() => toggleSection("summary")} mobile={mobile} />
            <SectionToggle label={t("sectionCourses")} checked={data.visibility.courses} onToggle={() => toggleSection("courses")} mobile={mobile} />
            <SectionToggle label={t("sectionCertifications")} checked={data.visibility.certifications} onToggle={() => toggleSection("certifications")} mobile={mobile} />
            <SectionToggle label={t("sectionAwards")} checked={data.visibility.awards} onToggle={() => toggleSection("awards")} mobile={mobile} />
          </>
        ) : (
          <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <SectionToggle label={t("sectionSummary")} checked={data.visibility.summary} onToggle={() => toggleSection("summary")} mobile={mobile} />
            <div className="h-px bg-gray-100 dark:bg-white/5" />
            <SectionToggle label={t("sectionCourses")} checked={data.visibility.courses} onToggle={() => toggleSection("courses")} mobile={mobile} />
            <div className="h-px bg-gray-100 dark:bg-white/5" />
            <SectionToggle label={t("sectionCertifications")} checked={data.visibility.certifications} onToggle={() => toggleSection("certifications")} mobile={mobile} />
            <div className="h-px bg-gray-100 dark:bg-white/5" />
            <SectionToggle label={t("sectionAwards")} checked={data.visibility.awards} onToggle={() => toggleSection("awards")} mobile={mobile} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Toolbar ──────────────────────────────────────── */

type MobileMenuPage = "main" | "accent" | "palette" | "font" | "sections" | "language";

export function Toolbar({ onPrintPDF, isGeneratingPDF }: ToolbarProps) {
  const { data, importData, toggleSection } = useCV();
  const { user, signOut } = useAuth();
  const { isPremium } = usePlan();
  const t = useTranslations("toolbar");
  const tauth = useTranslations("auth");
  const tl = useTranslations("languages");
  const tsync = useTranslations("sync");
  const tpremium = useTranslations("premium");
  const { status: syncStatus } = useSyncStatus();
  const { locale, setLocale } = useAppLocale();
  const { theme, setTheme } = useTheme();
  const { colorSchemeName, accentColor, setColorScheme, setAccentColor } = useColorScheme();
  const { fontFamilyId, fontSizeLevel, setFontFamily, setFontSizeLevel } = useFontSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isClosingMenu, setIsClosingMenu] = useState(false);
  const [mobileMenuPage, setMobileMenuPage] = useState<MobileMenuPage>("main");
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<UpgradeFeatureKey | undefined>();
  const [pdfUpsellOpen, setPdfUpsellOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareCopied, setShareCopied] = useState(false);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

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
        accentColor,
        fontFamily: fontFamilyId,
        fontSizeLevel,
        marginLevel: 2,
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
          toast.error(t("importFormatError"));
          return;
        }

        if (confirm(t("importConfirm"))) {
          importData(parsed);
          const settings = (parsed as unknown as Record<string, unknown>).settings as
            | { colorScheme?: string; accentColor?: string | null; fontFamily?: string; fontSizeLevel?: number }
            | undefined;
          if (settings) {
            if (settings.colorScheme) {
              // Migrate old scheme names (peterRiver, emerald, carrot)
              if (!COLOR_SCHEME_NAMES.includes(settings.colorScheme as never)) {
                const migrated = migrateColorSchemeName(settings.colorScheme);
                setColorScheme(migrated.baseName);
                setAccentColor(migrated.accentColor);
              } else {
                setColorScheme(settings.colorScheme as ColorSchemeName);
                setAccentColor(settings.accentColor ?? null);
              }
            }
            if (settings.fontFamily) setFontFamily(settings.fontFamily as FontFamilyId);
            if (settings.fontSizeLevel) setFontSizeLevel(settings.fontSizeLevel as FontSizeLevel);
          }
        }
      } catch {
        toast.error(t("importReadError"));
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
    if (isSharing) return;
    if (!isPremium) { onUpgrade("sharing"); return; }
    if (!canShare) { toast(t("shareNameRequired")); return; }
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
  }, [isPremium, isSharing, canShare, t]);

  const handleCopyShareUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Fallback: select input text
    }
  }, [shareUrl]);

  const handleFloatingShare = useCallback(async () => {
    if (isSharing) return;

    if (!isPremium) {
      onUpgrade("sharing");
      return;
    }

    if (!canShare) {
      toast(t("shareNameRequired"));
      return;
    }

    setIsSharing(true);

    try {
      const res = await fetch("/api/cv/publish", { method: "POST" });
      const result = res.ok ? await res.json() : null;
      const slug: string | null = result?.slug ?? null;

      if (!slug) {
        toast.error(t("shareError"));
        return;
      }

      const url = `${window.location.origin}/cv/${slug}`;

      // Use native Web Share API on mobile (coarse pointer = touch device)
      const isMobile = window.matchMedia("(pointer: coarse)").matches;
      if (isMobile && navigator.share) {
        try {
          await navigator.share({
            title: data.personalInfo.fullName,
            text: t("shareDescription"),
            url,
          });
          return;
        } catch (err) {
          // User cancelled or share failed — fall back to dialog
          if (err instanceof Error && err.name === "AbortError") return;
        }
      }

      // Desktop fallback: open share dialog
      setShareUrl(url);
      setShareCopied(false);
      setShareDialogOpen(true);
    } catch {
      toast.error(t("shareError"));
    } finally {
      setIsSharing(false);
    }
  }, [isPremium, canShare, isSharing, t, data.personalInfo.fullName]);

  const menuItemClass =
    "flex w-full items-center justify-between px-4 py-2.5 text-mobile-menu font-medium text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-accent/60 transition-colors cursor-pointer";

  const backButtonClass =
    "w-full flex items-center gap-2 px-4 h-14 border-b border-gray-100 dark:border-border text-mobile-title font-bold text-gray-900 dark:text-gray-100 tracking-tight hover:bg-gray-50 dark:hover:bg-accent/40 transition-colors cursor-pointer shrink-0";

  /* ── PDF upsell gate ────────────────────────────────── */
  const handlePDF = () => {
    if (isPremium) { onPrintPDF(); return; }
    setPdfUpsellOpen(true);
  };

  /* ── Shared design section props ──────────────────────── */
  const onUpgrade = (feature?: UpgradeFeatureKey) => { setUpgradeFeature(feature); setUpgradeDialogOpen(true); };
  const accentPickerProps: AccentPickerProps = { accentColor, setAccentColor, t: t as (key: string) => string };
  const paletteProps: PaletteSectionProps = { colorSchemeName, accentColor, setColorScheme, setAccentColor, t: t as (key: string) => string };
  const isPaletteActive = colorSchemeName === "wetAsphalt";
  const fontProps = { fontFamilyId, fontSizeLevel, setFontFamily, setFontSizeLevel, t: t as (key: string) => string };
  const sectionsProps = { data, toggleSection, t: t as (key: string) => string };

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
                      <span className="font-bold text-mobile-title text-gray-900 dark:text-gray-100 tracking-tight">Applio</span>
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
                    <p className="px-4 pt-3 pb-1.5 text-label font-semibold uppercase tracking-widest text-subtle">
                      {t("design")}
                    </p>

                    <button onClick={() => setMobileMenuPage("palette")} className={menuItemClass}>
                      <span className="flex items-center gap-3">
                        <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-pink-50 dark:bg-pink-900/20 text-pink-500 shrink-0">
                          <Palette className="h-4.5 w-4.5" />
                        </span>
                        {t("colorPalette")}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
                    </button>

                    <div className={isPaletteActive ? "opacity-40 pointer-events-none" : ""}>
                      <button
                        onClick={() => setMobileMenuPage("accent")}
                        className={menuItemClass}
                      >
                        <span className="flex items-center gap-3">
                          <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-500 shrink-0">
                            <Droplet className="h-4.5 w-4.5" />
                          </span>
                          {t("accentColor")}
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
                      </button>
                    </div>

                    <button onClick={() => setMobileMenuPage("font")} className={menuItemClass}>
                      <span className="flex items-center gap-3">
                        <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-500 shrink-0">
                          <Type className="h-4.5 w-4.5" />
                        </span>
                        {t("fontFamily")}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
                    </button>

                    <button onClick={() => setMobileMenuPage("sections")} className={menuItemClass}>
                      <span className="flex items-center gap-3">
                        <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 shrink-0">
                          <SlidersHorizontal className="h-4.5 w-4.5" />
                        </span>
                        {t("sections")}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
                    </button>

                    {/* ── PREFERENCIAS ── */}
                    <p className="px-4 pt-5 pb-1.5 text-label font-semibold uppercase tracking-widest text-subtle">
                      {t("menuPreferences")}
                    </p>

                    <div className={`${menuItemClass} cursor-default`} onClick={toggleTheme}>
                      <span className="flex items-center gap-3">
                        <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 shrink-0">
                          <Moon className="h-4.5 w-4.5" />
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
                          <Globe className="h-4.5 w-4.5" />
                        </span>
                        {t("language")}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm text-subtle">
                        {LOCALE_NAMES[locale]}
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </button>

                    {/* ── ARCHIVO ── */}
                    <p className="px-4 pt-5 pb-1.5 text-label font-semibold uppercase tracking-widest text-subtle">
                      {t("fileMenu")}
                    </p>

                    <button onClick={() => { setMobileMenuOpen(false); handlePDF(); }} disabled={isGeneratingPDF} className={`${menuItemClass} disabled:opacity-50`}>
                      <span className="flex items-center gap-3">
                        <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 shrink-0">
                          {isGeneratingPDF ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Download className="h-4.5 w-4.5" />}
                        </span>
                        {t("pdfTitle")}
                      </span>
                    </button>

                    <button onClick={exportToJSON} className={menuItemClass}>
                      <span className="flex items-center gap-3">
                        <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 shrink-0">
                          <FileDown className="h-4.5 w-4.5" />
                        </span>
                        {t("export")}
                      </span>
                    </button>

                    <button onClick={() => fileInputRef.current?.click()} className={menuItemClass}>
                      <span className="flex items-center gap-3">
                        <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 shrink-0">
                          <FileUp className="h-4.5 w-4.5" />
                        </span>
                        {t("import")}
                      </span>
                    </button>

                    <button onClick={handleShare} disabled={isSharing} className={menuItemClass}>
                      <span className="flex items-center gap-3">
                        <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20 text-green-500 shrink-0">
                          {isSharing ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Share2 className="h-4.5 w-4.5" />}
                        </span>
                        {t("share")}
                      </span>
                    </button>

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
                          <p className="text-mobile-menu font-semibold text-gray-800 dark:text-gray-100 truncate leading-tight">
                            {user.name || user.email}
                          </p>
                          {user.email && user.name && (
                            <p className="text-menu text-subtle truncate">{user.email}</p>
                          )}
                        </div>
                        <button
                          onClick={() => { setMobileMenuOpen(false); signOut(); }}
                          className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer shrink-0"
                          title={tauth("signOut")}
                        >
                          <LogOut className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="px-5 py-4">
                        <button
                          onClick={() => { setMobileMenuOpen(false); setLoginDialogOpen(true); }}
                          className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-mobile-menu font-semibold cursor-pointer hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                        >
                          <LogIn className="h-4.5 w-4.5" />
                          {tauth("login")}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── Mobile: Accent color picker page ── */}
              {mobileMenuPage === "accent" && (
                <div className="flex flex-col h-full">
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-5 w-5 text-subtle" />
                    {t("accentColor")}
                  </button>
                  <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin px-5 pt-5 pb-4">
                    <AccentPicker {...accentPickerProps} />
                  </div>
                </div>
              )}

              {/* ── Mobile: Palette page ── */}
              {mobileMenuPage === "palette" && (
                <div className="flex flex-col h-full">
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-5 w-5 text-subtle" />
                    {t("colorPalette")}
                  </button>
                  <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin px-5 pt-5 pb-4">
                    <PaletteSection {...paletteProps} />
                  </div>
                </div>
              )}

              {/* ── Mobile: Font page ── */}
              {mobileMenuPage === "font" && (
                <div className="flex flex-col h-full">
                  <button onClick={() => setMobileMenuPage("main")} className={backButtonClass}>
                    <ChevronLeft className="h-5 w-5 text-subtle" />
                    {t("fontFamily")}
                  </button>
                  <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin px-4 pt-4 pb-4 space-y-4">
                    <div>
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

                      {/* Font Size */}
                      <div className="mt-6">
                        <p className="text-label font-semibold uppercase tracking-widest text-subtle mb-3">
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
                    <ChevronLeft className="h-5 w-5 text-subtle" />
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
                    <ChevronLeft className="h-5 w-5 text-subtle" />
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
                          className="flex w-full items-center justify-between px-4 py-3.5 min-h-13 text-mobile-menu font-medium text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-accent/60 transition-colors cursor-pointer"
                        >
                          <span className="flex items-baseline gap-1.5">
                            {native}
                            <span className="text-menu text-subtle">({translated})</span>
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
          {/* Desktop: link to landing */}
          <Link
            href="/"
            className="hidden md:flex items-center gap-2"
          >
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-gray-900 dark:text-gray-100" />
            <span className="font-display text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Applio
            </span>
          </Link>
          {/* Mobile: opens menu */}
          <button
            className="flex md:hidden items-center gap-1.5"
            onClick={() => handleMobileMenuOpen(true)}
            aria-label="Abrir menú"
          >
            <span className="font-display text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
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

            {/* Color palette */}
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("colorPalette")}
                      data-testid="btn-color-palette"
                      className="h-10 w-10"
                    >
                      <span className="h-8 w-8 flex items-center justify-center rounded-lg bg-pink-50 dark:bg-pink-900/20 text-pink-500">
                        <Palette className="h-4 w-4" />
                      </span>
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("colorPalette")}</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-auto p-4" align="end" collisionPadding={12}>
                <PaletteSection {...paletteProps} />
              </PopoverContent>
            </Popover>

            {/* Accent color picker (disabled when Asfalto active) */}
            <div className={isPaletteActive ? "opacity-40 pointer-events-none" : ""}>
              <Popover>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("accentColor")}
                        data-testid="btn-accent-color"
                        className="h-10 w-10"
                      >
                        <span className="h-8 w-8 flex items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-500">
                          <Droplet className="h-4 w-4" />
                        </span>
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>{isPaletteActive ? t("accentDisabledHint") : t("accentColor")}</TooltipContent>
                </Tooltip>
                <PopoverContent className="w-auto p-4" align="end">
                  <AccentPicker {...accentPickerProps} />
                </PopoverContent>
              </Popover>
            </div>

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
                    onClick={() => { setFileMenuOpen(false); handlePDF(); }}
                    disabled={isGeneratingPDF}
                    className="flex w-full items-center gap-3 h-10 px-4 text-menu font-medium text-on-subtle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingPDF ? <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-red-500" /> : <Download className="h-3.5 w-3.5 shrink-0 text-red-500" />}
                    {t("pdfTitle")}
                  </button>
                </div>
                <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                  <button
                    onClick={exportToJSON}
                    className="flex w-full items-center gap-3 h-10 px-4 text-menu text-on-subtle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <FileDown className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    {t("export")}
                  </button>
                  <div className="h-px bg-gray-100 dark:bg-white/5" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center gap-3 h-10 px-4 text-menu text-on-subtle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <FileUp className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    {t("import")}
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Share button (always visible) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("share")}
                    onClick={handleShare}
                    disabled={isSharing}
                    className="h-10 w-10"
                  >
                    <span className="h-8 w-8 flex items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20 text-green-500">
                      {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                    </span>
                  </Button>
                </span>
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
                          className="flex w-full items-center justify-between h-10 px-4 text-menu text-on-subtle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                          <span>
                            {native}
                            <span className="ml-1.5 text-label text-subtle">({translated})</span>
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
                      <User className="h-5 w-5 text-subtle" />
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
                  onUpgrade={() => onUpgrade()}
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
                className="relative cursor-pointer md:hidden h-11 w-11 mr-1 items-center justify-center rounded-full overflow-visible transition-all flex group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-1"
              >
                {user ? (
                  <span className="h-9 w-9 rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700 group-hover:ring-gray-400 dark:group-hover:ring-gray-500 transition-all block">
                    <UserAvatar url={user.image} size={9} />
                  </span>
                ) : (
                  <span className="h-9 w-9 rounded-full ring-1 ring-gray-200 dark:ring-gray-700 group-hover:ring-gray-400 dark:group-hover:ring-gray-500 transition-all flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <User className="h-5 w-5 text-subtle" />
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
                onUpgrade={() => onUpgrade()}
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
    <UpgradeDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen} onLogin={() => setLoginDialogOpen(true)} initialFeature={upgradeFeature} />

    {/* PDF upsell dialog */}
    <Dialog open={pdfUpsellOpen} onOpenChange={setPdfUpsellOpen}>
      <DialogContent className="sm:max-w-xs p-0 gap-0 overflow-hidden">
        <DialogDescription className="sr-only">{tpremium("pdfUpsellBody")}</DialogDescription>
        <div className="pt-6 px-6 pb-2 text-center">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center bg-red-50 dark:bg-red-900/20 mx-auto mb-4">
            <FolderDown className="h-8 w-8 text-red-500" />
          </div>
          <DialogTitle className="text-lg font-bold tracking-tight">{tpremium("pdfUpsellTitle")}</DialogTitle>
        </div>
        <p className="px-6 pb-4 text-center text-sm text-muted-foreground leading-relaxed">
          {tpremium("pdfUpsellBody")}
        </p>
        <div className="px-5 pb-5 space-y-2">
          <Button
            onClick={() => { setPdfUpsellOpen(false); onUpgrade("pdfNoBranding"); }}
            className="w-full"
          >
            {tpremium("pdfUpsellUpgrade")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => { setPdfUpsellOpen(false); onPrintPDF(); }}
            className="w-full text-muted-foreground"
          >
            {tpremium("pdfUpsellContinue")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

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
            className="flex-1 min-w-0 bg-transparent pl-2.5 pr-1 py-2 text-menu text-muted-foreground truncate outline-none cursor-default select-all"
            onFocus={(e) => e.target.select()}
          />
          <Button
            size="icon"
            onClick={handleCopyShareUrl}
            className={`shrink-0 rounded-lg ${
              shareCopied
                ? "bg-green-500 text-white hover:bg-green-500"
                : ""
            }`}
          >
            {shareCopied ? <Check /> : <Copy />}
          </Button>
        </div>

        {/* Abrir en nueva pestaña */}
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-menu font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-input"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          {t("shareOpen")}
        </a>
      </DialogContent>
    </Dialog>


    {/* Floating action buttons */}
    <div className="fixed bottom-5 right-4 md:bottom-6 md:right-6 z-50 flex flex-col gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={handleFloatingShare}
            disabled={isSharing}
            className="rounded-full shadow-lg backdrop-blur-sm bg-white/90 dark:bg-card/90 hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            {isSharing ? <Loader2 className="animate-spin text-green-500" /> : <Share2 className="text-green-500" />}
            <span className="sr-only">{t("share")}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">{t("share")}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={handlePDF}
            disabled={isGeneratingPDF}
            className="rounded-full shadow-lg backdrop-blur-sm bg-white/90 dark:bg-card/90 hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            {isGeneratingPDF ? <Loader2 className="animate-spin text-red-500" /> : <Download className="text-red-500" />}
            <span className="sr-only">PDF</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">PDF</TooltipContent>
      </Tooltip>
    </div>
    </>
  );
}
