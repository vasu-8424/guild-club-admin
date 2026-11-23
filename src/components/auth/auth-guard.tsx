"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck } from "lucide-react";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    try {
      // Support local admin session cookie (consistent with middleware)
      if (typeof document !== "undefined" && document.cookie.includes("guildclub_admin_session")) {
        setIsAuthenticated(true);
        return;
      }

      const supabase = createClient();

      supabase.auth.getSession().then(({ data }) => {
        if (!isMounted) return;
        if (data?.session?.user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          window.location.href = "/login";
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!isMounted) return;
          if (!session?.user) {
            setIsAuthenticated(false);
            window.location.href = "/login";
          } else {
            setIsAuthenticated(true);
          }
        }
      );

      return () => {
        isMounted = false;
        authListener.subscription.unsubscribe();
      };
    } catch {
      if (isMounted) {
        setIsAuthenticated(false);
        window.location.href = "/login";
      }
    }
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin mt-1" />
          <p className="text-xs font-medium text-slate-400">Authenticating Guild Club console...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
