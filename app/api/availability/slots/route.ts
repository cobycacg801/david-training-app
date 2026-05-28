import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date"); // YYYY-MM-DD
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const db = createServiceClient();
  const dayOfWeek = new Date(`${date}T12:00:00`).getDay(); // noon avoids DST issues

  const [{ data: avail }, { data: blocked }, { data: existing }] = await Promise.all([
    db.from("weekly_availability").select("*").eq("day_of_week", dayOfWeek).single(),
    db.from("blocked_dates").select("id").eq("date", date).maybeSingle(),
    db.from("bookings")
      .select("scheduled_at")
      .gte("scheduled_at", `${date}T00:00:00.000Z`)
      .lte("scheduled_at", `${date}T23:59:59.999Z`)
      .in("status", ["confirmed", "pending"]),
  ]);

  if (!avail || !avail.enabled || blocked) {
    return NextResponse.json({ slots: [], available: false });
  }

  const bookedHours = new Set(
    (existing ?? []).map((b: { scheduled_at: string }) =>
      new Date(b.scheduled_at).getUTCHours(),
    ),
  );

  const slots: string[] = [];
  for (let h = avail.start_hour; h < avail.end_hour; h++) {
    if (!bookedHours.has(h)) {
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? "AM" : "PM";
      slots.push(`${h12}:00 ${ampm}`);
    }
  }

  return NextResponse.json({ slots, available: true });
}
