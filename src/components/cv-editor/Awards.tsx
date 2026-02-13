"use client";

import React, { memo } from "react";
import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { AwardItem } from "@/lib/types";
import { EditableText } from "./EditableText";
import { SectionTitle } from "./SectionTitle";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

function AwardCard({ award }: { award: AwardItem }) {
  const { updateAward, removeAward } = useCV();
  const t = useTranslations("awards");

  return (
    <div className="group/award relative rounded-sm transition-colors duration-150 -mx-1.5 px-1.5 py-1 hover:bg-gray-50/50 dark:hover:bg-accent/50">
      <div className="absolute -right-1 top-1 flex items-center gap-0.5 opacity-0 group-hover/award:opacity-100 transition-opacity duration-150">
        <button
          onClick={() => removeAward(award.id)}
          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          aria-label={t("deleteAward")}
        >
          <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
        </button>
      </div>

      <div className="flex items-baseline justify-between gap-2 pr-8">
        <EditableText
          value={award.name}
          onChange={(v) => updateAward(award.id, { name: v })}
          as="itemTitle"
          placeholder={t("namePlaceholder")}
        />
        <EditableText
          value={award.date}
          onChange={(v) => updateAward(award.id, { date: v })}
          as="tiny"
          className="flex-shrink-0"
          placeholder={t("datePlaceholder")}
        />
      </div>

      <EditableText
        value={award.issuer}
        onChange={(v) => updateAward(award.id, { issuer: v })}
        as="small"
        className="!font-medium !text-gray-500 dark:text-gray-400!"
        placeholder={t("issuerPlaceholder")}
      />
    </div>
  );
}

export const Awards = memo(function Awards() {
  const {
    data: { awards },
    addAward,
  } = useCV();
  const t = useTranslations("awards");

  return (
    <div>
      <SectionTitle>{t("title")}</SectionTitle>
      <div className="space-y-3">
        {awards.map((award) => (
          <AwardCard key={award.id} award={award} />
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={addAward}
        className="mt-2 h-7 px-2 text-[11px] text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
      >
        <Plus className="mr-1 h-3 w-3" />
        {t("addAward")}
      </Button>
    </div>
  );
});
