"use client";

import { useState } from "react";
import Link from "next/link";
import type { Artifact, ArtifactType } from "@/types";

interface ArtifactPanelProps {
  companyId: string;
  artifacts: Artifact[];
}

const ARTIFACT_ICONS: Record<ArtifactType, string> = {
  company_profile: "🏢",
  value_creation_thesis: "💡",
  strategic_priorities: "🎯",
  execution_plan: "📋",
  kpi_tree: "📊",
  risk_register: "⚠️",
  board_update: "👔",
  meeting_summary: "📝",
  action_item_list: "✅",
  specialist_recommendations: "🤝",
  playbook_entry: "📖",
};

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
  specialist_recommendations: "Specialist Recs",
  playbook_entry: "Playbook",
};

const PRIORITY_ORDER: ArtifactType[] = [
  "company_profile",
  "value_creation_thesis",
  "strategic_priorities",
  "execution_plan",
  "kpi_tree",
  "risk_register",
  "board_update",
  "meeting_summary",
  "action_item_list",
  "specialist_recommendations",
  "playbook_entry",
];

export function ArtifactPanel({ companyId, artifacts }: ArtifactPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Group by type, show latest version only
  const latestByType = new Map<ArtifactType, Artifact>();
  const recentAll = [...artifacts]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  for (const artifact of recentAll) {
    if (!latestByType.has(artifact.type as ArtifactType)) {
      latestByType.set(artifact.type as ArtifactType, artifact);
    }
  }

  const sorted = PRIORITY_ORDER
    .map((type) => latestByType.get(type))
    .filter((a): a is Artifact => !!a);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-400 mb-1">No artifacts yet</p>
        <p className="text-xs text-slate-600">
          Artifacts are created automatically as you work with your AI Operating Partner.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between shrink-0">
        <h2 className="text-sm font-semibold text-slate-200">Artifacts</h2>
        <span className="text-xs text-slate-500">{sorted.length} of {PRIORITY_ORDER.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sorted.map((artifact) => (
          <ArtifactCard
            key={artifact.id}
            artifact={artifact}
            companyId={companyId}
            isExpanded={expandedId === artifact.id}
            onToggle={() => setExpandedId(expandedId === artifact.id ? null : artifact.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ArtifactCard({
  artifact,
  companyId,
  isExpanded,
  onToggle,
}: {
  artifact: Artifact;
  companyId: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const type = artifact.type as ArtifactType;
  const icon = ARTIFACT_ICONS[type] ?? "📄";
  const label = ARTIFACT_TYPE_LABELS[type] ?? type;
  const content = artifact.content as Record<string, unknown>;

  return (
    <div className="artifact-card">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-800/40 transition-colors text-left"
      >
        <span className="text-base shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-200 truncate">{artifact.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            v{artifact.version} · {new Date(artifact.updated_at).toLocaleDateString()}
          </p>
        </div>
        <svg
          className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-800/60 px-3 py-3 animate-fade-in">
          <ArtifactPreview type={type} content={content} />
          <Link
            href={`/api/artifacts/${artifact.id}?company_id=${companyId}`}
            className="mt-3 block text-center text-xs text-e3-400 hover:text-e3-300 transition-colors"
          >
            View full artifact →
          </Link>
        </div>
      )}
    </div>
  );
}

function ArtifactPreview({
  type,
  content,
}: {
  type: ArtifactType;
  content: Record<string, unknown>;
}) {
  switch (type) {
    case "company_profile":
      return (
        <div className="space-y-2 text-xs">
          {content.business_model && (
            <div>
              <p className="text-slate-500 mb-0.5">Business Model</p>
              <p className="text-slate-300 line-clamp-3">{String(content.business_model)}</p>
            </div>
          )}
          {Array.isArray(content.customer_segments) && content.customer_segments.length > 0 && (
            <div>
              <p className="text-slate-500 mb-1">Customer Segments</p>
              <div className="flex flex-wrap gap-1">
                {(content.customer_segments as string[]).slice(0, 3).map((seg, i) => (
                  <span key={i} className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 border border-slate-700/40">
                    {seg}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    case "value_creation_thesis":
      return (
        <div className="space-y-2 text-xs">
          {content.headline && (
            <p className="text-slate-200 font-medium">{String(content.headline)}</p>
          )}
          {Array.isArray(content.value_creation_levers) && (
            <div>
              <p className="text-slate-500 mb-1">{(content.value_creation_levers as unknown[]).length} value creation levers identified</p>
            </div>
          )}
        </div>
      );

    case "execution_plan":
      return (
        <div className="space-y-1 text-xs">
          {content.period && (
            <p className="text-slate-400">{String(content.period)}</p>
          )}
          {Array.isArray(content.initiatives) && (
            <p className="text-slate-300">{(content.initiatives as unknown[]).length} initiatives</p>
          )}
        </div>
      );

    case "risk_register":
      return (
        <div className="space-y-1 text-xs">
          {Array.isArray(content.risks) && (
            <>
              <p className="text-slate-400">{(content.risks as unknown[]).length} risks tracked</p>
              {(content.risks as Array<{ severity?: string; description: string; likelihood?: string; impact?: string }>)
                .filter((r) => r.likelihood === "high" || r.impact === "high")
                .slice(0, 2)
                .map((risk, i) => (
                  <div key={i} className="flex items-start gap-1.5 py-1 border-t border-slate-800">
                    <span className="text-red-400 shrink-0">⚠</span>
                    <p className="text-slate-300 line-clamp-2">{risk.description}</p>
                  </div>
                ))}
            </>
          )}
        </div>
      );

    case "action_item_list":
    case "meeting_summary":
      return (
        <div className="space-y-1 text-xs">
          {Array.isArray(content.items ?? content.action_items) && (
            <p className="text-slate-400">
              {((content.items ?? content.action_items) as unknown[]).length} items
            </p>
          )}
        </div>
      );

    default:
      return (
        <p className="text-xs text-slate-500">
          {artifact.type.replace(/_/g, " ")} · v{artifact.version}
        </p>
      );
  }
}
