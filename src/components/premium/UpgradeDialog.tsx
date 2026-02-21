"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Palette,
  Type,
  Layers,
  FileText,
  Sparkles,
  SlidersHorizontal,
  Cloud,
  Monitor,
  Clock,
} from "lucide-react";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FEATURES = [
  { icon: FileText, key: "pdfNoBranding", bg: "bg-red-50 dark:bg-red-900/20", color: "text-red-500" },
  { icon: Cloud, key: "cloudSync", bg: "bg-emerald-50 dark:bg-emerald-900/20", color: "text-emerald-500" },
  { icon: Monitor, key: "multiDevice", bg: "bg-sky-50 dark:bg-sky-900/20", color: "text-sky-500" },
  { icon: Palette, key: "allColors", bg: "bg-pink-50 dark:bg-pink-900/20", color: "text-pink-500" },
  { icon: Type, key: "allFonts", bg: "bg-indigo-50 dark:bg-indigo-900/20", color: "text-indigo-500" },
  { icon: Layers, key: "allPatterns", bg: "bg-violet-50 dark:bg-violet-900/20", color: "text-violet-500" },
  { icon: SlidersHorizontal, key: "allSections", bg: "bg-emerald-50 dark:bg-emerald-900/20", color: "text-emerald-600" },
  { icon: Sparkles, key: "richText", bg: "bg-amber-50 dark:bg-amber-900/20", color: "text-amber-500" },
] as const;

export const UpgradeDialog = memo(function UpgradeDialog({
  open,
  onOpenChange,
}: UpgradeDialogProps) {
  const t = useTranslations("premium");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm flex flex-col max-h-[85dvh] gap-0 p-0">
          {/* Header fijo */}
          <DialogHeader className="px-6 pt-6 pb-3 shrink-0">
            <DialogTitle className="text-center text-xl">
              {t("upgradeTitle")}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t("upgradeDescription")}
            </DialogDescription>
          </DialogHeader>

          {/* Lista scrollable */}
          <div className="overflow-y-auto flex-1 min-h-0 px-6">
            <div className="space-y-1 py-1">
              {FEATURES.map(({ icon: Icon, key, bg, color }) => (
                <div key={key} className="flex items-center gap-3 py-1.5">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <span className="text-[14px] text-gray-700 dark:text-gray-200">
                    {t(`feature_${key}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Botón fijo al fondo */}
          <div className="px-6 pb-6 pt-3 shrink-0">
            <Button
              disabled
              className="w-full"
              size="lg"
            >
              <Clock className="h-4 w-4 mr-2" />
              {t("comingSoon")}
            </Button>
          </div>

        </DialogContent>
      </Dialog>
    </>
  );
});
