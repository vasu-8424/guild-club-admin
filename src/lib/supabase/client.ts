import { createBrowserClient } from "@supabase/ssr";

let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (clientInstance) return clientInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hyojlcanmglupmumstii.supabase.co";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5b2psY2FubWdsdXBtdW1zdGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNDM4NjksImV4cCI6MjEwMDcxOTg2OX0.c8AoKqcgZ06FPSwPjPYjy31FCaIQG4eeKqDRXSp43gY";

  clientInstance = createBrowserClient(url, anonKey);
  return clientInstance;
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      return {
        Authorization: `Bearer ${data.session.access_token}`,
      };
    }
  } catch {
    // Session not found or error
  }
  return {};
}

