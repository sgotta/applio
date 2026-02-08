import { CVData } from "./types";

const STORAGE_KEY = "cv-builder-data";

export function saveCVData(data: CVData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.error("Failed to save CV data to localStorage");
  }
}

export function loadCVData(): CVData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CVData;
  } catch {
    console.error("Failed to load CV data from localStorage");
    return null;
  }
}

export function clearCVData(): void {
  localStorage.removeItem(STORAGE_KEY);
}
