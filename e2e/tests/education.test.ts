import { test, expect, seedCVData, minimalCV, sectionEntries, openGripMenu, editTextbox } from "../helpers/setup";

test.describe("Education CRUD", () => {
  test("default data shows at least one education entry", async ({ appPage: page }) => {
    const entries = sectionEntries(page, "Education");
    const count = await entries.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("edit education institution name", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    const entries = sectionEntries(page, "Education");
    const institutionField = entries.first().locator("[role='textbox']").first();
    await expect(institutionField).toContainText("Test University");

    await editTextbox(page, institutionField, "MIT");
    await expect(institutionField).toContainText("MIT");
  });

  test("add and delete education entry", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    const entries = sectionEntries(page, "Education");
    await expect(entries).toHaveCount(1);

    // ADD
    await openGripMenu(page, entries.first());
    await page.getByText("Add education").click();
    await page.waitForTimeout(500);
    await expect(entries).toHaveCount(2);

    // DELETE the new entry
    await openGripMenu(page, entries.nth(1));
    await page.getByText("Delete").click();
    await page.waitForTimeout(500);
    await expect(entries).toHaveCount(1);
  });
});
