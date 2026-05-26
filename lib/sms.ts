import twilio from "twilio";

// ── Config ────────────────────────────────────────────────────
export const DAVID_PHONE = process.env.DAVID_PHONE ?? "";

// ── Base send ─────────────────────────────────────────────────
// Non-fatal — logs errors, never throws, never blocks the main flow.
// Silently skips if env vars are missing or `to` is empty.
export async function sendSMS(
  to: string | null | undefined,
  body: string
): Promise<void> {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_FROM;

  if (!to || !sid || !token || !from) return;

  try {
    const client = twilio(sid, token);
    await client.messages.create({ from, to, body });
    console.log(`[SMS] ✓ Sent to ${to.slice(0, 6)}***`);
  } catch (err) {
    console.error("[SMS error]", err);
    // Never throw — SMS failure should not break booking flow
  }
}

// ── Message templates ─────────────────────────────────────────

/** SMS to David: a new session was requested */
export function smsNewBookingDavid({
  memberName,
  sessionType,
  scheduledAt,
}: {
  memberName: string;
  sessionType: string;
  scheduledAt: string; // e.g. "Mon, Jun 2 at 10:00 AM"
}): string {
  return `📅 New session request!\n${memberName} — ${sessionType}\n${scheduledAt}\nCheck your admin panel to confirm.`;
}

/** SMS to member: session confirmed by David */
export function smsMemberConfirmed({
  memberName,
  sessionType,
  scheduledAt,
  zoomLink,
  davidNote,
}: {
  memberName: string;
  sessionType: string;
  scheduledAt: string;
  zoomLink?: string | null;
  davidNote?: string | null;
}): string {
  let msg = `✅ Session confirmed, ${memberName}!\n${sessionType} with Coach David\n${scheduledAt}`;
  if (zoomLink) msg += `\nZoom: ${zoomLink}`;
  if (davidNote) msg += `\n"${davidNote}"`;
  msg += `\n— David Training 💪`;
  return msg;
}

/** SMS to member: David cancelled their session */
export function smsMemberCancelledByDavid({
  memberName,
  sessionType,
  scheduledAt,
  reason,
}: {
  memberName: string;
  sessionType: string;
  scheduledAt: string;
  reason?: string | null;
}): string {
  let msg = `⚠️ Hi ${memberName}, your ${sessionType} session on ${scheduledAt} has been cancelled by Coach David.`;
  if (reason) msg += ` Reason: "${reason}"`;
  msg += ` Check your email for details.`;
  return msg;
}

/** SMS to member: their own cancellation confirmed */
export function smsMemberCancelledSelf({
  memberName,
  scheduledAt,
}: {
  memberName: string;
  scheduledAt: string;
}): string {
  return `✓ Your session on ${scheduledAt} has been cancelled, ${memberName}. Hope to see you back soon! — David Training`;
}

/** SMS to David: a member cancelled */
export function smsDavidMemberCancelled({
  memberName,
  sessionType,
  scheduledAt,
}: {
  memberName: string;
  sessionType: string;
  scheduledAt: string;
}): string {
  return `⚠️ ${memberName} cancelled their ${sessionType} session on ${scheduledAt}.`;
}

/** SMS to member: 24-hour session reminder */
export function smsMemberReminder({
  memberName,
  sessionType,
  scheduledAt,
  zoomLink,
}: {
  memberName: string;
  sessionType: string;
  scheduledAt: string;
  zoomLink?: string | null;
}): string {
  let msg = `⏰ Reminder, ${memberName}! Your ${sessionType} session with Coach David is tomorrow — ${scheduledAt}.`;
  if (zoomLink) msg += ` Zoom: ${zoomLink}`;
  msg += ` 💪`;
  return msg;
}
