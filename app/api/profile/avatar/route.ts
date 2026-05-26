import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 5 MB." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
      return NextResponse.json({ error: "Only JPG, PNG, or WebP images allowed." }, { status: 400 });
    }

    const filePath = `${user.id}/avatar.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const db = createServiceClient();
    const { error: uploadError } = await db.storage
      .from("avatars")
      .upload(filePath, buffer, { contentType: file.type, upsert: true });

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });

    const { data: { publicUrl } } = db.storage.from("avatars").getPublicUrl(filePath);
    const avatarUrl = `${publicUrl}?t=${Date.now()}`;

    await db.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);

    return NextResponse.json({ avatarUrl });
  } catch (err) {
    console.error("[POST /api/profile/avatar]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
