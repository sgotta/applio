import { test, expect, seedCVData, minimalCV, openToolbarPopover } from "../helpers/setup";

test.describe("i18n Language Switching @regression", () => {
  test("switch to Spanish changes section headings", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    // Verify English headings are visible
    await expect(page.locator("h3").filter({ hasText: /^Experience$/i })).toBeVisible();

    // Open language popover and select Spanish
    await openToolbarPopover(page, "btn-language");
    await page.getByText("Español").click();
    await page.waitForTimeout(500);

    // Section headings should now be in Spanish
    await expect(page.locator("h3").filter({ hasText: /^Experiencia$/i })).toBeVisible();
    await expect(page.locator("h3").filter({ hasText: /^Educación$/i })).toBeVisible();

    // English headings should no longer exist
    const expHeading = page.locator("h3").filter({ hasText: /^Experience$/i });
    await expect(expHeading).toHaveCount(0);
  });

  test("switch back to English restores headings", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    // Switch to Spanish
    await openToolbarPopover(page, "btn-language");
    await page.getByText("Español").click();
    await page.waitForTimeout(300);

    // Close popover (locale change re-renders everything while popover is open)
    await page.mouse.click(1, 1);
    await page.waitForTimeout(500);
    await expect(page.locator("h3").filter({ hasText: /^Experiencia$/i })).toBeVisible();

    // Switch back to English
    await openToolbarPopover(page, "btn-language");
    await page.waitForTimeout(300);
    await page.locator("button").filter({ hasText: "English" }).first().click();
    await page.waitForTimeout(300);
    await page.mouse.click(1, 1);
    await page.waitForTimeout(500);

    // Headings should be back in English
    await expect(page.locator("h3").filter({ hasText: /^Experience$/i })).toBeVisible();
    await expect(page.locator("h3").filter({ hasText: /^Education$/i })).toBeVisible();
  });

  test("locale persists after page reload", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    // Switch to Spanish
    await openToolbarPopover(page, "btn-language");
    await page.getByText("Español").click();
    await page.waitForTimeout(500);
    await expect(page.locator("h3").filter({ hasText: /^Experiencia$/i })).toBeVisible();

    // Verify localStorage
    const savedLocale = await page.evaluate(() => localStorage.getItem("quickcv-locale"));
    expect(savedLocale).toBe("es");

    // Reload the page
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.locator(".cv-preview-content").waitFor({ state: "visible" });

    // Headings should still be in Spanish
    await expect(page.locator("h3").filter({ hasText: /^Experiencia$/i })).toBeVisible();
  });
});
