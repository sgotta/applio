"use client";

import React, { memo, useState } from "react";
import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { CertificationItem } from "@/lib/types";
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
import { SwipeToDelete } from "@/components/ui/swipe-to-delete";
import { Plus, Trash2 } from "lucide-react";

function CertificationCard({
  cert,
  onRequestDelete,
}: {
  cert: CertificationItem;
  onRequestDelete: (message: string, onConfirm: () => void) => void;
}) {
  const { updateCertification, removeCertification } = useCV();
  const t = useTranslations("certifications");

  const handleSwipeDelete = () => {
    const label = cert.name.trim();
    onRequestDelete(
      label
        ? t("confirmDeleteCertification", { name: label })
        : t("confirmDeleteCertificationEmpty"),
      () => removeCertification(cert.id)
    );
  };

  return (
    <SwipeToDelete onDelete={handleSwipeDelete}>
      <div className="group/cert relative rounded-sm transition-colors duration-150 -mx-1.5 px-1.5 py-1 hover:bg-gray-50/50 dark:hover:bg-accent/50">
        <div className="absolute -right-1 top-1 hidden md:flex items-center gap-0.5 opacity-0 group-hover/cert:opacity-100 transition-opacity duration-150">
          <button
            onClick={() => removeCertification(cert.id)}
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            aria-label={t("deleteCertification")}
          >
            <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
          </button>
        </div>

        <div className="flex items-baseline justify-between gap-2 pr-8">
          <EditableText
            value={cert.name}
            onChange={(v) => updateCertification(cert.id, { name: v })}
            as="itemTitle"
            placeholder={t("namePlaceholder")}
          />
          <EditableText
            value={cert.date}
            onChange={(v) => updateCertification(cert.id, { date: v })}
            as="tiny"
            className="flex-shrink-0"
            placeholder={t("datePlaceholder")}
          />
        </div>

        <EditableText
          value={cert.issuer}
          onChange={(v) => updateCertification(cert.id, { issuer: v })}
          as="small"
          className="!font-medium !text-gray-500 dark:text-gray-400!"
          placeholder={t("issuerPlaceholder")}
        />
      </div>
    </SwipeToDelete>
  );
}

export const Certifications = memo(function Certifications() {
  const {
    data: { certifications },
    addCertification,
  } = useCV();
  const t = useTranslations("certifications");
  const [pendingDelete, setPendingDelete] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  return (
    <div>
      <SectionTitle>{t("title")}</SectionTitle>
      <div className="space-y-3">
        {certifications.map((cert) => (
          <CertificationCard
            key={cert.id}
            cert={cert}
            onRequestDelete={(message, onConfirm) =>
              setPendingDelete({ message, onConfirm })
            }
          />
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={addCertification}
        className="mt-2 h-7 px-2 text-[11px] text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
      >
        <Plus className="mr-1 h-3 w-3" />
        {t("addCertification")}
      </Button>

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
