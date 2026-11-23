import Link from "next/link";
import { ShieldAlert, ArrowLeft, LayoutDashboard, LogIn, Package } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl relative z-10 space-y-6">
        {/* Accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-t-2xl" />

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Title and Message */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono tracking-widest uppercase px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
            Error 404 • Route Not Found
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight pt-2">
            Page Does Not Exist
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            The administrative console route or resource you are trying to access could not be found or has been relocated.
          </p>
        </div>

        {/* Navigation Actions */}
        <div className="space-y-2.5 pt-2">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/10"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Return to Admin Dashboard</span>
          </Link>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Login</span>
            </Link>
            <Link
              href="/products"
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span>Products</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800/80 pt-4 text-[10px] text-slate-400 font-mono">
          Guild Club Store Operations Console
        </div>
      </div>
    </div>
  );
}
