import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NutritionLibrary from "./NutritionLibrary";

export default async function NutritionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = createServiceClient();

  const [{ data: recipes }, { data: membership }] = await Promise.all([
    db
      .from("recipes")
      .select("id, title, description, category, calories, prep_time, ingredients, instructions, image_url, min_plan")
      .eq("published", true)
      .order("created_at", { ascending: false }),
    db
      .from("memberships")
      .select("plan")
      .eq("user_id", user.id)
      .single(),
  ]);

  return (
    <NutritionLibrary
      recipes={recipes || []}
      userPlan={membership?.plan ?? "base"}
    />
  );
}
