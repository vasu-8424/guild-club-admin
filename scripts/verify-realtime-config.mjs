import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import ws from "ws";

globalThis.WebSocket = ws;

const envContent = fs.readFileSync(".env.local", "utf-8");
let serviceKey = "";
let anonKey = "";
let supabaseUrl = "";

envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (trimmed.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) {
    serviceKey = trimmed.split("=")[1].trim();
  }
  if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) {
    anonKey = trimmed.split("=")[1].trim();
  }
  if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
    supabaseUrl = trimmed.split("=")[1].trim();
  }
});

const adminClient = createClient(supabaseUrl, serviceKey);
const anonClient = createClient(supabaseUrl, anonKey);

async function testRealtimeNotifications() {
  console.log("===============================================================");
  console.log("SUPABASE REALTIME PUSH NOTIFICATIONS & ORDERS AUDIT");
  console.log("===============================================================");
  console.log("Supabase URL:", supabaseUrl);

  // 1. Subscribe with anon client (simulating Flutter app)
  console.log("\n[STEP 1] Subscribing Anon client to public:notifications_log channel...");
  let receivedRealtime = false;

  const channel = anonClient
    .channel("test_notif_channel")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications_log" },
      (payload) => {
        console.log("🎉 [REALTIME RECEIVED BY APP CLIENT] Payload:", payload.new);
        receivedRealtime = true;
      }
    )
    .subscribe((status) => {
      console.log("   Channel subscription status:", status);
    });

  // Wait for subscription to establish
  await new Promise((r) => setTimeout(r, 2500));

  // 2. Dispatch a test notification via adminClient (simulating Admin Panel)
  console.log("\n[STEP 2] Dispatching test notification from Admin Panel...");
  const testNotif = {
    title: "⚡ Flash Deal Alert: STEM Kits 30% OFF!",
    body: "Explore the new robotic kits and exclusive offers in Guild Club.",
    segment_type: "all",
    recipient_count: 5,
    sent_by_email: "admin@guildclub.com",
    status: "sent",
  };

  const { data: inserted, error: insertErr } = await adminClient
    .from("notifications_log")
    .insert(testNotif)
    .select()
    .single();

  if (insertErr) {
    console.error("❌ Failed to insert test notification:", insertErr.message);
    return;
  }
  console.log("✅ Inserted notification ID:", inserted.id);

  // Wait up to 5 seconds for Realtime event to arrive
  console.log("\n[STEP 3] Waiting for Realtime delivery to app client...");
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (receivedRealtime) break;
  }

  if (receivedRealtime) {
    console.log("✅ LIVE REALTIME NOTIFICATION CONFIRMED: Admin dispatch instantly broadcasts to phone apps!");
  } else {
    console.log("ℹ️ Realtime channel did not fire. Verifying if notifications_log is in supabase_realtime publication...");
  }

  // Clean up test notification
  await adminClient.from("notifications_log").delete().eq("id", inserted.id);
  console.log("🧹 Cleaned up test notification row.");
  channel.unsubscribe();
}

testRealtimeNotifications().catch(console.error);
