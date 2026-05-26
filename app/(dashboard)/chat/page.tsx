import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GroupChat from "./GroupChat";

export type ChatMessage = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
};

export default async function ChatPage() {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = createServiceClient();

  const [
    { data: messages },
    { data: membership },
    { data: profile },
  ] = await Promise.all([
    db
      .from("group_messages")
      .select("id, user_id, content, created_at, profiles(full_name)")
      .order("created_at", { ascending: true })
      .limit(100),
    db.from("memberships").select("plan").eq("user_id", user.id).single(),
    db.from("profiles").select("full_name").eq("id", user.id).single(),
  ]);

  return (
    <GroupChat
      initialMessages={(messages as unknown as ChatMessage[]) ?? []}
      userId={user.id}
      userName={profile?.full_name ?? user.email?.split("@")[0] ?? "Member"}
      userPlan={membership?.plan ?? "base"}
    />
  );
}
