import { test, expect } from "@playwright/test";
import { minimalCV, seedCVData } from "../helpers/setup";
import { mockAuthSession, mockCVApi } from "../helpers/auth-mock";

// Minimal valid 1x1 red PNG as base64 data-URI (renders as a real image)
const VALID_PNG_DATA_URI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

test.describe("Regression Tests @regression", () => {
  test.describe("Photo Sync", () => {
    test("photo without login stays as base64 in localStorage", async ({ page }) => {
      const cvWithPhoto = {
        ...minimalCV,
        personalInfo: {
          ...minimalCV.personalInfo,
          photoUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAgAAAQ",
        },
      };

      await page.goto("/editor");
      await page.locator(".cv-preview-content").waitFor({ state: "visible" });
      await seedCVData(page, cvWithPhoto);

      // Verify photo is stored as base64 in localStorage
      const storedPhoto = await page.evaluate(() => {
        const raw = localStorage.getItem("cv-builder-data");
        if (!raw) return null;
        const data = JSON.parse(raw);
        return data.personalInfo?.photoUrl ?? null;
      });

      expect(storedPhoto).toBeTruthy();
      expect(storedPhoto).toMatch(/^data:/);
    });

    test("login with base64 photo triggers upload API call", async ({ page }) => {
      const cvWithPhoto = {
        ...minimalCV,
        personalInfo: {
          ...minimalCV.personalInfo,
          photoUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAgAAAQ",
        },
      };

      await page.goto("/editor");
      await page.locator(".cv-preview-content").waitFor({ state: "visible" });
      await seedCVData(page, cvWithPhoto);

      // Mock auth + empty cloud
      await mockAuthSession(page);
      await mockCVApi(page, { loadCVReturn: null });

      // Mock upload-photo endpoint
      await page.route("**/api/upload-photo", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, url: "https://r2.example.com/mock-photo.webp" }),
        });
      });

      // Wait for the upload call instead of a fixed timeout
      const uploadPromise = page.waitForResponse(
        (r) => r.url().includes("/api/upload-photo") && r.status() === 200,
        { timeout: 15_000 },
      );

      await page.reload();
      await page.locator(".cv-preview-content").waitFor({ state: "visible" });

      // This resolves once the upload-photo mock is hit
      await uploadPromise;
    });

    test("export JSON embeds photo as base64 even from R2 URL", async ({ page }) => {
      const cvWithR2Photo = {
        ...minimalCV,
        personalInfo: {
          ...minimalCV.personalInfo,
          photoUrl: "https://r2.example.com/test-photo.webp",
        },
      };

      await page.goto("/editor");
      await page.locator(".cv-preview-content").waitFor({ state: "visible" });
      await seedCVData(page, cvWithR2Photo);

      // Mock the R2 URL fetch to return a small valid image blob
      await page.route("https://r2.example.com/test-photo.webp", async (route) => {
        // Return a minimal 1x1 PNG
        const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        await route.fulfill({
          status: 200,
          contentType: "image/png",
          body: Buffer.from(pngBase64, "base64"),
        });
      });

      // Listen for the download event triggered by export
      const downloadPromise = page.waitForEvent("download", { timeout: 10000 });

      // Open file menu and click export
      const fileMenuBtn = page.locator("[data-testid='btn-file-menu']");
      await fileMenuBtn.waitFor({ state: "visible" });
      await fileMenuBtn.click();

      const exportBtn = page.locator("[data-radix-popper-content-wrapper]").locator("button", { hasText: /JSON/i }).first();
      await exportBtn.waitFor({ state: "visible" });
      await exportBtn.click();

      const download = await downloadPromise;
      const filePath = await download.path();
      expect(filePath).toBeTruthy();

      // Read the downloaded file and verify the photo is base64
      const fs = await import("fs");
      const content = fs.readFileSync(filePath!, "utf-8");
      const parsed = JSON.parse(content);

      // The photo should be embedded as base64, not the R2 URL
      expect(parsed.personalInfo.photoUrl).toMatch(/^data:/);
    });

    test("base64 photo renders as img (not initials) in editor", async ({ page }) => {
      const cvWithPhoto = {
        ...minimalCV,
        personalInfo: {
          ...minimalCV.personalInfo,
          photoUrl: VALID_PNG_DATA_URI,
        },
      };

      await page.goto("/editor");
      await page.locator(".cv-preview-content").waitFor({ state: "visible" });
      await seedCVData(page, cvWithPhoto);

      // Desktop ProfilePhotoUpload (inside hidden md:block container) shows <img>
      const desktopPhoto = page.locator(".hidden.md\\:block img[alt='Profile photo']");
      await desktopPhoto.waitFor({ state: "attached", timeout: 5000 });

      // The img element should exist (not replaced by initials)
      await expect(desktopPhoto).toHaveCount(1);

      // Initials span should NOT be present in the desktop photo container
      const desktopInitials = page.locator(".hidden.md\\:block button.rounded-full span.text-3xl");
      await expect(desktopInitials).toHaveCount(0);
    });

    test("photo removal shows initials again in editor", async ({ page }) => {
      // Start with photo
      const cvWithPhoto = {
        ...minimalCV,
        personalInfo: {
          ...minimalCV.personalInfo,
          photoUrl: VALID_PNG_DATA_URI,
        },
      };

      await page.goto("/editor");
      await page.locator(".cv-preview-content").waitFor({ state: "visible" });
      await seedCVData(page, cvWithPhoto);

      // Photo should exist in desktop container
      const desktopPhoto = page.locator(".hidden.md\\:block img[alt='Profile photo']");
      await desktopPhoto.waitFor({ state: "attached", timeout: 5000 });

      // Now remove the photo by seeding without it
      await seedCVData(page, minimalCV);

      // Initials should reappear in desktop container
      const desktopInitials = page.locator(".hidden.md\\:block button.rounded-full span.text-3xl");
      await desktopInitials.waitFor({ state: "attached", timeout: 5000 });

      // Photo img should be gone from desktop container
      await expect(page.locator(".hidden.md\\:block img[alt='Profile photo']")).toHaveCount(0);
    });
  });
});
