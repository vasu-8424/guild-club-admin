import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/supabase/auth-guard";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const { items } = await req.json(); // Array of { id: string, sort_order: number }
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid payload: items array required" }, { status: 400 });
    }

    const adminClient = getAdminClient();

    // Execute updates
    for (const item of items) {
      await adminClient
        .from("categories")
        .update({ sort_order: item.sort_order })
        .eq("id", item.id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
