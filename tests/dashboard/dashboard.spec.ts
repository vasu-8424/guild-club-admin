import { test, expect } from "@playwright/test";
import { authenticateOperator, setupMockApiRoutes } from "../helpers/test-setup";

test.describe("Dashboard Overview - /", () => {
  test.beforeEach(async ({ context, page }) => {
    await authenticateOperator(context);
    await setupMockApiRoutes(page);
  });

  test("renders dashboard header and operator branding", async ({ page }) => {
    await page.goto("/");

    // Header
    await expect(page.getByRole("heading", { name: "Store Operations Dashboard" })).toBeVisible();
    await expect(
      page.getByText("Realtime monitoring of orders, inventory alerts & store metrics")
    ).toBeVisible();

    // Sidebar items on viewports where sidebar is rendered
    const sidebar = page.locator("aside");
    if (await sidebar.isVisible()) {
      await expect(sidebar.getByRole("link", { name: /Dashboard/i })).toBeVisible();
      await expect(sidebar.getByRole("link", { name: /Categories/i })).toBeVisible();
      await expect(sidebar.getByRole("link", { name: /Products/i })).toBeVisible();
      await expect(sidebar.getByRole("link", { name: /Orders/i })).toBeVisible();
      await expect(sidebar.getByRole("link", { name: /Home Banners/i })).toBeVisible();
      await expect(sidebar.getByRole("link", { name: /Pricing Sheet/i })).toBeVisible();
      await expect(sidebar.getByRole("link", { name: /Invoices/i })).toBeVisible();
      await expect(sidebar.getByRole("link", { name: /Notifications/i })).toBeVisible();
    }
  });

  test("displays four core KPI telemetry cards", async ({ page }) => {
    await page.goto("/");

    // Today's Orders
    await expect(page.getByText("Today's Orders")).toBeVisible();
    await expect(page.getByText(/orders logged/i)).toBeVisible();

    // Today's Revenue with INR symbol
    await expect(page.getByText("Today's Revenue")).toBeVisible();
    await expect(page.getByText(/INR \(₹\)/i)).toBeVisible();

    // Low Stock Alerts
    await expect(page.getByText("Low Stock Alerts")).toBeVisible();
    await expect(page.getByText(/items ≤ 10 units/i)).toBeVisible();

    // Active Products
    await expect(page.getByText("Active Products")).toBeVisible();
    await expect(page.getByText(/SKUs in catalog/i)).toBeVisible();
  });

  test("quick operational shortcuts navigate to respective modules", async ({ page }) => {
    await page.goto("/");

    const fulfillLink = page.getByRole("link", { name: /Fulfill Orders/i });
    await expect(fulfillLink).toHaveAttribute("href", "/orders");

    const addProductLink = page.getByRole("link", { name: /Add New Product/i });
    await expect(addProductLink).toHaveAttribute("href", "/products/new");

    const pricingLink = page.getByRole("link", { name: /Bulk Price Adjust/i });
    await expect(pricingLink).toHaveAttribute("href", "/pricing");

    const bannersLink = page.getByRole("link", { name: /Update Hero Carousel/i });
    await expect(bannersLink).toHaveAttribute("href", "/banners");
  });
});
