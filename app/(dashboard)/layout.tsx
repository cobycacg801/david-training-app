import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = createServiceClient();

  const [{ data: profile }, { data: membership }] = await Promise.all([
    db.from("profiles").select("full_name, role").eq("id", user.id).single(),
    db.from("memberships").select("plan, status").eq("user_id", user.id).single(),
  ]);

  const userName    = profile?.full_name ?? user.email?.split("@")[0] ?? "Member";
  const userInitial = (userName[0] ?? "M").toUpperCase();
  const plan        = membership?.plan ?? "base";
  const isAdmin     = profile?.role === "admin";

  return (
    <div className="sidebar-layout" style={{ background: "#080808" }}>
      <Sidebar
        userName={userName}
        userInitial={userInitial}
        plan={plan}
        isAdmin={isAdmin}
      />
      <main className="sidebar-content" style={{ padding: "32px 36px", minHeight: "100vh" }}>
        {children}
      </main>
    </div>
  );
}
