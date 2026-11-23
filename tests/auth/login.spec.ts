import { test, expect } from "@playwright/test";

test.describe("Authentication Module - /login", () => {
  test("renders login page with branding and core form controls", async ({ page }) => {
    await page.goto("/login");

    // Title and branding
    await expect(page).toHaveTitle(/Guild Club Admin/i);
    await expect(page.getByRole("heading", { name: /Guild Club Admin Portal/i })).toBeVisible();
    await expect(page.getByText(/Internal operations, fulfillment & inventory/i)).toBeVisible();

    // Inputs and buttons using accessible locators
    const emailInput = page.getByPlaceholder("admin@guildclub.com");
    const passwordInput = page.getByPlaceholder("••••••••••••");
    const submitBtn = page.getByRole("button", { name: /Sign In to Admin Portal/i });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();
  });

  test("password visibility toggle switches input type between password and text", async ({ page }) => {
    await page.goto("/login");
    const passwordInput = page.getByPlaceholder("••••••••••••");
    await passwordInput.fill("AdminPassword@2026");

    await expect(passwordInput).toHaveAttribute("type", "password");

    // Toggle button with Eye icon
    const toggleBtn = page.locator("button:has(svg.lucide-eye, svg.lucide-eye-off)");
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute("type", "text");

    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("Auto Fill button populates default administrator credentials", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page.getByPlaceholder("admin@guildclub.com");
    const passwordInput = page.getByPlaceholder("••••••••••••");

    await expect(emailInput).toHaveValue("");
    await expect(passwordInput).toHaveValue("");

    // Click Auto Fill button
    await page.getByRole("button", { name: /Auto Fill/i }).click();

    await expect(emailInput).toHaveValue("admin@guildclub.com");
    await expect(passwordInput).toHaveValue("AdminPassword@2026");
  });

  test("submitting invalid credentials displays error message safely", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page.getByPlaceholder("admin@guildclub.com");
    const passwordInput = page.getByPlaceholder("••••••••••••");
    const submitBtn = page.getByRole("button", { name: /Sign In to Admin Portal/i });

    await emailInput.fill("invalid.user@guildclub.com");
    await passwordInput.fill("WrongPassword123!");
    await submitBtn.click();

    // Verify error notification renders
    const errorAlert = page.locator(".bg-red-500\\/10, [role='alert'], .text-red-400");
    await expect(errorAlert.first()).toBeVisible({ timeout: 10000 });
  });

  test("unauthenticated access to protected routes redirects to /login", async ({ page }) => {
    const protectedRoutes = [
      "/",
      "/categories",
      "/products",
      "/orders",
      "/banners",
      "/pricing",
      "/invoices",
      "/notifications",
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    }
  });
});
