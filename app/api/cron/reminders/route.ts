import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail, sessionReminderEmail } from "@/lib/email";
import { sendSMS, smsMemberReminder } from "@/lib/sms";

// Called by Vercel Cron daily at 9 AM UTC
// Sends 24-hour reminder emails + SMS to members with confirmed sessions tomorrow
export async function GET(req: NextRequest) {
  // Protect the cron endpoint
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createServiceClient();

  // Find confirmed sessions scheduled for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const start = new Date(tomorrow); start.setHours(0, 0, 0, 0);
  const end   = new Date(tomorrow); end.setHours(23, 59, 59, 999);

  const { data: bookings, error } = await db
    .from("bookings")
    .select("*, profiles(full_name, email, phone)")
    .eq("status", "confirmed")
    .gte("scheduled_at", start.toISOString())
    .lte("scheduled_at", end.toISOString());

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
    const sessionType = booking.session_type === "online" ? "Online (Zoom)" : "In-Person (Houston)";

    const displayDate = new Date(booking.scheduled_at).toLocaleString("en-US", {
      weekday: "long", month: "long", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });

    const shortDate = new Date(booking.scheduled_at).toLocaleString("en-US", {
      weekday: "short", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });

    // Send email reminder
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

    // Send SMS reminder
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
