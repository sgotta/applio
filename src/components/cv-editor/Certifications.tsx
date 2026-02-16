"use client";

import React, { memo, useState } from "react";
import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { useIsViewMode } from "@/hooks/useIsViewMode";
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
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

function CertificationCard({
  cert,
  isFirst,
  isLast,
  onRequestDelete,
}: {
  cert: CertificationItem;
  isFirst: boolean;
  isLast: boolean;
  onRequestDelete: (message: string, onConfirm: () => void) => void;
}) {
  const { updateCertification, removeCertification, moveCertification } = useCV();
  const t = useTranslations("certifications");
  const viewMode = useIsViewMode();

  const handleDelete = () => {
    const label = cert.name.trim();
    onRequestDelete(
      label
        ? t("confirmDeleteCertification", { name: label })
        : t("confirmDeleteCertificationEmpty"),
      () => removeCertification(cert.id)
    );
  };

  return (
    <div className="group/cert relative rounded-sm transition-colors duration-150 -mx-1.5 px-1.5 py-1 hover:bg-gray-50/50">
      {/* Action buttons — always visible on mobile, hover-reveal on desktop */}
      {!viewMode && (
        <div className="absolute -right-1 top-1 flex items-center gap-0.5 can-hover:opacity-0 can-hover:group-hover/cert:opacity-100 transition-opacity duration-150">
          {!isFirst && (
            <button
              onClick={() => moveCertification(cert.id, "up")}
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              aria-label={t("moveUp")}
            >
              <ChevronUp className="h-3 w-3 text-gray-400" />
            </button>
          )}
          {!isLast && (
            <button
              onClick={() => moveCertification(cert.id, "down")}
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              aria-label={t("moveDown")}
            >
              <ChevronDown className="h-3 w-3 text-gray-400" />
            </button>
          )}
          <button
            onClick={handleDelete}
            className="p-1 rounded hover:bg-red-50 transition-colors"
            aria-label={t("deleteCertification")}
          >
            <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
          </button>
        </div>
      )}

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
        className="!font-medium !text-gray-500"
        placeholder={t("issuerPlaceholder")}
      />
    </div>
  );
}

export const Certifications = memo(function Certifications() {
  const {
    data: { certifications },
    addCertification,
  } = useCV();
  const t = useTranslations("certifications");
  const viewMode = useIsViewMode();
  const [pendingDelete, setPendingDelete] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  return (
    <div>
      <SectionTitle>{t("title")}</SectionTitle>
      <div className="space-y-3">
        {certifications.map((cert, i) => (
          <CertificationCard
            key={cert.id}
            cert={cert}
            isFirst={i === 0}
            isLast={i === certifications.length - 1}
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
          onClick={addCertification}
          className="mt-2 h-7 px-2 text-[0.917em] text-gray-400 hover:text-gray-600"
        >
          <Plus className="mr-1 h-3 w-3" />
          {t("addCertification")}
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
