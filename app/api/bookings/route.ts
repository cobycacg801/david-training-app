import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  sendEmail, DAVID_EMAIL,
  newBookingAdminEmail, bookingReceivedEmail,
} from "@/lib/email";
import {
  sendSMS, DAVID_PHONE,
  smsNewBookingDavid,
} from "@/lib/sms";

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

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionType, scheduledAt, notes, memberName, memberEmail, memberTimezone } =
      await req.json();

    if (!userId || !sessionType || !scheduledAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = createServiceClient();

    const { data: booking, error } = await db
      .from("bookings")
      .insert({
        user_id:          userId,
        session_type:     sessionType,
        scheduled_at:     scheduledAt,
        status:           "pending",
        notes:            notes || null,
        member_timezone:  memberTimezone || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: memberProfile } = await db
      .from("profiles")
      .select("phone")
      .eq("id", userId)
      .single();

    const memberPhone = memberProfile?.phone ?? null;
    const smsType = sessionType === "online" ? "Online (Zoom)" : "In-Person (Houston)";

    // Always show Houston CT time (David's timezone)
    const houstonDisplay = fmtForTZ(scheduledAt, HOUSTON);
    const houstonShort   = fmtForTZ(scheduledAt, HOUSTON, true);

    // If member is in a different timezone, show their local time too
    const memberTz = memberTimezone && memberTimezone !== HOUSTON ? memberTimezone : null;
    const memberLocalDisplay = memberTz ? fmtForTZ(scheduledAt, memberTz) : null;

    const displayDate = memberLocalDisplay
      ? `${houstonDisplay}\n(${memberLocalDisplay} — your local time)`
      : houstonDisplay;

    await Promise.allSettled([
      sendEmail(
        DAVID_EMAIL,
        `📅 New session request from ${memberName}`,
        newBookingAdminEmail({
          memberName, memberEmail,
          sessionType: smsType,
          scheduledAt: displayDate,
          notes: notes ?? "",
        })
      ),
      sendEmail(
        memberEmail,
        "Booking received — David Training",
        bookingReceivedEmail({
          memberName,
          sessionType: smsType,
          scheduledAt: displayDate,
        })
      ),
      sendSMS(
        DAVID_PHONE,
        smsNewBookingDavid({ memberName, sessionType: smsType, scheduledAt: houstonShort })
      ),
    ]);

    return NextResponse.json({ booking });
  } catch (err) {
    console.error("[POST /api/bookings]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
