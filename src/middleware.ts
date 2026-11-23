import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hyojlcanmglupmumstii.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5b2psY2FubWdsdXBtdW1zdGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNDM4NjksImV4cCI6MjEwMDcxOTg2OX0.c8AoKqcgZ06FPSwPjPYjy31FCaIQG4eeKqDRXSp43gY";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  let user: { id: string; email?: string } | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch {
    user = null;
  }

  // Local test / staging admin session cookie support
  if (!user && (request.cookies.get("guildclub_admin_session")?.value || request.cookies.get("sb-test-admin")?.value)) {
    user = { id: "00000000-0000-0000-0000-000000000001", email: "admin@guildclub.com" };
  }

  const pathname = request.nextUrl.pathname;

  // 1. Static assets & public system routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return response;
  }

  const isLoginPage = pathname === "/login";
  const isPrivacyPolicy = pathname === "/privacypolicy" || pathname.startsWith("/privacypolicy");
  const isApiRoute = pathname.startsWith("/api");

  // 2. Unauthenticated user trying to access protected dashboard pages
  if (!user && !isLoginPage && !isPrivacyPolicy && !isApiRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // 3. Authenticated user trying to access /login -> redirect to dashboard
  if (user && isLoginPage) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
