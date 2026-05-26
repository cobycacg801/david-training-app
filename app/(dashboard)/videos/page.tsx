import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import VideoLibrary from "./VideoLibrary";

export default async function VideosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = createServiceClient();

  const [{ data: videos }, { data: membership }] = await Promise.all([
    db
      .from("videos")
      .select("id, title, description, duration, category, thumbnail_url, video_url, calories, min_plan")
      .eq("published", true)
      .order("created_at", { ascending: false }),
    db
      .from("memberships")
      .select("plan")
      .eq("user_id", user.id)
      .single(),
  ]);

  return (
    <VideoLibrary
      videos={videos || []}
      userPlan={membership?.plan ?? "base"}
    />
  );
}
