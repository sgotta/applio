import { test, expect, seedCVData, minimalCV, skillCategories, openGripMenu } from "../helpers/setup";

test.describe("Skills CRUD", () => {
  test("default data shows at least one skill category", async ({ appPage: page }) => {
    const categories = skillCategories(page);
    const count = await categories.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("edit skill category name", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    const categories = skillCategories(page);
    const categoryName = categories.first().locator("[role='textbox']").first();
    await expect(categoryName).toContainText("Testing");

    // Double-click to edit category name (EditableText with doubleClickToEdit)
    await categoryName.dblclick();
    const editor = page.locator(".ProseMirror:focus");
    await editor.waitFor({ state: "visible", timeout: 5000 });
    await page.keyboard.press("Control+A");
    await page.keyboard.type("QA Tools", { delay: 10 });
    await page.mouse.click(1, 1);
    await page.waitForTimeout(300);

    await expect(categoryName).toContainText("QA Tools");
  });

  test("add a new skill badge via plus button", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    const categories = skillCategories(page);
    const firstCategory = categories.first();

    // Count current badges
    const badges = firstCategory.locator("span.inline-flex > span.inline-flex");
    const countBefore = await badges.count();

    // Click the dashed "+" button inside the category
    const addBtn = firstCategory.locator("button").last();
    await addBtn.click();
    await page.waitForTimeout(500);

    // A new badge should appear
    const countAfter = await badges.count();
    expect(countAfter).toBe(countBefore + 1);
  });

  test("delete a skill badge by clearing its text", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    const categories = skillCategories(page);
    const firstCategory = categories.first();
    const badges = firstCategory.locator("span.inline-flex > span.inline-flex");
    const countBefore = await badges.count();

    // Double-click the first badge to edit
    const firstBadge = badges.first().locator("[role='textbox']");
    await firstBadge.dblclick();
    const editor = page.locator(".ProseMirror:focus");
    await editor.waitFor({ state: "visible", timeout: 5000 });

    // Select all and delete (empty text triggers deletion)
    await page.keyboard.press("Control+A");
    await page.keyboard.press("Backspace");
    await page.mouse.click(1, 1);
    await page.waitForTimeout(500);

    const countAfter = await badges.count();
    expect(countAfter).toBe(countBefore - 1);
  });

  test("add and delete skill category via grip menu", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    const categories = skillCategories(page);
    await expect(categories).toHaveCount(1);

    // ADD: open grip menu on first category and click "Add category"
    await openGripMenu(page, categories.first());
    await page.getByText("Add category").click();
    await page.waitForTimeout(500);
    await expect(categories).toHaveCount(2);

    // DELETE: open grip menu on the new category and click "Delete"
    await openGripMenu(page, categories.nth(1));
    await page.getByText("Delete").click();
    await page.waitForTimeout(500);
    await expect(categories).toHaveCount(1);
  });
});
