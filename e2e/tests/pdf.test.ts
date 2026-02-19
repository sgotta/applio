import { test, expect, seedCVData, minimalCV } from "../helpers/setup";

test.describe("PDF Generation", () => {
  test("PDF download triggers with correct filename", async ({ appPage: page }) => {
    await seedCVData(page, minimalCV);

    // Open file menu
    await page.locator("[data-testid='btn-file-menu']").click();
    await page.locator("[data-radix-popper-content-wrapper]").first().waitFor({ state: "visible" });

    // Start waiting for download before clicking the PDF button
    const downloadPromise = page.waitForEvent("download", { timeout: 60_000 });

    // Click "Download PDF" — first button inside the file menu popover
    await page.getByText("Download PDF").click();

    const download = await downloadPromise;
    const filename = download.suggestedFilename();

    // Filename should match pattern CV-{name}_{date}.pdf
    expect(filename).toMatch(/^CV-.*\.pdf$/);
    expect(filename).toContain("Test-User");
  });
});
