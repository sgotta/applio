import { test, expect } from "../helpers/setup";

test.describe("Theme Toggle @regression", () => {
  test("toggle to dark mode adds dark class to html", async ({ appPage: page }) => {
    // Click theme button
    await page.locator("[data-testid='btn-theme']").click();
    await page.waitForTimeout(300);

    // HTML element should have "dark" class
    const htmlClass = await page.locator("html").getAttribute("class");
    expect(htmlClass).toContain("dark");
  });

  test("toggle back to light mode removes dark class", async ({ appPage: page }) => {
    // Toggle to dark
    await page.locator("[data-testid='btn-theme']").click();
    await page.waitForTimeout(300);

    // Toggle back to light
    await page.locator("[data-testid='btn-theme']").click();
    await page.waitForTimeout(300);

    const htmlClass = await page.locator("html").getAttribute("class") ?? "";
    expect(htmlClass).not.toContain("dark");
  });
});
