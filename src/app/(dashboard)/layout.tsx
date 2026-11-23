import { AdminSidebar } from "@/components/layout/sidebar";
import { AdminAuthGuard } from "@/components/auth/auth-guard";
import { MobileNavProvider } from "@/components/layout/mobile-nav-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <MobileNavProvider>
        <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
          {/* Sidebar Navigation across all 7 modules */}
          <AdminSidebar />

          {/* Main Content Viewport */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <main className="flex-1 overflow-y-auto bg-slate-950/80">
              {children}
            </main>
          </div>
        </div>
      </MobileNavProvider>
    </AdminAuthGuard>
  );
}
