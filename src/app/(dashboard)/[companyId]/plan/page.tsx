import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/db/server";

interface Props {
  params: { companyId: string };
}

export default async function PlanPage({ params }: Props) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: company }, { data: actionItems }, { data: goals }] = await Promise.all([
    supabase.from("companies").select("name").eq("id", params.companyId).single(),
    supabase
      .from("action_items")
      .select("*")
      .eq("company_id", params.companyId)
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("goals")
      .select("*")
      .eq("company_id", params.companyId)
      .order("level", { ascending: true }),
  ]);

  const openItems = (actionItems ?? []).filter((i) => i.status !== "done");
  const l1Goals = (goals ?? []).filter((g) => g.level === 1);
  const l2Goals = (goals ?? []).filter((g) => g.level === 2);

  const STATUS_COLORS: Record<string, string> = {
    on_track: "text-green-400",
    at_risk: "text-amber-400",
    off_track: "text-red-400",
    not_started: "text-slate-400",
    complete: "text-slate-500 line-through",
  };

  const PRIORITY_COLORS: Record<string, string> = {
    high: "bg-red-900/20 text-red-400 border-red-800/30",
    medium: "bg-amber-900/20 text-amber-400 border-amber-800/30",
    low: "bg-slate-800/60 text-slate-400 border-slate-700/40",
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Execution Plan</h1>
          <p className="text-slate-400 text-sm mt-1">{company?.name}</p>
        </div>

        {/* Level 1 Goals */}
        {l1Goals.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-e3-900/30 text-e3-400 text-xs flex items-center justify-center font-bold">L1</span>
              Company Goals
            </h2>
            <div className="space-y-2">
              {l1Goals.map((goal) => (
                <div key={goal.id} className="glass-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${STATUS_COLORS[goal.status] ?? "text-slate-200"}`}>
                        {goal.title}
                      </p>
                      {goal.description && (
                        <p className="text-xs text-slate-500 mt-1">{goal.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                        {goal.owner && <span>Owner: {goal.owner}</span>}
                        {goal.due_date && <span>Due: {goal.due_date}</span>}
                        {goal.success_metric && <span>Metric: {goal.success_metric}</span>}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 shrink-0 capitalize">
                      {goal.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Level 2 Goals */}
        {l2Goals.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-slate-800 text-slate-400 text-xs flex items-center justify-center font-bold">L2</span>
              Quarterly Goals
            </h2>
            <div className="space-y-2">
              {l2Goals.map((goal) => (
                <div key={goal.id} className="glass-card p-3">
                  <p className={`text-sm ${STATUS_COLORS[goal.status] ?? "text-slate-300"}`}>
                    {goal.title}
                  </p>
                  {goal.owner && (
                    <p className="text-xs text-slate-600 mt-1">Owner: {goal.owner}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Action Items */}
        <section>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">
            Open Action Items
            <span className="ml-2 text-xs text-slate-500 font-normal">({openItems.length})</span>
          </h2>
          {openItems.length === 0 ? (
            <p className="text-sm text-slate-600">No open action items. Start a conversation to generate tasks.</p>
          ) : (
            <div className="space-y-1.5">
              {openItems.map((item) => (
                <div key={item.id} className="glass-card px-4 py-3 flex items-start gap-3">
                  <div className="w-4 h-4 rounded border border-slate-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200">{item.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                      {item.owner && <span>{item.owner}</span>}
                      {item.due_date && <span>Due {item.due_date}</span>}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-xs px-1.5 py-0.5 rounded border ${
                      PRIORITY_COLORS[item.priority] ?? PRIORITY_COLORS.medium
                    }`}
                  >
                    {item.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {(l1Goals.length === 0 && l2Goals.length === 0 && openItems.length === 0) && (
          <div className="text-center py-16">
            <p className="text-slate-500 mb-2">No plan data yet.</p>
            <p className="text-slate-600 text-sm">
              Ask your AI Operating Partner: &ldquo;What should we focus on this quarter?&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
