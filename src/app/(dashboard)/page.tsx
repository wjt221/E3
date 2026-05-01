import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/db/server";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (profile?.company_id) {
    redirect(`/dashboard/${profile.company_id}/chat`);
  }

  // Multi-company user: show company selector
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, industry, stage")
    .order("name");

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-lg w-full">
        <h1 className="text-2xl font-semibold text-slate-100 mb-2">
          Select a company workspace
        </h1>
        <p className="text-slate-400 mb-6">
          You have access to multiple company workspaces. Choose one to continue.
        </p>
        <div className="space-y-2">
          {(companies ?? []).map((company) => (
            <a
              key={company.id}
              href={`/dashboard/${company.id}/chat`}
              className="flex items-center justify-between p-4 glass-card hover:border-slate-700 transition-colors group"
            >
              <div>
                <p className="font-medium text-slate-100 group-hover:text-white">
                  {company.name}
                </p>
                {company.industry && (
                  <p className="text-sm text-slate-500 mt-0.5">
                    {company.industry}
                    {company.stage ? ` · ${company.stage.replace("_", " ")}` : ""}
                  </p>
                )}
              </div>
              <svg
                className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
