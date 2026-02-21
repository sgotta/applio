"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useCV } from "@/lib/cv-context";
import { useColorScheme } from "@/lib/color-scheme-context";
import { useSidebarPattern } from "@/lib/sidebar-pattern-context";
import { useFontSettings } from "@/lib/font-context";
import { useTheme } from "@/lib/theme-context";
import { useAppLocale, LOCALES, LOCALE_NAMES } from "@/lib/locale-context";
import { useAuth } from "@/lib/auth-context";
import { usePlan } from "@/lib/plan-context";
import { filenameDateStamp } from "@/lib/utils";
import { CVData } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { UpgradeDialog } from "@/components/premium/UpgradeDialog";
import { toast } from "sonner";
import { publishCV } from "@/lib/supabase/db";
import { type ColorSchemeName } from "@/lib/color-schemes";
import { type SidebarPatternName, type PatternScope, type PatternIntensity } from "@/lib/sidebar-patterns";
import { type FontFamilyId, type FontSizeLevel } from "@/lib/fonts";
import {
  ColorSection,
  PatternSection,
  FontSection,
  SectionsContent,
  UserAvatar,
} from "@/components/toolbar/Toolbar";
import {
  ChevronRight, ChevronLeft, Palette, Layers, Type, SlidersHorizontal,
  Moon, Globe, Download, FileDown, FileUp, Share2, LogOut, LogIn,
  Loader2, Check, Lock, Copy, ExternalLink, X, FileText,
} from "lucide-react";

// Toggle to show/hide the account footer in the desktop panel
const SHOW_ACCOUNT_FOOTER = true;

type PanelPage = "main" | "color" | "pattern" | "font" | "sections" | "language";

interface DesktopPanelProps {
  open: boolean;
  onClose: () => void;
  onPrintPDF: () => void | Promise<void>;
  isGeneratingPDF?: boolean;
}

export function DesktopPanel({ open, onClose, onPrintPDF, isGeneratingPDF }: DesktopPanelProps) {
  const [page, setPage] = useState<PanelPage>("main");
  const [isClosingPanel, setIsClosingPanel] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClosePanel = useCallback(() => {
    setIsClosingPanel(true);
    setTimeout(() => {
      setIsClosingPanel(false);
      onClose();
    }, 200);
  }, [onClose]);

  const { data, importData, toggleSection, updatePersonalInfo } = useCV();
  const { user, signOut } = useAuth();
  const { isPremium } = usePlan();
  const { locale, setLocale } = useAppLocale();
  const { theme, setTheme } = useTheme();
  const { colorSchemeName, setColorScheme } = useColorScheme();
  const {
    patternName, setPattern, sidebarIntensity, mainIntensity, scope,
    setSidebarIntensity, setMainIntensity, setScope, patternSettings, setPatternSettings,
  } = useSidebarPattern();
  const { fontFamilyId, fontSizeLevel, setFontFamily, setFontSizeLevel } = useFontSettings();
  const t = useTranslations("toolbar");
  const tauth = useTranslations("auth");
  const tl = useTranslations("languages");

  // Reset page to main when panel closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => setPage("main"), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const toggleTheme = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme, setTheme]);
  const openUpgrade = useCallback(() => setUpgradeDialogOpen(true), []);
  const canShare = data.personalInfo.fullName.trim().length > 0;

  /* ── Shared section props ── */
  const colorProps = { colorSchemeName, setColorScheme, isPremium, onUpgrade: openUpgrade, t: t as (key: string) => string };
  const patternProps = {
    colorSchemeName, patternName, setPattern, sidebarIntensity, mainIntensity, scope,
    setSidebarIntensity, setMainIntensity, setScope, isPremium, onUpgrade: openUpgrade, t: t as (key: string) => string,
  };
  const fontProps = { fontFamilyId, fontSizeLevel, setFontFamily, setFontSizeLevel, isPremium, onUpgrade: openUpgrade, t: t as (key: string) => string };
  const sectionsProps = { data, toggleSection, isPremium, onUpgrade: openUpgrade, t: t as (key: string) => string };

  /* ── Export JSON ── */
  const exportToJSON = () => {
    const exportData = {
      ...data,
      settings: {
        colorScheme: colorSchemeName,
        fontFamily: fontFamilyId,
        fontSizeLevel,
        marginLevel: 2,
        pattern: patternSettings,
      },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CV-${data.personalInfo.fullName.replace(/\s+/g, "-")}_${filenameDateStamp(locale)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* ── Import JSON ── */
  function isValidCVData(d: unknown): d is CVData {
    if (!d || typeof d !== "object") return false;
    const r = d as Record<string, unknown>;
    return (
      typeof r.personalInfo === "object" && r.personalInfo !== null &&
      typeof (r.personalInfo as Record<string, unknown>).fullName === "string" &&
      Array.isArray(r.experience) && Array.isArray(r.education) &&
      Array.isArray(r.skills) && typeof r.summary === "string"
    );
  }

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!isValidCVData(parsed)) { alert(t("importFormatError")); return; }
        if (confirm(t("importConfirm"))) {
          importData(parsed);
          const settings = (parsed as unknown as Record<string, unknown>).settings as
            | { colorScheme?: string; fontFamily?: string; fontSizeLevel?: number; pattern?: { name: string; sidebarIntensity?: number; mainIntensity?: number; scope: string } }
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
      } catch { alert(t("importReadError")); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  /* ── Share ── */
  const handleShare = useCallback(async () => {
    if (!user || !canShare || isSharing) return;
    setIsSharing(true);
    try {
      let photoForPublish = data.personalInfo.photo;
      if (photoForPublish && photoForPublish.startsWith("data:")) {
        try {
          const res = await fetch(photoForPublish);
          const blob = await res.blob();
          const formData = new FormData();
          formData.append("photo", blob, "photo.jpg");
          const uploadRes = await fetch("/api/upload-photo", { method: "POST", body: formData });
          const result = await uploadRes.json();
          if (result.success && result.url) {
            photoForPublish = result.url;
            updatePersonalInfo("photo", result.url);
          }
        } catch { /* ignore upload error */ }
      }
      const cvData: CVData = { ...data, personalInfo: { ...data.personalInfo, photo: photoForPublish } };
      const settings = { colorScheme: colorSchemeName, fontFamily: fontFamilyId, fontSizeLevel, theme, locale, pattern: patternSettings };
      const slug = await publishCV(user.id, cvData, settings);
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
  }, [user, data, colorSchemeName, isSharing, canShare, patternSettings, fontFamilyId, fontSizeLevel, updatePersonalInfo, t, theme, locale]);

  const handleCopyShareUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch { /* ignore */ }
  }, [shareUrl]);

  /* ── Styles ── */
  const menuItemClass = "flex w-full items-center justify-between px-4 py-2.5 text-[13px] font-medium text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-accent/60 transition-colors cursor-pointer";
  const backButtonClass = "w-full flex items-center gap-2 px-4 h-12 border-b border-gray-100 dark:border-border text-[14px] font-bold text-gray-900 dark:text-gray-100 tracking-tight hover:bg-gray-50 dark:hover:bg-accent/40 transition-colors cursor-pointer shrink-0";

  return (
    <>
      {/* ── Sliding aside panel ── */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-border bg-white dark:bg-card fixed left-0 top-0 h-screen overflow-hidden transition-[width] duration-300 ease-out z-50 ${open ? "w-72" : "w-0"}`}
      >
        <div className="w-72 h-full flex flex-col overflow-hidden">

          {/* ── Main page ── */}
          {page === "main" && (
            <>
              {/* Header: identical to mobile sheet header */}
              <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 dark:border-border shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                  <span className="font-display font-bold text-[17px] text-gray-900 dark:text-gray-100 tracking-tight">Applio</span>
                </div>
                <button
                  onClick={handleClosePanel}
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-accent transition-colors cursor-pointer active:scale-90"
                >
                  <X
                    key={open ? 1 : 0}
                    className={`h-5 w-5 text-gray-500 dark:text-gray-400 ${isClosingPanel ? "animate-spin-out" : "animate-spin-in"}`}
                  />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto overscroll-contain py-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">

                {/* DISEÑO */}
                <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  {t("design")}
                </p>

                <button onClick={() => setPage("color")} className={menuItemClass}>
                  <span className="flex items-center gap-3">
                    <span className="h-8 w-8 flex items-center justify-center rounded-xl bg-pink-50 dark:bg-pink-900/20 text-pink-500 shrink-0">
                      <Palette className="h-[15px] w-[15px]" />
                    </span>
                    {t("colorScheme")}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
                </button>

                <button onClick={() => setPage("pattern")} className={menuItemClass}>
                  <span className="flex items-center gap-3">
                    <span className="h-8 w-8 flex items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-500 shrink-0">
                      <Layers className="h-[15px] w-[15px]" />
                    </span>
                    {t("sidebarPattern")}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
                </button>

                <button onClick={() => setPage("font")} className={menuItemClass}>
                  <span className="flex items-center gap-3">
                    <span className="h-8 w-8 flex items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-500 shrink-0">
                      <Type className="h-[15px] w-[15px]" />
                    </span>
                    {t("fontFamily")}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
                </button>

                <button onClick={() => setPage("sections")} className={menuItemClass}>
                  <span className="flex items-center gap-3">
                    <span className="h-8 w-8 flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 shrink-0">
                      <SlidersHorizontal className="h-[15px] w-[15px]" />
                    </span>
                    {t("sections")}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
                </button>

                {/* PREFERENCIAS */}
                <p className="px-4 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  {t("menuPreferences")}
                </p>

                <div className={`${menuItemClass} cursor-default`} onClick={toggleTheme}>
                  <span className="flex items-center gap-3">
                    <span className="h-8 w-8 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 shrink-0">
                      <Moon className="h-[15px] w-[15px]" />
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

                <button onClick={() => setPage("language")} className={menuItemClass}>
                  <span className="flex items-center gap-3">
                    <span className="h-8 w-8 flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 shrink-0">
                      <Globe className="h-[15px] w-[15px]" />
                    </span>
                    {t("language")}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                    {LOCALE_NAMES[locale]}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </button>

                {/* ARCHIVO */}
                <p className="px-4 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  {t("fileMenu")}
                </p>

                <button onClick={() => { onClose(); onPrintPDF(); }} disabled={isGeneratingPDF} className={`${menuItemClass} disabled:opacity-50`}>
                  <span className="flex items-center gap-3">
                    <span className="h-8 w-8 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 shrink-0">
                      {isGeneratingPDF ? <Loader2 className="h-[15px] w-[15px] animate-spin" /> : <Download className="h-[15px] w-[15px]" />}
                    </span>
                    {t("pdfTitle")}
                  </span>
                </button>

                <button onClick={exportToJSON} className={menuItemClass}>
                  <span className="flex items-center gap-3">
                    <span className="h-8 w-8 flex items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 shrink-0">
                      <FileDown className="h-[15px] w-[15px]" />
                    </span>
                    {t("export")}
                  </span>
                </button>

                <button onClick={() => fileInputRef.current?.click()} className={menuItemClass}>
                  <span className="flex items-center gap-3">
                    <span className="h-8 w-8 flex items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 shrink-0">
                      <FileUp className="h-[15px] w-[15px]" />
                    </span>
                    {t("import")}
                  </span>
                </button>

                <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileImport} className="hidden" />

                {user ? (
                  <button onClick={handleShare} disabled={isSharing || !canShare} className={`${menuItemClass} ${!canShare ? "opacity-50" : ""}`}>
                    <span className="flex items-center gap-3">
                      <span className="h-8 w-8 flex items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20 text-green-500 shrink-0">
                        {isSharing ? <Loader2 className="h-[15px] w-[15px] animate-spin" /> : <Share2 className="h-[15px] w-[15px]" />}
                      </span>
                      {t("share")}
                    </span>
                  </button>
                ) : (
                  <button onClick={() => setLoginDialogOpen(true)} className={`${menuItemClass} opacity-50`}>
                    <span className="flex items-center gap-3">
                      <span className="h-8 w-8 flex items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20 text-green-500 shrink-0">
                        <Share2 className="h-[15px] w-[15px]" />
                      </span>
                      {t("share")}
                    </span>
                    <Lock className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
                  </button>
                )}

                <div className="h-4" />
              </div>

              {/* Footer: Account — controlled by SHOW_ACCOUNT_FOOTER */}
              {SHOW_ACCOUNT_FOOTER && <div className="border-t border-gray-100 dark:border-border shrink-0">
                {user ? (
                  <div className="flex items-center gap-3 px-4 py-5">
                    <span className="h-9 w-9 rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700 shrink-0">
                      <UserAvatar url={user.user_metadata?.avatar_url} size={9} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 truncate leading-snug">
                        {user.user_metadata?.full_name || user.email}
                      </p>
                      {user.email && user.user_metadata?.full_name && (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">{user.email}</p>
                      )}
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer shrink-0"
                      title={tauth("signOut")}
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="px-4 py-4">
                    <button
                      onClick={() => setLoginDialogOpen(true)}
                      className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[13px] font-semibold cursor-pointer hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                    >
                      <LogIn className="h-4 w-4" />
                      {tauth("login")}
                    </button>
                  </div>
                )}
              </div>}
            </>
          )}

          {/* ── Color page ── */}
          {page === "color" && (
            <div className="flex flex-col h-full">
              <button onClick={() => setPage("main")} className={backButtonClass}>
                <ChevronLeft className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                {t("colorScheme")}
              </button>
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                <ColorSection {...colorProps} />
              </div>
            </div>
          )}

          {/* ── Pattern page ── */}
          {page === "pattern" && (
            <div className="flex flex-col h-full">
              <button onClick={() => setPage("main")} className={backButtonClass}>
                <ChevronLeft className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                {t("sidebarPattern")}
              </button>
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                <PatternSection {...patternProps} />
              </div>
            </div>
          )}

          {/* ── Font page ── */}
          {page === "font" && (
            <div className="flex flex-col h-full">
              <button onClick={() => setPage("main")} className={backButtonClass}>
                <ChevronLeft className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                {t("fontFamily")}
              </button>
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                <FontSection {...fontProps} />
              </div>
            </div>
          )}

          {/* ── Sections page ── */}
          {page === "sections" && (
            <div className="flex flex-col h-full">
              <button onClick={() => setPage("main")} className={backButtonClass}>
                <ChevronLeft className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                {t("sections")}
              </button>
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                <SectionsContent {...sectionsProps} />
              </div>
            </div>
          )}

          {/* ── Language page ── */}
          {page === "language" && (
            <div className="flex flex-col h-full">
              <button onClick={() => setPage("main")} className={backButtonClass}>
                <ChevronLeft className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                {t("language")}
              </button>
              <div className="flex-1 overflow-y-auto overscroll-contain py-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                {LOCALES.map((code) => {
                  const translated = tl(code);
                  const native = LOCALE_NAMES[code];
                  return (
                    <button
                      key={code}
                      onClick={() => { setLocale(code); setPage("main"); }}
                      className="flex w-full items-center justify-between px-4 py-2.5 min-h-[40px] text-[13px] font-medium text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-accent/60 transition-colors cursor-pointer"
                    >
                      <span className="flex items-baseline gap-1.5">
                        {native}
                        <span className="text-[11px] text-gray-400 dark:text-gray-500">({translated})</span>
                      </span>
                      {locale === code && (
                        <Check className="h-3.5 w-3.5 text-gray-900 dark:text-gray-100 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </aside>

      {/* ── Dialogs ── */}
      <LoginDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />
      <UpgradeDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen} />

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-xl">{t("shareTitle")}</DialogTitle>
            <DialogDescription>{t("shareDescription")}</DialogDescription>
          </DialogHeader>
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
    </>
  );
}
