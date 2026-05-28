import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const db = createServiceClient();
  const { data } = await db.from("blocked_dates").select("*").order("date");
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const db = createServiceClient();
  const { date, reason } = await req.json();
  const { data, error } = await db
    .from("blocked_dates")
    .insert({ date, reason: reason?.trim() || null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
