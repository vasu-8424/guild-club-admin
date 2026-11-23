import { test, expect } from "@playwright/test";
import { authenticateOperator, setupMockApiRoutes } from "../helpers/test-setup";

test.describe("Home Banners & Merchandising - /banners", () => {
  test.beforeEach(async ({ context, page }) => {
    await authenticateOperator(context);
    await setupMockApiRoutes(page);
  });

  test("renders banner list with title, promotional badge and status", async ({ page }) => {
    await page.goto("/banners");

    await expect(page.getByRole("heading", { name: "Mobile Home Carousel & Banners" })).toBeVisible();

    // Verify existing mock banner
    await expect(page.getByText("Guild Club Toy Library 🎁").first()).toBeVisible();
    await expect(page.getByText("PREMIUM TOY SUBSCRIPTION ⚡").first()).toBeVisible();
    await expect(page.getByText("Explore Library").first()).toBeVisible();
  });

  test("opens modal to create a new banner and updates form inputs", async ({ page }) => {
    await page.goto("/banners");

    await page.getByRole("button", { name: "Add Hero Slide" }).click();

    await expect(page.getByRole("heading", { name: "Create Hero Slide" })).toBeVisible();

    // Fill title
    const titleInput = page.locator("input[placeholder='e.g. Guild Club Toy Library 🎁']");
    await titleInput.fill("Diwali Festive Toy Box 🪔");

    // Close modal
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("heading", { name: "Create Hero Slide" })).not.toBeVisible();
  });

  test("displays live active toggle status for existing banner", async ({ page }) => {
    await page.goto("/banners");

    const activeToggle = page.locator("button:has-text('Active'), span:has-text('Active')").first();
    await expect(activeToggle).toBeVisible();
  });
});
