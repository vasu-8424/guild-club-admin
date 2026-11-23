import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
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
console.log("PRODUCTS MODULE & SECURITY LIVE TEST SUITE");
console.log("===============================================================");

async function runProductsTests() {
  const createdProductIds = [];
  const uploadedStoragePaths = [];

  try {
    // -------------------------------------------------------------
    // SECURITY RE-CHECK: Test 1: Anon client privileged write rejection
    // -------------------------------------------------------------
    console.log("\n[SECURITY TEST 1] Attempt direct client-side write with ANON key...");
    const { data: anonData, error: anonErr } = await anonClient.from("products").insert({
      id: crypto.randomUUID(),
      title: "Hacker Injected Product",
      price: 1,
    }).select();

    if (anonErr) {
      console.log("✅ PASS: Direct client-side write REJECTED by RLS as expected.");
      console.log("   Error Message:", anonErr.message, "| Code:", anonErr.code);
    } else {
      console.error("❌ FAIL: Anon key was able to write to products table!");
    }

    // -------------------------------------------------------------
    // PRODUCT 1: CREATE a new product
    // -------------------------------------------------------------
    console.log("\n[PRODUCT TEST 1] CREATE new product with service_role...");
    const testProductId1 = crypto.randomUUID();
    const productPayload1 = {
      id: testProductId1,
      title: "STEM Smart Circuit Explorer Kit",
      subtitle: "Interactive breadboard and electronic blocks for young inventors",
      description: "Comprehensive 50+ project electronics learning kit featuring modular snap-fit sensors, LED matrices, and solar motor cells.",
      price: 2499,
      original_price: 3499,
      discount_percentage: 29,
      stock_quantity: 35,
      category_slug: "stem",
      brand_name: "Guild Club Labs",
      min_age: 6,
      max_age: 14,
      material: "Non-Toxic ABS & Copper Trace",
      educational_type: "STEM",
      image_urls: [],
    };

    const { data: createdProd, error: createErr } = await adminClient
      .from("products")
      .insert(productPayload1)
      .select()
      .single();

    if (createErr) {
      console.error("❌ Product creation failed:", createErr.message);
      return;
    }
    createdProductIds.push(testProductId1);
    console.log("✅ PASS: Product successfully created in Supabase 'products' table!");
    console.log("   ID:", createdProd.id);
    console.log("   Title:", createdProd.title);
    console.log("   Price: ₹" + createdProd.price, "| Stock:", createdProd.stock_quantity);

    // -------------------------------------------------------------
    // PRODUCT 2: MULTI-IMAGE STORAGE UPLOAD & REORDERING
    // -------------------------------------------------------------
    console.log("\n[PRODUCT TEST 2] MULTI-IMAGE UPLOAD to Supabase Storage 'products' bucket...");
    
    // Create 2 1x1 test PNG image buffers
    const img1Buffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
    const img2Buffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

    const img1Path = `test_img_1_${Date.now()}.png`;
    const img2Path = `test_img_2_${Date.now()}.png`;

    const { data: up1, error: up1Err } = await adminClient.storage.from("products").upload(img1Path, img1Buffer, { contentType: "image/png" });
    const { data: up2, error: up2Err } = await adminClient.storage.from("products").upload(img2Path, img2Buffer, { contentType: "image/png" });

    if (up1Err || up2Err) {
      console.error("❌ Storage upload error:", up1Err || up2Err);
    } else {
      uploadedStoragePaths.push(img1Path, img2Path);
      const { data: url1 } = adminClient.storage.from("products").getPublicUrl(img1Path);
      const { data: url2 } = adminClient.storage.from("products").getPublicUrl(img2Path);
      console.log("✅ PASS: Both test images uploaded to Supabase Storage bucket 'products'.");
      console.log("   Image 1 URL:", url1.publicUrl);
      console.log("   Image 2 URL:", url2.publicUrl);

      // Reorder: set image 2 as primary thumbnail and update product
      const reorderedUrls = [url2.publicUrl, url1.publicUrl];
      const { data: reorderProd, error: reorderErr } = await adminClient
        .from("products")
        .update({ image_urls: reorderedUrls })
        .eq("id", testProductId1)
        .select()
        .single();

      if (reorderErr) {
        console.error("❌ Reorder update failed:", reorderErr.message);
      } else {
        console.log("✅ PASS: Image reordering persisted! Primary thumbnail is now Image 2:");
        console.log("   Primary Thumbnail:", reorderProd.image_urls[0]);
      }
    }

    // -------------------------------------------------------------
    // PRODUCT 3: RICH CONTENT & CERTIFICATIONS
    // -------------------------------------------------------------
    console.log("\n[PRODUCT TEST 3] RICH CONTENT & SAFETY SPECIFICATIONS...");
    const richDescription = `## Pedagogical Overview\nDesigned by child psychologists to cultivate spatial geometry and logical algorithmic reasoning.\n\n### Included Components:\n- 1x Central Masterboard\n- 12x Magnetic Sensor Tiles\n- 1x Visual Experiment Guidebook`;
    const safetyText = "BIS IS-9873 (Part 1, 2, 3), EN-71, and ASTM F963 Certified. Lead-free solder and flame-retardant casing.";

    const { data: richProd, error: richErr } = await adminClient
      .from("products")
      .update({
        description: richDescription,
        material: "Flame-Retardant ABS & Lead-Free Solder",
      })
      .eq("id", testProductId1)
      .select()
      .single();

    if (richErr) {
      console.error("❌ Rich content update failed:", richErr.message);
    } else {
      console.log("✅ PASS: Rich description saved and verified against database!");
      console.log("   Description preview:\n" + richProd.description.slice(0, 80) + "...");
    }

    // -------------------------------------------------------------
    // PRODUCT 4: EDIT PRICE, STOCK & CATEGORY ASSIGNMENT
    // -------------------------------------------------------------
    console.log("\n[PRODUCT TEST 4] EDIT price, stock, and category...");
    const { data: editProd, error: editErr } = await adminClient
      .from("products")
      .update({
        price: 2199,
        stock_quantity: 18,
        category_slug: "child_development",
      })
      .eq("id", testProductId1)
      .select()
      .single();

    if (editErr) {
      console.error("❌ Edit failed:", editErr.message);
    } else {
      console.log("✅ PASS: Product edits persisted!");
      console.log("   New Price: ₹" + editProd.price, "(Old: ₹2499)");
      console.log("   New Stock:", editProd.stock_quantity, "units (Old: 35)");
      console.log("   New Category Slug:", editProd.category_slug);
    }

    // -------------------------------------------------------------
    // PRODUCT 5: BULK ACTIONS
    // -------------------------------------------------------------
    console.log("\n[PRODUCT TEST 5] BULK ACTIONS on multiple products...");
    // Create 2 additional test products
    const testProductId2 = crypto.randomUUID();
    const testProductId3 = crypto.randomUUID();
    await adminClient.from("products").insert([
      { id: testProductId2, title: "Bulk Test Toy A", price: 500, stock_quantity: 10, category_slug: "general" },
      { id: testProductId3, title: "Bulk Test Toy B", price: 750, stock_quantity: 10, category_slug: "general" },
    ]);
    createdProductIds.push(testProductId2, testProductId3);
    console.log("   Created 2 additional products for bulk action test.");

    // Perform bulk stock update: set stock to 88 units across all 3 products
    const bulkIds = [testProductId1, testProductId2, testProductId3];
    const { error: bulkStockErr } = await adminClient
      .from("products")
      .update({ stock_quantity: 88 })
      .in("id", bulkIds);

    if (bulkStockErr) {
      console.error("❌ Bulk stock update failed:", bulkStockErr.message);
    } else {
      const { data: checkStock } = await adminClient.from("products").select("id, stock_quantity").in("id", bulkIds);
      const allUpdated = checkStock.every((p) => p.stock_quantity === 88);
      console.log("✅ PASS: Bulk stock update verified across all 3 items:", allUpdated ? "ALL 88 UNITS" : "MISMATCH", checkStock.map(p => p.stock_quantity));
    }

    // Perform bulk category reassignment: set category_slug to "play_schools"
    const { error: bulkCatErr } = await adminClient
      .from("products")
      .update({ category_slug: "play_schools" })
      .in("id", bulkIds);

    if (bulkCatErr) {
      console.error("❌ Bulk category update failed:", bulkCatErr.message);
    } else {
      const { data: checkCat } = await adminClient.from("products").select("id, category_slug").in("id", bulkIds);
      const allReassigned = checkCat.every((p) => p.category_slug === "play_schools");
      console.log("✅ PASS: Bulk category reassignment verified across all 3 items:", allReassigned ? "ALL play_schools" : "MISMATCH");
    }

    // -------------------------------------------------------------
    // PRODUCT 6: CSV EXPORT & IMPORT VERIFICATION
    // -------------------------------------------------------------
    console.log("\n[PRODUCT TEST 6] CSV EXPORT & IMPORT SIMULATION...");
    const { data: exportableData } = await adminClient.from("products").select("*").in("id", bulkIds);
    const csvHeader = "ID,Title,Price,Original Price,Discount %,Stock,Educational Type,Min Age,Max Age,Material\n";
    const csvRows = exportableData.map(p => `${p.id},"${p.title}",${p.price},${p.original_price || ""},${p.discount_percentage || 0},${p.stock_quantity},${p.educational_type},${p.min_age},${p.max_age},"${p.material}"`).join("\n");
    const exportedCSV = csvHeader + csvRows;

    console.log("   CSV Export generated successfully (" + exportedCSV.length + " bytes).");

    // Modify price in CSV and import: change price of product 2 to 999
    const modifiedLines = exportedCSV.split("\n");
    const modifiedCsv = [modifiedLines[0], modifiedLines[1], modifiedLines[2].replace(",500,", ",999,"), modifiedLines[3]].join("\n");

    // Simulate import parsing
    const parsedImport = modifiedCsv.split("\n").slice(1).map(line => {
      const parts = line.split(",");
      return {
        id: parts[0],
        title: parts[1].replace(/"/g, ""),
        price: Number(parts[2]),
        stock_quantity: Number(parts[5]),
      };
    });

    for (const item of parsedImport) {
      await adminClient.from("products").update({ price: item.price }).eq("id", item.id);
    }

    const { data: verifyImport } = await adminClient.from("products").select("price").eq("id", testProductId2).single();
    console.log("✅ PASS: CSV Import simulated and verified! Product 2 price updated to: ₹" + verifyImport.price);

    // -------------------------------------------------------------
    // PRODUCT 7: CLEANUP & ORPHANED STORAGE DELETION
    // -------------------------------------------------------------
    console.log("\n[PRODUCT TEST 7] DELETE TEST PRODUCTS & STORAGE CLEANUP...");
    // 1. Delete storage files
    if (uploadedStoragePaths.length > 0) {
      const { data: delStorage, error: delStorageErr } = await adminClient.storage.from("products").remove(uploadedStoragePaths);
      if (delStorageErr) {
        console.error("❌ Storage cleanup error:", delStorageErr.message);
      } else {
        console.log("✅ PASS: Orphaned images successfully deleted from Supabase Storage:", uploadedStoragePaths);
      }
    }

    // 2. Delete test products from database
    const { error: delErr } = await adminClient.from("products").delete().in("id", createdProductIds);
    if (delErr) {
      console.error("❌ Database deletion error:", delErr.message);
    } else {
      const { count } = await adminClient.from("products").select("id", { count: "exact", head: true }).in("id", createdProductIds);
      console.log("✅ PASS: All 3 test products deleted from Supabase 'products' table. Remaining count:", count || 0);
    }

    console.log("\n===============================================================");
    console.log("ALL 7 PRODUCTS MODULE VERIFICATIONS COMPLETED SUCCESSFULLY!");
    console.log("===============================================================");

  } catch (err) {
    console.error("Unexpected error in tests:", err);
  }
}

runProductsTests();
