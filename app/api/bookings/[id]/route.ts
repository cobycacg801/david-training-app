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

function buildDisplayDate(isoStr: string, memberTz: string | null, short = false): string {
  const houstonStr = fmtForTZ(isoStr, HOUSTON, short);
  if (!memberTz || memberTz === HOUSTON) return houstonStr;
  const localStr = fmtForTZ(isoStr, memberTz, short);
  return short
    ? `${houstonStr} / ${localStr} (your time)`
    : `${houstonStr}\n(${localStr} — your local time)`;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id }                                              = await params;
    const { status, zoomLink, davidNote, cancelledByMember } = await req.json();

    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = createServiceClient();

    const { data: booking, error: fetchErr } = await db
      .from("bookings")
      .select("*, profiles(full_name, email, phone)")
      .eq("id", id)
      .single();

    if (fetchErr || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (cancelledByMember) {
      if (booking.user_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      const { data: profile } = await db
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

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

    const memberName    = (booking.profiles as any)?.full_name ?? "Member";
    const memberEmail   = (booking.profiles as any)?.email     ?? "";
    const memberPhone   = (booking.profiles as any)?.phone     ?? null;
    const memberTz      = booking.member_timezone ?? null;
    const sessionType   = booking.session_type === "online" ? "Online (Zoom)" : "In-Person (Houston)";

    const displayDate = buildDisplayDate(booking.scheduled_at, memberTz);
    const shortDate   = buildDisplayDate(booking.scheduled_at, memberTz, true);

    if (status === "confirmed") {
      await Promise.allSettled([
        memberEmail && sendEmail(
          memberEmail,
          "Your session is confirmed! 🎉 — David Training",
          bookingConfirmedEmail({ memberName, sessionType, scheduledAt: displayDate, zoomLink, davidNote })
        ),
        sendSMS(
          memberPhone,
          smsMemberConfirmed({ memberName, sessionType, scheduledAt: shortDate, zoomLink, davidNote })
        ),
      ]);

    } else if (status === "cancelled" && !cancelledByMember) {
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
      await Promise.allSettled([
        memberEmail && sendEmail(
          memberEmail,
          "Your session has been cancelled — David Training",
          memberCancelledEmail({ memberName, scheduledAt: displayDate })
        ),
        sendEmail(
          DAVID_EMAIL,
          `⚠️ ${memberName} cancelled their session`,
          memberCancelledAdminEmail({ memberName, memberEmail, scheduledAt: displayDate })
        ),
        sendSMS(
          memberPhone,
          smsMemberCancelledSelf({ memberName, scheduledAt: shortDate })
        ),
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
