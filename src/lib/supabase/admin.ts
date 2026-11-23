import { createClient } from "@supabase/supabase-js";

// STRICT CLIENT-SIDE GUARD
if (typeof window !== "undefined") {
  throw new Error(
    "CRITICAL SECURITY ERROR: The Supabase Admin Client utilizes the privileged service_role key and must NEVER be imported or executed in the client browser bundle."
  );
}

let adminClientInstance: ReturnType<typeof createClient> | null = null;

/**
 * Creates or retrieves the privileged Supabase Admin client using the server-only service_role key.
 * Used exclusively inside server actions and API route handlers to perform verified administrative writes.
 */
export function getAdminClient() {
  if (adminClientInstance) return adminClientInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hyojlcanmglupmumstii.supabase.co";
  // NOTE: Strictly no NEXT_PUBLIC_ prefix. This is read ONLY by Node.js server runtime.
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey || serviceRoleKey === "your_supabase_service_role_key_here") {
    // When service_role is not yet provided, fall back to anon key on server
    const fallbackAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
    return createClient(url, fallbackAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  adminClientInstance = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClientInstance;
}
