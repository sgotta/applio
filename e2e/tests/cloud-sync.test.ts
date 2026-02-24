import { test, expect } from "@playwright/test";
import { minimalCV, seedCVData } from "../helpers/setup";
import { mockAuthSession, clearAuthSession, mockCVApi } from "../helpers/auth-mock";
import type { CVData, CloudSettings } from "../../src/lib/types";

const defaultSettings: CloudSettings = {
  colorScheme: "ivory",
  fontFamily: "inter",
  fontSizeLevel: 2,
  theme: "light",
  locale: "es",
  pattern: { name: "none", sidebarIntensity: 3, mainIntensity: 2, scope: "sidebar" },
};

/** CV data that differs from minimalCV */
const cloudCV: CVData = {
  ...minimalCV,
  personalInfo: { ...minimalCV.personalInfo, fullName: "Cloud User" },
  summary: "Cloud summary",
};

test.describe("Smoke Tests @smoke", () => {
  test.describe("Cloud Sync", () => {
    test("login with no cloud data — no conflict dialog", async ({ page }) => {
      // Seed local data
      await page.goto("/editor");
      await page.locator(".cv-preview-content").waitFor({ state: "visible" });
      await seedCVData(page, minimalCV);

      // Mock auth + empty cloud
      await mockAuthSession(page);
      await mockCVApi(page, { loadCVReturn: null });

      // Reload to trigger login flow
      await page.reload();
      await page.locator(".cv-preview-content").waitFor({ state: "visible" });

      // Conflict dialog should NOT appear
      await page.waitForTimeout(1000);
      await expect(page.locator("text=Encontramos tu CV")).not.toBeVisible();
    });

    test("login with identical cloud data — no conflict dialog", async ({ page }) => {
      await page.goto("/editor");
      await page.locator(".cv-preview-content").waitFor({ state: "visible" });
      await seedCVData(page, minimalCV);

      await mockAuthSession(page);
      await mockCVApi(page, {
        loadCVReturn: {
          id: "cv-1",
          cvData: minimalCV,
          settings: defaultSettings,
          isPublished: false,
          slug: null,
          updatedAt: new Date().toISOString(),
        },
      });

      await page.reload();
      await page.locator(".cv-preview-content").waitFor({ state: "visible" });

      await page.waitForTimeout(1000);
      await expect(page.locator("text=Encontramos tu CV")).not.toBeVisible();
    });

    test("login with different cloud data — shows conflict dialog", async ({ page }) => {
      await page.goto("/editor");
      await page.locator(".cv-preview-content").waitFor({ state: "visible" });
      await seedCVData(page, minimalCV);

      await mockAuthSession(page);
      await mockCVApi(page, {
        loadCVReturn: {
          id: "cv-1",
          cvData: cloudCV,
          settings: defaultSettings,
          isPublished: false,
          slug: null,
          updatedAt: new Date().toISOString(),
        },
      });

      await page.reload();
      await page.locator(".cv-preview-content").waitFor({ state: "visible" });

      // Conflict dialog should appear
      await expect(page.locator("text=Encontramos tu CV")).toBeVisible({ timeout: 5000 });
    });

    test("'Keep local' preserves local data and closes dialog", async ({ page }) => {
      await page.goto("/editor");
      await page.locator(".cv-preview-content").waitFor({ state: "visible" });
      await seedCVData(page, minimalCV);

      await mockAuthSession(page);
      await mockCVApi(page, {
        loadCVReturn: {
          id: "cv-1",
          cvData: cloudCV,
          settings: defaultSettings,
          isPublished: false,
          slug: null,
          updatedAt: new Date().toISOString(),
        },
      });

      await page.reload();
      await page.locator(".cv-preview-content").waitFor({ state: "visible" });

      const dialog = page.locator("text=Encontramos tu CV");
      await dialog.waitFor({ state: "visible", timeout: 5000 });

      // Click "No, seguir acá"
      await page.locator("button", { hasText: /seguir|continue/i }).click();

      // Dialog should close
      await expect(dialog).not.toBeVisible({ timeout: 3000 });

      // Local data preserved — name should still be "Test User"
      const nameField = page.locator("[data-testid='desktop-header']").locator("[role='textbox']").first();
      await expect(nameField).toContainText("Test User");
    });

    test("'Use cloud' applies cloud data and closes dialog", async ({ page }) => {
      await page.goto("/editor");
      await page.locator(".cv-preview-content").waitFor({ state: "visible" });
      await seedCVData(page, minimalCV);

      await mockAuthSession(page);
      await mockCVApi(page, {
        loadCVReturn: {
          id: "cv-1",
          cvData: cloudCV,
          settings: defaultSettings,
          isPublished: false,
          slug: null,
          updatedAt: new Date().toISOString(),
        },
      });

      await page.reload();
      await page.locator(".cv-preview-content").waitFor({ state: "visible" });

      const dialog = page.locator("text=Encontramos tu CV");
      await dialog.waitFor({ state: "visible", timeout: 5000 });

      // Click "Recuperar"
      await page.locator("button", { hasText: /recuperar|recover/i }).click();

      // Dialog should close
      await expect(dialog).not.toBeVisible({ timeout: 3000 });

      // Cloud data applied — name should be "Cloud User"
      const nameField = page.locator("[data-testid='desktop-header']").locator("[role='textbox']").first();
      await expect(nameField).toContainText("Cloud User");
    });

    test("'Keep local' with base64 photo uploads to R2 before saving", async ({ page }) => {
      let uploadCalled = false;
      let savePayloadPhotoUrl: string | undefined;

      const localWithPhoto = {
        ...minimalCV,
        personalInfo: {
          ...minimalCV.personalInfo,
          photoUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAgAAAQ",
        },
      };

      await page.goto("/editor");
      await page.locator(".cv-preview-content").waitFor({ state: "visible" });
      await seedCVData(page, localWithPhoto);

      await mockAuthSession(page);

      // Mock upload-photo to track calls
      await page.route("**/api/upload-photo", async (route) => {
        uploadCalled = true;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, url: "https://r2.example.com/uploaded.webp" }),
        });
      });

      // Mock CV API — track save payload
      await page.route("**/api/cv", async (route, request) => {
        if (request.method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              id: "cv-1",
              cvData: cloudCV,
              settings: defaultSettings,
              isPublished: false,
              slug: null,
              updatedAt: new Date().toISOString(),
            }),
          });
        } else if (request.method() === "POST") {
          const body = request.postDataJSON();
          savePayloadPhotoUrl = body?.cvData?.personalInfo?.photoUrl;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ id: "mock-cv-id", updatedAt: new Date().toISOString() }),
          });
        } else {
          await route.continue();
        }
      });

      await page.route("**/api/cv/plan", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ plan: "free", isActive: false, currentPeriodEnd: null }),
        });
      });

      await page.reload();
      await page.locator(".cv-preview-content").waitFor({ state: "visible" });

      const dialog = page.locator("text=Encontramos tu CV");
      await dialog.waitFor({ state: "visible", timeout: 5000 });

      // Click "No, seguir acá" (keep local)
      await page.locator("button", { hasText: /seguir|continue/i }).click();
      await expect(dialog).not.toBeVisible({ timeout: 3000 });

      // Wait for upload + save
      await page.waitForTimeout(3000);

      // Upload should have been called
      expect(uploadCalled).toBe(true);

      // The save payload should have the R2 URL, not base64
      expect(savePayloadPhotoUrl).toBe("https://r2.example.com/uploaded.webp");
    });

    test("edit after sync triggers API save", async ({ page }) => {
      let saveCalled = false;

      await page.goto("/editor");
      await page.locator(".cv-preview-content").waitFor({ state: "visible" });
      await seedCVData(page, minimalCV);

      await mockAuthSession(page);

      // Mock CV API with save tracking
      await page.route("**/api/cv", async (route, request) => {
        if (request.method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(null),
          });
        } else if (request.method() === "POST") {
          saveCalled = true;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ id: "mock-cv-id", updatedAt: new Date().toISOString() }),
          });
        } else {
          await route.continue();
        }
      });

      await page.route("**/api/cv/plan", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ plan: "free", isActive: false, currentPeriodEnd: null }),
        });
      });

      await page.reload();
      await page.locator(".cv-preview-content").waitFor({ state: "visible" });

      // Edit something to trigger auto-save
      const nameField = page.locator("[data-testid='desktop-header']").locator("[role='textbox']").first();
      await nameField.waitFor({ state: "visible" });
      await nameField.click();
      const editor = page.locator(".ProseMirror:focus");
      await editor.waitFor({ state: "visible", timeout: 5000 });
      await page.keyboard.press("Control+a");
      await page.keyboard.type("Modified Name");
      await page.keyboard.press("Escape");

      // Wait for debounce (3s) + network
      await page.waitForTimeout(4500);

      expect(saveCalled).toBe(true);
    });

    test("logout resets sync state", async ({ page }) => {
      await page.goto("/editor");
      await page.locator(".cv-preview-content").waitFor({ state: "visible" });

      // Start logged in
      await mockAuthSession(page);
      await mockCVApi(page, { loadCVReturn: null });

      await page.reload();
      await page.locator(".cv-preview-content").waitFor({ state: "visible" });

      // Now clear auth (simulate logout)
      await clearAuthSession(page);
      await page.reload();
      await page.locator(".cv-preview-content").waitFor({ state: "visible" });

      // No conflict dialog should appear
      await page.waitForTimeout(1000);
      await expect(page.locator("text=Encontramos tu CV")).not.toBeVisible();
    });
  });
});
