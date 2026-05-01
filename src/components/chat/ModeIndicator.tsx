import { cn } from "@/lib/utils";
import type { AgentMode } from "@/types";
import { AGENT_MODE_LABELS, AGENT_MODE_DESCRIPTIONS } from "@/types";

interface ModeIndicatorProps {
  mode: AgentMode;
  size?: "sm" | "md";
}

export const MODE_META: Record<AgentMode, {
  pill: string;
  dot: string;
  icon: React.ReactNode;
}> = {
  learn: {
    pill: "bg-blue-950/60 text-blue-300 border-blue-800/40",
    dot:  "bg-blue-400",
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  diagnose: {
    pill: "bg-amber-950/60 text-amber-300 border-amber-800/40",
    dot:  "bg-amber-400",
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  plan: {
    pill: "bg-green-950/60 text-green-300 border-green-800/40",
    dot:  "bg-green-400",
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  cadence: {
    pill: "bg-purple-950/60 text-purple-300 border-purple-800/40",
    dot:  "bg-purple-400",
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  board_prep: {
    pill: "bg-indigo-950/60 text-indigo-300 border-indigo-800/40",
    dot:  "bg-indigo-400",
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
  },
  specialists: {
    pill: "bg-pink-950/60 text-pink-300 border-pink-800/40",
    dot:  "bg-pink-400",
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  playbook: {
    pill: "bg-teal-950/60 text-teal-300 border-teal-800/40",
    dot:  "bg-teal-400",
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
};

export function ModeIndicator({ mode, size = "md" }: ModeIndicatorProps) {
  const meta = MODE_META[mode];
  return (
    <span
      title={AGENT_MODE_DESCRIPTIONS[mode]}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        meta.pill,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      )}
    >
      {meta.icon}
      {AGENT_MODE_LABELS[mode]}
    </span>
  );
}
