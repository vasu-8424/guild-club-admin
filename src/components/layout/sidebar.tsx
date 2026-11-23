"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Layers, 
  Package, 
  ShoppingBag, 
  Image as ImageIcon, 
  IndianRupee, 
  Receipt, 
  Bell, 
  ShieldCheck, 
  LogOut, 
  ChevronRight,
  X
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { AdminRole } from "@/types/database";
import { useMobileNav } from "./mobile-nav-context";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  moduleNum?: number;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Categories", href: "/categories", icon: Layers, moduleNum: 1 },
  { label: "Products", href: "/products", icon: Package, moduleNum: 2 },
  { label: "Orders", href: "/orders", icon: ShoppingBag, moduleNum: 3 },
  { label: "Home Banners", href: "/banners", icon: ImageIcon, moduleNum: 4 },
  { label: "Pricing Sheet", href: "/pricing", icon: IndianRupee, moduleNum: 5 },
  { label: "Invoices", href: "/invoices", icon: Receipt, moduleNum: 6 },
  { label: "Notifications", href: "/notifications", icon: Bell, moduleNum: 7 },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, close } = useMobileNav();
  const [adminEmail, setAdminEmail] = useState<string>("admin@guildclub.com");
  const [adminRole, setAdminRole] = useState<AdminRole>("owner");
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.email) {
          setAdminEmail(data.user.email);
        }
      });

      fetch("/api/auth/verify")
        .then(async (res) => {
          if (res.ok) {
            const d = await res.json();
            if (d.admin?.role) setAdminRole(d.admin.role);
            if (d.admin?.email) setAdminEmail(d.admin.email);
          }
        })
        .catch(() => {});
    } catch {
      // Ignored if client not ready
    }
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    } finally {
      setIsSigningOut(false);
    }
  };

  const renderNavContent = (isMobile = false) => (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center font-bold text-slate-950 text-sm shadow-md shadow-amber-500/20">
            GC
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
              Guild Club
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                Admin
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Store Operator Portal</p>
          </div>
        </div>

        {isMobile && (
          <button
            type="button"
            onClick={close}
            aria-label="Close navigation drawer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Core Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (isMobile) close();
              }}
              className={`group flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-amber-400" : "text-slate-400 group-hover:text-slate-300"}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.moduleNum && (
                  <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                    M{item.moduleNum}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-400" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Database Connection Info & Status */}
      <div className="p-3 mx-3 mb-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px]">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Supabase Backend
          </span>
          <span className="text-[10px] font-mono text-emerald-400">Live</span>
        </div>
        <p className="text-[10px] font-mono text-slate-400 truncate">
          hyojlcanmglupmumstii
        </p>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-medium text-slate-300 shrink-0">
            {adminEmail.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">{adminEmail}</p>
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-mono capitalize">
              <ShieldCheck className="w-3 h-3" />
              {adminRole}
            </span>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          title="Sign Out"
          className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar: Stationary */}
      <aside className="hidden md:flex md:w-64 bg-slate-900 border-r border-slate-800 flex-col h-screen shrink-0 select-none">
        {renderNavContent(false)}
      </aside>

      {/* Mobile Navigation Drawer: Accessible via Hamburger button */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={close}
            aria-hidden="true"
          />

          {/* Slide-over Drawer Panel */}
          <aside className="relative w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 flex flex-col h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {renderNavContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
