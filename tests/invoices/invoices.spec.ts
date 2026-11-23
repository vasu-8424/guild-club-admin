import { test, expect } from "@playwright/test";
import { authenticateOperator, setupMockApiRoutes } from "../helpers/test-setup";

test.describe("GST Invoices & Tax Documents - /invoices", () => {
  test.beforeEach(async ({ context, page }) => {
    await authenticateOperator(context);
    await setupMockApiRoutes(page);
  });

  test("renders invoices listing with customer names, totals and place of supply", async ({
    page,
  }) => {
    await page.goto("/invoices");

    await expect(page.getByRole("heading", { name: "Tax Invoice & Legal GST Manager" })).toBeVisible();

    // Verify customers and orders from mock data
    await expect(page.getByText("Rahul Sharma").first()).toBeVisible();
    await expect(page.getByText("Priya Varma").first()).toBeVisible();

    // Verify customer locations from delivery address
    await expect(page.getByText(/Telangana/i).first()).toBeVisible();
    await expect(page.getByText(/Andhra Pradesh/i).first()).toBeVisible();
  });

  test("triggers browser download for generated GST tax invoice PDF", async ({ page }) => {
    await page.goto("/invoices");

    // Listen for download event when Download PDF is clicked
    const downloadPromise = page.waitForEvent("download");

    const downloadBtn = page.getByRole("button", { name: /Download PDF/i }).first();
    await downloadBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  });

  test("resends tax invoice to customer email and shows confirmation", async ({ page }) => {
    await page.goto("/invoices");

    // Click "Resend to Customer Email" button on the first invoice row
    const emailBtn = page.locator("button[title='Resend to Customer Email']").first();
    await emailBtn.click();

    // Verify confirmation notice
    await expect(page.getByText(/Invoice sent to customer successfully/i)).toBeVisible();
  });
});
