import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProgressTracker from "./ProgressTracker";

export default async function ProgressPage() {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch this user's progress uploads (service role bypasses RLS)
  const db = createServiceClient();
  const { data: uploads } = await db
    .from("progress_uploads")
    .select("id, file_url, file_type, note, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <ProgressTracker uploads={uploads || []} userId={user.id} />;
}
