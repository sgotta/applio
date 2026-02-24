import { test, expect, seedCVData, minimalCV } from "../helpers/setup";
import * as fs from "fs";

test.describe("PDF Generation @smoke", () => {
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

  test("PDF with photo includes embedded image data", async ({ appPage: page }) => {
    // Seed CV with a valid base64 photo (small 1x1 PNG)
    const cvWithPhoto = {
      ...minimalCV,
      personalInfo: {
        ...minimalCV.personalInfo,
        photoUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      },
    };
    await seedCVData(page, cvWithPhoto);

    // Download PDF with photo
    await page.locator("[data-testid='btn-file-menu']").click();
    await page.locator("[data-radix-popper-content-wrapper]").first().waitFor({ state: "visible" });

    const downloadPromise = page.waitForEvent("download", { timeout: 60_000 });
    await page.getByText("Download PDF").click();
    const download = await downloadPromise;
    const filePath = await download.path();
    expect(filePath).toBeTruthy();

    // A PDF with an embedded photo should be noticeably larger than a bare
    // text-only PDF (~5KB). Even a tiny 1x1 image adds overhead.
    // The baseline no-photo PDF is ~4-5KB; with photo it should exceed 5KB.
    const fileSize = fs.statSync(filePath!).size;
    expect(fileSize).toBeGreaterThan(5000);
  });
});
