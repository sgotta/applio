import { test, expect, seedCVData, minimalCV, openToolbarPopover, popoverContent, skillCategories } from "../helpers/setup";

test.describe("Section Visibility", () => {
  test("toggle skills off hides skills section", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    // Verify skills are visible
    const skills = skillCategories(page);
    await expect(skills.first()).toBeVisible();

    // Open sections popover and toggle skills off
    await openToolbarPopover(page, "btn-sections");
    const panel = popoverContent(page);
    const skillsToggle = panel.locator("label").filter({ hasText: "Skills" }).locator("button[role='switch']");
    await skillsToggle.click();

    // Close popover
    await page.mouse.click(1, 1);
    await page.waitForTimeout(300);

    // Skills heading should no longer be visible
    const skillsHeading = page.locator("h3").filter({ hasText: /^Skills$/i });
    await expect(skillsHeading).toHaveCount(0);
  });

  test("toggle courses on shows courses section", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    // Courses section should NOT be visible by default
    const coursesHeading = page.locator("h3").filter({ hasText: /Courses/i });
    await expect(coursesHeading).toHaveCount(0);

    // Toggle courses on
    await openToolbarPopover(page, "btn-sections");
    const panel = popoverContent(page);
    const coursesToggle = panel.locator("label").filter({ hasText: "Courses" }).locator("button[role='switch']");
    await coursesToggle.click();

    // Close popover
    await page.mouse.click(1, 1);
    await page.waitForTimeout(300);

    // Courses section should now be visible
    await expect(coursesHeading).toBeVisible();
  });

  test("toggle certifications on shows certifications section", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    const certsHeading = page.locator("h3").filter({ hasText: /Certifications/i });
    await expect(certsHeading).toHaveCount(0);

    await openToolbarPopover(page, "btn-sections");
    const panel = popoverContent(page);
    const certsToggle = panel.locator("label").filter({ hasText: "Certifications" }).locator("button[role='switch']");
    await certsToggle.click();

    await page.mouse.click(1, 1);
    await page.waitForTimeout(300);

    await expect(certsHeading).toBeVisible();
  });

  test("toggle contact off hides contact fields", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    // Verify email is visible in sidebar
    const emailText = page.locator("[data-testid='cv-sidebar']").getByText("test@example.com");
    await expect(emailText).toBeVisible();

    // Toggle contact section off
    await openToolbarPopover(page, "btn-sections");
    const panel = popoverContent(page);
    const contactToggle = panel.locator("label").filter({ hasText: "Contact" }).first().locator("button[role='switch']");
    await contactToggle.click();

    await page.mouse.click(1, 1);
    await page.waitForTimeout(300);

    // Email should no longer be visible
    await expect(emailText).not.toBeVisible();
  });
});
