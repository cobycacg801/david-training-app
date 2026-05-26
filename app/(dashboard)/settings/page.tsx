import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsPage from "./SettingsPage";

export default async function Settings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = createServiceClient();

  const [{ data: profile }, { data: membership }] = await Promise.all([
    db.from("profiles")
      .select("full_name, email, phone")
      .eq("id", user.id)
      .single(),
    db.from("memberships")
      .select("plan, status")
      .eq("user_id", user.id)
      .single(),
  ]);

  return (
    <SettingsPage
      userId={user.id}
      fullName={profile?.full_name ?? ""}
      email={profile?.email ?? user.email ?? ""}
      phone={profile?.phone ?? ""}
      plan={membership?.plan ?? "base"}
    />
  );
}
