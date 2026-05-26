import { Resend } from "resend";

// Configure these in .env.local
export const FROM_ADDRESS = process.env.EMAIL_FROM ?? "David Training <noreply@davidtraining.app>";
export const DAVID_EMAIL  = process.env.DAVID_EMAIL ?? "david@davidtraining.app";
export const APP_URL      = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Non-fatal email send — booking always works even if email fails */
export async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // silently skip if not configured
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });
    if (error) console.error("[email] Resend error:", error);
  } catch (err) {
    console.error("[email] Send failed:", err);
  }
}

// ── Email Templates ───────────────────────────────────────────

function base(content: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
  .wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
  .header{background:#050505;padding:28px 32px;display:flex;align-items:center;gap:12px}
  .logo{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,rgba(0,242,255,0.2),rgba(139,92,246,0.25));border:1px solid rgba(0,242,255,0.3);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;color:#00f2ff;text-align:center;line-height:36px}
  .brand{font-size:16px;font-weight:800;color:#fff}
  .body{padding:32px}
  .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:20px}
  h2{font-size:22px;font-weight:900;color:#09090b;margin:0 0 12px}
  p{font-size:14px;color:#52525b;line-height:1.6;margin:0 0 12px}
  .detail-box{background:#f9f9fb;border:1px solid #e4e4e7;border-radius:10px;padding:16px 20px;margin:20px 0}
  .detail-row{display:flex;gap:8px;margin-bottom:8px;font-size:13px}
  .detail-label{color:#a1a1aa;font-weight:600;min-width:110px}
  .detail-value{color:#09090b;font-weight:600}
  .cta{display:inline-block;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:700;margin-top:8px}
  .footer{background:#fafafa;border-top:1px solid #f0f0f0;padding:16px 32px;font-size:11px;color:#a1a1aa;text-align:center}
</style></head><body>
<div class="wrap">
  <div class="header">
    <div class="logo">D</div>
    <span class="brand">David Training</span>
  </div>
  <div class="body">${content}</div>
  <div class="footer">David Training — Elite Coaching Platform &nbsp;·&nbsp; <a href="${APP_URL}" style="color:#a1a1aa">Open app</a></div>
</div>
</body></html>`;
}

/** To David: new booking received */
export function newBookingAdminEmail(opts: {
  memberName: string; memberEmail: string;
  sessionType: string; scheduledAt: string; notes: string;
}) {
  return base(`
    <div class="badge" style="background:#fff7ed;color:#c2410c;border:1px solid #fed7aa">NEW BOOKING</div>
    <h2>New session request 📅</h2>
    <p>A member just booked a session with you. Review it in your admin panel.</p>
    <div class="detail-box">
      <div class="detail-row"><span class="detail-label">Member</span><span class="detail-value">${opts.memberName}</span></div>
      <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${opts.memberEmail}</span></div>
      <div class="detail-row"><span class="detail-label">Session type</span><span class="detail-value">${opts.sessionType}</span></div>
      <div class="detail-row"><span class="detail-label">Requested date</span><span class="detail-value">${opts.scheduledAt}</span></div>
      ${opts.notes ? `<div class="detail-row"><span class="detail-label">Notes</span><span class="detail-value">${opts.notes}</span></div>` : ""}
    </div>
    <a href="${APP_URL}/admin" class="cta" style="background:#09090b;color:#fff">Review in Admin Panel →</a>
  `);
}

/** To member: booking received, pending confirmation */
export function bookingReceivedEmail(opts: {
  memberName: string; sessionType: string; scheduledAt: string;
}) {
  return base(`
    <div class="badge" style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0">BOOKING RECEIVED</div>
    <h2>We got your request, ${opts.memberName}! 🙌</h2>
    <p>Coach David has been notified and will confirm your session shortly. You'll receive another email once it's confirmed.</p>
    <div class="detail-box">
      <div class="detail-row"><span class="detail-label">Session type</span><span class="detail-value">${opts.sessionType}</span></div>
      <div class="detail-row"><span class="detail-label">Requested date</span><span class="detail-value">${opts.scheduledAt}</span></div>
      <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value" style="color:#f59e0b">⏳ Pending confirmation</span></div>
    </div>
    <a href="${APP_URL}/schedule" class="cta" style="background:#09090b;color:#fff">View your bookings →</a>
  `);
}

/** To member: booking confirmed by David */
export function bookingConfirmedEmail(opts: {
  memberName: string; sessionType: string; scheduledAt: string;
  zoomLink?: string; davidNote?: string;
}) {
  return base(`
    <div class="badge" style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0">CONFIRMED ✓</div>
    <h2>Your session is confirmed! 🎉</h2>
    <p>Coach David has confirmed your session. See you there!</p>
    <div class="detail-box">
      <div class="detail-row"><span class="detail-label">Session type</span><span class="detail-value">${opts.sessionType}</span></div>
      <div class="detail-row"><span class="detail-label">Date & time</span><span class="detail-value">${opts.scheduledAt}</span></div>
      <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value" style="color:#16a34a">✓ Confirmed</span></div>
      ${opts.zoomLink ? `<div class="detail-row"><span class="detail-label">Zoom link</span><span class="detail-value"><a href="${opts.zoomLink}" style="color:#2563eb">${opts.zoomLink}</a></span></div>` : ""}
      ${opts.davidNote ? `<div class="detail-row"><span class="detail-label">Note from David</span><span class="detail-value">${opts.davidNote}</span></div>` : ""}
    </div>
    <a href="${APP_URL}/schedule" class="cta" style="background:#09090b;color:#fff">View your schedule →</a>
  `);
}

/** To member: booking cancelled by David */
export function bookingCancelledByDavidEmail(opts: {
  memberName: string; sessionType: string; scheduledAt: string; reason?: string;
}) {
  return base(`
    <div class="badge" style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca">SESSION CANCELLED</div>
    <h2>Session update from Coach David</h2>
    <p>Unfortunately, your upcoming session has been cancelled. We're sorry for the inconvenience — please rebook at a time that works for you.</p>
    <div class="detail-box">
      <div class="detail-row"><span class="detail-label">Session type</span><span class="detail-value">${opts.sessionType}</span></div>
      <div class="detail-row"><span class="detail-label">Original date</span><span class="detail-value">${opts.scheduledAt}</span></div>
      ${opts.reason ? `<div class="detail-row"><span class="detail-label">Reason</span><span class="detail-value">${opts.reason}</span></div>` : ""}
    </div>
    <a href="${APP_URL}/schedule" class="cta" style="background:#09090b;color:#fff">Book a new session →</a>
  `);
}

/** To member: cancelled by member — confirmation + notify David */
export function memberCancelledEmail(opts: { memberName: string; scheduledAt: string }) {
  return base(`
    <div class="badge" style="background:#fefce8;color:#92400e;border:1px solid #fde68a">CANCELLED</div>
    <h2>Your session has been cancelled</h2>
    <p>We've cancelled your session as requested. You can book a new one anytime.</p>
    <div class="detail-box">
      <div class="detail-row"><span class="detail-label">Cancelled session</span><span class="detail-value">${opts.scheduledAt}</span></div>
    </div>
    <a href="${APP_URL}/schedule" class="cta" style="background:#09090b;color:#fff">Book again →</a>
  `);
}

/** To David: member cancelled their session */
export function memberCancelledAdminEmail(opts: {
  memberName: string; memberEmail: string; scheduledAt: string;
}) {
  return base(`
    <div class="badge" style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca">CANCELLATION</div>
    <h2>A member cancelled their session</h2>
    <div class="detail-box">
      <div class="detail-row"><span class="detail-label">Member</span><span class="detail-value">${opts.memberName}</span></div>
      <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${opts.memberEmail}</span></div>
      <div class="detail-row"><span class="detail-label">Was scheduled</span><span class="detail-value">${opts.scheduledAt}</span></div>
    </div>
    <a href="${APP_URL}/admin" class="cta" style="background:#09090b;color:#fff">View bookings →</a>
  `);
}

/** To member: 24h reminder */
export function sessionReminderEmail(opts: {
  memberName: string; sessionType: string; scheduledAt: string; zoomLink?: string;
}) {
  return base(`
    <div class="badge" style="background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe">REMINDER — TOMORROW</div>
    <h2>Your session is tomorrow! ⚡</h2>
    <p>Just a reminder — you have a session with Coach David tomorrow. Get ready!</p>
    <div class="detail-box">
      <div class="detail-row"><span class="detail-label">Session type</span><span class="detail-value">${opts.sessionType}</span></div>
      <div class="detail-row"><span class="detail-label">Date & time</span><span class="detail-value">${opts.scheduledAt}</span></div>
      ${opts.zoomLink ? `<div class="detail-row"><span class="detail-label">Zoom link</span><span class="detail-value"><a href="${opts.zoomLink}" style="color:#2563eb">${opts.zoomLink}</a></span></div>` : ""}
    </div>
    <a href="${APP_URL}/schedule" class="cta" style="background:#09090b;color:#fff">View details →</a>
  `);
}
