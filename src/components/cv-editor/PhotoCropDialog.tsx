"use client";

import { memo, useState, useCallback, useRef } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { useTranslations } from "next-intl";
import { Upload, Trash2, ImagePlus, Crop } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const resetCropState = useCallback(() => {
    setImageToCrop(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
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
    onPhotoChange(croppedImage);
    resetCropState();
    onOpenChange(false);
  }, [imageToCrop, croppedAreaPixels, onPhotoChange, resetCropState, onOpenChange]);

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
      <DialogContent className="sm:max-w-md">
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

            <div className="relative w-full h-64 bg-gray-900 rounded-md overflow-hidden">
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

            <DialogFooter>
              <Button variant="outline" onClick={handleCancelCrop}>
                {t("cancel")}
              </Button>
              <Button onClick={handleApply}>{t("apply")}</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("altText")}</DialogTitle>
            </DialogHeader>

            {currentPhoto ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-40 h-40 rounded-full overflow-hidden">
                  <img
                    src={currentPhoto}
                    alt={t("altText")}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setImageToCrop(currentPhoto!)}
                  >
                    <Crop className="w-4 h-4 mr-2" />
                    {t("adjust")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={triggerFileInput}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {t("change")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t("delete")}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={triggerFileInput}
                className="flex flex-col items-center justify-center gap-3 w-full py-10 border-2 border-dashed border-gray-300 dark:border-border rounded-lg hover:border-gray-400 dark:hover:border-ring hover:bg-gray-50 dark:hover:bg-accent transition-colors cursor-pointer"
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
