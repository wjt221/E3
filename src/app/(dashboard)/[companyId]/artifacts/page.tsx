import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/db/client";
import { listArtifacts } from "@/lib/db/queries";
import type { Artifact, ArtifactType } from "@/types";

interface Props {
  params: { companyId: string };
}

const ARTIFACT_TYPE_LABELS: Record<ArtifactType, string> = {
  company_profile: "Company Profile",
  value_creation_thesis: "Value Creation Thesis",
  strategic_priorities: "Strategic Priorities",
  execution_plan: "Execution Plan",
  kpi_tree: "KPI Tree",
  risk_register: "Risk Register",
  board_update: "Board Update",
  meeting_summary: "Meeting Summary",
  action_item_list: "Action Items",
  specialist_recommendations: "Specialist Recommendations",
  playbook_entry: "Playbook",
};

export default async function ArtifactsPage({ params }: Props) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [artifacts, { data: company }] = await Promise.all([
    listArtifacts(supabase, params.companyId),
    supabase.from("companies").select("name").eq("id", params.companyId).single(),
  ]);

  const grouped = artifacts.reduce((acc, artifact) => {
    const key = artifact.type as ArtifactType;
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(artifact);
    return acc;
  }, {} as Record<ArtifactType, Artifact[]>);

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-slate-100">Artifacts</h1>
          <p className="text-slate-400 text-sm mt-1">
            {company?.name} · {artifacts.length} artifact{artifacts.length !== 1 ? "s" : ""} created
          </p>
        </div>

        {artifacts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 mb-2">No artifacts yet.</p>
            <p className="text-slate-600 text-sm">
              Start a conversation with your AI Operating Partner to generate artifacts.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {(Object.keys(ARTIFACT_TYPE_LABELS) as ArtifactType[])
              .filter((type) => grouped[type]?.length)
              .map((type) => (
                <div key={type}>
                  <h2 className="text-sm font-semibold text-slate-300 mb-3">
                    {ARTIFACT_TYPE_LABELS[type]}
                  </h2>
                  <div className="space-y-2">
                    {(grouped[type] ?? []).map((artifact) => (
                      <div key={artifact.id} className="glass-card p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-slate-100">{artifact.title}</h3>
                            <p className="text-xs text-slate-500 mt-1">
                              Version {artifact.version} · Updated{" "}
                              {new Date(artifact.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                          <a
                            href={`/api/artifacts/${artifact.id}?company_id=${params.companyId}`}
                            className="text-xs text-e3-400 hover:text-e3-300 ml-4 shrink-0"
                          >
                            View JSON →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
