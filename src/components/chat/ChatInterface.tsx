"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { ModeIndicator } from "./ModeIndicator";
import type { AgentMode, UserRole } from "@/types";
import { AGENT_MODE_LABELS } from "@/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: string | null;
  sources?: unknown;
  created_at: string;
  streaming?: boolean;
}

interface Conversation {
  id: string;
  title: string | null;
  mode: string;
  updated_at: string;
}

interface ChatInterfaceProps {
  companyId: string;
  companyName: string;
  userId: string;
  userRole: UserRole;
  initialConversationId: string | null;
  initialMessages: Message[];
  conversations: Conversation[];
}

const MODE_COLORS: Record<AgentMode, string> = {
  learn: "text-blue-400",
  diagnose: "text-amber-400",
  plan: "text-green-400",
  cadence: "text-purple-400",
  board_prep: "text-indigo-400",
  specialists: "text-pink-400",
  playbook: "text-teal-400",
};

const STARTER_PROMPTS = [
  "Here is our website — what can you learn about our business?",
  "What should we focus on this quarter to create the most value?",
  "Where are we most at risk right now?",
  "Turn this leadership meeting into an execution plan",
  "What would a great operating partner ask me right now?",
  "Help me prepare for my board meeting",
];

export function ChatInterface({
  companyId,
  companyName,
  userId,
  userRole,
  initialConversationId,
  initialMessages,
  conversations,
}: ChatInterfaceProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const [currentMode, setCurrentMode] = useState<AgentMode>("learn");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [artifactsCreated, setArtifactsCreated] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const sendMessage = useCallback(
    async (text: string, attachments?: File[]) => {
      if (isStreaming || !text.trim()) return;

      // Handle file attachments by uploading first
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append(
            "meta",
            JSON.stringify({
              company_id: companyId,
              document_type: "other",
              name: file.name,
            })
          );

          await fetch("/api/documents/upload", {
            method: "POST",
            body: formData,
          }).catch((err) => console.error("Upload failed:", err));
        }
      }

      const userMsg: Message = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: text,
        mode: currentMode,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);
      setStreamingText("");

      abortRef.current = new AbortController();

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_id: companyId,
            conversation_id: conversationId,
            message: text,
            mode: currentMode,
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Chat API error: ${response.status}`);
        }

        // Get conversation ID from response header
        const newConversationId = response.headers.get("X-Conversation-Id");
        if (newConversationId && !conversationId) {
          setConversationId(newConversationId);
          router.replace(`/dashboard/${companyId}/chat?conversation=${newConversationId}`, {
            scroll: false,
          });
        }

        // Read SSE stream
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const { event, data } = JSON.parse(line.slice(6)) as {
                event: string;
                data: unknown;
              };

              if (event === "text_delta") {
                fullText += (data as { text: string }).text;
                setStreamingText(fullText);
              } else if (event === "mode_detected") {
                setCurrentMode((data as { mode: AgentMode }).mode);
              } else if (event === "tool_complete") {
                const toolData = data as { tool_name: string; result: { type: string; artifactId?: string } };
                if (toolData.result?.type === "artifact" && toolData.result.artifactId) {
                  setArtifactsCreated((prev) => [...prev, toolData.result.artifactId!]);
                }
              } else if (event === "done") {
                const doneData = data as { mode: AgentMode; message_id: string };
                // Commit the complete message
                const assistantMsg: Message = {
                  id: doneData.message_id ?? `assistant-${Date.now()}`,
                  role: "assistant",
                  content: fullText,
                  mode: doneData.mode,
                  created_at: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, assistantMsg]);
                setStreamingText("");
                setIsStreaming(false);
                fullText = "";
              } else if (event === "error") {
                throw new Error((data as { message: string }).message);
              }
            } catch (parseErr) {
              // Non-fatal parse error in stream
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // User cancelled
          setMessages((prev) => [
            ...prev,
            {
              id: `cancelled-${Date.now()}`,
              role: "assistant",
              content: "*Response cancelled.*",
              created_at: new Date().toISOString(),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `error-${Date.now()}`,
              role: "assistant",
              content: `I encountered an error: ${(err as Error).message}. Please try again.`,
              created_at: new Date().toISOString(),
            },
          ]);
        }
        setStreamingText("");
        setIsStreaming(false);
      }
    },
    [companyId, conversationId, currentMode, isStreaming, router]
  );

  function handleStop() {
    abortRef.current?.abort();
  }

  const isEmpty = messages.length === 0 && !isStreaming;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800/60 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-slate-100">{companyName}</h1>
          <ModeIndicator mode={currentMode} />
        </div>

        {artifactsCreated.length > 0 && (
          <span className="text-xs text-slate-500">
            {artifactsCreated.length} artifact{artifactsCreated.length !== 1 ? "s" : ""} created →
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isEmpty ? (
          <EmptyState
            companyName={companyName}
            onPrompt={sendMessage}
          />
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* Streaming message */}
            {isStreaming && (
              <MessageBubble
                message={{
                  id: "streaming",
                  role: "assistant",
                  content: streamingText,
                  mode: currentMode,
                  created_at: new Date().toISOString(),
                  streaming: true,
                }}
              />
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 px-6 py-4 border-t border-slate-800/60">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSend={sendMessage}
            onStop={handleStop}
            isStreaming={isStreaming}
            disabled={false}
            currentMode={currentMode}
            onModeChange={setCurrentMode}
            companyId={companyId}
          />
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  companyName,
  onPrompt,
}: {
  companyName: string;
  onPrompt: (text: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full py-12 animate-fade-in">
      <div className="max-w-2xl w-full text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-e3-900/30 border border-e3-700/30 mb-5">
          <span className="text-2xl font-bold text-e3-400">E3</span>
        </div>
        <h2 className="text-xl font-semibold text-slate-100 mb-2">
          Your AI Operating Partner is ready
        </h2>
        <p className="text-slate-400 text-sm mb-8">
          Share documents, ask strategic questions, or describe a challenge.
          <br />
          I&apos;ll learn your business and help you create value.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onPrompt(prompt)}
              className="text-left px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800/60
                         hover:border-slate-700 hover:bg-slate-800/60 transition-colors text-sm text-slate-300
                         hover:text-slate-100"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
