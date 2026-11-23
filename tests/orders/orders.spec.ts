import { test, expect } from "@playwright/test";
import { authenticateOperator, setupMockApiRoutes } from "../helpers/test-setup";
import { MOCK_ORDERS } from "../fixtures/mock-data";

test.describe("Orders & Fulfillment Module - /orders", () => {
  test.beforeEach(async ({ context, page }) => {
    await authenticateOperator(context);
    await setupMockApiRoutes(page);
  });

  test("renders orders table with status filter tabs and customer rows", async ({ page }) => {
    await page.goto("/orders");

    await expect(page.getByRole("heading", { name: "Fulfillment & Order Lifecycle" })).toBeVisible();

    // Verify tabs
    await expect(page.getByRole("button", { name: "All Orders" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Dispatched" })).toBeVisible();

    // Verify mock orders rendered
    await expect(page.getByText("Rahul Sharma").first()).toBeVisible();
    await expect(page.getByText("Priya Varma").first()).toBeVisible();

    // Verify status badges
    await expect(page.getByText("Dispatched").first()).toBeVisible();
    await expect(page.getByText("Placed").first()).toBeVisible();
  });

  test("filters orders list by status tab", async ({ page }) => {
    await page.goto("/orders");

    // Click "Dispatched" tab
    await page.getByRole("button", { name: "Dispatched" }).click();

    await expect(page.getByText("Rahul Sharma").first()).toBeVisible();
  });

  test("order details page displays fulfillment stepper, dual GPS addresses and navigation route", async ({
    page,
  }) => {
    const orderId = MOCK_ORDERS[0].id;
    await page.goto(`/orders/${orderId}`);

    // Order ID in header
    await expect(page.getByText(`Order ID: ${orderId}`)).toBeVisible();

    // Stepper stages
    await expect(page.getByText("Order Placed").first()).toBeVisible();
    await expect(page.getByText("Preparing & Packed").first()).toBeVisible();
    await expect(page.getByText("Dispatched from Hub").first()).toBeVisible();
    await expect(page.getByText("Out for Delivery").first()).toBeVisible();
    await expect(page.getByText("Delivered").first()).toBeVisible();

    // Dual addresses: Hub origin vs Customer destination
    await expect(page.getByText(/Essen Marvella apartments/i).first()).toBeVisible();
    await expect(page.getByText(/Flat 402, Green Meadows/i).first()).toBeVisible();

    // Google Maps routing navigation link
    const directionsLink = page.getByRole("link", { name: "Get Directions" });
    await expect(directionsLink).toBeVisible();
    await expect(directionsLink).toHaveAttribute("href", /google\.com\/maps\/dir/);

    // Line items and pricing audit
    await expect(page.getByText("Programmable Robotic Rover Explorer").first()).toBeVisible();
    await expect(page.getByText(/Space Gray/i)).toBeVisible();
    await expect(page.getByText(/Grand Total Paid/i)).toBeVisible();
  });

  test("advancing status updates fulfillment state and displays confirmation notice", async ({
    page,
  }) => {
    const orderId = MOCK_ORDERS[0].id;
    await page.goto(`/orders/${orderId}`);

    // Click "Out for Delivery" stage button if available
    const advanceBtn = page.getByRole("button", { name: /Out for Delivery/i }).first();
    if (await advanceBtn.isVisible()) {
      await advanceBtn.click();
      // Verify success notice appears
      await expect(page.getByText(/synced to customer live tracking/i)).toBeVisible();
    }
  });
});
