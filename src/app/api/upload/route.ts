import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/supabase/auth-guard";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "products";

    if (!file) {
      return NextResponse.json({ error: "No file provided for upload" }, { status: 400 });
    }

    const adminClient = getAdminClient();

    // Ensure bucket exists or create it
    try {
      await adminClient.storage.createBucket(bucket, { public: true });
    } catch {
      // Bucket may already exist
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop() || "png";
    const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;

    const { data: uploadData, error: uploadErr } = await adminClient.storage
      .from(bucket)
      .upload(cleanFileName, buffer, {
        contentType: file.type || "image/png",
        upsert: true,
      });

    if (uploadErr) {
      console.error("Storage upload error:", uploadErr);
      return NextResponse.json({ error: uploadErr.message }, { status: 500 });
    }

    const { data: urlData } = adminClient.storage.from(bucket).getPublicUrl(cleanFileName);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: uploadData.path,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message || "Failed to upload file" }, { status: 500 });
  }
}
