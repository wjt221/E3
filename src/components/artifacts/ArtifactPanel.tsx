"use client";

import { useState } from "react";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Artifact, ArtifactType } from "@/types";

interface ArtifactPanelProps {
  companyId: string;
  artifacts: Artifact[];
}

const TYPE_META: Record<ArtifactType, { icon: string; label: string; category: "strategy" | "execution" | "governance" | "learning" }> = {
  company_profile:             { icon: "🏢", label: "Company Profile",        category: "strategy" },
  value_creation_thesis:       { icon: "💡", label: "Value Creation Thesis",  category: "strategy" },
  strategic_priorities:        { icon: "🎯", label: "Strategic Priorities",   category: "strategy" },
  kpi_tree:                    { icon: "📊", label: "KPI Tree",               category: "strategy" },
  execution_plan:              { icon: "📋", label: "Execution Plan",         category: "execution" },
  action_item_list:            { icon: "✅", label: "Action Items",           category: "execution" },
  risk_register:               { icon: "⚠️", label: "Risk Register",          category: "execution" },
  meeting_summary:             { icon: "📝", label: "Meeting Summary",        category: "execution" },
  board_update:                { icon: "👔", label: "Board Update",           category: "governance" },
  specialist_recommendations:  { icon: "🤝", label: "Specialists",            category: "governance" },
  playbook_entry:              { icon: "📖", label: "Playbook",               category: "learning" },
};

const CATEGORIES = [
  { id: "all",        label: "All" },
  { id: "strategy",   label: "Strategy" },
  { id: "execution",  label: "Execution" },
  { id: "governance", label: "Governance" },
  { id: "learning",   label: "Playbook" },
] as const;

type Category = typeof CATEGORIES[number]["id"];

export function ArtifactPanel({ companyId, artifacts }: ArtifactPanelProps) {
  const [tab,        setTab]        = useState<Category>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Latest version per type
  const latestByType = new Map<ArtifactType, Artifact>();
  for (const a of [...artifacts].sort((x, y) =>
    new Date(y.updated_at).getTime() - new Date(x.updated_at).getTime()
  )) {
    if (!latestByType.has(a.type as ArtifactType)) {
      latestByType.set(a.type as ArtifactType, a);
    }
  }

  const all = Array.from(latestByType.values());

  const visible = tab === "all"
    ? all
    : all.filter((a) => TYPE_META[a.type as ArtifactType]?.category === tab);

  return (
    <div className="flex flex-col h-full bg-[rgb(10_14_26)]">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[rgb(30_41_70)] shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Artifacts
          </h2>
          <span className="text-[10px] text-slate-700">
            {all.length} / {Object.keys(TYPE_META).length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 rounded-full bg-[rgb(20_28_52)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-brand transition-all duration-500"
            style={{ width: `${(all.length / Object.keys(TYPE_META).length) * 100}%` }}
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-0.5 mt-3 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((cat) => {
            const count = cat.id === "all"
              ? all.length
              : all.filter((a) => TYPE_META[a.type as ArtifactType]?.category === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setTab(cat.id)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap transition-colors duration-100",
                  tab === cat.id
                    ? "bg-blue-900/30 text-blue-300 font-medium"
                    : "text-slate-600 hover:text-slate-400 hover:bg-[rgb(20_28_52)]"
                )}
              >
                {cat.label}
                {count > 0 && (
                  <span className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold",
                    tab === cat.id ? "bg-blue-800/40 text-blue-300" : "bg-[rgb(20_28_52)] text-slate-600"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {visible.length === 0 ? (
          <EmptyArtifacts tab={tab} />
        ) : (
          visible.map((artifact) => (
            <ArtifactCard
              key={artifact.id}
              artifact={artifact}
              companyId={companyId}
              expanded={expandedId === artifact.id}
              onToggle={() =>
                setExpandedId(expandedId === artifact.id ? null : artifact.id)
              }
            />
          ))
        )}
      </div>

      {/* Footer */}
      {all.length > 0 && (
        <div className="shrink-0 px-4 py-3 border-t border-[rgb(30_41_70)]">
          <a
            href={`/dashboard/${companyId}/artifacts`}
            className="flex items-center justify-center gap-1.5 text-xs text-slate-600
                       hover:text-slate-400 transition-colors"
          >
            View all artifacts
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}

/* ── Card ──────────────────────────────────────────────── */

function ArtifactCard({
  artifact, companyId, expanded, onToggle,
}: {
  artifact: Artifact;
  companyId: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const type    = artifact.type as ArtifactType;
  const meta    = TYPE_META[type];
  const content = artifact.content as Record<string, unknown>;

  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden transition-all duration-150",
        expanded
          ? "border-[rgb(44_58_95)] bg-[rgb(14_20_38)]"
          : "border-[rgb(30_41_70)] bg-[rgb(10_14_26)] hover:border-[rgb(44_58_95)] hover:bg-[rgb(14_20_38)]"
      )}
    >
      {/* Row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
      >
        <span className="text-sm shrink-0">{meta.icon}</span>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-200 truncate leading-tight">
            {artifact.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-slate-600">
              v{artifact.version}
            </span>
            <span className="text-[10px] text-slate-700">·</span>
            <span className="text-[10px] text-slate-600">
              {formatRelativeTime(artifact.updated_at)}
            </span>
          </div>
        </div>

        <svg
          className={cn(
            "w-3.5 h-3.5 text-slate-600 shrink-0 transition-transform duration-200",
            expanded && "rotate-180"
          )}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded preview */}
      {expanded && (
        <div className="border-t border-[rgb(30_41_70)] px-3 py-3 space-y-3 animate-slide-up">
          <ArtifactPreview type={type} content={content} />
          <div className="flex items-center gap-2 pt-1">
            <a
              href={`/api/artifacts/${artifact.id}?company_id=${companyId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
            >
              View full artifact →
            </a>
            {artifact.version > 1 && (
              <span className="text-[10px] text-slate-700">
                {artifact.version} versions
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Preview renderers ─────────────────────────────────── */

function ArtifactPreview({ type, content }: { type: ArtifactType; content: Record<string, unknown> }) {
  switch (type) {
    case "company_profile":
      return (
        <div className="space-y-2 text-xs">
          {content.business_model && (
            <InfoRow label="Business model" value={String(content.business_model)} lines={2} />
          )}
          {Array.isArray(content.customer_segments) && content.customer_segments.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-600 mb-1 uppercase tracking-wide">Segments</p>
              <TagList items={(content.customer_segments as string[]).slice(0, 3)} />
            </div>
          )}
          {Array.isArray(content.key_risks) && content.key_risks.length > 0 && (
            <InfoRow label="Key risks" value={`${(content.key_risks as unknown[]).length} identified`} />
          )}
        </div>
      );

    case "value_creation_thesis":
      return (
        <div className="space-y-2 text-xs">
          {content.headline && (
            <p className="text-slate-200 font-medium leading-snug text-[11px]">
              {String(content.headline)}
            </p>
          )}
          {Array.isArray(content.value_creation_levers) && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 text-[10px]">
                {(content.value_creation_levers as unknown[]).length} value levers identified
              </span>
            </div>
          )}
        </div>
      );

    case "execution_plan":
      return (
        <div className="space-y-1.5 text-xs">
          {content.period && (
            <p className="text-[10px] text-slate-500">{String(content.period)}</p>
          )}
          {Array.isArray(content.initiatives) && (
            <MetricPill label="Initiatives" value={String((content.initiatives as unknown[]).length)} />
          )}
          {Array.isArray(content.milestones) && (
            <MetricPill label="Milestones" value={String((content.milestones as unknown[]).length)} />
          )}
        </div>
      );

    case "risk_register": {
      const risks = (content.risks as Array<{ likelihood: string; impact: string; description: string }>) ?? [];
      const high = risks.filter((r) => r.likelihood === "high" || r.impact === "high");
      return (
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-3">
            <MetricPill label="Total" value={String(risks.length)} />
            {high.length > 0 && <MetricPill label="High" value={String(high.length)} danger />}
          </div>
          {high.slice(0, 2).map((r, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[11px]">
              <span className="text-amber-500 shrink-0 mt-0.5">⚠</span>
              <p className="text-slate-400 line-clamp-1">{r.description}</p>
            </div>
          ))}
        </div>
      );
    }

    case "action_item_list":
    case "meeting_summary": {
      const items = (content.items ?? content.action_items) as unknown[] | undefined;
      return (
        <div className="text-xs">
          {items && <MetricPill label="Items" value={String(items.length)} />}
          {content.meeting_date && (
            <p className="text-[10px] text-slate-600 mt-1">
              {String(content.meeting_date)}
            </p>
          )}
        </div>
      );
    }

    case "board_update":
      return (
        <div className="space-y-1.5 text-xs">
          {content.period && <p className="text-[10px] text-slate-500">{String(content.period)}</p>}
          {content.executive_summary && (
            <p className="text-[11px] text-slate-400 line-clamp-2">{String(content.executive_summary)}</p>
          )}
        </div>
      );

    default:
      return (
        <p className="text-[11px] text-slate-600">
          {type.replace(/_/g, " ")} · v{(content as { version?: number }).version ?? 1}
        </p>
      );
  }
}

/* ── Mini sub-components ───────────────────────────────── */

function InfoRow({ label, value, lines = 1 }: { label: string; value: string; lines?: number }) {
  return (
    <div>
      <p className="text-[10px] text-slate-600 mb-0.5 uppercase tracking-wide">{label}</p>
      <p className={cn("text-[11px] text-slate-300 leading-relaxed", lines === 2 && "line-clamp-2")}>{value}</p>
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <span key={i} className="px-1.5 py-0.5 rounded-md bg-[rgb(20_28_52)] text-[10px] text-slate-400 border border-[rgb(30_41_70)]">
          {item}
        </span>
      ))}
    </div>
  );
}

function MetricPill({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border",
      danger
        ? "bg-red-950/30 text-red-400 border-red-900/30"
        : "bg-[rgb(20_28_52)] text-slate-500 border-[rgb(30_41_70)]"
    )}>
      <span className="text-slate-700">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

function EmptyArtifacts({ tab }: { tab: Category }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-10 h-10 rounded-xl bg-[rgb(20_28_52)] flex items-center justify-center mb-3">
        <svg className="w-4.5 h-4.5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <p className="text-[11px] text-slate-600 max-w-[140px] leading-relaxed">
        {tab === "all"
          ? "No artifacts yet. Start a conversation to generate them."
          : `No ${tab} artifacts yet.`}
      </p>
    </div>
  );
}
