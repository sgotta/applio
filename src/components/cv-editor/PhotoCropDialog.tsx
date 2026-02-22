"use client";

import { memo, useState, useCallback, useRef } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { useTranslations } from "next-intl";
import { Upload, Trash2, ImagePlus, Crop, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
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
}: PhotoCropDialogProps) {
  const t = useTranslations("photo");
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

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
        alert(t("invalidImage"));
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        alert(t("imageTooLarge"));
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
    resetCropState();
    onOpenChange(false);
  }, [onPhotoChange, resetCropState, onOpenChange]);

  const handleCancelCrop = useCallback(() => {
    resetCropState();
  }, [resetCropState]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const isCropping = !!imageToCrop;

  return (
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
              <div className="flex flex-col items-center gap-6">
                <div className="w-36 h-36 rounded-full overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800 grid place-items-center shadow-sm">
                  {previewError ? (
                    <ImagePlus className="w-8 h-8 text-gray-400" />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element -- preview thumbnail inside dialog, not LCP-critical */
                    <img
                      src={currentPhoto}
                      alt={t("altText")}
                      className="w-full h-full object-cover"
                      onError={() => setPreviewError(true)}
                    />
                  )}
                </div>

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
  );
});
