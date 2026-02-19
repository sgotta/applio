import { test, expect, seedCVData, minimalCV, sectionEntries } from "../helpers/setup";

test.describe("Block Editor Formatting", () => {
  test("bold formatting with Ctrl+B", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    // Click the experience description (blockEditing field)
    const entries = sectionEntries(page, "Experience");
    const description = entries.first().locator("[role='textbox']").last();
    await description.click();

    // Wait for Tiptap editor to mount
    const editor = page.locator(".ProseMirror:focus");
    await editor.waitFor({ state: "visible", timeout: 5000 });

    // Select all existing content and type new text
    await page.keyboard.press("Control+A");
    await page.keyboard.type("bold text", { delay: 10 });

    // Select the text and apply bold
    await page.keyboard.press("Control+A");
    await page.keyboard.press("Control+B");

    // Verify the HTML contains <strong>
    const html = await editor.innerHTML();
    expect(html).toContain("<strong>");
  });

  test("italic formatting with Ctrl+I", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    const entries = sectionEntries(page, "Experience");
    const description = entries.first().locator("[role='textbox']").last();
    await description.click();

    const editor = page.locator(".ProseMirror:focus");
    await editor.waitFor({ state: "visible", timeout: 5000 });

    await page.keyboard.press("Control+A");
    await page.keyboard.type("italic text", { delay: 10 });

    await page.keyboard.press("Control+A");
    await page.keyboard.press("Control+I");

    const html = await editor.innerHTML();
    expect(html).toContain("<em>");
  });

  test("underline formatting with Ctrl+U", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    const entries = sectionEntries(page, "Experience");
    const description = entries.first().locator("[role='textbox']").last();
    await description.click();

    const editor = page.locator(".ProseMirror:focus");
    await editor.waitFor({ state: "visible", timeout: 5000 });

    await page.keyboard.press("Control+A");
    await page.keyboard.type("underline text", { delay: 10 });

    await page.keyboard.press("Control+A");
    await page.keyboard.press("Control+U");

    const html = await editor.innerHTML();
    expect(html).toContain("<u>");
  });

  test("floating toolbar appears on text selection", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    // Floating toolbar should not be visible initially
    const toolbar = page.locator("[data-testid='floating-toolbar']");
    await expect(toolbar).not.toBeVisible();

    // Click the experience description
    const entries = sectionEntries(page, "Experience");
    const description = entries.first().locator("[role='textbox']").last();
    await description.click();

    const editor = page.locator(".ProseMirror:focus");
    await editor.waitFor({ state: "visible", timeout: 5000 });

    // Select all text to trigger the floating toolbar
    await page.keyboard.press("Control+A");
    await page.waitForTimeout(300);

    // Floating toolbar should now be visible
    await expect(toolbar).toBeVisible();
  });
});
