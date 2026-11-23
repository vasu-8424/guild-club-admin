import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/supabase/auth-guard";
import { getAdminClient } from "@/lib/supabase/admin";

// GET all categories structured as tree
export async function GET(req: NextRequest) {
  try {
    const adminClient = getAdminClient();
    const { data: categories, error } = await adminClient
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Organize into parent-child hierarchy
    const parents = (categories || []).filter((c) => !c.parent_id);
    const children = (categories || []).filter((c) => c.parent_id);

    const tree = parents.map((parent) => ({
      ...parent,
      subcategories: children
        .filter((child) => child.parent_id === parent.id)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    }));

    return NextResponse.json({ categories: tree, flat: categories });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// CREATE category
export async function POST(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const body = await req.json();
    const adminClient = getAdminClient();

    const insertData = {
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      icon_key: body.icon_key || "toys_rounded",
      parent_id: body.parent_id || null,
      sort_order: Number(body.sort_order) || 0,
      color_hex: body.color_hex || "#1E3A8A",
      banner_url: body.banner_url || null,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
    };

    const { data, error } = await adminClient
      .from("categories")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, category: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// UPDATE category
export async function PUT(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Category ID required" }, { status: 400 });
    }

    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from("categories")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, category: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE category
export async function DELETE(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Category ID required" }, { status: 400 });
    }

    const adminClient = getAdminClient();

    // Check if category has subcategories
    const { count } = await adminClient
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with subcategories. Reassign or delete subcategories first." },
        { status: 400 }
      );
    }

    const { error } = await adminClient.from("categories").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
