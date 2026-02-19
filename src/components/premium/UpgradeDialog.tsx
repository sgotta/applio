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
  { icon: FileText, key: "pdfNoBranding" },
  { icon: Cloud, key: "cloudSync" },
  { icon: Monitor, key: "multiDevice" },
  { icon: Palette, key: "allColors" },
  { icon: Type, key: "allFonts" },
  { icon: Layers, key: "allPatterns" },
  { icon: SlidersHorizontal, key: "allSections" },
  { icon: Sparkles, key: "richText" },
] as const;

export const UpgradeDialog = memo(function UpgradeDialog({
  open,
  onOpenChange,
}: UpgradeDialogProps) {
  const t = useTranslations("premium");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {t("upgradeTitle")}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t("upgradeDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {FEATURES.map(({ icon: Icon, key }) => (
              <div key={key} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-accent">
                  <Icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  {t(`feature_${key}`)}
                </span>
              </div>
            ))}
          </div>

          <Button
            disabled
            className="w-full"
            size="lg"
          >
            <Clock className="h-4 w-4 mr-2" />
            {t("comingSoon")}
          </Button>

        </DialogContent>
      </Dialog>
    </>
  );
});
