"use client";

import { useState, useCallback, useEffect } from "react";
import { Camera } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset error when photo prop changes
    setPhotoError(false);
  }, [currentPhoto]);

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

  const showInitials = !currentPhoto || photoError;

  const photoContent = showInitials ? (
    <span
      className="text-3xl font-medium leading-none tracking-wide select-none"
      style={{ color: placeholderText ?? "#9ca3af" }}
    >
      {getInitials(fullName)}
    </span>
  ) : (
    <img
      src={currentPhoto}
      alt={t("altText")}
      className="w-full h-full object-cover"
      onError={() => setPhotoError(true)}
    />
  );

  return (
    <div className="flex flex-col items-center mb-6">
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
    </div>
  );
}
