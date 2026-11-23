import { Page, BrowserContext } from "@playwright/test";
import {
  MOCK_CATEGORIES,
  MOCK_FLAT_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_ORDERS,
  MOCK_BANNERS,
  MOCK_NOTIFICATION_LOGS,
} from "../fixtures/mock-data";

export async function authenticateOperator(context: BrowserContext) {
  await context.addCookies([
    {
      name: "guildclub_admin_session",
      value: "admin@guildclub.com",
      url: "http://localhost:3000",
    },
  ]);
}

export async function setupMockApiRoutes(page: Page) {
  // Mock /api/auth/verify
  await page.route("**/api/auth/verify**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        authenticated: true,
        admin: {
          id: "00000000-0000-0000-0000-000000000001",
          user_id: "00000000-0000-0000-0000-000000000001",
          email: "admin@guildclub.com",
          role: "owner",
          is_active: true,
        },
      }),
    });
  });

  // Mock /api/categories
  await page.route("**/api/categories**", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          categories: MOCK_CATEGORIES,
          flat: MOCK_FLAT_CATEGORIES,
        }),
      });
    } else if (method === "POST") {
      const body = route.request().postDataJSON();
      const newCat = {
        id: `cat-${Date.now()}`,
        ...body,
        created_at: new Date().toISOString(),
      };
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ success: true, category: newCat }),
      });
    } else if (method === "PUT") {
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, category: body }),
      });
    } else if (method === "DELETE") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock /api/products
  await page.route("**/api/products**", async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();

    if (method === "GET") {
      const lowStock = url.searchParams.get("low_stock") === "true";
      const search = url.searchParams.get("search")?.toLowerCase();

      let list = [...MOCK_PRODUCTS];
      if (lowStock) {
        list = list.filter((p) => (p.stock_quantity ?? 0) <= 10);
      }
      if (search) {
        list = list.filter(
          (p) =>
            p.title.toLowerCase().includes(search) ||
            p.description?.toLowerCase().includes(search)
        );
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ products: list, count: list.length }),
      });
    } else if (method === "POST") {
      const body = route.request().postDataJSON();
      const newProd = {
        id: `prod-${Date.now()}`,
        ...body,
        created_at: new Date().toISOString(),
      };
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ success: true, product: newProd }),
      });
    } else if (method === "PUT") {
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, product: body }),
      });
    } else if (method === "DELETE") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock /api/products/bulk
  await page.route("**/api/products/bulk**", async (route) => {
    const body = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, updatedCount: body.ids?.length || 1 }),
    });
  });

  // Mock /api/orders
  await page.route("**/api/orders**", async (route) => {
    const url = new URL(route.request().url());
    const id = url.searchParams.get("id");
    const status = url.searchParams.get("status");

    if (id) {
      const order = MOCK_ORDERS.find((o) => o.id === id) || MOCK_ORDERS[0];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ order }),
      });
    } else {
      let orders = [...MOCK_ORDERS];
      if (status && status !== "all") {
        orders = orders.filter((o) => o.status === status);
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ orders, count: orders.length }),
      });
    }
  });

  // Mock /api/orders/[id]/status
  await page.route("**/api/orders/*/status**", async (route) => {
    const body = route.request().postDataJSON();
    const updatedOrder = {
      ...MOCK_ORDERS[0],
      status: body.status,
      status_updated_at: new Date().toISOString(),
      status_history: {
        ...MOCK_ORDERS[0].status_history,
        [body.status]: new Date().toISOString(),
      },
    };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, order: updatedOrder }),
    });
  });

  // Mock /api/banners
  await page.route("**/api/banners**", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ banners: MOCK_BANNERS }),
      });
    } else if (method === "POST" || method === "PUT") {
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, banner: body }),
      });
    } else if (method === "DELETE") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock /api/invoices
  await page.route("**/api/invoices**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ orders: MOCK_ORDERS }),
    });
  });

  // Mock /api/invoices/resend
  await page.route("**/api/invoices/resend**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, message: "Invoice sent to customer successfully" }),
    });
  });

  // Mock /api/notifications/dispatch
  await page.route("**/api/notifications/dispatch**", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          totalRegisteredUsers: 7,
          activeDeviceTokens: 5,
          users: [
            { id: "usr-101", email: "rahul.sharma@example.com", name: "Rahul Sharma" },
            { id: "usr-102", email: "priya.varma@example.com", name: "Priya Varma" },
          ],
          cities: ["Hyderabad", "Chendurthi", "Bengaluru"],
        }),
      });
    } else if (method === "POST") {
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          status: "sent",
          recipientCount: 7,
          dispatchPayload: body,
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock /api/notifications/logs
  await page.route("**/api/notifications/logs**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ logs: MOCK_NOTIFICATION_LOGS }),
    });
  });

  // Mock /api/upload
  await page.route("**/api/upload**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        url: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1",
        name: "uploaded-image.png",
      }),
    });
  });
}
