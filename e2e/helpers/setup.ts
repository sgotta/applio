import { test as base, expect as baseExpect, type Page, type Locator } from "@playwright/test";
import type { CVData } from "../../src/lib/types";

/**
 * Minimal CV data for tests — 1 experience, 1 education, 1 skill category.
 */
export const minimalCV: CVData = {
  personalInfo: {
    fullName: "Test User",
    title: "QA Engineer",
    email: "test@example.com",
    phone: "+1 555 0000",
    location: "Test City",
    linkedin: "linkedin.com/in/testuser",
    website: "testuser.dev",
  },
  summary: "A test summary for E2E testing.",
  experience: [
    {
      id: "exp-test-1",
      company: "Test Company",
      position: "Test Position",
      startDate: "2020",
      endDate: "Present",
      description: "<ul><li><p>Test achievement</p></li></ul>",
    },
  ],
  education: [
    {
      id: "edu-test-1",
      institution: "Test University",
      degree: "B.S. in Testing",
      startDate: "2016",
      endDate: "2020",
      description: "",
    },
  ],
  skills: [
    {
      id: "skill-test-1",
      category: "Testing",
      items: ["Playwright", "Selenium", "E2E"],
    },
  ],
  courses: [],
  certifications: [],
  awards: [],
  visibility: {
    email: true,
    phone: true,
    location: true,
    linkedin: true,
    website: true,
    courses: false,
    certifications: false,
    awards: false,
    contact: true,
    summary: true,
    skills: true,
  },
  sidebarOrder: ["contact", "summary", "skills"],
};

// ─── Data helpers ──────────────────────────────────────────

/**
 * Inject CV data into localStorage and reload the page.
 */
export async function seedCVData(page: Page, data: CVData) {
  await page.evaluate((json) => {
    localStorage.setItem("cv-builder-data", json);
  }, JSON.stringify(data));
  await page.reload();
  await page.waitForLoadState("networkidle");
}

/**
 * Clear localStorage and reload to get default data.
 */
export async function resetToDefaults(page: Page) {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState("networkidle");
}

// ─── Locator helpers ───────────────────────────────────────

/**
 * Get the desktop-only header area (name + title), hidden on mobile.
 */
export function desktopHeader(page: Page) {
  return page.locator("[data-testid='desktop-header']").first();
}

/**
 * Get the name textbox in the desktop header.
 */
export function nameField(page: Page) {
  return desktopHeader(page).locator("[role='textbox']").first();
}

/**
 * Get the title textbox in the desktop header.
 */
export function titleField(page: Page) {
  return desktopHeader(page).locator("[role='textbox']").nth(1);
}

/**
 * Get a section's entry cards by finding the section heading.
 * Returns a locator for all `.group/entry` elements within that section.
 */
export function sectionEntries(page: Page, sectionTitle: string) {
  return page.locator(`h3:has-text("${sectionTitle}")`).locator("../..").locator(".group\\/entry");
}

/**
 * Get the CV sidebar element.
 */
export function cvSidebar(page: Page) {
  return page.locator("[data-testid='cv-sidebar']");
}

/**
 * Get skill categories in the sidebar. Each is a .group/entry inside the skills section.
 */
export function skillCategories(page: Page) {
  return page.locator("h3").filter({ hasText: /^Skills$/i }).locator("../..").locator(".group\\/entry");
}

// ─── Toolbar helpers ──────────────────────────────────────

/**
 * Click a toolbar button by data-testid and wait for the Radix popover to open.
 */
export async function openToolbarPopover(page: Page, testId: string) {
  await page.locator(`[data-testid="${testId}"]`).click();
  await page.locator("[data-radix-popper-content-wrapper]").first().waitFor({ state: "visible" });
}

/**
 * Get the currently visible Radix popover content.
 */
export function popoverContent(page: Page) {
  return page.locator("[data-radix-popper-content-wrapper]").first();
}

// ─── Interaction helpers ───────────────────────────────────

/**
 * Click on a textbox to activate the Tiptap editor, select all, type new text,
 * and click outside to save.
 */
export async function editTextbox(page: Page, textbox: Locator, newText: string) {
  await textbox.click();

  // Wait for Tiptap editor to mount
  const editor = page.locator(".ProseMirror:focus");
  await editor.waitFor({ state: "visible", timeout: 5000 });

  // Select all and type new text
  await page.keyboard.press("Control+A");
  await page.keyboard.type(newText, { delay: 10 });

  // Click outside to blur and save
  await page.mouse.click(1, 1);
  await page.waitForTimeout(300);
}

/**
 * Open the EntryGrip popover for a given entry by hovering and clicking the grip icon.
 */
export async function openGripMenu(page: Page, entry: Locator) {
  await entry.hover();
  const grip = entry.locator("button").first();
  await grip.click();
  await page.locator("[data-radix-popper-content-wrapper]").waitFor({ state: "visible" });
}

// ─── Test fixture ──────────────────────────────────────────

/**
 * Custom fixture that navigates to the app and waits for it to load.
 * Uses 1280x720 viewport (desktop layout).
 */
export const test = base.extend<{ appPage: Page }>({
  appPage: async ({ page }, use) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator(".cv-preview-content").waitFor({ state: "visible" });
    await use(page);
  },
});

export { baseExpect as expect };
