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

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionType, scheduledAt, notes, memberName, memberEmail } =
      await req.json();

    if (!userId || !sessionType || !scheduledAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = createServiceClient();

    // Create the booking
    const { data: booking, error } = await db
      .from("bookings")
      .insert({
        user_id:      userId,
        session_type: sessionType,
        scheduled_at: scheduledAt,
        status:       "pending",
        notes:        notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch member's phone number for SMS
    const { data: memberProfile } = await db
      .from("profiles")
      .select("phone")
      .eq("id", userId)
      .single();

    const memberPhone = memberProfile?.phone ?? null;

    const displayDate = new Date(scheduledAt).toLocaleString("en-US", {
      weekday: "long", month: "long", day: "numeric",
      year: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
    });

    const shortDate = new Date(scheduledAt).toLocaleString("en-US", {
      weekday: "short", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });

    const smsType = sessionType === "online" ? "Online (Zoom)" : "In-Person (Houston)";

    // Send all notifications in parallel (non-blocking)
    await Promise.allSettled([
      // ── Email: notify David ──
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
      // ── Email: confirm receipt to member ──
      sendEmail(
        memberEmail,
        "Booking received — David Training",
        bookingReceivedEmail({
          memberName,
          sessionType: smsType,
          scheduledAt: displayDate,
        })
      ),
      // ── SMS: ping David immediately ──
      sendSMS(
        DAVID_PHONE,
        smsNewBookingDavid({ memberName, sessionType: smsType, scheduledAt: shortDate })
      ),
    ]);

    return NextResponse.json({ booking });
  } catch (err) {
    console.error("[POST /api/bookings]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
