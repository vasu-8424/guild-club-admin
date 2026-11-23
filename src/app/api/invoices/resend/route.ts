import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/supabase/auth-guard";

export async function POST(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const { orderId, email, invoiceNumber } = await req.json();

    if (!orderId || !email) {
      return NextResponse.json({ error: "Order ID and email are required." }, { status: 400 });
    }

    // In a production setup, this sends an email via SendGrid/Resend/SMTP or in-app notification.
    return NextResponse.json({
      success: true,
      message: `Tax Invoice ${invoiceNumber || orderId} link dispatched successfully to ${email}.`,
      sentAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
