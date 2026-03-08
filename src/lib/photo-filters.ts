import type { PhotoFilter } from "@/lib/types";

export interface PhotoFilterDef {
  id: PhotoFilter;
  labelKey: string;
  cssFilter: string;
  canvasFilter: string;
  premium: boolean;
}

export const PHOTO_FILTERS: PhotoFilterDef[] = [
  { id: "none", labelKey: "filterNone", cssFilter: "none", canvasFilter: "none", premium: false },
  { id: "grayscale", labelKey: "filterGrayscale", cssFilter: "grayscale(1)", canvasFilter: "grayscale(1)", premium: true },
  { id: "studio", labelKey: "filterStudio", cssFilter: "brightness(1.06) contrast(1.1) saturate(1.15)", canvasFilter: "brightness(1.06) contrast(1.1) saturate(1.15)", premium: true },
  { id: "warm", labelKey: "filterWarm", cssFilter: "brightness(1.04) sepia(0.18) saturate(1.25)", canvasFilter: "brightness(1.04) sepia(0.18) saturate(1.25)", premium: true },
  { id: "cool", labelKey: "filterCool", cssFilter: "brightness(1.04) saturate(0.85) hue-rotate(15deg)", canvasFilter: "brightness(1.04) saturate(0.85) hue-rotate(15deg)", premium: true },
];

export function getPhotoFilter(id?: string): PhotoFilterDef {
  return PHOTO_FILTERS.find((f) => f.id === id) ?? PHOTO_FILTERS[0];
}
