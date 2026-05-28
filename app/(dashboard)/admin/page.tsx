import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminPanel from "./AdminPanel";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = createServiceClient();

  // Gate: admins only
  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  // Fetch all platform data in parallel
  const [
    { data: members },
    { data: videos },
    { data: recipes },
    { data: bookings },
  ] = await Promise.all([
    db
      .from("profiles")
      .select("id, full_name, email, role, created_at, memberships(plan, status)")
      .order("created_at", { ascending: false }),
    db
      .from("videos")
      .select("id, title, description, duration, category, thumbnail_url, video_url, calories, min_plan, published, created_at")
      .order("created_at", { ascending: false }),
    db
      .from("recipes")
      .select("id, title, description, category, calories, prep_time, ingredients, instructions, image_url, min_plan, published, created_at")
      .order("created_at", { ascending: false }),
    db
      .from("bookings")
      .select("id, user_id, session_type, scheduled_at, status, notes, zoom_link, david_note, created_at, profiles(full_name, email)")
      .order("scheduled_at", { ascending: false }),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.davidabrajin.com";
  const calendarUrl = `${appUrl}/api/calendar?token=${process.env.CRON_SECRET ?? ""}`;

  return (
    <AdminPanel
      members={(members as any[]) ?? []}
      videos={(videos as any[]) ?? []}
      recipes={(recipes as any[]) ?? []}
      bookings={(bookings as any[]) ?? []}
      calendarUrl={calendarUrl}
    />
  );
}
