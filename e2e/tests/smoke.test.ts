import { test, expect, nameField } from "../helpers/setup";

test.describe("Smoke Tests @smoke", () => {
  test("app loads and shows default CV data", async ({ appPage: page }) => {
    // The desktop header name should be visible and non-empty
    const name = nameField(page);
    await expect(name).toBeVisible();
    await expect(name).not.toBeEmpty();

    // Section titles (h3) should be present — at least Experience and Education
    const sectionTitles = page.locator(".cv-preview-content h3");
    const count = await sectionTitles.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("toolbar is visible with action buttons", async ({ appPage: page }) => {
    const toolbar = page.locator("header").first();
    await expect(toolbar).toBeVisible();

    // Should have multiple icon buttons (color, theme, menu, etc.)
    const buttons = toolbar.locator("button");
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(3);
  });
});
