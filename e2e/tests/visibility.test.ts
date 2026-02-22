import { test, expect, seedCVData, minimalCV, openToolbarPopover, popoverContent } from "../helpers/setup";

test.describe("Section Visibility", () => {
  test("toggle summary off hides summary section", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    // Verify summary text is visible in sidebar
    const summaryText = page.locator("[data-testid='cv-sidebar']").getByText("A test summary for E2E testing.");
    await expect(summaryText).toBeVisible();

    // Open sections popover and toggle summary off (uses "Professional Profile" label)
    await openToolbarPopover(page, "btn-sections");
    const panel = popoverContent(page);
    const summaryToggle = panel.locator("label").filter({ hasText: "Professional Profile" }).locator("button[role='switch']");
    await summaryToggle.click();

    // Close popover
    await page.mouse.click(1, 1);
    await page.waitForTimeout(300);

    // Summary text should no longer be visible
    await expect(summaryText).not.toBeVisible();
  });

  test("toggle location off hides location in sidebar", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    // Verify location is visible
    const locationText = page.locator("[data-testid='cv-sidebar']").getByText("Test City");
    await expect(locationText).toBeVisible();

    // Toggle location off
    await openToolbarPopover(page, "btn-sections");
    const panel = popoverContent(page);
    const locationToggle = panel.locator("label").filter({ hasText: "Location" }).locator("button[role='switch']");
    await locationToggle.click();

    await page.mouse.click(1, 1);
    await page.waitForTimeout(300);

    // Location should no longer be visible
    await expect(locationText).not.toBeVisible();
  });

  test("toggle linkedin off hides linkedin in sidebar", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    // Verify linkedin is visible
    const linkedinText = page.locator("[data-testid='cv-sidebar']").getByText("linkedin.com/in/testuser");
    await expect(linkedinText).toBeVisible();

    // Toggle linkedin off
    await openToolbarPopover(page, "btn-sections");
    const panel = popoverContent(page);
    const linkedinToggle = panel.locator("label").filter({ hasText: "LinkedIn" }).locator("button[role='switch']");
    await linkedinToggle.click();

    await page.mouse.click(1, 1);
    await page.waitForTimeout(300);

    await expect(linkedinText).not.toBeVisible();
  });

  test("toggle website off hides website in sidebar", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    // Verify website is visible
    const websiteText = page.locator("[data-testid='cv-sidebar']").getByText("testuser.dev");
    await expect(websiteText).toBeVisible();

    // Toggle website off
    await openToolbarPopover(page, "btn-sections");
    const panel = popoverContent(page);
    const websiteToggle = panel.locator("label").filter({ hasText: "Website" }).locator("button[role='switch']");
    await websiteToggle.click();

    await page.mouse.click(1, 1);
    await page.waitForTimeout(300);

    await expect(websiteText).not.toBeVisible();
  });
});
