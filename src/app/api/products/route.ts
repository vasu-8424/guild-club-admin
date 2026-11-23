import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/supabase/auth-guard";
import { getAdminClient } from "@/lib/supabase/admin";

// Helper to enrich product with category details
async function enrichProductsWithCategories(adminClient: any, products: any[]) {
  if (!products || products.length === 0) return [];
  const { data: categories } = await adminClient.from("categories").select("*");
  const catMap = new Map();
  (categories || []).forEach((c: any) => {
    catMap.set(c.id, c);
    if (c.slug) catMap.set(c.slug, c);
  });

  return products.map((p: any) => {
    const cat = catMap.get(p.category_slug) || catMap.get(p.category_id) || null;
    return {
      ...p,
      category_id: p.category_id || p.category_slug || null,
      category: cat,
      categories: cat, // for backwards-compatibility
    };
  });
}

// GET products with search, category filter, and sorting
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("category_id");
    const lowStock = searchParams.get("low_stock") === "true";
    const id = searchParams.get("id");

    const adminClient = getAdminClient();

    if (id) {
      const { data, error } = await adminClient
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      const [enriched] = await enrichProductsWithCategories(adminClient, [data]);
      return NextResponse.json({ product: enriched });
    }

    let query = adminClient
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    if (categoryId) {
      // Find category slug/id to match against category_slug column
      const { data: matchedCat } = await adminClient
        .from("categories")
        .select("id, slug")
        .or(`id.eq.${categoryId},slug.eq.${categoryId}`)
        .maybeSingle();

      if (matchedCat) {
        query = query.or(`category_slug.eq.${matchedCat.id},category_slug.eq.${matchedCat.slug}`);
      } else {
        query = query.eq("category_slug", categoryId);
      }
    }

    if (lowStock) {
      query = query.lte("stock_quantity", 10);
    }

    const { data: products, error } = await query;

    if (error) throw error;

    const enrichedProducts = await enrichProductsWithCategories(adminClient, products || []);
    return NextResponse.json({ products: enrichedProducts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST create product
export async function POST(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const body = await req.json();
    const adminClient = getAdminClient();

    // Auto calculate discount percentage if original_price is provided
    let discount = Number(body.discount_percentage) || 0;
    const price = Number(body.price) || 0;
    const origPrice = Number(body.original_price) || 0;
    if (origPrice > price && price > 0) {
      discount = Math.round(((origPrice - price) / origPrice) * 100);
    }

    const insertData: any = {
      id: body.id || crypto.randomUUID(),
      title: body.title,
      subtitle: body.subtitle || "",
      description: body.description || "",
      price,
      original_price: origPrice > 0 ? origPrice : null,
      discount_percentage: discount,
      stock_quantity: Number(body.stock_quantity) || 0,
      category_slug: body.category_slug || body.category_id || "general",
      brand_name: body.brand_name || "Guild Club",
      min_age: Number(body.min_age) || 3,
      max_age: Number(body.max_age) || 12,
      material: body.material || "BPA-Free Plastic & Eco Wood",
      educational_type: body.educational_type || "STEM",
      image_urls: Array.isArray(body.image_urls) ? body.image_urls : [],
    };

    const { data: product, error } = await adminClient
      .from("products")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    // Handle product_images if multi-images provided
    if (body.image_urls && Array.isArray(body.image_urls) && body.image_urls.length > 0) {
      const imagesToInsert = body.image_urls.map((url: string, index: number) => ({
        product_id: product.id,
        image_url: url,
        is_primary: index === 0,
        display_order: index,
      }));

      await adminClient.from("product_images").insert(imagesToInsert);
    }

    const [enriched] = await enrichProductsWithCategories(adminClient, [product]);
    return NextResponse.json({ success: true, product: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT update product
export async function PUT(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const body = await req.json();
    const { id, image_urls, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    // Recalculate discount percentage if price changed
    if (updates.price && updates.original_price) {
      const p = Number(updates.price);
      const op = Number(updates.original_price);
      if (op > p) {
        updates.discount_percentage = Math.round(((op - p) / op) * 100);
      }
    }

    // Sanitize updates to valid database columns
    const allowedColumns = [
      "title", "subtitle", "description", "price", "original_price", 
      "discount_percentage", "stock_quantity", "category_slug", 
      "brand_name", "min_age", "max_age", "material", "educational_type", "image_urls"
    ];

    const cleanUpdates: any = {};
    for (const key of allowedColumns) {
      if ((updates as any)[key] !== undefined) {
        cleanUpdates[key] = (updates as any)[key];
      }
    }
    if ((updates as any).category_id) {
      cleanUpdates.category_slug = (updates as any).category_id;
    }
    if (image_urls && Array.isArray(image_urls)) {
      cleanUpdates.image_urls = image_urls;
    }

    const adminClient = getAdminClient();
    const { data: product, error } = await adminClient
      .from("products")
      .update(cleanUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Sync product images if updated
    if (image_urls && Array.isArray(image_urls)) {
      await adminClient.from("product_images").delete().eq("product_id", id);
      if (image_urls.length > 0) {
        const imagesToInsert = image_urls.map((url: string, index: number) => ({
          product_id: id,
          image_url: url,
          is_primary: index === 0,
          display_order: index,
        }));
        await adminClient.from("product_images").insert(imagesToInsert);
      }
    }

    const [enriched] = await enrichProductsWithCategories(adminClient, [product]);
    return NextResponse.json({ success: true, product: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE product
export async function DELETE(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    const adminClient = getAdminClient();

    // 1. Find images to clean up from storage
    try {
      const { data: images } = await adminClient
        .from("product_images")
        .select("image_url")
        .eq("product_id", id);

      if (images && images.length > 0) {
        const fileNames = images
          .map((img) => {
            const parts = img.image_url.split("/");
            return parts[parts.length - 1];
          })
          .filter(Boolean);

        if (fileNames.length > 0) {
          await adminClient.storage.from("products").remove(fileNames);
        }
      }
      await adminClient.from("product_images").delete().eq("product_id", id);
    } catch (cleanupErr) {
      console.warn("Storage cleanup warning during product deletion:", cleanupErr);
    }

    // 2. Delete product record
    const { error } = await adminClient.from("products").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
