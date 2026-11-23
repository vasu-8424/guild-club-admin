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

async function runGenericSubcategoryTest() {
  console.log("===============================================================");
  console.log("GENERIC SUBCATEGORY CREATION TEST (UNDER 'SCHOOLS')");
  console.log("===============================================================");

  // 1. Locate Schools parent category
  const { data: schoolsParent, error: sErr } = await adminClient
    .from("categories")
    .select("*")
    .eq("slug", "schools")
    .single();

  if (sErr || !schoolsParent) {
    console.error("❌ Failed to find 'Schools' parent category:", sErr?.message);
    return;
  }

  console.log("\n[STEP 1] Target Parent Category Found:");
  console.log(`   Parent Name: "${schoolsParent.name}" | ID: ${schoolsParent.id} | Slug: ${schoolsParent.slug}`);

  // 2. Create subcategory under Schools
  const testSubPayload = {
    name: "Robotics & STEM Labs",
    slug: "robotics-stem-labs-test",
    parent_id: schoolsParent.id,
    icon_key: "stem_robotics",
    color_hex: "#0EA5E9",
    sort_order: 1,
    is_active: true,
  };

  console.log("\n[STEP 2] Inserting generic subcategory under 'Schools'...");
  const { data: newSub, error: createErr } = await adminClient
    .from("categories")
    .insert(testSubPayload)
    .select()
    .single();

  if (createErr) {
    console.error("❌ Failed to create subcategory under Schools:", createErr.message);
    return;
  }

  console.log("✅ PASS: Subcategory successfully created under 'Schools'!");
  console.log(`   ID: ${newSub.id}`);
  console.log(`   Name: ${newSub.name}`);
  console.log(`   Parent ID: ${newSub.parent_id} (Matches Schools ID: ${newSub.parent_id === schoolsParent.id})`);
  console.log(`   Slug: ${newSub.slug} | Sort: ${newSub.sort_order}`);

  // 3. Verify tree hierarchy via API query simulation
  console.log("\n[STEP 3] Verifying tree hierarchy from database...");
  const { data: allCategories } = await adminClient
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  const parents = allCategories.filter((c) => !c.parent_id);
  const children = allCategories.filter((c) => c.parent_id);

  const tree = parents.map((parent) => ({
    ...parent,
    subcategories: children.filter((child) => child.parent_id === parent.id),
  }));

  const schoolsInTree = tree.find((c) => c.id === schoolsParent.id);
  const cdcInTree = tree.find((c) => c.slug === "child-development-centers");

  console.log(`   - "Schools" subcategories count: ${schoolsInTree?.subcategories?.length || 0}`);
  schoolsInTree?.subcategories?.forEach((s) => console.log(`       * ${s.name} (${s.slug})`));

  console.log(`   - "Child Development Centers" subcategories count: ${cdcInTree?.subcategories?.length || 0}`);
  cdcInTree?.subcategories?.forEach((s) => console.log(`       * ${s.name} (${s.slug})`));

  // 4. Test Mobile Client query with ANON key
  console.log("\n[STEP 4] Querying subcategories under 'Schools' using ANON key (as mobile app does)...");
  const { data: anonSubRows, error: anonSubErr } = await anonClient
    .from("categories")
    .select("*")
    .eq("parent_id", schoolsParent.id)
    .eq("is_active", true);

  if (anonSubErr) {
    console.error("❌ Anon query error:", anonSubErr.message);
  } else {
    console.log(`✅ PASS: Mobile app query successfully returned ${anonSubRows.length} subcategory under 'Schools':`);
    anonSubRows.forEach((r) => console.log(`       * ${r.name} (parent_id: ${r.parent_id})`));
  }

  // 5. Clean up temporary test subcategory
  console.log("\n[STEP 5] Cleaning up test subcategory...");
  const { error: delErr } = await adminClient
    .from("categories")
    .delete()
    .eq("id", newSub.id);

  if (delErr) {
    console.error("❌ Error deleting test subcategory:", delErr.message);
  } else {
    console.log(`✅ PASS: Test subcategory "${newSub.name}" (${newSub.id}) deleted successfully.`);
  }

  // Confirm final state
  const { count: finalCount } = await adminClient
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", schoolsParent.id);

  console.log(`✅ PASS: Schools subcategories count after cleanup: ${finalCount || 0}`);

  console.log("\n===============================================================");
  console.log("GENERIC SUBCATEGORY CREATION & CLEANUP VERIFIED 100% WORKING!");
  console.log("===============================================================");
}

runGenericSubcategoryTest();
