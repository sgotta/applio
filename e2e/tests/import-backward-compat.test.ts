import { test, expect, nameField, sectionEntries, skillCategories } from "../helpers/setup";

/**
 * Old-format CV JSON using field names from before the rename refactor:
 * - personalInfo.title  (now jobTitle)
 * - personalInfo.photo  (now photoUrl)
 * - experience          (now experiences)
 * - skills              (now skillCategories)
 * - sidebarOrder        (now sidebarSections)
 */
const oldFormatCV = {
  personalInfo: {
    fullName: "Legacy User",
    title: "Old Format Engineer",
    email: "legacy@example.com",
    phone: "+1 555 1234",
    location: "Legacy City",
    linkedin: "",
    website: "",
  },
  summary: "This CV uses the old field names.",
  experience: [
    {
      id: "exp-old-1",
      company: "Old Corp",
      position: "Senior Dev",
      startDate: "2019",
      endDate: "Present",
      description: "<ul><li><p>Legacy achievement</p></li></ul>",
    },
  ],
  education: [
    {
      id: "edu-old-1",
      institution: "Old University",
      degree: "B.S. in Legacy",
      startDate: "2015",
      endDate: "2019",
      description: "",
    },
  ],
  skills: [
    {
      id: "skill-old-1",
      category: "Legacy Skills",
      items: ["TypeScript", "React", "Node.js"],
    },
  ],
  courses: [],
  certifications: [],
  awards: [],
  visibility: {
    location: true,
    linkedin: false,
    website: false,
    summary: true,
    courses: false,
    certifications: false,
    awards: false,
  },
  sidebarOrder: ["contact", "summary", "skills"],
};

test.describe("Import backward compat @regression", () => {
  test("import old-format JSON with renamed fields loads correctly", async ({ appPage: page }) => {
    // Accept the confirm dialog that import triggers
    page.on("dialog", (dialog) => dialog.accept());

    // Import the old-format JSON via the hidden file input
    const fileInput = page.locator("input[type='file'][accept='.json']");
    await fileInput.setInputFiles({
      name: "old-format.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(oldFormatCV)),
    });

    await page.waitForTimeout(500);

    // 1. Name should show the imported name
    const name = nameField(page);
    await expect(name).toContainText("Legacy User");

    // 2. Experience section should show the imported company
    const expEntries = sectionEntries(page, "Experience");
    await expect(expEntries).toHaveCount(1);
    await expect(expEntries.first()).toContainText("Old Corp");

    // 3. Skills should show the imported category
    const skills = skillCategories(page);
    await expect(skills).toHaveCount(1);
    await expect(skills.first()).toContainText("Legacy Skills");
  });

  test("old-format import persists after reload", async ({ appPage: page }) => {
    // Accept the confirm dialog
    page.on("dialog", (dialog) => dialog.accept());

    // Import the old-format JSON
    const fileInput = page.locator("input[type='file'][accept='.json']");
    await fileInput.setInputFiles({
      name: "old-format.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(oldFormatCV)),
    });

    await page.waitForTimeout(600);

    // Reload the page
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.locator(".cv-preview-content").waitFor({ state: "visible" });

    // Data should still be there after reload (persisted to localStorage with new field names)
    const name = nameField(page);
    await expect(name).toContainText("Legacy User");

    const expEntries = sectionEntries(page, "Experience");
    await expect(expEntries).toHaveCount(1);
    await expect(expEntries.first()).toContainText("Old Corp");
  });
});
