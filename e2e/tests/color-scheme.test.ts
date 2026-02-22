import { test, expect, seedCVData, minimalCV, openToolbarPopover, popoverContent, cvSidebar } from "../helpers/setup";

test.describe("Color Schemes @regression", () => {
  test("all color scheme swatches are visible in picker", async ({ appPage: page }) => {
    await openToolbarPopover(page, "btn-color-scheme");
    const panel = popoverContent(page);

    // There should be 5 color scheme swatches (circular buttons)
    const swatches = panel.locator("button.rounded-full");
    await expect(swatches).toHaveCount(5);
  });

  test("change color scheme updates sidebar background", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    // Seed a non-default color scheme so we can switch back to the free "default"
    await page.evaluate(() => {
      localStorage.setItem("applio-color-scheme", "peterRiver");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.locator(".cv-preview-content").waitFor({ state: "visible" });

    // Get initial sidebar background (peterRiver)
    const sidebar = cvSidebar(page);
    const initialBg = await sidebar.evaluate((el) => el.style.backgroundColor);

    // Open color scheme picker and click the first swatch (default/ivory — free)
    await openToolbarPopover(page, "btn-color-scheme");
    const panel = popoverContent(page);
    const swatches = panel.locator("button.rounded-full");
    await swatches.nth(0).click();
    await page.waitForTimeout(300);

    // Sidebar background should have changed
    const newBg = await sidebar.evaluate((el) => el.style.backgroundColor);
    expect(newBg).not.toBe(initialBg);
  });

  test("color scheme persists after reload", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    // Seed a non-default color scheme so we can switch back to the free "default"
    await page.evaluate(() => {
      localStorage.setItem("applio-color-scheme", "peterRiver");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.locator(".cv-preview-content").waitFor({ state: "visible" });

    // Change color scheme to default (first swatch, free)
    await openToolbarPopover(page, "btn-color-scheme");
    const panel = popoverContent(page);
    const swatches = panel.locator("button.rounded-full");
    await swatches.nth(0).click();
    await page.waitForTimeout(300);

    // Get the new background color
    const sidebar = cvSidebar(page);
    const bgAfterChange = await sidebar.evaluate((el) => el.style.backgroundColor);

    // Reload and verify it persists
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.locator(".cv-preview-content").waitFor({ state: "visible" });

    const bgAfterReload = await sidebar.evaluate((el) => el.style.backgroundColor);
    expect(bgAfterReload).toBe(bgAfterChange);
  });
});
