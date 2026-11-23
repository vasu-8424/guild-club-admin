import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/supabase/auth-guard";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const id = searchParams.get("id");

    const adminClient = getAdminClient();

    if (id) {
      const { data: order, error } = await adminClient
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Enhance order with customer details & address if available
      if (order) {
        // 1. Resolve address if address_id exists or embedded address is JSON string
        if (typeof order.address === "string") {
          try {
            order.address = JSON.parse(order.address);
          } catch (_) {}
        }

        if (order.address_id && (!order.address || Object.keys(order.address).length === 0)) {
          try {
            const { data: addr } = await adminClient
              .from("addresses")
              .select("*")
              .eq("id", order.address_id)
              .maybeSingle();
            if (addr) {
              order.address = addr;
              if (!order.delivery_address_text) {
                order.delivery_address_text = addr.full_address;
              }
              if (!order.destination_lat && addr.latitude) {
                order.destination_lat = addr.latitude;
                order.destination_lng = addr.longitude;
              }
            }
          } catch (_) {}
        }

        // 2. Resolve customer info from profiles or auth users
        if (order.user_id && !order.customer) {
          try {
            const { data: profile } = await adminClient
              .from("profiles")
              .select("*")
              .eq("id", order.user_id)
              .maybeSingle();

            if (profile) {
              order.customer = {
                id: order.user_id,
                full_name: profile.full_name || profile.name || profile.username || "Customer",
                email: profile.email || "",
                phone_number: profile.phone || profile.phone_number || "",
              };
            } else {
              const { data: authUser } = await adminClient.auth.admin.getUserById(order.user_id);
              if (authUser?.user) {
                const u = authUser.user;
                order.customer = {
                  id: u.id,
                  full_name:
                    (u.user_metadata?.full_name as string) ||
                    (u.user_metadata?.name as string) ||
                    u.email?.split("@")[0] ||
                    "Customer",
                  email: u.email || "",
                  phone_number: (u.phone as string) || (u.user_metadata?.phone as string) || "",
                };
              }
            }
          } catch (_) {}
        }
      }

      return NextResponse.json({ order });
    }

    let query = adminClient
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(
        `id.ilike.%${search}%,delivery_address_text.ilike.%${search}%,razorpay_payment_id.ilike.%${search}%`
      );
    }

    const { data: rawOrders, error } = await query;
    if (error) throw error;

    const orders = rawOrders || [];

    // Batch resolve addresses and customers for orders table
    if (orders.length > 0) {
      // 1. Gather all address IDs needing resolution
      const addressIds = Array.from(
        new Set(
          orders
            .map((o) => o.address_id)
            .filter((id): id is string => Boolean(id))
        )
      );

      const addressMap = new Map<string, any>();
      if (addressIds.length > 0) {
        try {
          const { data: addrs } = await adminClient
            .from("addresses")
            .select("*")
            .in("id", addressIds);
          (addrs || []).forEach((a) => addressMap.set(a.id, a));
        } catch (_) {}
      }

      // 2. Gather all user IDs needing resolution
      const userIds = Array.from(
        new Set(
          orders
            .map((o) => o.user_id)
            .filter((id): id is string => Boolean(id))
        )
      );

      const userMap = new Map<string, any>();
      if (userIds.length > 0) {
        try {
          const { data: profiles } = await adminClient
            .from("profiles")
            .select("*")
            .in("id", userIds);
          (profiles || []).forEach((p) => userMap.set(p.id, p));

          // For any user not in profiles, try auth users
          const missingUserIds = userIds.filter((uid) => !userMap.has(uid));
          await Promise.all(
            missingUserIds.map(async (uid) => {
              try {
                const { data: authUser } = await adminClient.auth.admin.getUserById(uid);
                if (authUser?.user) {
                  const u = authUser.user;
                  userMap.set(uid, {
                    full_name:
                      (u.user_metadata?.full_name as string) ||
                      (u.user_metadata?.name as string) ||
                      u.email?.split("@")[0] ||
                      "Customer",
                    email: u.email || "",
                    phone: (u.phone as string) || (u.user_metadata?.phone as string) || "",
                  });
                }
              } catch (_) {}
            })
          );
        } catch (_) {}
      }

      // 3. Attach address and customer to each order
      for (const order of orders) {
        if (typeof order.address === "string") {
          try {
            order.address = JSON.parse(order.address);
          } catch (_) {}
        }

        if (order.address_id && addressMap.has(order.address_id)) {
          const addr = addressMap.get(order.address_id);
          order.address = order.address && Object.keys(order.address).length > 0 ? order.address : addr;
          if (!order.delivery_address_text && addr.full_address) {
            order.delivery_address_text = addr.full_address;
          }
          if (!order.destination_lat && addr.latitude) {
            order.destination_lat = addr.latitude;
            order.destination_lng = addr.longitude;
          }
        }

        if (order.user_id && userMap.has(order.user_id)) {
          const u = userMap.get(order.user_id);
          order.customer = {
            id: order.user_id,
            full_name: u.full_name || u.name || u.username || "Customer",
            email: u.email || "",
            phone_number: u.phone || u.phone_number || "",
          };
        }
      }
    }

    return NextResponse.json({ orders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
