import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import ws from "ws";

globalThis.WebSocket = ws;

// Read .env.local
const envPath = path.join(process.cwd(), ".env.local");
let envVars = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...vals] = trimmed.split("=");
      envVars[key.trim()] = vals.join("=").trim();
    }
  });
}

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL || "https://hyojlcanmglupmumstii.supabase.co";
const ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_d2Ry2a9TNKi6su86NRLrAA_v8LSkkKj";
const SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log("=================================================");
console.log("GUILD CLUB ADMIN — LIVE SUPABASE VERIFICATION");
console.log("=================================================");
console.log("Supabase URL:", SUPABASE_URL);
console.log("Anon Key present:", Boolean(ANON_KEY));
console.log(
  "Service Role Key configured:",
  SERVICE_KEY && SERVICE_KEY !== "your_supabase_service_role_key_here" ? "YES (Configured)" : "NO (Placeholder)"
);

async function runTests() {
  const isServiceConfigured = SERVICE_KEY && SERVICE_KEY !== "your_supabase_service_role_key_here";
  const activeKey = isServiceConfigured ? SERVICE_KEY : ANON_KEY;
  const client = createClient(SUPABASE_URL, activeKey);

  console.log("\n--- TEST 0: SCHEMA & RLS DIAGNOSTICS ---");

  // Check categories table
  const { data: catData, error: catErr } = await client.from("categories").select("*").limit(1);
  if (catErr) {
    console.log("❌ Categories Table Status:", catErr.message, "(Code: " + catErr.code + ")");
  } else {
    console.log("✅ Categories Table exists! Current row count:", catData.length);
  }

  // Check products table
  const { data: prodData, error: prodErr } = await client.from("products").select("*").limit(1);
  if (prodErr) {
    console.log("❌ Products Table Status:", prodErr.message, "(Code: " + prodErr.code + ")");
  } else {
    console.log("✅ Products Table exists! Current row count:", prodData.length);
  }

  // Check storage buckets
  const { data: buckets, error: bucketErr } = await client.storage.listBuckets();
  if (bucketErr) {
    console.log("❌ Storage Buckets Status:", bucketErr.message);
  } else {
    console.log("✅ Storage Buckets:", buckets.map((b) => b.name));
  }

  // Check write with current key
  const { data: insertTest, error: insertErr } = await client.from("products").insert({
    title: "__VERIFICATION_CANARY__",
    description: "Canary test",
    price: 100,
  }).select();

  if (insertErr) {
    console.log("⚠️ Write Permission Test (Current Key):", insertErr.message, "(Code: " + insertErr.code + ")");
  } else {
    console.log("✅ Write Permission Test (Current Key): SUCCESS! Inserted canary ID:", insertTest[0]?.id);
    // clean up canary
    await client.from("products").delete().eq("id", insertTest[0]?.id);
    console.log("   Cleaned up canary test product.");
  }
}

runTests();
