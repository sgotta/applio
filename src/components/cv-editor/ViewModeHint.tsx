"use client";

import { memo, useContext } from "react";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { EditModeContext } from "@/lib/edit-mode-context";

export const ViewModeHint = memo(function ViewModeHint() {
  const ctx = useContext(EditModeContext);
  const t = useTranslations("editMode");

  if (!ctx?.hintVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center print:hidden">
      <div className="pointer-events-auto flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200 rounded-full bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
        <Pencil className="h-3.5 w-3.5" />
        {t("viewModeHint")}
      </div>
    </div>
  );
});
