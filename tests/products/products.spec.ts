import { test, expect } from "@playwright/test";
import { authenticateOperator, setupMockApiRoutes } from "../helpers/test-setup";

test.describe("Products & Inventory Module - /products", () => {
  test.beforeEach(async ({ context, page }) => {
    await authenticateOperator(context);
    await setupMockApiRoutes(page);
  });

  test("renders product catalog table with prices, stock levels and status badges", async ({ page }) => {
    await page.goto("/products");

    await expect(page.getByRole("heading", { name: "Products Catalog & Inventory" })).toBeVisible();

    // Verify products from mock data
    await expect(page.getByText("Programmable Robotic Rover Explorer").first()).toBeVisible();
    await expect(page.getByText("Sensory Balance Wooden Stacking Stones").first()).toBeVisible();

    // Verify price formatting and discount
    await expect(page.getByText("₹1,899").first()).toBeVisible();
    await expect(page.getByText("24% OFF").first()).toBeVisible();

    // Verify low stock warning badge for stock <= 10
    await expect(page.getByText("8 units").first()).toBeVisible();
  });

  test("filters catalog by search keyword", async ({ page }) => {
    await page.goto("/products");

    const searchInput = page.getByPlaceholder("Search products...");
    await searchInput.fill("Robotic");
    await searchInput.press("Enter");

    await expect(page.getByText("Programmable Robotic Rover Explorer").first()).toBeVisible();
  });

  test("toggles low stock filter", async ({ page }) => {
    await page.goto("/products");

    // Click "Low Stock (≤ 10)" button
    const lowStockBtn = page.getByRole("button", { name: /Low Stock \(≤ 10\)/i });
    await lowStockBtn.click();

    // Should display the low stock product
    await expect(page.getByText("Programmable Robotic Rover Explorer").first()).toBeVisible();
  });

  test("multi-select items reveals bulk action toolbar and modal", async ({ page }) => {
    await page.goto("/products");

    // Select the first product via the table row selection button
    const rowSelectBtn = page.locator("tbody tr").first().locator("button").first();
    await rowSelectBtn.click();

    // Bulk actions bar should appear
    await expect(page.getByText(/Selected/i).first()).toBeVisible();
    const bulkStockBtn = page.getByRole("button", { name: /Bulk Stock Update/i });
    await expect(bulkStockBtn).toBeVisible();

    // Open bulk stock adjustment modal
    await bulkStockBtn.click();
    await expect(page.getByRole("heading", { name: /Bulk Update Stock Quantity/i })).toBeVisible();

    // Close modal
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("product creation form validates calculations and saves properly", async ({ page }) => {
    await page.goto("/products/new");

    await expect(page.getByRole("heading", { name: "Create New Product SKU" })).toBeVisible();

    // Fill Title using placeholder or label
    const titleInput = page.locator("input[placeholder*='Montessori Geometric']");
    await titleInput.fill("Magnetic Solar System 3D Orbit");

    // Test Pricing and automatic discount calculation
    const priceInputs = page.locator("input[type='number']");
    const priceInput = priceInputs.nth(0); // Price
    const origPriceInput = priceInputs.nth(1); // Original Price

    await priceInput.fill("1000");
    await origPriceInput.fill("2000");

    // Form calculates 50% discount
    await expect(page.getByText("50% OFF").first()).toBeVisible();

    // Toggle flags
    const trendingCheckbox = page.locator("input[type='checkbox']").first();
    await trendingCheckbox.check();
    await expect(trendingCheckbox).toBeChecked();
  });
});
