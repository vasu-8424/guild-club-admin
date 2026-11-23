"use client";

import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/layout/header";
import { 
  ShoppingBag, 
  IndianRupee, 
  AlertTriangle, 
  Layers, 
  TrendingUp, 
  Clock, 
  ChevronRight, 
  RefreshCw,
  Truck,
  CheckCircle2,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Order, OrderStatus } from "@/types/database";
import { formatCurrency, formatDate, getOrderStatusBadgeColor, getOrderStatusLabel } from "@/lib/utils";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    lowStockCount: 0,
    activeProductsCount: 0,
    pendingFulfillmentCount: 0,
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // 1. Fetch Orders
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      const fetchedOrders: Order[] = ordersData || [];
      setOrders(fetchedOrders);

      // Compute order KPIs
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      let todayOrders = 0;
      let todayRev = 0;
      let pendingCount = 0;

      fetchedOrders.forEach((o) => {
        if (o.created_at >= todayStart) {
          todayOrders += 1;
          todayRev += Number(o.total) || 0;
        }
        if (o.status !== "delivered" && o.status !== "cancelled") {
          pendingCount += 1;
        }
      });

      // 2. Fetch Products for stock alerts
      const { data: productsData } = await supabase
        .from("products")
        .select("id, stock_quantity");

      let lowStock = 0;
      let totalActive = productsData ? productsData.length : 0;

      if (productsData) {
        productsData.forEach((p) => {
          if ((p.stock_quantity ?? 0) <= 10) {
            lowStock += 1;
          }
        });
      }

      setStats({
        todayOrders,
        todayRevenue: todayRev,
        lowStockCount: lowStock,
        activeProductsCount: totalActive,
        pendingFulfillmentCount: pendingCount,
      });
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="flex flex-col min-h-full">
      <AdminHeader
        title="Store Operations Dashboard"
        subtitle="Realtime monitoring of orders, inventory alerts & store metrics"
      />

      <div className="p-6 space-y-6">
        {/* Top KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today's Orders */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Today&apos;s Orders</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">
                {stats.todayOrders}
              </span>
              <span className="text-[11px] text-slate-400">orders logged</span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Pending Dispatch:</span>
              <span className="font-semibold text-amber-400">{stats.pendingFulfillmentCount}</span>
            </div>
          </div>

          {/* Today's Revenue */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Today&apos;s Revenue</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">
                {formatCurrency(stats.todayRevenue)}
              </span>
              <span className="text-[11px] text-emerald-400 flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> Gross
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Currency:</span>
              <span className="font-mono text-slate-300">INR (₹)</span>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Low Stock Alerts</span>
              <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">
                {stats.lowStockCount}
              </span>
              <span className="text-[11px] text-red-400 font-medium">items ≤ 10 units</span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <Link href="/products?filter=low_stock" className="text-amber-400 hover:underline flex items-center gap-1">
                View in Inventory <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Active Catalog */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Active Products</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">
                {stats.activeProductsCount}
              </span>
              <span className="text-[11px] text-slate-400">SKUs in catalog</span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Mobile Sync:</span>
              <span className="text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
              </span>
            </div>
          </div>
        </div>

        {/* Quick Operational Shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/orders"
            className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-slate-200">Fulfill Orders</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
          </Link>
          <Link
            href="/products/new"
            className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-slate-200">Add New Product</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
          </Link>
          <Link
            href="/pricing"
            className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-2.5">
              <IndianRupee className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-slate-200">Bulk Price Adjust</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
          </Link>
          <Link
            href="/banners"
            className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-slate-200">Update Hero Carousel</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
          </Link>
        </div>

        {/* Live Orders Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Recent Orders Stream
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <Link
                href="/orders"
                className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                All Orders <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Order ID</th>
                  <th className="py-2.5 px-4">Customer / Location</th>
                  <th className="py-2.5 px-4">Items</th>
                  <th className="py-2.5 px-4">Total</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Created</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      {loading ? "Loading orders from Supabase..." : "No orders found in database."}
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const badge = getOrderStatusBadgeColor(order.status);
                    return (
                      <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-amber-400">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-200">
                            {order.delivery_partner_name ? "Customer Delivery" : "Guild Club Customer"}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate max-w-xs">
                            {order.delivery_address_text || "Bengaluru Fulfillment"}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {Array.isArray(order.items) ? `${order.items.length} item(s)` : "1 item"}
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {getOrderStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/orders/${order.id}`}
                            className="text-amber-400 hover:text-amber-300 font-medium text-[11px] hover:underline"
                          >
                            Inspect & Track
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
