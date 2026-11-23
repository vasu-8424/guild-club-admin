import { test, expect } from "@playwright/test";
import { authenticateOperator, setupMockApiRoutes } from "../helpers/test-setup";
import { MOCK_ORDERS } from "../fixtures/mock-data";

test.describe("Guild Club Admin Panel - End-to-End Operational Walkthrough", () => {
  test.beforeEach(async ({ context, page }) => {
    await authenticateOperator(context);
    await setupMockApiRoutes(page);
  });

  test("End-to-End Test & Video Tour: Verify all 8 Sidebar Sections and App Synchronization", async ({
    page,
  }) => {
    test.setTimeout(120000);
    // ---------------------------------------------------------
    // SECTION 1: DASHBOARD OVERVIEW & STORE METRICS
    // ---------------------------------------------------------
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Verify Dashboard Header
    await expect(page.getByRole("heading", { name: "Store Operations Dashboard" })).toBeVisible();
    await expect(page.getByText("Realtime monitoring of orders, inventory alerts & store metrics")).toBeVisible();

    // Verify 4 Core KPI Telemetry Cards
    await expect(page.getByText("Today's Orders")).toBeVisible();
    await expect(page.getByText("Today's Revenue")).toBeVisible();
    await expect(page.getByText("Low Stock Alerts")).toBeVisible();
    await expect(page.getByText("Active Products")).toBeVisible();

    // Verify Supabase Backend status badge in sidebar
    await expect(page.locator("aside").getByText("Supabase Backend")).toBeVisible();
    await expect(page.locator("aside").getByText("Live", { exact: true })).toBeVisible();

    await page.waitForTimeout(1000);

    // ---------------------------------------------------------
    // SECTION 2: CATEGORIES & SUBCATEGORIES HIERARCHY (MODULE 1)
    // ---------------------------------------------------------
    const categoriesLink = page.locator("aside").getByRole("link", { name: /Categories/i });
    await categoriesLink.click();
    await expect(page).toHaveURL(/\/categories/);
    await page.waitForTimeout(1000);

    // Verify Category Tree Heading and Parent Categories
    await expect(page.getByRole("heading", { name: "Category Hierarchy Manager" })).toBeVisible();
    await expect(page.getByText("STEM & Robotics").first()).toBeVisible();
    await expect(page.getByText("Montessori Wooden Toys").first()).toBeVisible();
    await expect(page.getByText("Coding Kits").first()).toBeVisible();

    // Test Opening "New Top Category" Modal
    const addCategoryBtn = page.getByRole("button", { name: "New Top Category" });
    await addCategoryBtn.click();
    await page.waitForTimeout(600);
    await expect(page.getByRole("heading", { name: "Create New Top-Level Category" })).toBeVisible();

    // Fill Category Form
    const catNameInput = page.locator("input[placeholder='e.g. Speech Therapy']");
    await catNameInput.fill("STEM Robotic Toys");
    await page.waitForTimeout(600);

    // Close Modal
    const cancelCatBtn = page.getByRole("button", { name: "Cancel" });
    await cancelCatBtn.click();
    await page.waitForTimeout(800);

    // ---------------------------------------------------------
    // SECTION 3: PRODUCTS CATALOG & INVENTORY (MODULE 2)
    // ---------------------------------------------------------
    const productsLink = page.locator("aside").getByRole("link", { name: /Products/i });
    await productsLink.click();
    await expect(page).toHaveURL(/\/products/);
    await page.waitForTimeout(1000);

    await expect(page.getByRole("heading", { name: "Products Catalog & Inventory" })).toBeVisible();

    // Verify Products Listing & Stock details
    await expect(page.getByText("Programmable Robotic Rover Explorer").first()).toBeVisible();
    await expect(page.getByText("Sensory Balance Wooden Stacking Stones").first()).toBeVisible();

    // Test Product Search
    const searchInput = page.getByPlaceholder("Search products...");
    await searchInput.fill("Robotic");
    await page.waitForTimeout(500);
    await searchInput.press("Enter");
    await page.waitForTimeout(800);
    await expect(page.getByText("Programmable Robotic Rover Explorer").first()).toBeVisible();

    // Clear Search
    await searchInput.fill("");
    await searchInput.press("Enter");
    await page.waitForTimeout(600);

    // Test Low Stock Filter
    const lowStockBtn = page.getByRole("button", { name: /Low Stock \(≤ 10\)/i });
    await lowStockBtn.click();
    await page.waitForTimeout(800);
    await expect(page.getByText("Programmable Robotic Rover Explorer").first()).toBeVisible();

    // Toggle Low Stock filter back
    await lowStockBtn.click();
    await page.waitForTimeout(600);

    // Test Bulk Selection
    const selectFirstRow = page.locator("tbody tr").first().locator("button").first();
    await selectFirstRow.click();
    await page.waitForTimeout(600);
    await expect(page.getByText(/Selected/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Bulk Stock Update/i })).toBeVisible();

    // Test Add Product Navigation
    const newProductLink = page.getByRole("link", { name: "New Product" });
    await newProductLink.click();
    await expect(page).toHaveURL(/\/products\/new/);
    await page.waitForTimeout(800);
    await expect(page.getByRole("heading", { name: "Create New Product SKU" })).toBeVisible();

    // Fill Product details
    const titleInput = page.locator("input[placeholder*='Montessori Geometric']");
    await titleInput.fill("AI Voice Interactive Robotic Teddy");

    // Test Pricing and automatic discount calculation
    const priceInputs = page.locator("input[type='number']");
    const priceInput = priceInputs.nth(0); // Price
    const origPriceInput = priceInputs.nth(1); // Original Price
    await priceInput.fill("1000");
    await origPriceInput.fill("2000");
    await page.waitForTimeout(600);
    await expect(page.getByText("50% OFF").first()).toBeVisible();

    // Click cancel to return to /products
    await page.getByRole("link", { name: "Cancel" }).click();
    await expect(page).toHaveURL(/\/products/);
    await page.waitForTimeout(800);

    // ---------------------------------------------------------
    // SECTION 4: ORDERS & FULFILLMENT LIFECYCLE (MODULE 3)
    // ---------------------------------------------------------
    const ordersLink = page.locator("aside").getByRole("link", { name: /Orders/i });
    await ordersLink.click();
    await expect(page).toHaveURL(/\/orders/);
    await page.waitForTimeout(1000);

    await expect(page.getByRole("heading", { name: "Fulfillment & Order Lifecycle" })).toBeVisible();

    // Test Status Filter Tabs
    await expect(page.getByRole("button", { name: "All Orders" })).toBeVisible();
    await page.getByRole("button", { name: "Dispatched" }).click();
    await page.waitForTimeout(600);
    await expect(page.getByText("Rahul Sharma").first()).toBeVisible();

    await page.getByRole("button", { name: "All Orders" }).click();
    await page.waitForTimeout(600);

    // Navigate to Order Details
    const orderId = MOCK_ORDERS[0].id;
    await page.goto(`/orders/${orderId}`);
    await page.waitForTimeout(1000);

    // Verify Fulfillment Stepper & GPS Navigation
    await expect(page.getByText(`Order ID: ${orderId}`)).toBeVisible();
    await expect(page.getByText("Order Placed").first()).toBeVisible();
    await expect(page.getByText("Preparing & Packed").first()).toBeVisible();
    await expect(page.getByText("Dispatched from Hub").first()).toBeVisible();
    await expect(page.getByText("Out for Delivery").first()).toBeVisible();
    await expect(page.getByText("Delivered").first()).toBeVisible();

    // Dual GPS addresses
    await expect(page.getByText(/Essen Marvella/i).first()).toBeVisible();
    await expect(page.getByText(/Flat 402, Green Meadows/i).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Get Directions" })).toBeVisible();

    await page.waitForTimeout(1000);

    // ---------------------------------------------------------
    // SECTION 5: HOME BANNERS & MERCHANDISING (MODULE 4)
    // ---------------------------------------------------------
    const bannersLink = page.locator("aside").getByRole("link", { name: /Home Banners/i });
    await bannersLink.click();
    await expect(page).toHaveURL(/\/banners/);
    await page.waitForTimeout(1000);

    await expect(page.getByRole("heading", { name: "Mobile Home Carousel & Banners" })).toBeVisible();
    await expect(page.getByText("Guild Club Toy Library 🎁").first()).toBeVisible();

    // Open Add Banner Modal
    const addBannerBtn = page.getByRole("button", { name: "Add Hero Slide" });
    await addBannerBtn.click();
    await page.waitForTimeout(600);
    await expect(page.getByRole("heading", { name: "Create Hero Slide" })).toBeVisible();

    // Fill title
    const bannerTitleInput = page.locator("input[placeholder='e.g. Guild Club Toy Library 🎁']");
    await bannerTitleInput.fill("Diwali Festive Toy Box 🪔");
    await page.waitForTimeout(600);

    // Cancel Banner Modal
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.waitForTimeout(800);

    // ---------------------------------------------------------
    // SECTION 6: PRICING SHEET & MARGIN MATRIX (MODULE 5)
    // ---------------------------------------------------------
    const pricingLink = page.locator("aside").getByRole("link", { name: /Pricing Sheet/i });
    await pricingLink.click();
    await expect(page).toHaveURL(/\/pricing/);
    await page.waitForTimeout(1000);

    await expect(page.getByRole("heading", { name: "Pricing & Discount Manager" })).toBeVisible();
    await expect(page.getByText("Programmable Robotic Rover Explorer").first()).toBeVisible();

    // Test Inline Price Edit
    const retailPriceInput = page.locator("tbody input[type='number']").nth(0);
    await retailPriceInput.fill("1500");
    await page.waitForTimeout(600);
    await expect(page.getByText("40% OFF").first()).toBeVisible();

    // Test Bulk Markdown Modal
    const bulkDiscountBtn = page.getByRole("button", { name: "Bulk Campaign Tool" });
    await bulkDiscountBtn.click();
    await page.waitForTimeout(600);
    await expect(page.getByRole("heading", { name: "Apply Universal Discount Campaign" })).toBeVisible();

    // Close Modal
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.waitForTimeout(800);

    // ---------------------------------------------------------
    // SECTION 7: GST INVOICES & TAX DOCUMENTS (MODULE 6)
    // ---------------------------------------------------------
    const invoicesLink = page.locator("aside").getByRole("link", { name: /Invoices/i });
    await invoicesLink.click();
    await expect(page).toHaveURL(/\/invoices/);
    await page.waitForTimeout(1000);

    await expect(page.getByRole("heading", { name: "Tax Invoice & Legal GST Manager" })).toBeVisible();
    await expect(page.getByText("Rahul Sharma").first()).toBeVisible();

    // Verify Download PDF & Resend Buttons
    const downloadPdfBtn = page.getByRole("button", { name: /Download PDF/i }).first();
    await expect(downloadPdfBtn).toBeVisible();

    // Test Resend button
    const resendBtn = page.locator("button[title='Resend to Customer Email']").first();
    await resendBtn.click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(/Invoice sent to customer successfully/i)).toBeVisible();

    // ---------------------------------------------------------
    // SECTION 8: PUSH NOTIFICATIONS DISPATCHER (MODULE 7)
    // ---------------------------------------------------------
    const notificationsLink = page.locator("aside").getByRole("link", { name: /Notifications/i });
    await notificationsLink.click();
    await expect(page).toHaveURL(/\/notifications/);
    await page.waitForTimeout(1000);

    await expect(page.getByRole("heading", { name: "Push Notification Dispatcher" })).toBeVisible();

    // Compose Notification
    const notifTitleInput = page.getByPlaceholder("e.g. Flash Toy Rotation Notice ⚡");
    await notifTitleInput.fill("New Robotic Kit Just Dropped! 🚀");
    const notifBodyInput = page.getByPlaceholder("Compelling text explaining the promotion or order update...");
    await notifBodyInput.fill("Check out the new AI Voice Teddy and Rover Explorer now in stock!");
    await page.waitForTimeout(800);

    // Verify Live Lock-Screen Mobile Preview Updates
    const previewCard = page.locator(".bg-slate-800\\/90");
    await expect(previewCard.getByText("New Robotic Kit Just Dropped! 🚀")).toBeVisible();
    await expect(previewCard.getByText("Check out the new AI Voice Teddy and Rover Explorer now in stock!")).toBeVisible();

    // Select Audience Segment
    await page.getByText("All Customers").click();
    await page.waitForTimeout(600);

    // Click Review & Broadcast to trigger safety safeguard modal
    const sendBtn = page.getByRole("button", { name: /Review & Broadcast/i });
    await sendBtn.click();
    await page.waitForTimeout(600);
    await expect(page.getByRole("heading", { name: "Confirm All-Customer Broadcast" })).toBeVisible();

    // Close Confirmation Modal
    await page.getByRole("button", { name: "Abort / Cancel" }).click();
    await page.waitForTimeout(1000);

    // Return to Dashboard to conclude the comprehensive tour
    await page.locator("aside").getByRole("link", { name: /Dashboard/i }).click();
    await expect(page).toHaveURL("/");
    await page.waitForTimeout(1500);
  });
});
