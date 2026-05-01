import type { AgentMode } from "@/types";
import { AGENT_MODE_LABELS, AGENT_MODE_DESCRIPTIONS } from "@/types";

interface ModeIndicatorProps {
  mode: AgentMode;
}

const MODE_STYLES: Record<AgentMode, { pill: string; dot: string }> = {
  learn: {
    pill: "bg-blue-900/20 text-blue-400 border-blue-800/30",
    dot: "bg-blue-400",
  },
  diagnose: {
    pill: "bg-amber-900/20 text-amber-400 border-amber-800/30",
    dot: "bg-amber-400",
  },
  plan: {
    pill: "bg-green-900/20 text-green-400 border-green-800/30",
    dot: "bg-green-400",
  },
  cadence: {
    pill: "bg-purple-900/20 text-purple-400 border-purple-800/30",
    dot: "bg-purple-400",
  },
  board_prep: {
    pill: "bg-indigo-900/20 text-indigo-400 border-indigo-800/30",
    dot: "bg-indigo-400",
  },
  specialists: {
    pill: "bg-pink-900/20 text-pink-400 border-pink-800/30",
    dot: "bg-pink-400",
  },
  playbook: {
    pill: "bg-teal-900/20 text-teal-400 border-teal-800/30",
    dot: "bg-teal-400",
  },
};

export function ModeIndicator({ mode }: ModeIndicatorProps) {
  const styles = MODE_STYLES[mode];

  return (
    <span
      className={`mode-pill border ${styles.pill}`}
      title={AGENT_MODE_DESCRIPTIONS[mode]}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
      {AGENT_MODE_LABELS[mode]}
    </span>
  );
}
