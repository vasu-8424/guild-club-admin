import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/supabase/auth-guard";

export async function GET(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);

  if (!authResult.authorized) {
    return authResult.response;
  }

  return NextResponse.json({
    authorized: true,
    admin: authResult.admin,
  });
}
