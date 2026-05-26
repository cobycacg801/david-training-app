import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  try {
    // Auth check
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fullName, phone } = await req.json();

    // Build update payload (only include defined fields)
    const updateData: Record<string, string | null> = {};
    if (fullName !== undefined) updateData.full_name = fullName || null;
    if (phone    !== undefined) updateData.phone     = phone    || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const db = createServiceClient();
    const { error } = await db
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/profile]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
