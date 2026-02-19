import { test, expect, seedCVData, minimalCV, openToolbarPopover, popoverContent } from "../helpers/setup";

test.describe("Font Settings", () => {
  test("change font family updates CV font", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    // Get the initial font family from the CV container
    const cvContent = page.locator(".cv-preview-content");
    const initialFont = await cvContent.evaluate((el) => el.style.fontFamily);

    // Open font popover and select a different font (e.g., Merriweather — a serif font)
    await openToolbarPopover(page, "btn-design");
    const panel = popoverContent(page);
    await panel.getByText("Merriweather").click();
    await page.waitForTimeout(300);

    // Font should have changed
    const newFont = await cvContent.evaluate((el) => el.style.fontFamily);
    expect(newFont).not.toBe(initialFont);
    expect(newFont).toContain("Merriweather");
  });

  test("font family persists after reload", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    // Change font
    await openToolbarPopover(page, "btn-design");
    const panel = popoverContent(page);
    await panel.getByText("Lora").click();
    await page.waitForTimeout(300);

    const cvContent = page.locator(".cv-preview-content");
    const fontAfterChange = await cvContent.evaluate((el) => el.style.fontFamily);
    expect(fontAfterChange).toContain("Lora");

    // Reload and verify
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.locator(".cv-preview-content").waitFor({ state: "visible" });

    const fontAfterReload = await cvContent.evaluate((el) => el.style.fontFamily);
    expect(fontAfterReload).toBe(fontAfterChange);
  });

  test("change font size level", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    // Open font popover
    await openToolbarPopover(page, "btn-design");
    const panel = popoverContent(page);

    // Font size buttons: S, M, L — M is default (level 2)
    // Click "S" to change to small
    await panel.getByText("S", { exact: true }).click();
    await page.waitForTimeout(300);

    // The font-size scale wrapper should have a fontSize style
    const scaleWrapper = page.locator(".cv-preview-content > div").first();
    const fontSize = await scaleWrapper.evaluate((el) => el.style.fontSize);
    expect(fontSize).toBeTruthy(); // non-empty means a custom size is applied (not default)

    // Click "M" to go back to default
    await panel.getByText("M", { exact: true }).click();
    await page.waitForTimeout(300);

    const fontSizeDefault = await scaleWrapper.evaluate((el) => el.style.fontSize);
    expect(fontSizeDefault).toBe(""); // default level 2 doesn't set inline fontSize
  });
});
