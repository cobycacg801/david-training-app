import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import PrivateChat from "./PrivateChat";
import AdminInbox from "./AdminInbox";

export default async function MessagesPage() {
  const db = createServiceClient();

  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await db
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  const { data: membership } = await db
    .from("memberships")
    .select("plan")
    .eq("user_id", user.id)
    .single();

  const userPlan  = membership?.plan ?? "base";
  const isAdmin   = profile?.role === "admin";
  const userName  = profile?.full_name ?? "Member";

  // Get David's profile (admin)
  const { data: davidProfile } = await db
    .from("profiles")
    .select("id, full_name")
    .eq("role", "admin")
    .single();

  if (!davidProfile) {
    return (
      <div style={{ padding: 40, color: "#71717a", fontSize: 13 }}>
        Chat is not available yet. Please check back soon.
      </div>
    );
  }

  // ── Admin view: load ALL private messages ─────────────────────
  if (isAdmin) {
    const { data: messages } = await db
      .from("private_messages")
      .select("id, sender_id, receiver_id, content, read, created_at")
      .or(`sender_id.eq.${davidProfile.id},receiver_id.eq.${davidProfile.id}`)
      .order("created_at", { ascending: true });

    // Build member name map
    const memberIds = [...new Set(
      (messages ?? [])
        .map(m => m.sender_id === davidProfile.id ? m.receiver_id : m.sender_id)
    )];

    const memberNames: Record<string, string> = {};
    if (memberIds.length > 0) {
      const { data: profiles } = await db
        .from("profiles")
        .select("id, full_name")
        .in("id", memberIds);
      for (const p of profiles ?? []) {
        memberNames[p.id] = p.full_name ?? "Member";
      }
    }

    return (
      <div style={{ padding: "0 0 32px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
            Member Inbox
          </h1>
          <p style={{ fontSize: 13, color: "#71717a" }}>
            Private messages from your Elite members
          </p>
        </div>
        <AdminInbox
          davidId={davidProfile.id}
          initialMessages={messages ?? []}
          memberNames={memberNames}
        />
      </div>
    );
  }

  // ── Member view: load only their conversation ─────────────────
  const { data: messages } = await db
    .from("private_messages")
    .select("id, sender_id, receiver_id, content, read, created_at")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${davidProfile.id}),` +
      `and(sender_id.eq.${davidProfile.id},receiver_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true });

  return (
    <div style={{ padding: "0 0 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
          Private Chat
        </h1>
        <p style={{ fontSize: 13, color: "#71717a" }}>
          Your direct line to Coach David — Elite members only
        </p>
      </div>
      <PrivateChat
        initialMessages={messages ?? []}
        userId={user.id}
        userName={userName}
        userPlan={userPlan}
        davidId={davidProfile.id}
        davidName={davidProfile.full_name ?? "Coach David"}
      />
    </div>
  );
}
