import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/db/client";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile + accessible companies
  const [{ data: profile }, { data: companies }] = await Promise.all([
    supabase.from("user_profiles").select("*, organizations(*)").eq("id", user.id).single(),
    supabase.from("companies").select("id, name, industry, stage").order("name"),
  ]);

  if (!profile) {
    redirect("/login?error=no_profile");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar
        userProfile={{
          id: profile.id,
          email: user.email ?? "",
          full_name: profile.full_name,
          role: profile.role as import("@/types").UserRole,
        }}
        companies={companies ?? []}
        currentCompanyId={profile.company_id ?? undefined}
      />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
