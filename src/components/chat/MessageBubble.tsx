"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AGENT_MODE_LABELS } from "@/types";
import type { AgentMode, SourceReference } from "@/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: string | null;
  sources?: unknown;
  created_at: string;
  streaming?: boolean;
}

interface MessageBubbleProps {
  message: Message;
}

const MODE_COLORS: Record<AgentMode, { dot: string; text: string }> = {
  learn: { dot: "bg-blue-400", text: "text-blue-400" },
  diagnose: { dot: "bg-amber-400", text: "text-amber-400" },
  plan: { dot: "bg-green-400", text: "text-green-400" },
  cadence: { dot: "bg-purple-400", text: "text-purple-400" },
  board_prep: { dot: "bg-indigo-400", text: "text-indigo-400" },
  specialists: { dot: "bg-pink-400", text: "text-pink-400" },
  playbook: { dot: "bg-teal-400", text: "text-teal-400" },
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const sources = (message.sources as SourceReference[]) ?? [];
  const mode = message.mode as AgentMode | null;
  const modeColors = mode ? MODE_COLORS[mode] : null;

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-xl">
          <div className="chat-bubble-user">
            <p className="text-sm text-slate-200 whitespace-pre-wrap">{message.content}</p>
          </div>
          <p className="text-xs text-slate-600 mt-1 text-right">
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 animate-fade-in">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-lg bg-e3-700/30 border border-e3-700/30 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-xs font-bold text-e3-400">E3</span>
      </div>

      <div className="flex-1 min-w-0">
        {/* Mode badge */}
        {modeColors && mode && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className={`w-1.5 h-1.5 rounded-full ${modeColors.dot}`} />
            <span className={`text-xs font-medium ${modeColors.text}`}>
              {AGENT_MODE_LABELS[mode]}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="chat-bubble-assistant">
          {message.content ? (
            <div className="prose prose-sm max-w-none text-sm">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Tables
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-3">
                      <table className="w-full text-xs border-collapse">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="text-left px-3 py-2 bg-slate-800 text-slate-300 font-medium border-b border-slate-700">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-3 py-2 text-slate-300 border-b border-slate-800/60">
                      {children}
                    </td>
                  ),
                  // Code blocks
                  code: ({ inline, children, ...props }: { inline?: boolean; children?: React.ReactNode }) => {
                    if (inline) {
                      return (
                        <code className="px-1.5 py-0.5 rounded bg-slate-800 text-e3-300 text-xs font-mono" {...props}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code className="block p-3 rounded-lg bg-slate-850 text-slate-300 text-xs font-mono overflow-x-auto" {...props}>
                        {children}
                      </code>
                    );
                  },
                  // Headings
                  h1: ({ children }) => (
                    <h1 className="text-base font-semibold text-slate-100 mt-4 mb-2">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-sm font-semibold text-slate-100 mt-3 mb-2">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-medium text-slate-200 mt-2 mb-1">{children}</h3>
                  ),
                  // Lists
                  ul: ({ children }) => (
                    <ul className="space-y-1 my-2 pl-4 list-disc list-outside text-slate-300">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="space-y-1 my-2 pl-4 list-decimal list-outside text-slate-300">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm leading-relaxed">{children}</li>
                  ),
                  // Blockquote — used for FACT/ASSUMPTION/RECOMMENDATION labels
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-e3-600 pl-3 my-2 text-slate-400 italic">
                      {children}
                    </blockquote>
                  ),
                  // Paragraphs
                  p: ({ children }) => (
                    <p className="text-sm text-slate-200 leading-relaxed mb-2">{children}</p>
                  ),
                  // Strong
                  strong: ({ children }) => (
                    <strong className="font-semibold text-slate-100">{children}</strong>
                  ),
                  // Horizontal rule
                  hr: () => <hr className="border-slate-800 my-3" />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : message.streaming ? (
            <div className="flex items-center gap-1.5 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-e3-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-e3-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-e3-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : null}
        </div>

        {/* Sources */}
        {sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {sources.slice(0, 4).map((src, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/60 text-xs text-slate-500 border border-slate-700/40"
                title={`Relevance: ${Math.round(src.relevance_score * 100)}%`}
              >
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {src.document_name}
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-slate-700 mt-1.5">
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
