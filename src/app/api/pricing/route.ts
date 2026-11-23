import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/supabase/auth-guard";
import { getAdminClient } from "@/lib/supabase/admin";

export async function PUT(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const { updates } = await req.json(); // Array of { id, price, original_price, discount_percentage }

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "No price updates provided" }, { status: 400 });
    }

    const adminClient = getAdminClient();

    for (const item of updates) {
      const p = Number(item.price);
      const op = item.original_price ? Number(item.original_price) : null;
      let disc = Number(item.discount_percentage) || 0;

      if (op && op > p && p > 0) {
        disc = Math.round(((op - p) / op) * 100);
      }

      await adminClient
        .from("products")
        .update({
          price: p,
          original_price: op,
          discount_percentage: disc,
        })
        .eq("id", item.id);
    }

    return NextResponse.json({ success: true, updatedCount: updates.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
