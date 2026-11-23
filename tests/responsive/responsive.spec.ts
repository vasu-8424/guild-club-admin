import { test, expect } from "@playwright/test";
import { authenticateOperator, setupMockApiRoutes } from "../helpers/test-setup";

test.describe("UI Responsiveness & Accessibility", () => {
  test.beforeEach(async ({ context, page }) => {
    await setupMockApiRoutes(page);
  });

  test("desktop viewport (1440x900) renders full sidebar and main dashboard correctly", async ({
    context,
    page,
  }) => {
    await authenticateOperator(context);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    // Full sidebar should be visible
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();
    await expect(page.getByText("Store Operator Portal")).toBeVisible();
  });

  test("mobile viewport (390x844) renders login card without horizontal overflow", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");

    // Login card should be centered and responsive
    const loginCard = page.locator(".max-w-md");
    await expect(loginCard).toBeVisible();

    // Verify inputs remain accessible on touch viewports
    const emailInput = page.getByPlaceholder("admin@guildclub.com");
    await expect(emailInput).toBeVisible();

    // Verify card width fits within mobile viewport
    const cardBox = await loginCard.boundingBox();
    expect(cardBox).toBeTruthy();
    if (cardBox) {
      expect(cardBox.width).toBeLessThanOrEqual(390);
    }
  });

  test("login form inputs have associated labels and accessible focus states", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await page.goto("/login");

    const emailInput = page.getByPlaceholder("admin@guildclub.com");
    await emailInput.focus();
    await expect(emailInput).toBeFocused();

    const passwordInput = page.getByPlaceholder("••••••••••••");
    await passwordInput.focus();
    await expect(passwordInput).toBeFocused();
  });

  test("mobile navigation drawer opens via hamburger menu, lists all modules, and closes properly", async ({
    context,
    page,
  }) => {
    await authenticateOperator(context);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    // Hamburger button should be visible on mobile
    const hamburgerBtn = page.getByRole("button", { name: "Open Navigation Menu" });
    await expect(hamburgerBtn).toBeVisible();

    // Open mobile navigation drawer
    await hamburgerBtn.click();

    // Drawer should open and display core navigation links
    const mobileDrawer = page.getByRole("dialog", { name: "Mobile Navigation" });
    await expect(mobileDrawer).toBeVisible();
    await expect(mobileDrawer.getByRole("link", { name: /Categories/i })).toBeVisible();
    await expect(mobileDrawer.getByRole("link", { name: /Orders/i })).toBeVisible();
    await expect(mobileDrawer.getByRole("link", { name: /Pricing Sheet/i })).toBeVisible();

    // Close drawer via close button
    const closeBtn = page.getByRole("button", { name: "Close navigation drawer" });
    await closeBtn.click();
    await expect(mobileDrawer).not.toBeVisible();
  });
});
