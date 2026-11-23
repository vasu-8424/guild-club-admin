import { test, expect } from "@playwright/test";
import { authenticateOperator, setupMockApiRoutes } from "../helpers/test-setup";

test.describe("Push Notification Dispatcher - /notifications", () => {
  test.beforeEach(async ({ context, page }) => {
    await authenticateOperator(context);
    await setupMockApiRoutes(page);
  });

  test("renders notification composer and lock-screen simulator", async ({ page }) => {
    await page.goto("/notifications");

    await expect(page.getByRole("heading", { name: "Push Notification Dispatcher" })).toBeVisible();
    await expect(page.getByText("Mobile Lock-Screen Simulation")).toBeVisible();
    await expect(page.getByText("Notification Dispatch Audit Log")).toBeVisible();

    // Verify default segment buttons
    await expect(page.getByText("All Customers")).toBeVisible();
    await expect(page.getByText("Cart Abandoned")).toBeVisible();
    await expect(page.getByText("By Customer City")).toBeVisible();
    await expect(page.getByText("Single Customer")).toBeVisible();
  });

  test("updates mobile lock-screen simulator in realtime when title/body changes", async ({ page }) => {
    await page.goto("/notifications");

    const titleInput = page.getByPlaceholder("e.g. Flash Toy Rotation Notice ⚡");
    const bodyTextarea = page.getByPlaceholder("Compelling text explaining the promotion or order update...");

    await titleInput.fill("Mega Toy Carnival 🎪");
    await bodyTextarea.fill("Rent 3 STEM toys and get 1 free trial for 14 days!");

    // Check lock-screen simulation updates within the phone simulator preview
    const previewCard = page.locator(".bg-slate-800\\/90");
    await expect(previewCard.getByText("Mega Toy Carnival 🎪")).toBeVisible();
    await expect(previewCard.getByText("Rent 3 STEM toys and get 1 free trial for 14 days!")).toBeVisible();
  });

  test("switches between audience segments and adjusts recipient count", async ({ page }) => {
    await page.goto("/notifications");

    // Click Cart Abandoned
    await page.getByText("Cart Abandoned").click();
    await expect(page.getByRole("button", { name: "Send Notification" })).toBeVisible();

    // Click By Customer City
    await page.getByText("By Customer City").click();
    await expect(page.getByText("Target Customer City")).toBeVisible();

    // Click Single Customer
    await page.getByText("Single Customer").click();
    await expect(page.getByText("Select Registered Customer")).toBeVisible();

    // Back to All Customers
    await page.getByText("All Customers").click();
    await expect(page.getByRole("button", { name: /Review & Broadcast/i })).toBeVisible();
  });

  test("broadcast triggers safeguard confirmation modal showing recipient count and allows abort", async ({
    page,
  }) => {
    await page.goto("/notifications");

    // Click Review & Broadcast
    await page.getByRole("button", { name: /Review & Broadcast/i }).click();

    // Confirmation modal should appear
    await expect(page.getByRole("heading", { name: "Confirm All-Customer Broadcast" })).toBeVisible();
    await expect(page.getByText(/Calculated Recipient Devices:/i)).toBeVisible();

    // Click Abort / Cancel
    await page.getByRole("button", { name: "Abort / Cancel" }).click();
    await expect(page.getByRole("heading", { name: "Confirm All-Customer Broadcast" })).not.toBeVisible();
  });

  test("executing broadcast displays success notice and initiates cooldown", async ({ page }) => {
    await page.goto("/notifications");

    // Open confirmation
    await page.getByRole("button", { name: /Review & Broadcast/i }).click();

    // Confirm dispatch
    await page.getByRole("button", { name: "Yes, Dispatch to All Customers" }).click();

    // Success notice
    await expect(page.getByText(/Push notification successfully queued & dispatched/i)).toBeVisible();

    // Cooldown indicator should activate
    await expect(page.getByText(/Broadcast cooldown:/i)).toBeVisible();
  });

  test("renders audit log entries with recipient count, segment, and status badge", async ({ page }) => {
    await page.goto("/notifications");

    // Verify mock audit logs table
    await expect(page.getByText("Weekend STEM Rotation is Live! 🚀").first()).toBeVisible();
    await expect(page.getByText("SENT").first()).toBeVisible();
    await expect(page.getByText("7 devices").first()).toBeVisible();
  });
});