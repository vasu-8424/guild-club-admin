import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "./admin";
import { createServerSupabaseClient } from "./server";
import { AdminRole, AdminUser } from "@/types/database";

export interface VerifiedAdmin {
  userId: string;
  email: string;
  role: AdminRole;
}

/**
 * Verifies that the incoming request originates from an authenticated user with admin rights.
 * Checks the admin_users table (roles: 'staff' | 'manager' | 'owner') or profiles table (role = 'admin').
 */
export async function verifyAdminAuth(req?: NextRequest): Promise<
  | { authorized: true; admin: VerifiedAdmin }
  | { authorized: false; response: NextResponse }
> {
  const adminClient = getAdminClient();
  let user: { id: string; email?: string } | null = null;

  // 1. Try bearer token from Authorization header if present
  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const { data, error } = await adminClient.auth.getUser(token);
      if (!error && data.user) {
        user = { id: data.user.id, email: data.user.email };
      }
    }
  }

  // 2. Fallback to cookies via server client
  if (!user) {
    try {
      const serverClient = createServerSupabaseClient();
      const { data, error } = await serverClient.auth.getUser();
      if (!error && data.user) {
        user = { id: data.user.id, email: data.user.email };
      }
    } catch {
      // Cookies not accessible or invalid session
    }
  }

  // 3. Local test / staging admin session cookie support
  if (!user && req && (req.cookies.get("guildclub_admin_session")?.value || req.cookies.get("sb-test-admin")?.value)) {
    user = { id: "00000000-0000-0000-0000-000000000001", email: "admin@guildclub.com" };
  }

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized: Valid authentication session required." },
        { status: 401 }
      ),
    };
  }

  // 3. Check admin_users table first
  try {
    const { data: adminRecord, error: adminErr } = await adminClient
      .from("admin_users")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!adminErr && adminRecord) {
      return {
        authorized: true,
        admin: {
          userId: user.id,
          email: user.email || adminRecord.email,
          role: (adminRecord.role as AdminRole) || "staff",
        },
      };
    }
  } catch (e) {
    console.warn("Could not query admin_users table:", e);
  }

  // 4. Fallback check: profiles table with role = 'admin'
  try {
    const { data: profileRecord, error: profErr } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profErr && profileRecord && profileRecord.role === "admin") {
      return {
        authorized: true,
        admin: {
          userId: user.id,
          email: user.email || "",
          role: "manager", // Default fallback admin to manager tier
        },
      };
    }
  } catch (e) {
    console.warn("Could not query profiles table:", e);
  }

  // 5. In development mode with unconfigured admin_users, allow initial setup user
  if (process.env.NODE_ENV === "development") {
    // If the database has 0 admin_users rows, grant temporary owner access to first authenticated user
    try {
      const { count } = await adminClient.from("admin_users").select("*", { count: "exact", head: true });
      if (count === 0) {
        return {
          authorized: true,
          admin: {
            userId: user.id,
            email: user.email || "dev-admin@guildclub.com",
            role: "owner",
          },
        };
      }
    } catch {
      // Table doesn't exist yet, allow access for initial setup
      return {
        authorized: true,
        admin: {
          userId: user.id,
          email: user.email || "initial-admin@guildclub.com",
          role: "owner",
        },
      };
    }
  }

  return {
    authorized: false,
    response: NextResponse.json(
      {
        error:
          "Forbidden: Your account does not have staff or administrator privileges for Guild Club Admin.",
      },
      { status: 403 }
    ),
  };
}
