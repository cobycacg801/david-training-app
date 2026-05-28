import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail, sessionReminderEmail } from "@/lib/email";
import { sendSMS, smsMemberReminder } from "@/lib/sms";

const HOUSTON = "America/Chicago";

function fmtForTZ(isoStr: string, tz: string, short = false): string {
  return new Date(isoStr).toLocaleString("en-US", {
    timeZone: tz,
    weekday: short ? "short" : "long",
    month: short ? "short" : "long",
    day: "numeric",
    ...(short ? {} : { year: "numeric" }),
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

// Called by Vercel Cron daily at 9 AM UTC (3–4 AM Houston — bookings for next Houston day)
// Sends 24-hour reminder emails + SMS to members with confirmed sessions tomorrow (Houston time)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createServiceClient();

  // "Tomorrow" in Houston timezone
  const nowHouston = new Date(new Date().toLocaleString("en-US", { timeZone: HOUSTON }));
  const tomorrowHouston = new Date(nowHouston);
  tomorrowHouston.setDate(nowHouston.getDate() + 1);

  const tomorrowStr = tomorrowHouston.toLocaleDateString("en-CA", { timeZone: HOUSTON });
  const startUTC = new Date(`${tomorrowStr}T00:00:00Z`).toISOString();
  const endUTC   = new Date(`${tomorrowStr}T23:59:59Z`).toISOString();

  const { data: bookings, error } = await db
    .from("bookings")
    .select("*, profiles(full_name, email, phone)")
    .eq("status", "confirmed")
    .gte("scheduled_at", startUTC)
    .lte("scheduled_at", endUTC);

  if (error) {
    console.error("[cron/reminders] DB error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let emailsSent = 0;
  let smsSent    = 0;

  for (const booking of bookings ?? []) {
    const memberName  = (booking.profiles as any)?.full_name ?? "Member";
    const memberEmail = (booking.profiles as any)?.email     ?? null;
    const memberPhone = (booking.profiles as any)?.phone     ?? null;
    const memberTz    = booking.member_timezone ?? null;
    const sessionType = booking.session_type === "online" ? "Online (Zoom)" : "In-Person (Houston)";

    // Houston time (primary — what David sees)
    const houstonDisplay = fmtForTZ(booking.scheduled_at, HOUSTON);
    const houstonShort   = fmtForTZ(booking.scheduled_at, HOUSTON, true);

    // Member's local time (if different timezone stored)
    const memberLocalDisplay = memberTz && memberTz !== HOUSTON
      ? fmtForTZ(booking.scheduled_at, memberTz)
      : null;
    const memberShort = memberLocalDisplay
      ? fmtForTZ(booking.scheduled_at, memberTz!, true)
      : null;

    const displayDate = memberLocalDisplay
      ? `${houstonDisplay}\n(${memberLocalDisplay} — your local time)`
      : houstonDisplay;

    const shortDate = memberShort
      ? `${houstonShort} / ${memberShort} (your time)`
      : houstonShort;

    if (memberEmail) {
      await sendEmail(
        memberEmail,
        "Reminder: Your session with Coach David is tomorrow ⚡",
        sessionReminderEmail({
          memberName,
          sessionType,
          scheduledAt: displayDate,
          zoomLink: booking.zoom_link ?? undefined,
        })
      );
      emailsSent++;
    }

    if (memberPhone) {
      await sendSMS(
        memberPhone,
        smsMemberReminder({
          memberName,
          sessionType,
          scheduledAt: shortDate,
          zoomLink: booking.zoom_link ?? null,
        })
      );
      smsSent++;
    }
  }

  console.log(`[cron/reminders] Sent ${emailsSent} emails, ${smsSent} SMS`);
  return NextResponse.json({ emailsSent, smsSent });
}
