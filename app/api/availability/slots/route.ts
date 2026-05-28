import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// All availability hours are stored in David's timezone: America/Chicago (CST/CDT)
const TZ = "America/Chicago";

function getHoustonHour(isoStr: string): number {
  const h = parseInt(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hour12: false }).format(new Date(isoStr)),
  );
  return h === 24 ? 0 : h;
}

// Convert a Houston-local hour on a given date to UTC ISO string (DST-aware via Intl)
function houstonToUTC(date: string, hour: number): string {
  const probe = new Date(`${date}T12:00:00Z`); // noon UTC safely avoids midnight edge cases
  const probeHouston = parseInt(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hour12: false }).format(probe),
  );
  const offsetHours = 12 - (probeHouston === 24 ? 0 : probeHouston); // CDT→5, CST→6
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hour + offsetHours, 0, 0)).toISOString();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date"); // YYYY-MM-DD
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const db = createServiceClient();
  const dayOfWeek = new Date(`${date}T12:00:00Z`).getUTCDay();

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
    return NextResponse.json({ slots: [], slotDetails: [], available: false });
  }

  // Compare existing bookings using Houston hours (not UTC hours — avoids DST mismatches)
  const bookedHoustonHours = new Set(
    (existing ?? []).map((b: { scheduled_at: string }) => getHoustonHour(b.scheduled_at)),
  );

  const slotDetails: Array<{ label: string; utc: string }> = [];
  for (let h = avail.start_hour; h < avail.end_hour; h++) {
    if (!bookedHoustonHours.has(h)) {
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? "AM" : "PM";
      slotDetails.push({ label: `${h12}:00 ${ampm} CT`, utc: houstonToUTC(date, h) });
    }
  }

  return NextResponse.json({
    slots: slotDetails.map(s => s.label),  // kept for backward compat
    slotDetails,
    available: true,
  });
}
