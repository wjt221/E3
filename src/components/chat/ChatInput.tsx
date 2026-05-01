"use client";

import { useState, useRef, useCallback } from "react";
import type { AgentMode } from "@/types";
import { AGENT_MODE_LABELS } from "@/types";

interface ChatInputProps {
  onSend: (text: string, files?: File[]) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled: boolean;
  currentMode: AgentMode;
  onModeChange: (mode: AgentMode) => void;
  companyId: string;
}

const ALL_MODES: AgentMode[] = [
  "learn",
  "diagnose",
  "plan",
  "cadence",
  "board_prep",
  "specialists",
  "playbook",
];

const MODE_ICONS: Record<AgentMode, string> = {
  learn: "📖",
  diagnose: "🔍",
  plan: "🗺️",
  cadence: "📅",
  board_prep: "📊",
  specialists: "🤝",
  playbook: "📝",
};

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  disabled,
  currentMode,
  onModeChange,
  companyId,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [showModes, setShowModes] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    // Auto-resize
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed, files.length > 0 ? files : undefined);
    setText("");
    setFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...selected]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const canSend = text.trim().length > 0 && !isStreaming && !disabled;

  return (
    <div className="space-y-2">
      {/* File previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-slate-300 border border-slate-700"
            >
              <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {file.name}
              <button
                onClick={() => removeFile(i)}
                className="ml-0.5 text-slate-500 hover:text-slate-300"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main input area */}
      <div
        className={`relative bg-slate-900 border rounded-xl transition-colors ${
          isDragging
            ? "border-e3-500 bg-e3-900/10"
            : "border-slate-700/60 hover:border-slate-600"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={`Message your E3 AI Operating Partner... (${AGENT_MODE_LABELS[currentMode]})`}
          rows={1}
          disabled={disabled}
          className="w-full bg-transparent resize-none px-4 pt-3 pb-10 text-sm text-slate-200
                     placeholder-slate-500 focus:outline-none leading-relaxed"
          style={{ minHeight: "52px", maxHeight: "200px" }}
        />

        {/* Bottom toolbar */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* File upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-ghost p-1.5 rounded-lg"
              title="Attach document"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Mode selector */}
            <div className="relative">
              <button
                onClick={() => setShowModes(!showModes)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <span>{MODE_ICONS[currentMode]}</span>
                <span className="hidden sm:block">{AGENT_MODE_LABELS[currentMode]}</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showModes && (
                <div className="absolute bottom-8 left-0 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-10 py-1 animate-fade-in">
                  {ALL_MODES.map((mode) => (
                    <button
                      key={mode}
                      onClick={() => { onModeChange(mode); setShowModes(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                        mode === currentMode
                          ? "bg-e3-900/30 text-e3-300"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      <span>{MODE_ICONS[mode]}</span>
                      {AGENT_MODE_LABELS[mode]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Send / Stop */}
          {isStreaming ? (
            <button
              onClick={onStop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-300 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              Stop
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSend}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                canSend
                  ? "bg-e3-600 hover:bg-e3-700 text-white"
                  : "bg-slate-800 text-slate-600 cursor-not-allowed"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-slate-700">
        All company data is encrypted and tenant-isolated · E3 Confidential
      </p>
    </div>
  );
}
