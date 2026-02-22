import { test, expect, resetToDefaults, nameField, titleField, editTextbox } from "../helpers/setup";

test.describe("Inline Editing @smoke", () => {
  test.beforeEach(async ({ appPage: page }) => {
    await resetToDefaults(page);
  });

  test("edit name: click, type, blur to save", async ({ appPage: page }) => {
    const name = nameField(page);
    await editTextbox(page, name, "Maria Garcia");
    await expect(name).toContainText("Maria Garcia");
  });

  test("edit name: Escape cancels without saving", async ({ appPage: page }) => {
    const name = nameField(page);
    const originalName = (await name.textContent()) ?? "";

    // Click to activate editor
    await name.click();
    const editor = page.locator(".ProseMirror:focus");
    await editor.waitFor({ state: "visible", timeout: 5000 });

    // Type something
    await page.keyboard.press("Control+A");
    await page.keyboard.type("SHOULD NOT SAVE");

    // Press Escape to cancel
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Original name should be preserved
    await expect(name).toContainText(originalName);
  });

  test("edit professional title: click, type, save on blur", async ({ appPage: page }) => {
    const title = titleField(page);
    await editTextbox(page, title, "Lead QA Engineer");
    await expect(title).toContainText("Lead QA Engineer");
  });

  test("edit summary text in sidebar", async ({ appPage: page }) => {
    // The sidebar summary is inside the left column, after a section heading
    // Find it by navigating the summary section in the sidebar
    // "Professional Profile" is the en translation for the summary heading
    const summaryHeading = page.locator("h3").filter({ hasText: /professional profile/i }).first();
    const summarySection = summaryHeading.locator("../..").first();
    const summaryField = summarySection.locator("[role='textbox']").first();

    await editTextbox(page, summaryField, "Expert in automated testing.");
    await expect(summaryField).toContainText("Expert in automated testing.");
  });
});
