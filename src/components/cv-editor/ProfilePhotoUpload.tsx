"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Camera, Pencil, MousePointerClick } from "lucide-react";
import { useTranslations } from "next-intl";
import { useIsViewMode } from "@/hooks/useIsViewMode";
import { useEditMode } from "@/lib/edit-mode-context";
import { toast } from "sonner";
import { PhotoCropDialog } from "./PhotoCropDialog";

interface ProfilePhotoUploadProps {
  currentPhoto?: string;
  fullName: string;
  onPhotoChange: (photoBase64: string | undefined) => void;
  /** Background color for the initials circle (from color scheme) */
  placeholderBg?: string;
  /** Text color for the initials (from color scheme) */
  placeholderText?: string;
}

export function ProfilePhotoUpload({
  currentPhoto,
  fullName,
  onPhotoChange,
  placeholderBg,
  placeholderText,
}: ProfilePhotoUploadProps) {
  const t = useTranslations("photo");
  const te = useTranslations("editMode");
  const viewMode = useIsViewMode();
  const { enterEditMode } = useEditMode();
  const [dialogOpen, setDialogOpen] = useState(false);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (clickTimerRef.current) clearTimeout(clickTimerRef.current); };
  }, []);

  const handlePhotoChange = useCallback(
    (photo: string | undefined) => {
      onPhotoChange(photo);
    },
    [onPhotoChange]
  );

  const getInitials = (name: string): string => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleViewClick = () => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      clickTimerRef.current = setTimeout(() => {
        toast(
          <span className="flex items-center gap-2">
            <MousePointerClick className="h-3.5 w-3.5 shrink-0" />
            {te("doubleClickHint")}
          </span>,
          { duration: 2000 },
        );
      }, 250);
    } else {
      toast(
        <span className="flex items-center gap-2">
          <Pencil className="h-3.5 w-3.5 shrink-0" />
          {te("viewModeHint")}
        </span>,
        { duration: 2000 },
      );
    }
  };

  const handleViewDoubleClick = () => {
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    enterEditMode();
  };

  const photoContent = currentPhoto ? (
    <img
      src={currentPhoto}
      alt={t("altText")}
      className="w-full h-full object-cover"
    />
  ) : (
    <span
      className="text-3xl font-medium leading-none tracking-wide select-none"
      style={{ color: placeholderText ?? "#9ca3af" }}
    >
      {getInitials(fullName)}
    </span>
  );

  return (
    <div className="flex flex-col items-center mb-6">
      {viewMode ? (
        <div
          role="button"
          tabIndex={0}
          onClick={handleViewClick}
          onDoubleClick={handleViewDoubleClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleViewClick();
            }
          }}
          className="relative w-36 h-36 rounded-full overflow-hidden grid place-items-center cursor-pointer"
          style={{ backgroundColor: placeholderBg ?? "#e5e7eb" }}
        >
          {photoContent}
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="relative w-36 h-36 rounded-full overflow-hidden grid place-items-center group cursor-pointer"
            style={{ backgroundColor: placeholderBg ?? "#e5e7eb" }}
          >
            {photoContent}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </button>

          <PhotoCropDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            currentPhoto={currentPhoto}
            onPhotoChange={handlePhotoChange}
          />
        </>
      )}
    </div>
  );
}
