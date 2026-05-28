import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const db = createServiceClient();
  const [{ data: weekly }, { data: blocked }] = await Promise.all([
    db.from("weekly_availability").select("*").order("day_of_week"),
    db.from("blocked_dates").select("*").order("date"),
  ]);
  return NextResponse.json({ weekly: weekly ?? [], blocked: blocked ?? [] });
}

export async function PATCH(req: Request) {
  const db = createServiceClient();
  const { slots } = await req.json() as {
    slots: Array<{ day_of_week: number; enabled: boolean; start_hour: number; end_hour: number }>;
  };
  for (const slot of slots) {
    await db.from("weekly_availability").upsert(slot, { onConflict: "day_of_week" });
  }
  return NextResponse.json({ ok: true });
}
