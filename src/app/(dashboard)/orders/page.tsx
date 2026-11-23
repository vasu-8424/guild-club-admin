"use client";

import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/layout/header";
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Clock, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  RefreshCw, 
  ArrowRight,
  Receipt
} from "lucide-react";
import Link from "next/link";
import { Order, OrderStatus } from "@/types/database";
import { formatCurrency, formatDate, getOrderStatusBadgeColor, getOrderStatusLabel } from "@/lib/utils";

const statusTabs: { label: string; value: string; countKey?: string }[] = [
  { label: "All Orders", value: "all" },
  { label: "Placed", value: "placed" },
  { label: "Preparing", value: "preparing" },
  { label: "Dispatched", value: "dispatched" },
  { label: "Out for Delivery", value: "out_for_delivery" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.append("status", activeTab);
      if (search) params.append("search", search);

      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleQuickStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Update locally
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      } else {
        const d = await res.json();
        alert(d.error || "Failed to advance status");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <AdminHeader
        title="Fulfillment & Order Lifecycle"
        subtitle="Manage dispatch pipeline and trigger real-time updates to customer tracking screen"
      />

      <div className="p-6 space-y-4">
        {/* Top Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {statusTabs.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search & Refresh */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search order ID or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </form>

            <button
              onClick={fetchOrders}
              disabled={loading}
              className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Order ID & Date</th>
                  <th className="py-2.5 px-4">Customer Delivery Destination</th>
                  <th className="py-2.5 px-4">Ordered Items</th>
                  <th className="py-2.5 px-4">Order Total</th>
                  <th className="py-2.5 px-4">Fulfillment Status</th>
                  <th className="py-2.5 px-4">Quick Advance Stage</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      {loading ? "Fetching orders from Supabase..." : "No orders found for selected criteria."}
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const badge = getOrderStatusBadgeColor(order.status);
                    const isUpdating = updatingId === order.id;

                    return (
                      <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* ID & Date */}
                        <td className="py-3 px-4">
                          <Link
                            href={`/orders/${order.id}`}
                            className="font-mono font-bold text-amber-400 hover:underline block"
                          >
                            #{order.id.slice(0, 8)}
                          </Link>
                          <span className="text-[10px] text-slate-400">
                            {formatDate(order.created_at)}
                          </span>
                        </td>

                        {/* Customer & Address */}
                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-semibold text-slate-200 truncate">
                            {order.customer?.full_name || (order.user_id ? `Customer #${order.user_id.slice(0, 8)}` : "Customer")}
                          </p>
                          <p 
                            className="text-[11px] text-slate-400 truncate" 
                            title={order.delivery_address_text || (order.address as any)?.full_address || "Address pending"}
                          >
                            {order.delivery_address_text || (order.address as any)?.full_address || "Address pending"}
                          </p>
                        </td>

                        {/* Items */}
                        <td className="py-3 px-4">
                          <div className="text-slate-300">
                            <span className="font-semibold">{order.items?.length || 1} item(s)</span>
                            {order.items && order.items[0] && (
                              <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                                {order.items[0].title} {order.items.length > 1 && `+ ${order.items.length - 1} more`}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Total */}
                        <td className="py-3 px-4 font-bold text-white">
                          {formatCurrency(order.total)}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {getOrderStatusLabel(order.status)}
                          </span>
                        </td>

                        {/* Quick Advance Stage Control */}
                        <td className="py-3 px-4">
                          <select
                            disabled={isUpdating}
                            value={order.status}
                            onChange={(e) =>
                              handleQuickStatusChange(order.id, e.target.value as OrderStatus)
                            }
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
                          >
                            <option value="placed">1. Placed</option>
                            <option value="preparing">2. Preparing</option>
                            <option value="dispatched">3. Dispatched</option>
                            <option value="out_for_delivery">4. Out for Delivery</option>
                            <option value="delivered">5. Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/orders/${order.id}`}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1"
                            >
                              <span>Inspect</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </div>
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
