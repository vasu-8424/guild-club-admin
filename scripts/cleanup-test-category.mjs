import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import ws from "ws";

globalThis.WebSocket = ws;

const envContent = fs.readFileSync(".env.local", "utf-8");
let serviceKey = "";
let supabaseUrl = "";

envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (trimmed.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) {
    serviceKey = trimmed.split("=")[1].trim();
  }
  if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
    supabaseUrl = trimmed.split("=")[1].trim();
  }
});

const adminClient = createClient(supabaseUrl, serviceKey);

async function cleanup() {
  const { error } = await adminClient
    .from("categories")
    .delete()
    .eq("slug", "zzz-live-data-test");

  if (error) {
    console.error("Error removing test category:", error.message);
  } else {
    console.log("✅ 'ZZZ Live Data Test' removed from Supabase categories table.");
  }
}

cleanup();
