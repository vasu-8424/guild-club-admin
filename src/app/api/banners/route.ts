import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/supabase/auth-guard";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const adminClient = getAdminClient();
    const { data: banners, error } = await adminClient
      .from("banners")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ banners: banners || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const body = await req.json();
    const adminClient = getAdminClient();

    const insertData = {
      title: body.title,
      subtitle: body.subtitle || null,
      badge: body.badge || "FEATURED",
      image_url: body.image_url,
      video_url: body.video_url || null,
      cta_text: body.cta_text || "Shop Now",
      cta_link: body.cta_link || "/categories",
      target_category_slug: body.target_category_slug || null,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      display_order: Number(body.display_order) || 0,
    };

    const { data, error } = await adminClient
      .from("banners")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, banner: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Banner ID required" }, { status: 400 });
    }

    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from("banners")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, banner: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) return authResult.response;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Banner ID required" }, { status: 400 });
    }

    const adminClient = getAdminClient();
    const { error } = await adminClient.from("banners").delete().eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
