"use client";

import { memo } from "react";
import { Pencil, Eye } from "lucide-react";
import { useEditMode } from "@/lib/edit-mode-context";
import { useTranslations } from "next-intl";

export const MobileEditFAB = memo(function MobileEditFAB() {
  const { isViewMode, toggleEditMode } = useEditMode();
  const t = useTranslations("editMode");

  return (
    <button
      onClick={toggleEditMode}
      className="fixed bottom-6 right-6 z-40 md:hidden flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-3 text-white shadow-lg transition-all duration-200 active:scale-95 dark:bg-gray-100 dark:text-gray-900"
      aria-label={isViewMode ? t("switchToEdit") : t("switchToView")}
    >
      {isViewMode ? (
        <>
          <Pencil className="h-4 w-4" />
          <span className="text-sm font-medium">{t("edit")}</span>
        </>
      ) : (
        <>
          <Eye className="h-4 w-4" />
          <span className="text-sm font-medium">{t("view")}</span>
        </>
      )}
    </button>
  );
});
