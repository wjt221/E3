import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/db/client";

export default async function RootPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's primary company or go to company selector
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (profile?.company_id) {
    redirect(`/dashboard/${profile.company_id}/chat`);
  }

  redirect("/dashboard");
}
