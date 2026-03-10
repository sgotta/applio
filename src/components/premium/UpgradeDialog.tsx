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
  FolderDown,
  Cloud,
  Share2,
  Rocket,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

const FEATURES = [
  { icon: FolderDown, key: "pdfNoBranding", color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20", hex: "#ef4444" },
  { icon: Cloud, key: "cloudSync", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", hex: "#3b82f6" },
  { icon: Share2, key: "sharing", color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20", hex: "#22c55e" },
  { icon: Rocket, key: "earlyAccess", color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20", hex: "#8b5cf6" },
] as const;

export type UpgradeFeatureKey = (typeof FEATURES)[number]["key"];

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin?: () => void;
  initialFeature?: UpgradeFeatureKey;
}

type PlanId = "3mo" | "6mo";

export const UpgradeDialog = memo(function UpgradeDialog({
  open,
  onOpenChange,
  onLogin,
  initialFeature,
}: UpgradeDialogProps) {
  const t = useTranslations("premium");
  const { user } = useAuth();
  const [current, setCurrent] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("3mo");
  const [loading, setLoading] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const goPrev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), []);
  const goNext = useCallback(() => setCurrent((c) => Math.min(FEATURES.length - 1, c + 1)), []);
  const cycleNext = useCallback(() => setCurrent((c) => (c + 1) % FEATURES.length), []);

  useEffect(() => {
    if (open) {
      const idx = initialFeature ? FEATURES.findIndex((f) => f.key === initialFeature) : 0;
      setCurrent(idx >= 0 ? idx : 0);
      setSelectedPlan("3mo");
      setLoading(false);
    }
  }, [open, initialFeature]);

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

  const handleCheckout = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/mercadopago/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan }),
      });
      if (!res.ok) throw new Error(`Checkout failed: ${res.status}`);
      const { initPoint } = await res.json();
      if (initPoint) {
        window.location.href = initPoint;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setLoading(false);
    }
  }, [loading, selectedPlan]);

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
            <span className="text-micro font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded tracking-widest uppercase">
              Pro
            </span>
          </div>
        </div>

        {/* Hero section — fixed height to prevent layout shifts */}
        <div
          className="h-44 flex flex-col items-center justify-center px-8 text-center overflow-hidden cursor-pointer select-none"
          onClick={cycleNext}
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
        <div className="flex items-center justify-center gap-0.5 pb-3">
          {FEATURES.map(({ hex }, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Feature ${i + 1}`}
              className="outline-none cursor-pointer py-1.5 px-1"
            >
              <motion.span
                animate={{
                  width: i === current ? 20 : 6,
                  backgroundColor: i === current ? hex : "#d1d5db",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
                className="block"
                style={{ height: 6, borderRadius: 9999 }}
              />
            </button>
          ))}
        </div>

        {/* Plan selector */}
        <div className="px-5 pb-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSelectedPlan("3mo")}
            className={`rounded-lg border-2 px-3 py-2.5 text-left transition-colors ${
              selectedPlan === "3mo"
                ? "border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-gray-800"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <p className="text-xs font-medium text-muted-foreground">{t("plan3moLabel")}</p>
            <p className="text-base font-bold">$19.000</p>
          </button>
          <button
            type="button"
            onClick={() => setSelectedPlan("6mo")}
            className={`relative rounded-lg border-2 px-3 py-2.5 text-left transition-colors ${
              selectedPlan === "6mo"
                ? "border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-gray-800"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <span className="absolute -top-2.5 right-2 text-micro font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded tracking-wide">
              {t("planSaveTag")}
            </span>
            <p className="text-xs font-medium text-muted-foreground">{t("plan6moLabel")}</p>
            <p className="text-base font-bold">$33.000</p>
          </button>
        </div>

        {/* CTA */}
        <div className="px-5 pb-5">
          <Button
            disabled={loading}
            onClick={!user && onLogin ? () => { onOpenChange(false); onLogin(); } : handleCheckout}
            className="w-full font-semibold"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : !user ? (
              t("loginRequired")
            ) : (
              t("checkout")
            )}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
});
