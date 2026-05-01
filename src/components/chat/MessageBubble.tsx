"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn, formatTime } from "@/lib/utils";
import { ModeIndicator, MODE_META } from "./ModeIndicator";
import type { AgentMode, SourceReference } from "@/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: string | null;
  sources?: unknown;
  created_at: string;
  streaming?: boolean;
  toolEvents?: ToolEvent[];
}

interface ToolEvent {
  toolName: string;
  result?: {
    type: string;
    data?: unknown;
    artifactId?: string;
  };
}

interface MessageBubbleProps {
  message: Message;
  isFirst?: boolean;
}

export function MessageBubble({ message, isFirst }: MessageBubbleProps) {
  return message.role === "user"
    ? <UserBubble message={message} />
    : <AssistantBubble message={message} isFirst={isFirst} />;
}

/* ──────────────── User ──────────────── */

function UserBubble({ message }: { message: Message }) {
  return (
    <div className="flex justify-end animate-slide-up">
      <div className="max-w-[75%]">
        <div className="chat-user">
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
        <p className="text-[10px] text-slate-700 mt-1.5 text-right pr-1">
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}

/* ──────────────── Assistant ──────────────── */

function AssistantBubble({ message, isFirst }: { message: Message; isFirst?: boolean }) {
  const mode    = message.mode as AgentMode | null;
  const sources = (message.sources as SourceReference[]) ?? [];
  const modeMeta = mode ? MODE_META[mode] : null;

  return (
    <div className={cn("flex gap-3 animate-slide-up", isFirst && "mt-2")}>
      {/* Avatar */}
      <div className="relative shrink-0 mt-1">
        <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-glow-sm">
          <span className="text-white font-bold text-xs">E3</span>
        </div>
        {message.streaming && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[rgb(10_14_26)]">
            <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        {/* Mode badge */}
        {mode && (
          <div className="flex items-center gap-2">
            <ModeIndicator mode={mode} size="sm" />
            <span className="text-[10px] text-slate-700">{formatTime(message.created_at)}</span>
          </div>
        )}

        {/* Tool event cards */}
        {message.toolEvents && message.toolEvents.length > 0 && (
          <div className="space-y-1.5">
            {message.toolEvents.map((ev, i) => (
              <ToolEventCard key={i} event={ev} />
            ))}
          </div>
        )}

        {/* Content */}
        {message.content ? (
          <div className="chat-assistant chat-prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Override default elements to avoid nested <p> in block elements
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3">
                    <table className="w-full">{children}</table>
                  </div>
                ),
                // Inline code
                code: ({ inline, children, ...props }: { inline?: boolean; children?: React.ReactNode }) =>
                  inline ? (
                    <code {...props}>{children}</code>
                  ) : (
                    <pre><code {...props}>{children}</code></pre>
                  ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : message.streaming ? (
          <TypingIndicator />
        ) : null}

        {/* Source attribution */}
        {sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {sources.slice(0, 5).map((src, i) => (
              <SourcePill key={i} source={src} />
            ))}
          </div>
        )}

        {/* Timestamp (no mode badge) */}
        {!mode && (
          <p className="text-[10px] text-slate-700">
            {formatTime(message.created_at)}
          </p>
        )}
      </div>
    </div>
  );
}

/* ──────────────── Sub-components ──────────────── */

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  );
}

function SourcePill({ source }: { source: SourceReference }) {
  const pct = Math.round(source.relevance_score * 100);
  return (
    <span
      title={`${source.document_name} — ${pct}% relevant`}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                 bg-[rgb(14_20_38)] border border-[rgb(30_41_70)]
                 text-[10px] text-slate-500 hover:text-slate-300
                 hover:border-[rgb(44_58_95)] transition-colors cursor-default"
    >
      <svg className="w-2.5 h-2.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {source.document_name.length > 24
        ? source.document_name.slice(0, 22) + "…"
        : source.document_name}
    </span>
  );
}

const TOOL_META: Record<string, { label: string; color: string; icon: string }> = {
  create_artifact:         { label: "Artifact created",    color: "text-blue-400 bg-blue-950/40 border-blue-800/30",  icon: "📄" },
  extract_action_items:    { label: "Action items saved",  color: "text-green-400 bg-green-950/40 border-green-800/30", icon: "✅" },
  add_risk:                { label: "Risk logged",         color: "text-amber-400 bg-amber-950/40 border-amber-800/30", icon: "⚠️" },
  update_company_profile:  { label: "Profile updated",     color: "text-purple-400 bg-purple-950/40 border-purple-800/30", icon: "🏢" },
  ask_clarifying_question: { label: "Clarification needed",color: "text-slate-400 bg-[rgb(20_28_52)] border-[rgb(44_58_95)]", icon: "❓" },
};

function ToolEventCard({ event }: { event: ToolEvent }) {
  const meta = TOOL_META[event.toolName];
  if (!meta) return null;

  const data = event.result?.data as Record<string, unknown> | undefined;

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs",
      meta.color
    )}>
      <span>{meta.icon}</span>
      <span className="font-medium">{meta.label}</span>
      {data?.count && <span className="opacity-60">({String(data.count)})</span>}
      {data?.artifact_id && (
        <span className="opacity-60 font-mono text-[10px]">
          {String(data.type ?? "")}
        </span>
      )}
    </div>
  );
}
