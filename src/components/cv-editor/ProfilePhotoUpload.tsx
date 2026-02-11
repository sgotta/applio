"use client";

import { Camera } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert(t("invalidImage"));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert(t("imageTooLarge"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onPhotoChange(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    if (confirm(t("confirmDelete"))) {
      onPhotoChange(undefined);
    }
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col items-center gap-3 mb-6">
      <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center group">
        {currentPhoto ? (
          <img
            src={currentPhoto}
            alt={t("altText")}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl text-gray-500 font-semibold">
            {getInitials(fullName)}
          </span>
        )}

        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
          <label className="cursor-pointer flex items-center justify-center w-full h-full">
            <Camera className="w-6 h-6 text-white" />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="flex gap-2">
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button variant="outline" size="sm" asChild>
            <span className="cursor-pointer">
              {currentPhoto ? t("change") : t("upload")} {t("photoLabel")}
            </span>
          </Button>
        </label>

        {currentPhoto && (
          <Button variant="ghost" size="sm" onClick={handleRemovePhoto}>
            {t("delete")}
          </Button>
        )}
      </div>
    </div>
  );
}
