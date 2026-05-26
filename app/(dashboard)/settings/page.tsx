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
      .select("full_name, email, phone, avatar_url, fitness_goal, height, weight, notify_sms, notify_email")
      .eq("id", user.id)
      .single(),
    db.from("memberships")
      .select("plan, status, stripe_customer_id, current_period_end")
      .eq("user_id", user.id)
      .single(),
  ]);

  return (
    <SettingsPage
      userId={user.id}
      fullName={profile?.full_name ?? ""}
      email={profile?.email ?? user.email ?? ""}
      phone={profile?.phone ?? ""}
      avatarUrl={profile?.avatar_url ?? ""}
      fitnessGoal={profile?.fitness_goal ?? ""}
      height={profile?.height ?? ""}
      weight={profile?.weight ?? ""}
      notifySms={profile?.notify_sms ?? true}
      notifyEmail={profile?.notify_email ?? true}
      plan={membership?.plan ?? "base"}
      membershipStatus={membership?.status ?? "active"}
      hasStripe={!!membership?.stripe_customer_id}
      nextChargeDate={membership?.current_period_end ?? null}
    />
  );
}
