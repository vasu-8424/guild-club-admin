"use client";

import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/layout/header";
import { 
  Receipt, 
  Download, 
  Send, 
  Search, 
  CheckCircle2, 
  FileText, 
  RefreshCw,
  Building2,
  Percent,
  Calendar,
  IndianRupee,
  ExternalLink
} from "lucide-react";
import { Order } from "@/types/database";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateInvoicePDF, InvoiceData } from "@/lib/pdf/invoice-generator";

export default function InvoicesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Failed to fetch invoice orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getInvoiceNumber = (order: Order, index: number): string => {
    const cleanId = order.id.replace(/-/g, "").slice(0, 5).toUpperCase();
    return `GC/2026-27/INV-${cleanId}`;
  };

  const getPlaceOfSupply = (order: Order): string => {
    const rawAddr = order.address as any;
    const addr = (order.delivery_address_text || rawAddr?.full_address || rawAddr?.state || "").toLowerCase();
    if (addr.includes("andhra") || addr.includes(" a.p") || addr.includes(" ap") || addr.includes("533") || addr.includes("chendurthi")) {
      return "Andhra Pradesh (37)";
    }
    if (addr.includes("telangana") || addr.includes("hyderabad") || addr.includes("500")) {
      return "Telangana (36)";
    }
    if (addr.includes("karnataka") || addr.includes("bengaluru") || addr.includes("560")) {
      return "Karnataka (29)";
    }
    if (addr.includes("tamil") || addr.includes("chennai")) {
      return "Tamil Nadu (33)";
    }
    if (addr.includes("maharashtra") || addr.includes("mumbai")) {
      return "Maharashtra (27)";
    }
    return rawAddr?.state ? `${rawAddr.state}` : "Andhra Pradesh (37)";
  };

  const handleDownloadPDF = (order: Order, index: number) => {
    const invNum = getInvoiceNumber(order, index);
    const placeOfSupply = getPlaceOfSupply(order);

    const invoiceData: InvoiceData = {
      invoiceNumber: invNum,
      invoiceDate: formatDate(order.created_at),
      order: order,
      companyName: "TOY VISE / GUILD CLUB",
      companyAddress: order.origin_location || "Essen Marvella apartments, A block, 410, Suchitra Rd, Sriram Nagar, Jeedimetla, Hyderabad, Telangana 500055 (Landmark: Post Office)",
      companyGstin: "36AABCG1234F1Z5",
      companyPan: "AABCG1234F",
      companyStateCode: "36 (Telangana)",
      customerName: order.customer?.full_name || (order.user_id ? `Customer #${order.user_id.slice(0, 8)}` : "Customer"),
      customerEmail: order.customer?.email || "N/A",
      customerPhone: order.customer?.phone_number || "N/A",
      customerAddress: order.delivery_address_text || (order.address as any)?.full_address || "Customer Delivery Address",
      placeOfSupply: placeOfSupply,
    };

    const doc = generateInvoicePDF(invoiceData);
    doc.save(`${invNum.replace(/\//g, "-")}.pdf`);
  };

  const handleResendInvoice = async (order: Order, index: number) => {
    setResendingId(order.id);
    const invNum = getInvoiceNumber(order, index);
    const recipientEmail = order.customer?.email || "customer@guildclub.com";

    try {
      const res = await fetch("/api/invoices/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          email: recipientEmail,
          invoiceNumber: invNum,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotice(data.message);
        setTimeout(() => setNotice(null), 5000);
      } else {
        alert(data.error || "Failed to resend invoice");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setResendingId(null);
    }
  };

  const filteredOrders = orders.filter((o) =>
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    (o.delivery_address_text && o.delivery_address_text.toLowerCase().includes(search.toLowerCase()))
  );

  // Compute summary tax metrics using actual 5% GST (toys category rate)
  const totalRevenue = orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  const totalGst = orders.reduce((acc, o) => acc + (Number(o.gst_amount) || Math.round((Number(o.subtotal || o.total) * 0.05) * 100) / 100), 0);
  const totalDeliveryFee = orders.reduce((acc, o) => acc + (Number(o.delivery_fee) || 0), 0);
  const totalDiscount = orders.reduce((acc, o) => acc + (Number(o.discount_amount) || 0), 0);
  const totalTaxable = Math.round((totalRevenue - totalGst) * 100) / 100;
  const totalCgst = Math.round((totalGst / 2) * 100) / 100;

  return (
    <div className="flex flex-col min-h-full">
      <AdminHeader
        title="Tax Invoice & Legal GST Manager"
        subtitle="Generate, download and audit itemized GST invoices under Section 31 of CGST Act"
      />

      <div className="p-6 space-y-6">
        {/* KPI & Legal Summary Header */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Invoiced Gross</span>
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {formatCurrency(totalRevenue)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Across {orders.length} order receipts
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Taxable Value (Excl. GST)</span>
              <Receipt className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {formatCurrency(totalTaxable)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Base invoice value before taxes
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>GST Breakdown (5% Toys Rate)</span>
              <Percent className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-400 mt-1">
              {formatCurrency(totalGst)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              CGST: {formatCurrency(totalCgst)} | SGST: {formatCurrency(totalCgst)}
            </p>
          </div>
        </div>

        {notice && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-xs text-emerald-400 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <p>{notice}</p>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <div className="relative w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice number or order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={fetchOrders}
            disabled={loading}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Invoices Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Invoice Number &amp; Date</th>
                  <th className="py-2.5 px-4">Order Ref</th>
                  <th className="py-2.5 px-4">Customer &amp; Location</th>
                  <th className="py-2.5 px-4">Subtotal</th>
                  <th className="py-2.5 px-4">Discount</th>
                  <th className="py-2.5 px-4">Delivery</th>
                  <th className="py-2.5 px-4">GST 5% (CGST+SGST)</th>
                  <th className="py-2.5 px-4">Grand Total</th>
                  <th className="py-2.5 px-4">Payment</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      {loading ? "Loading invoices from Supabase..." : "No invoices found."}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order, idx) => {
                    const invNum = getInvoiceNumber(order, idx);
                    const isResending = resendingId === order.id;

                    return (
                      <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-mono font-bold text-amber-400">{invNum}</p>
                          <span className="text-[10px] text-slate-400">
                            {formatDate(order.created_at)}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-300">
                          #{order.id.slice(0, 8)}
                        </td>

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

                        {/* Subtotal (pre-GST) */}
                        <td className="py-3 px-4 font-medium text-slate-300">
                          {formatCurrency(Number(order.subtotal) || 0)}
                        </td>

                        {/* Discount */}
                        <td className="py-3 px-4 text-emerald-400 font-medium">
                          {order.discount_amount && Number(order.discount_amount) > 0
                            ? `- ${formatCurrency(Number(order.discount_amount))}`
                            : <span className="text-slate-600">—</span>}
                        </td>

                        {/* Delivery Fee */}
                        <td className="py-3 px-4 text-slate-300">
                          {order.delivery_fee && Number(order.delivery_fee) > 0
                            ? formatCurrency(Number(order.delivery_fee))
                            : <span className="text-emerald-400 text-[11px] font-semibold">FREE</span>}
                        </td>

                        {/* GST 5% CGST + SGST */}
                        {(() => {
                          const gst = order.gst_amount != null
                            ? Number(order.gst_amount)
                            : Math.round(Number(order.subtotal || 0) * 0.05 * 100) / 100;
                          const half = Math.round((gst / 2) * 100) / 100;
                          return (
                            <td className="py-3 px-4 text-slate-400">
                              {formatCurrency(gst)}{" "}
                              <span className="text-[10px] text-slate-500 font-mono">(2.5% + 2.5%)</span>
                            </td>
                          );
                        })()}

                        {/* Grand Total */}
                        <td className="py-3 px-4 font-bold text-white">
                          {formatCurrency(Number(order.total))}
                        </td>

                        {/* Payment Method */}
                        <td className="py-3 px-4 text-[11px] text-slate-300">
                          {order.payment_method || (order.razorpay_payment_id ? "Razorpay" : "COD")}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDownloadPDF(order, idx)}
                              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] inline-flex items-center gap-1 shadow-sm transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download PDF</span>
                            </button>
                            <button
                              onClick={() => handleResendInvoice(order, idx)}
                              disabled={isResending}
                              title="Resend to Customer Email"
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                            >
                              <Send className={`w-3.5 h-3.5 ${isResending ? "animate-pulse" : ""}`} />
                            </button>
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
