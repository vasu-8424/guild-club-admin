import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/supabase/auth-guard";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const { status } = await req.json();
    const orderId = params.id;

    if (!status || !orderId) {
      return NextResponse.json({ error: "Order ID and new status are required." }, { status: 400 });
    }

    const validStatuses = [
      "placed",
      "preparing",
      "dispatched",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }

    const adminClient = getAdminClient();

    // 1. Try to fetch current order with status_history
    //    Guard against missing column (42703) if SQL patch hasn't been run yet
    let existingHistory: Record<string, string> = {};
    let hasStatusHistoryColumn = true;

    try {
      const { data: currentOrder, error: fetchErr } = await adminClient
        .from("orders")
        .select("status_history, created_at")
        .eq("id", orderId)
        .single();

      if (fetchErr) {
        // code 42703 = column does not exist
        if (fetchErr.code === "42703") {
          hasStatusHistoryColumn = false;
        } else {
          throw fetchErr;
        }
      } else {
        const nowIso = new Date().toISOString();
        existingHistory = (currentOrder?.status_history as Record<string, string>) || {};
        if (!existingHistory["placed"] && currentOrder?.created_at) {
          existingHistory["placed"] = currentOrder.created_at;
        }
        existingHistory[status] = nowIso;
      }
    } catch (e: any) {
      if (e.code !== "42703") throw e;
      hasStatusHistoryColumn = false;
    }

    const nowIso = new Date().toISOString();

    // 2. Build update payload — only include status_history if the column exists
    const updatePayload: Record<string, any> = {
      status,
      status_updated_at: nowIso,
    };
    if (hasStatusHistoryColumn) {
      updatePayload.status_history = existingHistory;
    }

    // 3. Perform privileged status update — triggers Supabase Realtime for customer Flutter app
    let updatedOrder = null;
    const { data: directUpdated, error: updateErr } = await adminClient
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId)
      .select()
      .single();

    if (updateErr) {
      if (updateErr.code === "42703") {
        // One of the extended columns does not exist yet; fall back to bare status update
        const { data: fallbackUpdated, error: fallbackErr } = await adminClient
          .from("orders")
          .update({ status })
          .eq("id", orderId)
          .select()
          .single();

        if (fallbackErr) throw fallbackErr;
        updatedOrder = fallbackUpdated;
      } else {
        throw updateErr;
      }
    } else {
      updatedOrder = directUpdated;
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Order status updated to ${status} and broadcasted to customer app.`,
    });
  } catch (err: any) {
    console.error("Status update error:", err);
    return NextResponse.json({ error: err.message || "Failed to update order status" }, { status: 500 });
  }
}
