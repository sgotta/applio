import { test, expect, seedCVData, minimalCV, openToolbarPopover, popoverContent, cvSidebar } from "../helpers/setup";

test.describe("Color Schemes", () => {
  test("all color scheme swatches are visible in picker", async ({ appPage: page }) => {
    await openToolbarPopover(page, "btn-design");
    const panel = popoverContent(page);

    // There should be 5 color scheme swatches (circular buttons)
    const swatches = panel.locator("button.rounded-full");
    await expect(swatches).toHaveCount(5);
  });

  test("change color scheme updates sidebar background", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    // Get initial sidebar background
    const sidebar = cvSidebar(page);
    const initialBg = await sidebar.evaluate((el) => el.style.backgroundColor);

    // Open color scheme picker and click a different swatch (second one)
    await openToolbarPopover(page, "btn-design");
    const panel = popoverContent(page);
    const swatches = panel.locator("button.rounded-full");
    await swatches.nth(1).click();
    await page.waitForTimeout(300);

    // Sidebar background should have changed
    const newBg = await sidebar.evaluate((el) => el.style.backgroundColor);
    expect(newBg).not.toBe(initialBg);
  });

  test("color scheme persists after reload", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    // Change color scheme
    await openToolbarPopover(page, "btn-design");
    const panel = popoverContent(page);
    const swatches = panel.locator("button.rounded-full");
    await swatches.nth(1).click();
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
