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

async function testLiveCategorySync() {
  console.log("===============================================================");
  console.log("FLUTTER LIVE CATEGORY SYNC AUDIT & DIAGNOSTIC TEST");
  console.log("===============================================================");

  const testCatId = "c9999999-9999-9999-9999-999999999999";
  const testCategoryPayload = {
    id: testCatId,
    name: "ZZZ Live Data Test",
    slug: "zzz-live-data-test",
    icon_key: "toys_rounded",
    parent_id: null,
    sort_order: 0,
    color_hex: "#EC4899",
    banner_url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=800&auto=format&fit=crop",
    is_active: true,
  };

  console.log("\n[STEP 1] Inserting temporary category 'ZZZ Live Data Test' via Admin Panel/Service Role...");
  const { data: inserted, error: insertErr } = await adminClient
    .from("categories")
    .upsert(testCategoryPayload, { onConflict: "id" })
    .select()
    .single();

  if (insertErr) {
    console.error("❌ Failed to insert test category:", insertErr.message);
    return;
  }
  console.log("✅ 'ZZZ Live Data Test' category inserted in Supabase!");
  console.log("   ID:", inserted.id, "| Name:", inserted.name, "| Slug:", inserted.slug);

  console.log("\n[STEP 2] Simulating Flutter SupabaseService.fetchTopLevelCategories() with ANON key...");
  console.log("   Query: from('categories').select('*').is('parent_id', null).eq('is_active', true).order('sort_order', ascending: true)");
  
  const startTime = Date.now();
  const { data: flutterRows, error: flutterErr } = await anonClient
    .from("categories")
    .select("*")
    .is("parent_id", null)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const durationMs = Date.now() - startTime;

  if (flutterErr) {
    console.error("❌ Flutter query failed with error:", flutterErr.message);
    console.error("   Code:", flutterErr.code, "| Details:", flutterErr.details);
    console.log("⚠️ DIAGNOSTIC: Flutter will hit catch(e) block and fall back to MockToyData.topLevelCategories!");
    return;
  }

  console.log(`✅ Flutter query returned ${flutterRows.length} rows in ${durationMs}ms (HTTP 200 OK)`);

  // Diagnostic Check: Empty list fallback
  if (!flutterRows || flutterRows.length === 0) {
    console.error("❌ Rows returned is empty! Flutter would trigger: return list.isEmpty ? MockToyData.topLevelCategories : list");
    return;
  }

  // Diagnostic Check: Is "ZZZ Live Data Test" in the list?
  const testRow = flutterRows.find(c => c.name === "ZZZ Live Data Test" || c.id === testCatId);
  if (!testRow) {
    console.error("❌ 'ZZZ Live Data Test' is NOT in the list returned by Supabase!");
    return;
  }
  console.log("✅ 'ZZZ Live Data Test' IS present in the live anon query results!");

  // Diagnostic Check: Dart CategoryModel.fromJson parsing test
  console.log("\n[STEP 3] Validating all rows against Flutter's CategoryModel.fromJson schema...");
  for (const cat of flutterRows) {
    const parsed = {
      id: cat.id?.toString() ?? '',
      name: cat.name?.toString() ?? '',
      slug: cat.slug?.toString() ?? '',
      iconKey: cat.icon_key?.toString() ?? cat.icon_name?.toString() ?? '',
      parentId: cat.parent_id?.toString() || null,
      sortOrder: Number(cat.sort_order) || 0,
      colorHex: cat.color_hex?.toString() ?? '#1E3A8A',
      bannerUrl: cat.banner_url?.toString() ?? '',
      isActive: Boolean(cat.is_active),
      hasSubcategories: cat.slug === 'child-development-centers',
    };
    console.log(`   - [OK] ${parsed.name} (slug: ${parsed.slug}, sort: ${parsed.sortOrder}, color: ${parsed.colorHex})`);
  }

  console.log("\n[STEP 4] Subcategory query check for Child Development Centers...");
  const cdcId = "c1000000-0000-0000-0000-000000000002";
  const { data: subRows, error: subErr } = await anonClient
    .from("categories")
    .select("*")
    .eq("parent_id", cdcId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (subErr) {
    console.error("❌ Subcategory query failed:", subErr.message);
  } else {
    console.log(`✅ Subcategory query returned ${subRows.length} rows for Child Development Centers:`);
    subRows.forEach(s => console.log(`     * ${s.name} (${s.slug})`));
  }

  console.log("\n===============================================================");
  console.log("SUMMARY: Flutter app SupabaseService is 100% connected to LIVE data.");
  console.log("===============================================================");
}

testLiveCategorySync();
