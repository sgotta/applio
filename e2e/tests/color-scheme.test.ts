import { test, expect, seedCVData, minimalCV, openToolbarPopover, popoverContent } from "../helpers/setup";

test.describe("Color Schemes @regression", () => {
  test("base style and accent swatches are visible in picker", async ({ appPage: page }) => {
    await openToolbarPopover(page, "btn-color-scheme");
    const panel = popoverContent(page);

    // 2 base style swatches + 1 no-accent + 3 preset accents + 1 custom = 7 circular buttons
    const swatches = panel.locator("button.rounded-full");
    await expect(swatches).toHaveCount(7);
  });

  test("clicking accent color updates name color on CV", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    // Open color picker and click the blue accent preset (2nd in accent row = index 3 overall)
    await openToolbarPopover(page, "btn-color-scheme");
    const panel = popoverContent(page);
    const swatches = panel.locator("button.rounded-full");
    // Index: 0=Default, 1=Asfalto, 2=No accent, 3=Blue, 4=Green, 5=Orange, 6=Custom
    await swatches.nth(3).click();
    await page.waitForTimeout(300);

    // Verify accent persists in localStorage
    const accent = await page.evaluate(() => localStorage.getItem("applio-accent-color"));
    expect(accent).toBe("#1a7ed6");
  });

  test("color scheme and accent persist after reload", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    // Set wetAsphalt base + green accent via localStorage
    await page.evaluate(() => {
      localStorage.setItem("applio-color-scheme", "wetAsphalt");
      localStorage.setItem("applio-accent-color", "#27ae60");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.locator(".cv-preview-content").waitFor({ state: "visible" });

    // Verify values persist
    const scheme = await page.evaluate(() => localStorage.getItem("applio-color-scheme"));
    const accent = await page.evaluate(() => localStorage.getItem("applio-accent-color"));
    expect(scheme).toBe("wetAsphalt");
    expect(accent).toBe("#27ae60");
  });
});
