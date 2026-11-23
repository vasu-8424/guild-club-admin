import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/supabase/auth-guard";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const { products } = await req.json(); // Array of parsed product objects

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "No products provided for import" }, { status: 400 });
    }

    const adminClient = getAdminClient();
    const results = [];

    for (const p of products) {
      const price = Number(p.price) || 0;
      const originalPrice = p.original_price ? Number(p.original_price) : null;
      let discount = Number(p.discount_percentage) || 0;
      if (originalPrice && originalPrice > price && price > 0) {
        discount = Math.round(((originalPrice - price) / originalPrice) * 100);
      }

      const itemData: any = {
        title: p.title,
        description: p.description || "Imported catalog product.",
        price,
        original_price: originalPrice,
        discount_percentage: discount,
        stock_quantity: Number(p.stock_quantity) || 0,
        educational_type: p.educational_type || "STEM",
        min_age: Number(p.min_age) || 3,
        max_age: Number(p.max_age) || 12,
        material: p.material || "Eco Wood & BPA-Free Polymer",
      };

      if (p.id) {
        // Update existing
        const { data, error } = await adminClient
          .from("products")
          .upsert({ id: p.id, ...itemData })
          .select()
          .single();
        if (!error && data) results.push(data);
      } else {
        // Insert new
        const { data, error } = await adminClient
          .from("products")
          .insert(itemData)
          .select()
          .single();
        if (!error && data) results.push(data);
      }
    }

    return NextResponse.json({
      success: true,
      importedCount: results.length,
      products: results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
