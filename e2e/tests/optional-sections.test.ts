import { test, expect, seedCVData, cvWithOptionalSections, sectionEntries, openGripMenu, editTextbox } from "../helpers/setup";
import type { CVData } from "../../src/lib/types";

// ─── Courses ──────────────────────────────────────────────

test.describe("Courses CRUD @regression", () => {
  test("courses section visible with seeded data", async ({ appPage: page }) => {
    await seedCVData(page, cvWithOptionalSections);

    const heading = page.locator("h3").filter({ hasText: /Courses/i });
    await expect(heading).toBeVisible();

    const entries = sectionEntries(page, "Courses");
    await expect(entries).toHaveCount(1);
    await expect(entries.first()).toContainText("Advanced Testing");
  });

  test("edit course name", async ({ appPage: page }) => {
    await seedCVData(page, cvWithOptionalSections);

    const entries = sectionEntries(page, "Courses");
    const nameField = entries.first().locator("[role='textbox']").first();
    await expect(nameField).toContainText("Advanced Testing");

    await editTextbox(page, nameField, "React Masterclass");
    await expect(nameField).toContainText("React Masterclass");
  });

  test("add course via grip menu", async ({ appPage: page }) => {
    await seedCVData(page, cvWithOptionalSections);

    const entries = sectionEntries(page, "Courses");
    await expect(entries).toHaveCount(1);

    await openGripMenu(page, entries.first());
    await page.getByText("Add course").click();
    await page.waitForTimeout(500);

    await expect(entries).toHaveCount(2);
  });

  test("delete course via grip menu", async ({ appPage: page }) => {
    const twoCourseCV: CVData = {
      ...cvWithOptionalSections,
      courses: [
        ...cvWithOptionalSections.courses,
        { id: "course-test-2", name: "Second Course", institution: "Another Academy", date: "2024", description: "" },
      ],
    };
    await seedCVData(page, twoCourseCV);

    const entries = sectionEntries(page, "Courses");
    await expect(entries).toHaveCount(2);

    await openGripMenu(page, entries.first());
    await page.getByText("Delete").click();
    await page.waitForTimeout(500);

    await expect(entries).toHaveCount(1);
    await expect(entries.first()).toContainText("Second Course");
  });
});

// ─── Certifications ───────────────────────────────────────

test.describe("Certifications CRUD @regression", () => {
  test("certifications section visible with seeded data", async ({ appPage: page }) => {
    await seedCVData(page, cvWithOptionalSections);

    const heading = page.locator("h3").filter({ hasText: /Certifications/i });
    await expect(heading).toBeVisible();

    const entries = sectionEntries(page, "Certifications");
    await expect(entries).toHaveCount(1);
    await expect(entries.first()).toContainText("ISTQB Foundation");
  });

  test("edit certification name", async ({ appPage: page }) => {
    await seedCVData(page, cvWithOptionalSections);

    const entries = sectionEntries(page, "Certifications");
    const nameField = entries.first().locator("[role='textbox']").first();
    await expect(nameField).toContainText("ISTQB Foundation");

    await editTextbox(page, nameField, "AWS Solutions Architect");
    await expect(nameField).toContainText("AWS Solutions Architect");
  });

  test("add certification via grip menu", async ({ appPage: page }) => {
    await seedCVData(page, cvWithOptionalSections);

    const entries = sectionEntries(page, "Certifications");
    await expect(entries).toHaveCount(1);

    await openGripMenu(page, entries.first());
    await page.getByText("Add certification").click();
    await page.waitForTimeout(500);

    await expect(entries).toHaveCount(2);
  });

  test("delete certification via grip menu", async ({ appPage: page }) => {
    const twoCertCV: CVData = {
      ...cvWithOptionalSections,
      certifications: [
        ...cvWithOptionalSections.certifications,
        { id: "cert-test-2", name: "Second Cert", issuer: "Another Org", date: "2024", description: "" },
      ],
    };
    await seedCVData(page, twoCertCV);

    const entries = sectionEntries(page, "Certifications");
    await expect(entries).toHaveCount(2);

    await openGripMenu(page, entries.first());
    await page.getByText("Delete").click();
    await page.waitForTimeout(500);

    await expect(entries).toHaveCount(1);
    await expect(entries.first()).toContainText("Second Cert");
  });
});

// ─── Awards ───────────────────────────────────────────────

test.describe("Awards CRUD @regression", () => {
  test("awards section visible with seeded data", async ({ appPage: page }) => {
    await seedCVData(page, cvWithOptionalSections);

    const heading = page.locator("h3").filter({ hasText: /Awards/i });
    await expect(heading).toBeVisible();

    const entries = sectionEntries(page, "Awards");
    await expect(entries).toHaveCount(1);
    await expect(entries.first()).toContainText("Best Tester Award");
  });

  test("edit award name", async ({ appPage: page }) => {
    await seedCVData(page, cvWithOptionalSections);

    const entries = sectionEntries(page, "Awards");
    const nameField = entries.first().locator("[role='textbox']").first();
    await expect(nameField).toContainText("Best Tester Award");

    await editTextbox(page, nameField, "Innovation Prize");
    await expect(nameField).toContainText("Innovation Prize");
  });

  test("add award via grip menu", async ({ appPage: page }) => {
    await seedCVData(page, cvWithOptionalSections);

    const entries = sectionEntries(page, "Awards");
    await expect(entries).toHaveCount(1);

    await openGripMenu(page, entries.first());
    await page.getByText("Add award").click();
    await page.waitForTimeout(500);

    await expect(entries).toHaveCount(2);
  });

  test("delete award via grip menu", async ({ appPage: page }) => {
    const twoAwardCV: CVData = {
      ...cvWithOptionalSections,
      awards: [
        ...cvWithOptionalSections.awards,
        { id: "award-test-2", name: "Second Award", issuer: "Another Org", date: "2024", description: "" },
      ],
    };
    await seedCVData(page, twoAwardCV);

    const entries = sectionEntries(page, "Awards");
    await expect(entries).toHaveCount(2);

    await openGripMenu(page, entries.first());
    await page.getByText("Delete").click();
    await page.waitForTimeout(500);

    await expect(entries).toHaveCount(1);
    await expect(entries.first()).toContainText("Second Award");
  });
});
