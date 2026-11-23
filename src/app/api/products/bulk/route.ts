import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/supabase/auth-guard";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const { action, productIds, stockQuantity, categoryId } = await req.json();

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: "No product IDs provided" }, { status: 400 });
    }

    const adminClient = getAdminClient();

    if (action === "update_stock") {
      const quantity = Number(stockQuantity);
      if (isNaN(quantity) || quantity < 0) {
        return NextResponse.json({ error: "Valid stock quantity required" }, { status: 400 });
      }

      const { error } = await adminClient
        .from("products")
        .update({ stock_quantity: quantity })
        .in("id", productIds);

      if (error) throw error;
      return NextResponse.json({ success: true, updatedCount: productIds.length });
    }

    if (action === "reassign_category") {
      if (!categoryId) {
        return NextResponse.json({ error: "Category ID required" }, { status: 400 });
      }

      const { error } = await adminClient
        .from("products")
        .update({ category_slug: categoryId })
        .in("id", productIds);

      if (error) throw error;
      return NextResponse.json({ success: true, updatedCount: productIds.length });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
