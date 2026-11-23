"use client";

import { useState, useEffect } from "react";
import { Search, RefreshCw, Bell, Plus, Shield, Menu } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMobileNav } from "./mobile-nav-context";

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  actionButton?: {
    label: string;
    href: string;
    icon?: React.ElementType;
  };
}

export function AdminHeader({ title, subtitle, actionButton }: AdminHeaderProps) {
  const router = useRouter();
  const { toggle, open } = useMobileNav();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    // Route to orders or products with query
    router.push(`/orders?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="h-16 px-4 sm:px-6 border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm flex items-center justify-between gap-4 shrink-0">
      {/* Page Title & Mobile Menu Trigger */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          aria-label="Open Navigation Menu"
          onClick={open}
          className="md:hidden p-2 -ml-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
        >
          <Menu className="w-5 h-5 text-amber-400" />
        </button>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-100 truncate">{title || "Administration Console"}</h2>
          {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="hidden sm:block flex-1 max-w-md mx-4">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search order ID, product name, or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
          />
        </form>
      </div>

      {/* Right Side Tools */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex flex-col items-end text-[11px] font-mono text-slate-400 border-r border-slate-800 pr-3">
          <span className="text-slate-200 font-semibold">{currentTime}</span>
          <span className="text-[10px] text-slate-400">IST (UTC+5:30)</span>
        </div>

        {actionButton && (
          <Link
            href={actionButton.href}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold shadow-sm transition-colors"
          >
            {actionButton.icon ? (
              <actionButton.icon className="w-3.5 h-3.5" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>{actionButton.label}</span>
          </Link>
        )}
      </div>
    </header>
  );
}
