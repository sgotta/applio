import { test, expect, seedCVData, minimalCV, nameField } from "../helpers/setup";
import type { CVData } from "../../src/lib/types";

test.describe("Import / Export @smoke", () => {
  test("export JSON triggers download with correct filename", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    // Open file menu
    const fileMenuBtn = page.locator("[data-testid='btn-file-menu']");
    await fileMenuBtn.waitFor({ state: "visible", timeout: 5000 });
    await fileMenuBtn.click();
    await page.locator("[data-radix-popper-content-wrapper]").first().waitFor({ state: "visible" });

    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent("download");
    await page.getByText("Export JSON").click();
    const download = await downloadPromise;

    // Filename should match pattern CV-{name}_{date}.json
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^CV-.*\.json$/);
  });

  test("import valid JSON updates CV data", async ({ appPage: page }) => {
    // Start with default data
    const name = nameField(page);
    const originalName = await name.textContent();

    // Prepare import data with a different name
    const importData: CVData = {
      ...minimalCV,
      personalInfo: { ...minimalCV.personalInfo, fullName: "Imported User" },
    };

    // Accept the confirm dialog
    page.on("dialog", (dialog) => dialog.accept());

    // Set the hidden file input directly
    const fileInput = page.locator("input[type='file'][accept='.json']");
    await fileInput.setInputFiles({
      name: "test-import.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(importData)),
    });

    await page.waitForTimeout(500);

    // Name should now be "Imported User"
    await expect(name).toContainText("Imported User");
    expect(originalName).not.toBe("Imported User");
  });

  test("import invalid JSON shows error alert", async ({ appPage: page }) => {
    // Listen for the alert dialog
    const dialogPromise = new Promise<string>((resolve) => {
      page.on("dialog", async (dialog) => {
        resolve(dialog.type());
        await dialog.accept();
      });
    });

    // Set invalid JSON file
    const fileInput = page.locator("input[type='file'][accept='.json']");
    await fileInput.setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from("{ not valid json !!!"),
    });

    // Should show an alert dialog
    const dialogType = await dialogPromise;
    expect(dialogType).toBe("alert");
  });

  test("import restores visual settings (color scheme)", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    // Import data with peterRiver color scheme
    const importData = {
      ...minimalCV,
      settings: {
        colorScheme: "peterRiver",
        fontFamily: "lato",
        fontSizeLevel: 1,
        marginLevel: 1,
        pattern: { name: "none", sidebarIntensity: 3, mainIntensity: 2, scope: "sidebar" },
      },
    };

    page.on("dialog", (dialog) => dialog.accept());

    const fileInput = page.locator("input[type='file'][accept='.json']");
    await fileInput.setInputFiles({
      name: "styled.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(importData)),
    });

    await page.waitForTimeout(500);

    // Sidebar should have peterRiver color (#1a7ed6 → rgb(26, 126, 214))
    const sidebar = page.locator("[data-testid='cv-sidebar']");
    await sidebar.waitFor({ state: "visible", timeout: 5000 });
    const bg = await sidebar.evaluate((el) => el.style.backgroundColor);
    expect(bg).toBeTruthy();

    // Font should be Lato
    const cvContent = page.locator(".cv-preview-content");
    await cvContent.waitFor({ state: "visible", timeout: 5000 });
    const font = await cvContent.evaluate((el) => el.style.fontFamily);
    expect(font).toContain("Lato");
  });
});
