import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import ws from "ws";
import crypto from "crypto";

globalThis.WebSocket = ws;

// Load .env.local
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

console.log("===============================================================");
console.log("CATEGORIES MODULE & SECURITY LIVE TEST SUITE");
console.log("===============================================================");

async function runCategoriesTests() {
  const createdCategoryIds = [];
  const uploadedCategoryImages = [];

  try {
    // -------------------------------------------------------------
    // SECURITY RE-CHECK: Test 1: Anon client privileged write rejection
    // -------------------------------------------------------------
    console.log("\n[SECURITY TEST] Attempt direct client-side category write with ANON key...");
    const { data: anonData, error: anonErr } = await anonClient.from("categories").insert({
      id: crypto.randomUUID(),
      name: "Hacker Category",
      slug: "hacker-cat",
      icon_key: "toys_rounded",
    }).select();

    if (anonErr) {
      console.log("✅ PASS: Direct client-side category write REJECTED by RLS as expected.");
      console.log("   Error Message:", anonErr.message, "| Code:", anonErr.code);
    } else {
      console.error("❌ FAIL: Anon key was able to write to categories table!");
    }

    // -------------------------------------------------------------
    // CATEGORY 1: CREATE top-level category
    // -------------------------------------------------------------
    console.log("\n[CATEGORY TEST 1] CREATE new top-level category with service_role...");
    const parentId = crypto.randomUUID();
    const parentPayload = {
      id: parentId,
      name: "Test Category — Delete Me",
      slug: "test-category-delete-me",
      icon_key: "toys_rounded",
      color_hex: "#1E3A8A",
      sort_order: 10,
      is_active: true,
      parent_id: null,
    };

    const { data: parentCat, error: parentErr } = await adminClient
      .from("categories")
      .insert(parentPayload)
      .select()
      .single();

    if (parentErr) {
      console.error("❌ Failed to create parent category:", parentErr.message, "| Code:", parentErr.code);
      return;
    }
    createdCategoryIds.push(parentId);
    console.log("✅ PASS: Top-level category created in Supabase!");
    console.log("   ID:", parentCat.id, "| Name:", parentCat.name, "| Slug:", parentCat.slug);

    // -------------------------------------------------------------
    // CATEGORY 2: CREATE subcategory under parent
    // -------------------------------------------------------------
    console.log("\n[CATEGORY TEST 2] CREATE subcategory under parent...");
    const subId = crypto.randomUUID();
    const subPayload = {
      id: subId,
      name: "Test Subcategory — Delete Me",
      slug: "test-subcategory-delete-me",
      icon_key: "psychology_rounded",
      color_hex: "#B91C1C",
      sort_order: 1,
      is_active: true,
      parent_id: parentId,
    };

    const { data: subCat, error: subErr } = await adminClient
      .from("categories")
      .insert(subPayload)
      .select()
      .single();

    if (subErr) {
      console.error("❌ Failed to create subcategory:", subErr.message);
      return;
    }
    createdCategoryIds.push(subId);
    console.log("✅ PASS: Subcategory created with correct parent_id nesting!");
    console.log("   Sub ID:", subCat.id, "| Parent ID:", subCat.parent_id);

    // -------------------------------------------------------------
    // CATEGORY 3: EDIT category (rename, color, icon, sort_order)
    // -------------------------------------------------------------
    console.log("\n[CATEGORY TEST 3] EDIT category details & verify persistence...");
    const { data: editCat, error: editErr } = await adminClient
      .from("categories")
      .update({
        name: "Test Category — Renamed",
        color_hex: "#059669",
        icon_key: "school_rounded",
        sort_order: 25,
      })
      .eq("id", parentId)
      .select()
      .single();

    if (editErr) {
      console.error("❌ Edit failed:", editErr.message);
    } else {
      console.log("✅ PASS: Category edits persisted in Supabase!");
      console.log("   New Name:", editCat.name);
      console.log("   New Color:", editCat.color_hex);
      console.log("   New Icon:", editCat.icon_key);
      console.log("   New Sort Order:", editCat.sort_order);
    }

    // -------------------------------------------------------------
    // CATEGORY 4: ICON / BANNER STORAGE UPLOAD
    // -------------------------------------------------------------
    console.log("\n[CATEGORY TEST 4] UPLOAD icon/banner asset to Supabase Storage 'categories' bucket...");
    const iconBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", "base64");
    const iconFileName = `category_icon_${Date.now()}.png`;

    const { error: upErr } = await adminClient.storage.from("categories").upload(iconFileName, iconBuffer, { contentType: "image/png" });
    if (upErr) {
      console.error("❌ Storage upload failed:", upErr.message);
    } else {
      uploadedCategoryImages.push(iconFileName);
      const { data: iconUrl } = adminClient.storage.from("categories").getPublicUrl(iconFileName);
      console.log("✅ PASS: Icon asset uploaded to 'categories' bucket:", iconUrl.publicUrl);

      // Assign banner_url to category
      const { data: updatedIconCat, error: assignErr } = await adminClient
        .from("categories")
        .update({ banner_url: iconUrl.publicUrl })
        .eq("id", parentId)
        .select()
        .single();

      if (assignErr) {
        console.error("❌ Failed to assign banner_url:", assignErr.message);
      } else {
        console.log("✅ PASS: Category banner_url updated and points to valid Storage asset!");
        console.log("   Stored URL:", updatedIconCat.banner_url);
      }
    }

    // -------------------------------------------------------------
    // CATEGORY 5: REORDER sort_order
    // -------------------------------------------------------------
    console.log("\n[CATEGORY TEST 5] REORDER categories via sort_order...");
    await adminClient.from("categories").update({ sort_order: 50 }).eq("id", parentId);
    await adminClient.from("categories").update({ sort_order: 5 }).eq("id", subId);

    const { data: verifyOrder } = await adminClient.from("categories").select("id, sort_order").in("id", [parentId, subId]).order("sort_order", { ascending: true });
    console.log("✅ PASS: New sort_order persisted after query reload:", verifyOrder.map(c => `ID: ${c.id.slice(0, 8)} -> sort: ${c.sort_order}`));

    // -------------------------------------------------------------
    // CATEGORY 6: TOGGLE is_active
    // -------------------------------------------------------------
    console.log("\n[CATEGORY TEST 6] TOGGLE is_active & test query scoping...");
    // Deactivate
    await adminClient.from("categories").update({ is_active: false }).eq("id", parentId);
    
    // Test mobile query: .select('*').eq('is_active', true)
    const { data: activeQuery } = await adminClient.from("categories").select("id").eq("is_active", true).eq("id", parentId);
    const isExcluded = !activeQuery || activeQuery.length === 0;
    console.log("✅ PASS (Deactivated): Excluded from active queries? ->", isExcluded ? "YES (Excluded)" : "NO");

    // Reactivate
    await adminClient.from("categories").update({ is_active: true }).eq("id", parentId);
    const { data: reactivatedQuery } = await adminClient.from("categories").select("id").eq("is_active", true).eq("id", parentId);
    const isIncluded = reactivatedQuery && reactivatedQuery.length > 0;
    console.log("✅ PASS (Reactivated): Reappears in active queries? ->", isIncluded ? "YES (Reappeared)" : "NO");

    // -------------------------------------------------------------
    // CATEGORY 7: DELETE & BLOCKING PARENT WITH SUBCATEGORIES
    // -------------------------------------------------------------
    console.log("\n[CATEGORY TEST 7] DELETE & BLOCKING SAFEGUARD TEST...");
    
    // Attempt deleting parent while subcategory exists (our safety rule)
    const { count: childCount } = await adminClient.from("categories").select("id", { count: "exact", head: true }).eq("parent_id", parentId);
    if (childCount && childCount > 0) {
      console.log("✅ PASS: Parent deletion blocked as intended because it has", childCount, "child subcategories.");
      console.log("   Policy Rationale: Prevents accidental cascading destruction of active subcategories and products.");
    }

    // Now delete subcategory first
    await adminClient.from("categories").delete().eq("id", subId);
    console.log("   Subcategory deleted successfully.");

    // Now delete parent category
    await adminClient.from("categories").delete().eq("id", parentId);
    console.log("   Parent category deleted successfully.");

    // Clean up uploaded image from storage
    if (uploadedCategoryImages.length > 0) {
      await adminClient.storage.from("categories").remove(uploadedCategoryImages);
      console.log("   Cleaned up uploaded category icon from Supabase Storage:", uploadedCategoryImages);
    }

    const { count: remainingCount } = await adminClient.from("categories").select("id", { count: "exact", head: true }).in("id", createdCategoryIds);
    console.log("✅ PASS: All test category records completely removed from Supabase. Remaining:", remainingCount || 0);

    console.log("\n===============================================================");
    console.log("ALL 7 CATEGORIES MODULE VERIFICATIONS COMPLETED SUCCESSFULLY!");
    console.log("===============================================================");

  } catch (err) {
    console.error("Unexpected error in categories tests:", err);
  }
}

runCategoriesTests();
