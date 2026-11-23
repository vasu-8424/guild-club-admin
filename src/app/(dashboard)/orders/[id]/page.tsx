"use client";

import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/layout/header";
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  User, 
  Package, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  Receipt,
  ExternalLink,
  Navigation,
  Copy,
  Check,
  Building2,
  Mail,
  Store
} from "lucide-react";
import Link from "next/link";
import { Order, OrderStatus } from "@/types/database";
import { formatCurrency, formatDate, getOrderStatusBadgeColor, getOrderStatusLabel } from "@/lib/utils";

const STAGES: { status: OrderStatus; label: string; description: string }[] = [
  { status: "placed", label: "Order Placed", description: "Payment confirmed / Order created" },
  { status: "preparing", label: "Preparing & Packed", description: "Items picked and packed at Store Hub" },
  { status: "dispatched", label: "Dispatched from Hub", description: "Handed over to delivery logistics" },
  { status: "out_for_delivery", label: "Out for Delivery", description: "Courier is on route to customer address" },
  { status: "delivered", label: "Delivered", description: "Delivered safely to customer" },
];

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedShopAddress, setCopiedShopAddress] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?id=${params.id}`);
      const data = await res.json();
      if (data.order) {
        setOrder(data.order);
      }
    } catch (err) {
      console.error("Failed to load order:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!order) return;
    setUpdating(true);
    setSuccessNotice(null);

    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (res.ok) {
        setOrder(data.order);
        setSuccessNotice(`Order status advanced to "${getOrderStatusLabel(newStatus)}" — synced to customer live tracking!`);
        setTimeout(() => setSuccessNotice(null), 5000);
      } else {
        alert(data.error || "Failed to update order status");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCopy = (text: string, isShop: boolean = false) => {
    navigator.clipboard.writeText(text);
    if (isShop) {
      setCopiedShopAddress(true);
      setTimeout(() => setCopiedShopAddress(false), 2000);
    } else {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Loading order details from Supabase...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center text-xs text-red-400">
        Order not found in database.
      </div>
    );
  }

  const currentStageIndex = STAGES.findIndex((s) => s.status === order.status);
  const isCancelled = order.status === "cancelled";
  const badge = getOrderStatusBadgeColor(order.status);
  const history = order.status_history || {};

  // Extract and normalize User Address Details
  const rawAddr = order.address as any;
  const userFullAddress = 
    rawAddr?.full_address || 
    rawAddr?.fullAddress || 
    order.delivery_address_text || 
    "Customer Delivery Address";
  
  const userAddressLabel = rawAddr?.label || "Delivery Address";
  const userCity = rawAddr?.city || "";
  const userState = rawAddr?.state || "";
  const userPostalCode = rawAddr?.postal_code || rawAddr?.postalCode || "";
  const userLat = order.destination_lat || rawAddr?.latitude;
  const userLng = order.destination_lng || rawAddr?.longitude;

  // Shop / Hub Address Details
  const shopAddress = 
    order.origin_location || 
    "Essen Marvella apartments, A block, 410, Suchitra Rd, Sriram Nagar, Jeedimetla, Hyderabad, Telangana 500055 (Landmark: Post Office)";
  const shopLat = order.origin_lat || 17.5168;
  const shopLng = order.origin_lng || 78.4735;

  // Google Maps URLs
  const customerMapsUrl = (userLat && userLng)
    ? `https://www.google.com/maps/search/?api=1&query=${userLat},${userLng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(userFullAddress)}`;

  const navigationDirectionsUrl = (userLat && userLng)
    ? `https://www.google.com/maps/dir/?api=1&origin=${shopLat},${shopLng}&destination=${userLat},${userLng}`
    : `https://www.google.com/maps/dir/?api=1&origin=${shopLat},${shopLng}&destination=${encodeURIComponent(userFullAddress)}`;

  const shopMapsUrl = `https://www.google.com/maps/search/?api=1&query=${shopLat},${shopLng}`;

  return (
    <div className="flex flex-col min-h-full">
      <AdminHeader
        title={`Order #${order.id.slice(0, 8)}`}
        subtitle={`Placed on ${formatDate(order.created_at)}`}
        actionButton={{
          label: "View Invoice",
          href: `/invoices?order_id=${order.id}`,
          icon: Receipt,
        }}
      />

      <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Breadcrumb & Quick Info Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <Link
              href="/orders"
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white font-mono">
                  Order ID: {order.id}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                  {getOrderStatusLabel(order.status)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Last status change: {formatDate(order.status_updated_at || order.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/invoices?order_id=${order.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              <span>Generate / View PDF Invoice</span>
            </Link>
          </div>
        </div>

        {successNotice && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-lg flex items-center gap-2.5 text-xs text-emerald-400 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <p>{successNotice}</p>
          </div>
        )}

        {/* Realtime Customer Tracking Stepper */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Live Fulfillment Progress (Realtime App Sync)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Customer App Realtime
            </span>
          </div>

          {/* Stepper Display */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
            {STAGES.map((stage, idx) => {
              const isPastOrCurrent = !isCancelled && idx <= currentStageIndex;
              const isCurrent = !isCancelled && idx === currentStageIndex;
              const timestamp = history[stage.status];

              return (
                <div
                  key={stage.status}
                  className={`p-3 rounded-lg border transition-all ${
                    isCurrent
                      ? "bg-amber-500/10 border-amber-500/40 shadow-sm"
                      : isPastOrCurrent
                      ? "bg-slate-950/60 border-slate-800 text-slate-300"
                      : "bg-slate-950/20 border-slate-800/40 text-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isCurrent
                          ? "bg-amber-500 text-slate-950"
                          : isPastOrCurrent
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    {timestamp && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatDate(timestamp)}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-semibold ${isCurrent ? "text-amber-400" : "text-slate-200"}`}>
                    {stage.label}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                    {stage.description}
                  </p>

                  {/* Advance Button */}
                  {!isCancelled && idx === currentStageIndex + 1 && (
                    <button
                      onClick={() => handleUpdateStatus(stage.status)}
                      disabled={updating}
                      className="mt-2.5 w-full py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold shadow-sm transition-colors"
                    >
                      Advance to this Stage →
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Override Stage Controls */}
          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400">Manual Stage Override:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {STAGES.map((stage) => (
                <button
                  key={stage.status}
                  onClick={() => handleUpdateStatus(stage.status)}
                  disabled={updating || order.status === stage.status}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                    order.status === stage.status
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {stage.label}
                </button>
              ))}
              <button
                onClick={() => handleUpdateStatus("cancelled")}
                disabled={updating || order.status === "cancelled"}
                className="px-2.5 py-1 rounded text-[11px] font-medium border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Left (Order Items & Pricing) + Right (Addresses & Logistics) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Ordered Products Table & Complete Pricing Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  Ordered Items ({order.items?.length || 0})
                </h3>
                <span className="text-xs font-semibold text-white">
                  Total: {formatCurrency(order.total)}
                </span>
              </div>

              <div className="divide-y divide-slate-800/60 text-xs">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-100 truncate">{item.title}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="font-mono">Product ID: #{item.product_id?.slice(0, 8)}</span>
                          {item.color && (
                            <>
                              <span>•</span>
                              <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">
                                Variant: {item.color}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-white">
                        {formatCurrency(item.price * item.qty)}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatCurrency(item.price)} × {item.qty}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comprehensive Financial Pricing Breakdown */}
              <div className="p-4 bg-slate-950/70 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Items Subtotal</span>
                  <span className="font-medium">{formatCurrency(order.subtotal || order.total)}</span>
                </div>

                {(order.discount_amount && order.discount_amount > 0) ? (
                  <div className="flex items-center justify-between text-emerald-400">
                    <span>Discount / Coupon Applied</span>
                    <span>- {formatCurrency(order.discount_amount)}</span>
                  </div>
                ) : null}

                <div className="flex items-center justify-between text-slate-300">
                  <span>Delivery & Shipping Fee</span>
                  <span className={order.delivery_fee && order.delivery_fee > 0 ? "text-slate-200" : "text-emerald-400 font-medium"}>
                    {order.delivery_fee && order.delivery_fee > 0 ? formatCurrency(order.delivery_fee) : "Free Delivery"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span>GST (Included 5% standard)</span>
                  <span className="text-slate-200">
                    {order.gst_amount && order.gst_amount > 0 ? formatCurrency(order.gst_amount) : "Included"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400 pt-1">
                  <span>Payment Method</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px]">
                    {order.payment_method || (order.razorpay_payment_id ? "Razorpay UPI / Card" : "Online Payment")}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm font-bold text-white pt-2.5 border-t border-slate-800">
                  <span>Grand Total Paid</span>
                  <span className="text-amber-400 text-base">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Original User Address & Shop Address */}
          <div className="space-y-6">
            {/* 1. CUSTOMER DELIVERY ADDRESS CARD (PROMINENT) */}
            <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-5 space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />

              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Customer Delivery Address
                    </h3>
                    <span className="text-[10px] text-amber-400 font-medium">
                      Destination / Recipient
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {userAddressLabel.toUpperCase()}
                </span>
              </div>

              {/* Customer Contact Details */}
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-slate-200 font-semibold">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{order.customer?.full_name || `Customer (ID: ${order.user_id.slice(0, 8)})`}</span>
                </div>
                {order.customer?.phone_number && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <a href={`tel:${order.customer.phone_number}`} className="hover:underline font-mono text-[11px]">
                      {order.customer.phone_number}
                    </a>
                  </div>
                )}
                {order.customer?.email && (
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    <a href={`mailto:${order.customer.email}`} className="hover:underline">
                      {order.customer.email}
                    </a>
                  </div>
                )}
              </div>

              {/* Full Address Text */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Delivery Destination:
                </span>
                <p className="text-slate-100 text-xs leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800 font-medium select-all">
                  {userFullAddress}
                </p>

                {/* City / State / Pincode Tags */}
                {(userCity || userState || userPostalCode) && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {userCity && (
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded">
                        City: {userCity}
                      </span>
                    )}
                    {userState && (
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded">
                        State: {userState}
                      </span>
                    )}
                    {userPostalCode && (
                      <span className="px-2 py-0.5 bg-slate-800 text-amber-300 text-[10px] rounded font-mono">
                        PIN: {userPostalCode}
                      </span>
                    )}
                  </div>
                )}

                {/* GPS Coordinates */}
                <div className="text-[10px] font-mono text-slate-400 pt-1 flex items-center justify-between">
                  <span>GPS Coords:</span>
                  <span className="text-slate-300">
                    {userLat && userLng ? `${userLat.toFixed(5)}, ${userLng.toFixed(5)}` : "Estimated via City"}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Open in Google Maps & Navigation */}
              <div className="pt-2 space-y-2">
                <a
                  href={customerMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Open Customer Location in Google Maps</span>
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </a>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={navigationDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
                  >
                    <Navigation className="w-3 h-3 text-emerald-400" />
                    <span>Get Directions</span>
                  </a>

                  <button
                    onClick={() => handleCopy(userFullAddress, false)}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
                  >
                    {copiedAddress ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Copy Address</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 2. MY SHOP / STORE DISPATCH HUB ADDRESS CARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      My Shop / Dispatch Origin
                    </h3>
                    <span className="text-[10px] text-purple-400 font-medium">
                      Toy Vise Fulfillment Hub
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  STORE ORIGIN
                </span>
              </div>

              {/* Shop Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Building2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Toy Vise Central Store & Logistics Hub</span>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800 font-mono text-[11px]">
                  {shopAddress}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1 text-slate-400">
                  <div>
                    <span>Lat: </span>
                    <span className="text-slate-300">{shopLat}</span>
                  </div>
                  <div>
                    <span>Lng: </span>
                    <span className="text-slate-300">{shopLng}</span>
                  </div>
                </div>
              </div>

              {/* Shop Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={shopMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-[11px] font-medium transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>View on Maps</span>
                </a>

                <button
                  onClick={() => handleCopy(shopAddress, true)}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
                >
                  {copiedShopAddress ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>Copy Address</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 3. LOGISTICS & DISPATCH PARTNER */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                Dispatch & Delivery Logistics
              </h3>
              <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <p className="text-slate-200 font-medium">
                  {order.delivery_partner_name || "Alex (Guild Club Logistics)"}
                </p>
                <p className="text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <a href={`tel:${order.delivery_partner_phone || "+919876543210"}`} className="hover:underline">
                    {order.delivery_partner_phone || "+91 98765 43210"}
                  </a>
                </p>
              </div>
            </div>

            {/* 4. PAYMENT & GATEWAY REFERENCE */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                Payment Information
              </h3>
              <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-500 block">Payment Method</span>
                  <span className="text-slate-200">
                    {order.payment_method || (order.razorpay_payment_id ? "Razorpay Gateway" : "Online Payment")}
                  </span>
                </div>
                {order.razorpay_payment_id && (
                  <div>
                    <span className="text-[10px] text-slate-500 block">Razorpay Payment ID</span>
                    <span className="text-emerald-400">{order.razorpay_payment_id}</span>
                  </div>
                )}
                {order.razorpay_order_id && (
                  <div>
                    <span className="text-[10px] text-slate-500 block">Razorpay Order ID</span>
                    <span className="text-slate-400">{order.razorpay_order_id}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
