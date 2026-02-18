import { test, expect, seedCVData, minimalCV, sectionEntries, openGripMenu, editTextbox } from "../helpers/setup";
import type { CVData } from "../../src/lib/types";

test.describe("Experience CRUD", () => {
  test("default data shows at least one experience entry", async ({ appPage: page }) => {
    const entries = sectionEntries(page, "Experience");
    const count = await entries.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("add a new experience entry via grip menu", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    const entries = sectionEntries(page, "Experience");
    const countBefore = await entries.count();
    expect(countBefore).toBe(1);

    // Open grip menu and click "Add experience"
    await openGripMenu(page, entries.first());
    await page.getByText("Add experience").click();
    await page.waitForTimeout(500);

    const countAfter = await entries.count();
    expect(countAfter).toBe(countBefore + 1);
  });

  test("edit experience company name", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    const entries = sectionEntries(page, "Experience");
    const companyField = entries.first().locator("[role='textbox']").first();
    await expect(companyField).toContainText("Test Company");

    await editTextbox(page, companyField, "New Company Name");
    await expect(companyField).toContainText("New Company Name");
  });

  test("delete an experience entry via grip menu", async ({ appPage: page }) => {
    const twoExpCV: CVData = {
      ...minimalCV,
      experience: [
        ...minimalCV.experience,
        {
          id: "exp-test-2",
          company: "Second Company",
          position: "Position B",
          startDate: "2018",
          endDate: "2020",
          description: "<p>Description B</p>",
        },
      ],
    };
    await seedCVData(page, twoExpCV);

    const entries = sectionEntries(page, "Experience");
    await expect(entries).toHaveCount(2);

    // Delete the first entry
    await openGripMenu(page, entries.first());
    await page.getByText("Delete").click();
    await page.waitForTimeout(500);

    await expect(entries).toHaveCount(1);
    await expect(entries.first()).toContainText("Second Company");
  });
});
