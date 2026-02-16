"use client";

import React, { memo, useState } from "react";
import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { useIsViewMode } from "@/hooks/useIsViewMode";
import { AwardItem } from "@/lib/types";
import { EditableText } from "./EditableText";
import { SectionTitle } from "./SectionTitle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

function AwardCard({
  award,
  isFirst,
  isLast,
  onRequestDelete,
}: {
  award: AwardItem;
  isFirst: boolean;
  isLast: boolean;
  onRequestDelete: (message: string, onConfirm: () => void) => void;
}) {
  const { updateAward, removeAward, moveAward } = useCV();
  const t = useTranslations("awards");
  const viewMode = useIsViewMode();

  const handleDelete = () => {
    const label = award.name.trim();
    onRequestDelete(
      label
        ? t("confirmDeleteAward", { name: label })
        : t("confirmDeleteAwardEmpty"),
      () => removeAward(award.id)
    );
  };

  return (
    <div className="group/award relative rounded-sm transition-colors duration-150 -mx-1.5 px-1.5 py-1 hover:bg-gray-50/50 dark:hover:bg-accent/50">
      {/* Action buttons — always visible on mobile, hover-reveal on desktop */}
      {!viewMode && (
        <div className="absolute -right-1 top-1 flex items-center gap-0.5 can-hover:opacity-0 can-hover:group-hover/award:opacity-100 transition-opacity duration-150">
          {!isFirst && (
            <button
              onClick={() => moveAward(award.id, "up")}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-muted transition-colors"
              aria-label={t("moveUp")}
            >
              <ChevronUp className="h-3 w-3 text-gray-400 dark:text-gray-500" />
            </button>
          )}
          {!isLast && (
            <button
              onClick={() => moveAward(award.id, "down")}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-muted transition-colors"
              aria-label={t("moveDown")}
            >
              <ChevronDown className="h-3 w-3 text-gray-400 dark:text-gray-500" />
            </button>
          )}
          <button
            onClick={handleDelete}
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            aria-label={t("deleteAward")}
          >
            <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
          </button>
        </div>
      )}

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
  const viewMode = useIsViewMode();
  const [pendingDelete, setPendingDelete] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  return (
    <div>
      <SectionTitle>{t("title")}</SectionTitle>
      <div className="space-y-3">
        {awards.map((award, i) => (
          <AwardCard
            key={award.id}
            award={award}
            isFirst={i === 0}
            isLast={i === awards.length - 1}
            onRequestDelete={(message, onConfirm) =>
              setPendingDelete({ message, onConfirm })
            }
          />
        ))}
      </div>
      {!viewMode && (
        <Button
          variant="ghost"
          size="sm"
          onClick={addAward}
          className="mt-2 h-7 px-2 text-[0.917em] text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          <Plus className="mr-1 h-3 w-3" />
          {t("addAward")}
        </Button>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent showCloseButton={false} className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">
              {pendingDelete?.message}
            </DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPendingDelete(null)}
            >
              {t("deleteCancel")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                pendingDelete?.onConfirm();
                setPendingDelete(null);
              }}
            >
              {t("deleteConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
