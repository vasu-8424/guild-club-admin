import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/supabase/auth-guard";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const adminClient = getAdminClient();
    const { data: logs, error } = await adminClient
      .from("notifications_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      // Return empty array if table not yet migrated
      return NextResponse.json({ logs: [] });
    }

    return NextResponse.json({ logs: logs || [] });
  } catch (err: any) {
    return NextResponse.json({ logs: [] });
  }
}
