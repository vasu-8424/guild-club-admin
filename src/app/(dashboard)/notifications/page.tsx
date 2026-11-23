"use client";

import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/layout/header";
import { 
  Bell, 
  Send, 
  Users, 
  ShoppingBag, 
  MapPin, 
  User, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  RefreshCw,
  Clock,
  ShieldAlert,
  Flame
} from "lucide-react";
import { NotificationLog } from "@/types/database";
import { formatDate } from "@/lib/utils";

export default function NotificationsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);

  // Form State
  const [title, setTitle] = useState("Weekend STEM Rotation is Live! 🚀");
  const [body, setBody] = useState(
    "Choose your next Montessori & Robotics learning kits before 6 PM for priority evening delivery."
  );
  const [segmentType, setSegmentType] = useState<"all" | "cart_abandoned" | "city" | "single_user">("all");
  const [city, setCity] = useState("Bengaluru - Indiranagar");
  const [singleUserId, setSingleUserId] = useState("");
  const [deepLink, setDeepLink] = useState("/categories");

  // Real registered customer counts and targeting data
  const [realRegisteredCount, setRealRegisteredCount] = useState(7);
  const [availableUsers, setAvailableUsers] = useState<{ id: string; email: string; name: string }[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>(["Chendurthi", "Hyderabad", "Bengaluru"]);

  // Safeguards
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [recipientCountEstimate, setRecipientCountEstimate] = useState(7);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchCustomerCounts = async () => {
    try {
      const res = await fetch("/api/notifications/dispatch");
      const data = await res.json();
      if (data.totalRegisteredUsers !== undefined) {
        setRealRegisteredCount(data.totalRegisteredUsers);
        setRecipientCountEstimate(data.totalRegisteredUsers);
        if (data.users && data.users.length > 0) {
          setAvailableUsers(data.users);
          if (!singleUserId) setSingleUserId(data.users[0].id);
        }
        if (data.cities && data.cities.length > 0) {
          setAvailableCities(data.cities);
          setCity(data.cities[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load customer counts:", err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/logs");
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);

        // Check if latest broadcast was within 5 minutes
        const lastBroadcast = data.logs.find(
          (l: NotificationLog) => l.segment_type === "all" && l.status === "sent"
        );
        if (lastBroadcast) {
          const diffSeconds = Math.floor(
            (Date.now() - new Date(lastBroadcast.created_at).getTime()) / 1000
          );
          if (diffSeconds < 300) {
            setCooldownSeconds(300 - diffSeconds);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchCustomerCounts();
  }, []);

  // Sync recipient estimate when segment type changes
  const handleSegmentChange = (type: "all" | "cart_abandoned" | "city" | "single_user") => {
    setSegmentType(type);
    if (type === "all") {
      setRecipientCountEstimate(realRegisteredCount);
    } else if (type === "cart_abandoned") {
      setRecipientCountEstimate(0);
    } else if (type === "city") {
      setRecipientCountEstimate(1);
    } else if (type === "single_user") {
      setRecipientCountEstimate(1);
    }
  };

  // Cooldown countdown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      alert("Please fill in notification title and body.");
      return;
    }

    if (segmentType === "all") {
      // Require confirmation dialog for broadcast
      setConfirmModalOpen(true);
    } else {
      executeDispatch();
    }
  };

  const executeDispatch = async () => {
    setDispatching(true);
    setNotice(null);
    try {
      const res = await fetch("/api/notifications/dispatch", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          segmentType,
          city,
          singleUserId,
          deepLink,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotice({
          type: "success",
          text: `Push notification successfully queued & dispatched via FCM to ${data.recipientCount} devices!`,
        });
        setConfirmModalOpen(false);
        if (segmentType === "all") {
          setCooldownSeconds(300); // 5-minute cooldown
        }
        fetchLogs();
      } else {
        setNotice({
          type: "error",
          text: data.error || "Failed to dispatch notification",
        });
      }
    } catch (err: any) {
      setNotice({ type: "error", text: err.message || "Dispatch failed" });
    } finally {
      setDispatching(false);
    }
  };

  const handleCancelBroadcast = async () => {
    setConfirmModalOpen(false);
    try {
      await fetch("/api/notifications/dispatch", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          segmentType: "all",
          isCancelledAttempt: true,
        }),
      });
      fetchLogs();
    } catch {
      // Ignored
    }
  };

  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  return (
    <div className="flex flex-col min-h-full">
      <AdminHeader
        title="Push Notification Dispatcher"
        subtitle="Compose and broadcast push notifications to customer segments via Firebase Cloud Messaging"
      />

      <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
        {notice && (
          <div
            className={`p-3 rounded-lg border flex items-center gap-2.5 text-xs animate-in fade-in ${
              notice.type === "success"
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/15 border-red-500/30 text-red-400"
            }`}
          >
            {notice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <p>{notice.text}</p>
          </div>
        )}

        {/* 2-Column: Left Composer + Right Mobile Lock-Screen Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Notification Composer */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notification Composer
              </h2>
              <span className="text-[10px] font-mono text-slate-400">Provider: FCM Standard</span>
            </div>

            <form onSubmit={handleInitiateSend} className="space-y-4 text-xs">
              {/* Target Segment */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Target Customer Segment *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSegmentChange("all")}
                    className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                      segmentType === "all"
                        ? "bg-amber-500/15 border-amber-500/50 text-amber-300 font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Users className="w-4 h-4 mb-1" />
                    <span>All Customers</span>
                    <span className="text-[10px] text-amber-400 font-mono mt-0.5">({realRegisteredCount} Registered)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSegmentChange("cart_abandoned")}
                    className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                      segmentType === "cart_abandoned"
                        ? "bg-amber-500/15 border-amber-500/50 text-amber-300 font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 mb-1" />
                    <span>Cart Abandoned</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">(0 Carts)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSegmentChange("city")}
                    className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                      segmentType === "city"
                        ? "bg-amber-500/15 border-amber-500/50 text-amber-300 font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <MapPin className="w-4 h-4 mb-1" />
                    <span>By Customer City</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">({availableCities.length} Cities)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSegmentChange("single_user")}
                    className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                      segmentType === "single_user"
                        ? "bg-amber-500/15 border-amber-500/50 text-amber-300 font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <User className="w-4 h-4 mb-1" />
                    <span>Single Customer</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">(Direct)</span>
                  </button>
                </div>
              </div>

              {/* Segment Parameters */}
              {segmentType === "city" && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target Customer City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {availableCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {segmentType === "single_user" && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Select Registered Customer</label>
                  {availableUsers.length > 0 ? (
                    <select
                      value={singleUserId}
                      onChange={(e) => setSingleUserId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    >
                      {availableUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={singleUserId}
                      onChange={(e) => setSingleUserId(e.target.value)}
                      placeholder="e.g. 9a07e7ab-9720-4447-b464-722364a301c4"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>
              )}

              {/* Title & Body */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Push Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Flash Toy Rotation Notice ⚡"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Message Body *</label>
                <textarea
                  rows={3}
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Compelling text explaining the promotion or order update..."
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">In-App Target Route</label>
                <input
                  type="text"
                  value={deepLink}
                  onChange={(e) => setDeepLink(e.target.value)}
                  placeholder="e.g. /categories, /cart, or /orders"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Send Button & Safeguard Notice */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  {cooldownSeconds > 0 ? (
                    <span className="text-amber-400 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      Broadcast cooldown: {formatCooldown(cooldownSeconds)} remaining
                    </span>
                  ) : (
                    <span>Ready for verified transmission</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={dispatching || (segmentType === "all" && cooldownSeconds > 0)}
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/10 flex items-center gap-2 disabled:opacity-40 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {dispatching
                      ? "Transmitting..."
                      : segmentType === "all"
                      ? "Review & Broadcast →"
                      : "Send Notification"}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Right 1 Col: Customer Mobile Lock-Screen Simulator */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  Mobile Lock-Screen Simulation
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Live Render</span>
              </div>

              {/* Phone Device Frame */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 shadow-xl space-y-3">
                {/* Clock on lock screen */}
                <div className="text-center text-slate-400 text-xs pb-1">
                  <span className="font-semibold text-slate-200 text-base">04:30 PM</span>
                  <p className="text-[10px] text-slate-500">Saturday, September 12</p>
                </div>

                {/* Simulated Push Card */}
                <div className="p-3 rounded-xl bg-slate-800/90 backdrop-blur-md border border-slate-700/60 shadow-lg space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-amber-500 flex items-center justify-center font-bold text-[9px] text-slate-950">
                        GC
                      </div>
                      <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">
                        Guild Club
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Just now</span>
                  </div>

                  <p className="text-xs font-bold text-white leading-tight">
                    {title || "Notification Title"}
                  </p>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {body || "Your message preview will appear here..."}
                  </p>
                </div>

                <div className="pt-2 text-center text-[10px] text-slate-500 font-mono">
                  Target Route: {deepLink}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Notification Dispatch Audit Log (All Attempts)
              </h3>
            </div>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Message Title & Body</th>
                  <th className="py-2.5 px-4">Segment</th>
                  <th className="py-2.5 px-4">Recipients</th>
                  <th className="py-2.5 px-4">Sent By</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      {loading ? "Loading audit logs..." : "No notification logs recorded yet."}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isSent = log.status === "sent";
                    const isCancelled = log.status === "cancelled";
                    const isFailed = log.status === "failed";

                    return (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="py-3 px-4 max-w-sm">
                          <p className="font-semibold text-slate-200">{log.title}</p>
                          <p className="text-[11px] text-slate-400 truncate">{log.body}</p>
                          {log.error_message && (
                            <p className="text-[10px] text-red-400 mt-0.5">{log.error_message}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] uppercase">
                            {log.segment_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          {log.recipient_count} devices
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {log.sent_by_email || "admin@guildclub.com"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                              isSent
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                : isCancelled
                                ? "bg-slate-800 border-slate-700 text-slate-400"
                                : "bg-red-500/10 border-red-500/30 text-red-400"
                            }`}
                          >
                            {log.status.toUpperCase()}
                          </span>
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

      {/* Broadcast Safeguard Confirmation Dialog */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-full bg-red-500/10 border border-red-500/30">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Confirm All-Customer Broadcast</h3>
                <p className="text-xs text-red-400">Irreversible live notification transmission</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Calculated Recipient Devices:</span>
                <span className="font-bold text-amber-400 font-mono text-sm">
                  {recipientCountEstimate} Customers
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
                <span className="font-semibold text-slate-200">Title:</span> {title}
              </div>
              <div className="text-[11px] text-slate-400">
                <span className="font-semibold text-slate-200">Body:</span> {body}
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              This will blast an immediate push notification to the lock screen of every registered Guild Club customer device. A 5-minute cooldown will be initiated.
            </p>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelBroadcast}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Abort / Cancel
              </button>
              <button
                type="button"
                onClick={executeDispatch}
                disabled={dispatching}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/20"
              >
                {dispatching ? "Blasting..." : "Yes, Dispatch to All Customers"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
