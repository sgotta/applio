"use client";

import { memo, useState } from "react";
import { useTranslations } from "next-intl";
import { usePlan } from "@/lib/plan-context";
import { Lock } from "lucide-react";
import { UpgradeDialog } from "./UpgradeDialog";

interface PremiumBadgeProps {
  /** If true, renders nothing when user is premium (just show the feature) */
  hideWhenPremium?: boolean;
}

/**
 * Small lock icon + "PRO" badge that opens the UpgradeDialog on click.
 * Use this inline next to premium feature labels (e.g., in toolbar popovers).
 */
export const PremiumBadge = memo(function PremiumBadge({
  hideWhenPremium = true,
}: PremiumBadgeProps) {
  const { isPremium } = usePlan();
  const t = useTranslations("premium");
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isPremium && hideWhenPremium) return null;

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setDialogOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            e.preventDefault();
            setDialogOpen(true);
          }
        }}
        className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors cursor-pointer"
        title={t("pro")}
      >
        <Lock className="h-2.5 w-2.5" />
        PRO
      </span>

      <UpgradeDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
});
