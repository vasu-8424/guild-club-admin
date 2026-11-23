import { test, expect } from "@playwright/test";
import { authenticateOperator, setupMockApiRoutes } from "../helpers/test-setup";

test.describe("Categories Module - /categories", () => {
  test.beforeEach(async ({ context, page }) => {
    await authenticateOperator(context);
    await setupMockApiRoutes(page);
  });

  test("renders category tree hierarchy with parent categories and subcategories", async ({ page }) => {
    await page.goto("/categories");

    await expect(page.getByRole("heading", { name: "Category Hierarchy Manager" })).toBeVisible();

    // Verify parent categories from mock data
    await expect(page.getByText("STEM & Robotics").first()).toBeVisible();
    await expect(page.getByText("Montessori Wooden Toys").first()).toBeVisible();

    // Verify subcategory is rendered
    await expect(page.getByText("Coding Kits").first()).toBeVisible();
  });

  test("opens modal to create a new top-level category and validates inputs", async ({ page }) => {
    await page.goto("/categories");

    await page.getByRole("button", { name: "New Top Category" }).click();

    // Modal opens
    await expect(page.getByRole("heading", { name: "Create New Top-Level Category" })).toBeVisible();

    // Form fields
    const nameInput = page.locator("input[placeholder='e.g. Speech Therapy']");
    const slugInput = page.locator("input[placeholder='e.g. speech-therapy']");

    await expect(nameInput).toBeVisible();
    await expect(slugInput).toBeVisible();

    await nameInput.fill("Art & Creative Play");
    await slugInput.fill("art-creative-play");

    // Click cancel to close
    const cancelBtn = page.getByRole("button", { name: "Cancel" });
    await cancelBtn.click();
    await expect(page.getByRole("heading", { name: "Create New Top-Level Category" })).not.toBeVisible();
  });

  test("opens modal pre-configured for subcategory creation", async ({ page }) => {
    await page.goto("/categories");

    // Click "+ Subcategory" on STEM & Robotics row
    const addSubBtn = page.getByRole("button", { name: "+ Subcategory" }).first();
    await addSubBtn.click();

    await expect(page.getByRole("heading", { name: /Add Subcategory/i })).toBeVisible();

    // Verify parent category selector has parent selected
    const parentSelect = page.locator("select").first();
    await expect(parentSelect).toHaveValue("cat-001");

    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("opens edit modal for existing category", async ({ page }) => {
    await page.goto("/categories");

    // Click "Edit Category" button on the first category row
    const editBtn = page.getByRole("button", { name: "Edit Category" }).first();
    await editBtn.click();

    await expect(page.getByRole("heading", { name: /Edit Category/i })).toBeVisible();

    const nameInput = page.locator("input[placeholder='e.g. Speech Therapy']");
    await expect(nameInput).toHaveValue("STEM & Robotics");

    await page.getByRole("button", { name: "Cancel" }).click();
  });
});
