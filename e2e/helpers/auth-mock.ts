import type { Page } from "@playwright/test";
import type { CVData, CloudSettings } from "../../src/lib/types";

/**
 * Mock session response matching NextAuth's /api/auth/session format.
 */
export const mockSession = {
  user: {
    id: "mock-user-123",
    name: "Mock User",
    email: "mock@example.com",
    image: null,
  },
  expires: new Date(Date.now() + 86_400_000).toISOString(),
};

/**
 * Intercept /api/auth/session to return a fake authenticated session.
 * Must be called BEFORE navigating to the page.
 */
export async function mockAuthSession(page: Page) {
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockSession),
    });
  });
}

/**
 * Clear the auth session mock so the user appears logged out.
 */
export async function clearAuthSession(page: Page) {
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });
}

/**
 * Mock the CV API routes (/api/cv, /api/cv/plan).
 * Call BEFORE navigating to the page.
 */
export async function mockCVApi(
  page: Page,
  options: {
    loadCVReturn?: {
      id: string;
      cvData: CVData;
      settings: CloudSettings;
      isPublished: boolean;
      slug: string | null;
      updatedAt: string;
    } | null;
  } = {},
) {
  const { loadCVReturn = null } = options;

  // GET /api/cv → loadCV
  await page.route("**/api/cv", async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(loadCVReturn),
      });
    } else if (request.method() === "POST") {
      // POST /api/cv → saveCV
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "mock-cv-id", updatedAt: new Date().toISOString() }),
      });
    } else {
      await route.continue();
    }
  });

  // GET /api/cv/plan → fetchPlan
  await page.route("**/api/cv/plan", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ plan: "free", isActive: false, currentPeriodEnd: null }),
    });
  });
}
