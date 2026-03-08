import { test, expect, seedCVData, minimalCV, openToolbarPopover, popoverContent } from "../helpers/setup";

test.describe("Color Schemes @regression", () => {
  test("palette rows are visible in palette picker", async ({ appPage: page }) => {
    await openToolbarPopover(page, "btn-color-palette");
    const panel = popoverContent(page);

    // 8 palette rows: Default + 3 Default+accent + 4 themed
    const paletteRows = panel.locator("button.rounded-xl");
    await expect(paletteRows).toHaveCount(8);
  });

  test("clicking palette updates localStorage", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    await openToolbarPopover(page, "btn-color-palette");
    const panel = popoverContent(page);
    const paletteRows = panel.locator("button.rounded-xl");

    // Click "Default Azul" row (index 1: Default=0, DefaultBlue=1)
    await paletteRows.nth(1).click();
    await page.waitForTimeout(300);

    const accent = await page.evaluate(() => localStorage.getItem("applio-accent-color"));
    expect(accent).toBe("#1a7ed6");
  });

  test("selecting Asfalto disables accent picker button", async ({ appPage: page }) => {
    await openToolbarPopover(page, "btn-color-palette");
    const panel = popoverContent(page);
    const paletteRows = panel.locator("button.rounded-xl");

    // Click Asfalto row (index 7: last palette, only one without accent)
    await paletteRows.nth(7).click();
    await page.waitForTimeout(300);
    // Close palette popover
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // Accent button should be disabled (wrapper has pointer-events-none)
    const accentBtn = page.locator('[data-testid="btn-accent-color"]');
    await expect(accentBtn).toBeVisible();
    const wrapper = accentBtn.locator("xpath=ancestor-or-self::div[contains(@class,'pointer-events-none')]");
    await expect(wrapper).toBeVisible();
  });

  test("color scheme and accent persist after reload", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    await page.evaluate(() => {
      localStorage.setItem("applio-color-scheme", "wetAsphalt");
      localStorage.setItem("applio-accent-color", "#27ae60");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.locator(".cv-preview-content").waitFor({ state: "visible" });

    const scheme = await page.evaluate(() => localStorage.getItem("applio-color-scheme"));
    const accent = await page.evaluate(() => localStorage.getItem("applio-accent-color"));
    expect(scheme).toBe("wetAsphalt");
    expect(accent).toBe("#27ae60");
  });
});
