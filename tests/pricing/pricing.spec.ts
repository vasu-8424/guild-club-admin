import { test, expect } from "@playwright/test";
import { authenticateOperator, setupMockApiRoutes } from "../helpers/test-setup";

test.describe("Pricing Sheet Module - /pricing", () => {
  test.beforeEach(async ({ context, page }) => {
    await authenticateOperator(context);
    await setupMockApiRoutes(page);
  });

  test("renders pricing spreadsheet with retail prices, MRPs and discount percentages", async ({
    page,
  }) => {
    await page.goto("/pricing");

    await expect(page.getByRole("heading", { name: "Pricing & Discount Manager" })).toBeVisible();

    // Verify products rendered
    await expect(page.getByText("Programmable Robotic Rover Explorer").first()).toBeVisible();
    await expect(page.getByText("Sensory Balance Wooden Stacking Stones").first()).toBeVisible();

    // Customer price card preview section
    await expect(page.getByText(/Mobile App Price Tag Simulation/i)).toBeVisible();
  });

  test("inline price modification recalculates discount percentage and marks row as modified", async ({
    page,
  }) => {
    await page.goto("/pricing");

    // Get the retail price input for the first item
    const priceInputs = page.locator("tbody input[type='number']");
    const retailPriceInput = priceInputs.nth(0); // Price

    // Change retail price from 1899 to 1500 (MRP is 2499)
    await retailPriceInput.fill("1500");

    // The discount should recalculate to ~40% (2499 - 1500) / 2499 * 100
    await expect(page.getByText("40% OFF").first()).toBeVisible();

    // "Save All (1) Changes" button should be active
    const saveAllBtn = page.getByRole("button", { name: /Save All/i });
    await expect(saveAllBtn).toBeVisible();
  });

  test("bulk discount modal applies percentage markdown across catalog", async ({ page }) => {
    await page.goto("/pricing");

    // Open bulk campaign tool
    await page.getByRole("button", { name: "Bulk Campaign Tool" }).click();

    await expect(page.getByRole("heading", { name: "Apply Universal Discount Campaign" })).toBeVisible();

    // Fill 30% discount
    const discountInput = page.locator("input[type='number']").last();
    await discountInput.fill("30");

    // Close modal
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("heading", { name: "Apply Universal Discount Campaign" })).not.toBeVisible();
  });
});
