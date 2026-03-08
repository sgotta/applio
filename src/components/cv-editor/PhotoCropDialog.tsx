"use client";

import { memo, useState, useCallback, useRef } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { useTranslations } from "next-intl";
import { Upload, Trash2, ImagePlus, Crop, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { usePlan } from "@/lib/plan-context";
import { PHOTO_FILTERS, getPhotoFilter } from "@/lib/photo-filters";
import type { PhotoFilter } from "@/lib/types";
import { UpgradeDialog } from "@/components/premium/UpgradeDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

interface PhotoCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPhoto?: string;
  onPhotoChange: (photo: string | undefined) => void;
  photoFilter?: PhotoFilter;
  onPhotoFilterChange?: (filter: PhotoFilter) => void;
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<string> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = imageSrc;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
  });

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL("image/jpeg", 0.9);
}

export const PhotoCropDialog = memo(function PhotoCropDialog({
  open,
  onOpenChange,
  currentPhoto,
  onPhotoChange,
  photoFilter,
  onPhotoFilterChange,
}: PhotoCropDialogProps) {
  const t = useTranslations("photo");
  const { user } = useAuth();
  const { isPremium } = usePlan();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const activeFilter = getPhotoFilter(photoFilter);

  const resetCropState = useCallback(() => {
    setImageToCrop(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setPreviewError(false);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) resetCropState();
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetCropState]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error(t("invalidImage"));
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error(t("imageTooLarge"));
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageToCrop(ev.target?.result as string);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [t]
  );

  const handleCropDone = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleApply = useCallback(async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);

    // Logged in → upload to R2 and store URL; otherwise store base64
    if (user) {
      setUploading(true);
      try {
        const res = await fetch(croppedImage);
        const blob = await res.blob();
        const formData = new FormData();
        formData.append("photo", blob, "photo.jpg");
        const uploadRes = await fetch("/api/upload-photo", { method: "POST", body: formData });
        const result = await uploadRes.json();
        if (result.success && result.url) {
          onPhotoChange(result.url);
        } else {
          // R2 failed — fall back to base64
          onPhotoChange(croppedImage);
        }
      } catch {
        onPhotoChange(croppedImage);
      } finally {
        setUploading(false);
      }
    } else {
      onPhotoChange(croppedImage);
    }

    resetCropState();
    onOpenChange(false);
  }, [imageToCrop, croppedAreaPixels, onPhotoChange, resetCropState, onOpenChange, user]);

  const handleDelete = useCallback(() => {
    onPhotoChange(undefined);
    if (onPhotoFilterChange) onPhotoFilterChange("none");
    resetCropState();
    onOpenChange(false);
  }, [onPhotoChange, onPhotoFilterChange, resetCropState, onOpenChange]);

  const handleCancelCrop = useCallback(() => {
    resetCropState();
  }, [resetCropState]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFilterSelect = useCallback(
    (filterId: PhotoFilter, premium: boolean) => {
      if (premium && !isPremium) {
        setUpgradeOpen(true);
        return;
      }
      onPhotoFilterChange?.(filterId);
    },
    [isPremium, onPhotoFilterChange]
  );

  const isCropping = !!imageToCrop;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {isCropping ? (
            <>
              <DialogHeader>
                <DialogTitle>{t("cropTitle")}</DialogTitle>
                <DialogDescription>{t("cropDescription")}</DialogDescription>
              </DialogHeader>

              <div className="relative w-full h-72 bg-gray-900 rounded-xl overflow-hidden">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={handleCropDone}
                />
              </div>

              <div className="flex items-center gap-3 px-1">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {t("zoom")}
                </span>
                <Slider
                  value={[zoom]}
                  onValueChange={(values) => setZoom(values[0])}
                  min={1}
                  max={3}
                  step={0.05}
                  className="flex-1"
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                  <button
                    onClick={handleApply}
                    disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 px-5 h-14 text-[15px] font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t("apply")}
                  </button>
                </div>
                <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                  <button
                    onClick={handleCancelCrop}
                    className="w-full flex items-center justify-center px-5 h-14 text-[15px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    {t("cancel")}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{t("altText")}</DialogTitle>
                <DialogDescription className="sr-only">
                  {t("upload")} {t("photoLabel")}
                </DialogDescription>
              </DialogHeader>

              {currentPhoto ? (
                <div className="flex flex-col items-center gap-4">
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="w-40 h-40 rounded-full overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800 grid place-items-center shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {previewError ? (
                      <ImagePlus className="w-8 h-8 text-gray-400" />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element -- preview thumbnail inside dialog, not LCP-critical */
                      <img
                        src={currentPhoto}
                        alt={t("altText")}
                        className="w-full h-full object-cover"
                        style={{ filter: activeFilter.cssFilter }}
                        onError={() => setPreviewError(true)}
                      />
                    )}
                  </button>

                  {/* Filter selector */}
                  {!previewError && onPhotoFilterChange && (
                    <div className="flex justify-center gap-2.5">
                      {PHOTO_FILTERS.map((def) => {
                        const isActive = activeFilter.id === def.id;
                        return (
                          <button
                            key={def.id}
                            type="button"
                            onClick={() => handleFilterSelect(def.id, def.premium)}
                            className="flex flex-col items-center gap-1 cursor-pointer"
                          >
                            <div
                              className={`relative w-10 h-10 rounded-full overflow-hidden ring-[1.5px] transition-all ${
                                isActive
                                  ? "ring-gray-900 dark:ring-gray-100"
                                  : "ring-transparent hover:ring-gray-300 dark:hover:ring-gray-600"
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={currentPhoto}
                                alt=""
                                className="w-full h-full object-cover"
                                style={{ filter: def.cssFilter }}
                              />
                              {def.premium && !isPremium && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <Lock className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <span className={`text-[10px] leading-tight ${
                              isActive
                                ? "font-semibold text-gray-900 dark:text-gray-100"
                                : "text-muted-foreground"
                            }`}>
                              {t(def.labelKey)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="w-full flex flex-col gap-2.5">
                    {/* Acciones principales */}
                    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                      {!previewError && (
                        <>
                          <button
                            onClick={() => setImageToCrop(currentPhoto!)}
                            className="w-full flex items-center gap-4 px-5 h-14 text-[15px] font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <Crop className="w-4.5 h-4.5 text-gray-500 dark:text-gray-400 shrink-0" />
                            {t("adjust")}
                          </button>
                          <div className="h-px bg-gray-100 dark:bg-white/5" />
                        </>
                      )}
                      <button
                        onClick={triggerFileInput}
                        className="w-full flex items-center gap-4 px-5 h-14 text-[15px] font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <Upload className="w-4.5 h-4.5 text-gray-500 dark:text-gray-400 shrink-0" />
                        {t("change")}
                      </button>
                    </div>
                    {/* Eliminar — grupo separado (destructivo) */}
                    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-4 px-5 h-14 text-[15px] font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4.5 h-4.5 shrink-0" />
                        {t("delete")}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="flex flex-col items-center justify-center gap-3 w-full py-10 border-2 border-dashed border-gray-300 dark:border-border rounded-xl hover:border-gray-400 dark:hover:border-ring hover:bg-gray-50 dark:hover:bg-accent transition-colors cursor-pointer"
                >
                  <ImagePlus className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-muted-foreground">
                    {t("upload")} {t("photoLabel")}
                  </span>
                </button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
});
