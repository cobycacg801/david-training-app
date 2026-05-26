import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BookingPage from "./BookingPage";

export default async function SchedulePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = createServiceClient();

  const [{ data: profile }, { data: bookings }] = await Promise.all([
    db.from("profiles").select("full_name, email").eq("id", user.id).single(),
    db
      .from("bookings")
      .select("id, session_type, scheduled_at, status, notes, zoom_link, david_note, created_at")
      .eq("user_id", user.id)
      .order("scheduled_at", { ascending: false }),
  ]);

  return (
    <BookingPage
      userId={user.id}
      userName={profile?.full_name ?? user.email?.split("@")[0] ?? "Member"}
      userEmail={profile?.email ?? user.email ?? ""}
      bookings={(bookings as any[]) ?? []}
    />
  );
}
