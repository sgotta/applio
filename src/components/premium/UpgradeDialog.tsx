"use client";

import { memo, useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  FileText,
  LayoutTemplate,
  Clock,
} from "lucide-react";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FEATURES = [
  { icon: FileText, key: "pdfNoBranding", color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20", hex: "#ef4444" },
  { icon: LayoutTemplate, key: "premiumTemplates", color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20", hex: "#8b5cf6" },
] as const;

export const UpgradeDialog = memo(function UpgradeDialog({
  open,
  onOpenChange,
}: UpgradeDialogProps) {
  const t = useTranslations("premium");
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const goPrev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), []);
  const goNext = useCallback(() => setCurrent((c) => Math.min(FEATURES.length - 1, c + 1)), []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- reset carousel on open
  useEffect(() => { if (open) setCurrent(0); }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, goPrev, goNext]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) goNext();
        else goPrev();
      }
      touchStartX.current = null;
    },
    [goNext, goPrev]
  );

  const feature = FEATURES[current];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs p-0 gap-0 overflow-hidden">
        <DialogDescription className="sr-only">
          {t("upgradeDescription")}
        </DialogDescription>

        {/* Title + inline PRO chip */}
        <div className="pt-5 px-6 pb-2 text-center">
          <div className="inline-flex items-center gap-1.5">
            <DialogTitle className="text-xl font-bold tracking-tight">
              {t("upgradeTitle")}
            </DialogTitle>
            <span className="text-[9px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded tracking-widest uppercase">
              Pro
            </span>
          </div>
        </div>

        {/* Hero section — fixed height to prevent layout shifts */}
        <div
          className="h-52 flex flex-col items-center justify-center px-8 text-center overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={feature.key}
              initial={{ opacity: 0, scale: 0.75, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.75, y: -12 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="flex flex-col items-center"
            >
              <div
                className={`h-20 w-20 rounded-3xl flex items-center justify-center ${feature.bg} mb-5`}
              >
                <feature.icon className={`h-10 w-10 ${feature.color}`} />
              </div>

              <p className="text-sm font-semibold leading-snug max-w-52">
                {t(`feature_${feature.key}`)}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Animated dot navigation */}
        <div className="flex items-center justify-center gap-1.5 pb-4">
          {FEATURES.map(({ hex }, i) => (
            <motion.button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Feature ${i + 1}`}
              animate={{
                width: i === current ? 20 : 6,
                backgroundColor: i === current ? hex : "#d1d5db",
              }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
              className="outline-none"
              style={{ height: 6, borderRadius: 9999, flexShrink: 0 }}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="px-5 pb-5">
          <button
            disabled
            className="w-full h-10 rounded-md flex items-center justify-center gap-2 text-sm font-semibold text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 opacity-60 cursor-default select-none"
          >
            <Clock className="h-4 w-4" />
            {t("comingSoon")}
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
});
