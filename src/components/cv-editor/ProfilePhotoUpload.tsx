"use client";

import { useState, useCallback } from "react";
import { Camera } from "lucide-react";
import { useTranslations } from "next-intl";
import { PhotoCropDialog } from "./PhotoCropDialog";

interface ProfilePhotoUploadProps {
  currentPhoto?: string;
  fullName: string;
  onPhotoChange: (photoBase64: string | undefined) => void;
}

export function ProfilePhotoUpload({
  currentPhoto,
  fullName,
  onPhotoChange,
}: ProfilePhotoUploadProps) {
  const t = useTranslations("photo");
  const [dialogOpen, setDialogOpen] = useState(false);

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

  return (
    <div className="flex flex-col items-center mb-6">
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-accent flex items-center justify-center group cursor-pointer"
      >
        {currentPhoto ? (
          <img
            src={currentPhoto}
            alt={t("altText")}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl text-gray-500 dark:text-gray-400 font-semibold">
            {getInitials(fullName)}
          </span>
        )}

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
