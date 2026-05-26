import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  sendEmail, DAVID_EMAIL,
  bookingConfirmedEmail,
  bookingCancelledByDavidEmail,
  memberCancelledEmail,
  memberCancelledAdminEmail,
} from "@/lib/email";
import {
  sendSMS, DAVID_PHONE,
  smsMemberConfirmed,
  smsMemberCancelledByDavid,
  smsMemberCancelledSelf,
  smsDavidMemberCancelled,
} from "@/lib/sms";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id }                                              = await params;
    const { status, zoomLink, davidNote, cancelledByMember } = await req.json();

    // ── Auth: require an authenticated session ───────────────
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = createServiceClient();

    // Fetch existing booking + member info (including phone)
    const { data: booking, error: fetchErr } = await db
      .from("bookings")
      .select("*, profiles(full_name, email, phone)")
      .eq("id", id)
      .single();

    if (fetchErr || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // ── Authorization ────────────────────────────────────────
    if (cancelledByMember) {
      // Members can only cancel their own bookings
      if (booking.user_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      // Only admins can confirm / cancel on David's behalf
      const { data: profile } = await db
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // ── Update the booking ───────────────────────────────────
    const updatePayload: Record<string, unknown> = { status };
    if (zoomLink  !== undefined && zoomLink  !== null) updatePayload.zoom_link  = zoomLink;
    if (davidNote !== undefined && davidNote !== null) updatePayload.david_note = davidNote;

    const { data: updated, error: updateErr } = await db
      .from("bookings")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    const memberName  = (booking.profiles as any)?.full_name ?? "Member";
    const memberEmail = (booking.profiles as any)?.email     ?? "";
    const memberPhone = (booking.profiles as any)?.phone     ?? null;
    const sessionType = booking.session_type === "online" ? "Online (Zoom)" : "In-Person (Houston)";

    const displayDate = new Date(booking.scheduled_at).toLocaleString("en-US", {
      weekday: "long", month: "long", day: "numeric",
      year: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
    });

    const shortDate = new Date(booking.scheduled_at).toLocaleString("en-US", {
      weekday: "short", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });

    // ── Send notifications ───────────────────────────────────
    if (status === "confirmed") {
      await Promise.allSettled([
        // Email → member
        memberEmail && sendEmail(
          memberEmail,
          "Your session is confirmed! 🎉 — David Training",
          bookingConfirmedEmail({ memberName, sessionType, scheduledAt: displayDate, zoomLink, davidNote })
        ),
        // SMS → member
        sendSMS(
          memberPhone,
          smsMemberConfirmed({ memberName, sessionType, scheduledAt: shortDate, zoomLink, davidNote })
        ),
      ]);

    } else if (status === "cancelled" && !cancelledByMember) {
      // David cancelled → notify member
      await Promise.allSettled([
        memberEmail && sendEmail(
          memberEmail,
          "Session update from Coach David — David Training",
          bookingCancelledByDavidEmail({ memberName, sessionType, scheduledAt: displayDate, reason: davidNote })
        ),
        sendSMS(
          memberPhone,
          smsMemberCancelledByDavid({ memberName, sessionType, scheduledAt: shortDate, reason: davidNote })
        ),
      ]);

    } else if (status === "cancelled" && cancelledByMember) {
      // Member cancelled → confirm to member + notify David (email + SMS both channels)
      await Promise.allSettled([
        // Email: member confirmation
        memberEmail && sendEmail(
          memberEmail,
          "Your session has been cancelled — David Training",
          memberCancelledEmail({ memberName, scheduledAt: displayDate })
        ),
        // Email: David alert
        sendEmail(
          DAVID_EMAIL,
          `⚠️ ${memberName} cancelled their session`,
          memberCancelledAdminEmail({ memberName, memberEmail, scheduledAt: displayDate })
        ),
        // SMS: member confirmation
        sendSMS(
          memberPhone,
          smsMemberCancelledSelf({ memberName, scheduledAt: shortDate })
        ),
        // SMS: David alert
        sendSMS(
          DAVID_PHONE,
          smsDavidMemberCancelled({ memberName, sessionType, scheduledAt: shortDate })
        ),
      ]);
    }

    return NextResponse.json({ booking: updated });
  } catch (err) {
    console.error("[PATCH /api/bookings/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
