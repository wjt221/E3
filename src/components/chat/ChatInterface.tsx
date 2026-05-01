"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageBubble } from "./MessageBubble";
import { ChatInput }     from "./ChatInput";
import { ModeIndicator } from "./ModeIndicator";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { AgentMode, UserRole } from "@/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: string | null;
  sources?: unknown;
  created_at: string;
  streaming?: boolean;
  toolEvents?: Array<{ toolName: string; result?: unknown }>;
}

interface Conversation {
  id: string;
  title: string | null;
  mode: string;
  updated_at: string;
}

interface ChatInterfaceProps {
  companyId:              string;
  companyName:            string;
  userId:                 string;
  userRole:               UserRole;
  initialConversationId:  string | null;
  initialMessages:        Message[];
  conversations:          Conversation[];
}

// ── Starter prompts ──────────────────────────────────────

const STARTERS: { label: string; prompt: string; mode: AgentMode }[] = [
  {
    label: "Learn the business",
    prompt: "Here is our website — what can you learn about our business model and key value drivers?",
    mode: "learn",
  },
  {
    label: "Strategic priorities",
    prompt: "What should we focus on this quarter to create the most enterprise value?",
    mode: "plan",
  },
  {
    label: "Diagnose risks",
    prompt: "Where are we most at risk right now? What should I be worried about?",
    mode: "diagnose",
  },
  {
    label: "Board prep",
    prompt: "Help me prepare for my next board meeting. What should I lead with?",
    mode: "board_prep",
  },
  {
    label: "Review a meeting",
    prompt: "I'll paste a meeting transcript. Extract decisions, action items, and open issues.",
    mode: "cadence",
  },
  {
    label: "What would a great OP ask?",
    prompt: "What would a great operating partner ask me right now that I'm probably not asking myself?",
    mode: "diagnose",
  },
];

// ── Component ─────────────────────────────────────────────

export function ChatInterface({
  companyId, companyName, userId, userRole,
  initialConversationId, initialMessages, conversations,
}: ChatInterfaceProps) {
  const router     = useRouter();
  const bottomRef  = useRef<HTMLDivElement>(null);
  const abortRef   = useRef<AbortController | null>(null);

  const [messages,        setMessages]        = useState<Message[]>(initialMessages);
  const [conversationId,  setConversationId]  = useState<string | null>(initialConversationId);
  const [currentMode,     setCurrentMode]     = useState<AgentMode>("learn");
  const [isStreaming,     setIsStreaming]      = useState(false);
  const [streamingText,   setStreamingText]   = useState("");
  const [streamingTools,  setStreamingTools]  = useState<Message["toolEvents"]>([]);
  const [showHistory,     setShowHistory]     = useState(false);
  const [artifactCount,   setArtifactCount]   = useState(0);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // ── Send ──────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string, attachments?: File[]) => {
      if (isStreaming || !text.trim()) return;

      // Upload attachments first
      if (attachments?.length) {
        for (const file of attachments) {
          const form = new FormData();
          form.append("file", file);
          form.append("meta", JSON.stringify({
            company_id: companyId, document_type: "other", name: file.name,
          }));
          await fetch("/api/documents/upload", { method: "POST", body: form })
            .catch(console.error);
        }
      }

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: text,
        mode: currentMode,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);
      setStreamingText("");
      setStreamingTools([]);

      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_id:      companyId,
            conversation_id: conversationId,
            message:         text,
            mode:            currentMode,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) throw new Error(`Chat error ${res.status}`);

        const newConvId = res.headers.get("X-Conversation-Id");
        if (newConvId && !conversationId) {
          setConversationId(newConvId);
          router.replace(`/dashboard/${companyId}/chat?conversation=${newConvId}`, { scroll: false });
        }

        // Stream SSE
        const reader  = res.body!.getReader();
        const decoder = new TextDecoder();
        let   buffer  = "";
        let   full    = "";
        const tools: Message["toolEvents"] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const { event, data } = JSON.parse(line.slice(6)) as { event: string; data: unknown };
              const d = data as Record<string, unknown>;

              if (event === "text_delta") {
                full += (d.text as string);
                setStreamingText(full);

              } else if (event === "mode_detected") {
                setCurrentMode(d.mode as AgentMode);

              } else if (event === "tool_complete") {
                const ev = {
                  toolName: d.tool_name as string,
                  result:   d.result as Message["toolEvents"][0]["result"],
                };
                tools.push(ev);
                setStreamingTools([...tools]);
                if ((d.result as Record<string, unknown>)?.type === "artifact") {
                  setArtifactCount((n) => n + 1);
                }

              } else if (event === "done") {
                const done = d as { mode: AgentMode; message_id: string };
                setMessages((prev) => [
                  ...prev,
                  {
                    id:          done.message_id ?? `a-${Date.now()}`,
                    role:        "assistant",
                    content:     full,
                    mode:        done.mode,
                    toolEvents:  tools,
                    created_at:  new Date().toISOString(),
                  },
                ]);
                setStreamingText("");
                setStreamingTools([]);
                setIsStreaming(false);
                full = "";

              } else if (event === "error") {
                throw new Error((d.message as string) ?? "Stream error");
              }
            } catch {
              // non-fatal parse error
            }
          }
        }
      } catch (err) {
        const isAbort = (err as Error).name === "AbortError";
        setMessages((prev) => [
          ...prev,
          {
            id:         `err-${Date.now()}`,
            role:       "assistant",
            content:    isAbort ? "*Cancelled.*" : `Something went wrong: ${(err as Error).message}`,
            created_at: new Date().toISOString(),
          },
        ]);
        setStreamingText("");
        setStreamingTools([]);
        setIsStreaming(false);
      }
    },
    [companyId, conversationId, currentMode, isStreaming, router]
  );

  function handleStarter(s: typeof STARTERS[number]) {
    setCurrentMode(s.mode);
    sendMessage(s.prompt);
  }

  const isEmpty = messages.length === 0 && !isStreaming;

  return (
    <div className="flex h-full">

      {/* ── History drawer (mobile / collapsible) ── */}
      {showHistory && (
        <div className="w-64 border-r border-[rgb(30_41_70)] flex flex-col bg-[rgb(10_14_26)] shrink-0 animate-slide-up">
          <div className="flex items-center justify-between px-4 h-12 border-b border-[rgb(30_41_70)]">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conversations</p>
            <button onClick={() => setShowHistory(false)} className="btn-icon w-6 h-6 text-slate-600">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {conversations.length === 0 && (
              <p className="text-xs text-slate-700 text-center py-6">No conversations yet</p>
            )}
            {conversations.map((c) => (
              <a
                key={c.id}
                href={`/dashboard/${companyId}/chat?conversation=${c.id}`}
                className={cn(
                  "block px-3 py-2 rounded-lg text-xs transition-colors",
                  c.id === conversationId
                    ? "bg-blue-900/20 text-blue-300"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[rgb(20_28_52)]"
                )}
              >
                <p className="font-medium truncate">
                  {c.title ?? "Conversation"}
                </p>
                <p className="text-slate-600 mt-0.5">{formatRelativeTime(c.updated_at)}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Main chat column ── */}
      <div className="flex-1 min-w-0 flex flex-col h-full">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 h-12 border-b border-[rgb(30_41_70)] shrink-0">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="btn-icon w-7 h-7 rounded-md shrink-0"
            title="Conversation history"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-sm font-medium text-slate-200 truncate">{companyName}</span>
            <ModeIndicator mode={currentMode} size="sm" />
          </div>

          {artifactCount > 0 && (
            <a
              href={`/dashboard/${companyId}/artifacts`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs
                         bg-blue-950/30 text-blue-400 border border-blue-800/30
                         hover:bg-blue-950/50 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {artifactCount} artifact{artifactCount > 1 ? "s" : ""} created
            </a>
          )}

          {/* New conversation */}
          <a
            href={`/dashboard/${companyId}/chat`}
            className="btn-icon w-7 h-7 rounded-md"
            title="New conversation"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </a>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isEmpty ? (
            <EmptyState
              companyName={companyName}
              onStarter={handleStarter}
            />
          ) : (
            <div className="max-w-3xl mx-auto space-y-5">
              {messages.map((msg, i) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isFirst={i === 0 || messages[i - 1]?.role !== msg.role}
                />
              ))}

              {/* Streaming assistant message */}
              {isStreaming && (
                <MessageBubble
                  message={{
                    id:         "streaming",
                    role:       "assistant",
                    content:    streamingText,
                    mode:       currentMode,
                    toolEvents: streamingTools,
                    created_at: new Date().toISOString(),
                    streaming:  true,
                  }}
                />
              )}

              <div ref={bottomRef} className="h-1" />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="shrink-0 px-6 pb-5 pt-3 border-t border-[rgb(30_41_70)]">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSend={sendMessage}
              onStop={() => abortRef.current?.abort()}
              isStreaming={isStreaming}
              disabled={false}
              currentMode={currentMode}
              onModeChange={setCurrentMode}
              companyId={companyId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────── */

function EmptyState({
  companyName,
  onStarter,
}: {
  companyName: string;
  onStarter: (s: typeof STARTERS[number]) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full py-16 animate-slide-up">
      <div className="max-w-xl w-full">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-5">
            <div className="absolute inset-0 rounded-2xl bg-blue-600/20 blur-2xl scale-125" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto shadow-glow-blue">
              <span className="text-white font-bold text-xl">E3</span>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-slate-100 tracking-tight mb-2">
            AI Operating Partner
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Share documents, ask strategic questions, or describe a challenge.
            I&apos;ll learn your business and help you create value.
          </p>
        </div>

        {/* Starter prompts */}
        <div className="grid grid-cols-2 gap-2">
          {STARTERS.map((s) => (
            <button
              key={s.label}
              onClick={() => onStarter(s)}
              className={cn(
                "text-left px-4 py-3 rounded-xl border transition-all duration-150",
                "bg-[rgb(14_20_38)] border-[rgb(30_41_70)]",
                "hover:bg-[rgb(20_28_52)] hover:border-[rgb(44_58_95)]",
                "group"
              )}
            >
              <p className="text-xs font-semibold text-slate-300 group-hover:text-slate-100 mb-1 transition-colors">
                {s.label}
              </p>
              <p className="text-[11px] text-slate-600 group-hover:text-slate-500 leading-relaxed line-clamp-2 transition-colors">
                {s.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
