import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// iCal feed — David subscribes once, his phone calendar auto-updates.
// URL: /api/calendar?token=<CRON_SECRET>
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (token !== process.env.CRON_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const db = createServiceClient();
  const { data: bookings } = await db
    .from("bookings")
    .select("id, session_type, scheduled_at, status, zoom_link, profiles(full_name)")
    .in("status", ["confirmed", "pending"])
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at");

  const now = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.davidabrajin.com";

  const events = (bookings ?? []).map((b: any) => {
    const start = new Date(b.scheduled_at);
    const end   = new Date(start.getTime() + 60 * 60 * 1000); // 1 hr
    const fmt   = (d: Date) => d.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
    const member = b.profiles?.full_name ?? "Member";
    const type   = b.session_type === "online" ? "Online (Zoom)" : "In-Person (Houston)";
    const status = b.status === "confirmed" ? "✓ Confirmed" : "⏳ Pending";
    const location = b.zoom_link ? b.zoom_link : b.session_type === "in-person" ? "Houston, TX" : "Zoom — TBD";

    return [
      "BEGIN:VEVENT",
      `UID:booking-${b.id}@davidabrajin.com`,
      `DTSTAMP:${now}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${status} — ${member} (${type})`,
      `LOCATION:${location}`,
      `DESCRIPTION:Session with ${member}\\nType: ${type}\\nStatus: ${b.status}\\nManage: ${appUrl}/admin`,
      "END:VEVENT",
    ].join("\r\n");
  });

  const ical = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//David Training App//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:David Training — Sessions`,
    `X-WR-TIMEZONE:America/Chicago`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="david-sessions.ics"',
      "Cache-Control": "no-cache",
    },
  });
}
