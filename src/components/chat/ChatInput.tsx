"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MODE_META } from "./ModeIndicator";
import type { AgentMode } from "@/types";
import { AGENT_MODE_LABELS } from "@/types";

interface ChatInputProps {
  onSend:        (text: string, files?: File[]) => void;
  onStop:        () => void;
  isStreaming:   boolean;
  disabled:      boolean;
  currentMode:   AgentMode;
  onModeChange:  (mode: AgentMode) => void;
  companyId:     string;
}

const ALL_MODES: AgentMode[] = [
  "learn", "diagnose", "plan", "cadence",
  "board_prep", "specialists", "playbook",
];

export function ChatInput({
  onSend, onStop, isStreaming, disabled,
  currentMode, onModeChange, companyId,
}: ChatInputProps) {
  const [text, setText]               = useState("");
  const [files, setFiles]             = useState<File[]>([]);
  const [showModes, setShowModes]     = useState(false);
  const [isDragging, setIsDragging]   = useState(false);
  const taRef       = useRef<HTMLTextAreaElement>(null);
  const fileRef     = useRef<HTMLInputElement>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);

  // Close mode menu on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) {
        setShowModes(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function autoResize() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 240)}px`;
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    autoResize();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
    if (e.key === "Escape") {
      setShowModes(false);
    }
  }

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed, files.length ? files : undefined);
    setText("");
    setFiles([]);
    if (taRef.current) taRef.current.style.height = "auto";
  }

  function addFiles(newFiles: File[]) {
    const textFiles = newFiles.filter(
      (f) => f.type.startsWith("text/") ||
             f.name.endsWith(".txt") ||
             f.name.endsWith(".md") ||
             f.name.endsWith(".csv")
    );
    setFiles((prev) => [...prev, ...textFiles]);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, []);

  const canSend = text.trim().length > 0 && !isStreaming && !disabled;
  const modeMeta = MODE_META[currentMode];

  return (
    <div className="space-y-2">
      {/* File chips */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg
                         bg-[rgb(20_28_52)] border border-[rgb(44_58_95)]
                         text-xs text-slate-300 animate-scale-in"
            >
              <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="max-w-[140px] truncate">{file.name}</span>
              <button
                onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
                className="text-slate-600 hover:text-slate-300 ml-0.5 transition-colors w-4 h-4 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input wrapper */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-xl border transition-all duration-150",
          isDragging
            ? "border-blue-500/60 bg-blue-950/20 ring-1 ring-blue-500/30"
            : "border-[rgb(30_41_70)] bg-[rgb(14_20_38)] hover:border-[rgb(44_58_95)]",
          "focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20"
        )}
      >
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center z-10 rounded-xl">
            <p className="text-sm text-blue-300 font-medium">Drop files to attach</p>
          </div>
        )}

        <textarea
          ref={taRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Message your AI Operating Partner…"
          rows={1}
          className={cn(
            "w-full bg-transparent resize-none px-4 py-3.5 pb-12",
            "text-sm text-slate-200 placeholder-slate-600",
            "focus:outline-none leading-relaxed",
            isDragging && "opacity-0"
          )}
          style={{ minHeight: "52px", maxHeight: "240px" }}
        />

        {/* Bottom toolbar */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pb-2.5">
          <div className="flex items-center gap-1">

            {/* File attach */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              title="Attach .txt, .md, or .csv"
              className="btn-icon w-7 h-7 rounded-md text-slate-600 hover:text-slate-400"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".txt,.md,.csv,text/*"
              onChange={(e) => { addFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }}
              className="hidden"
            />

            {/* Mode picker */}
            <div className="relative" ref={modeMenuRef}>
              <button
                type="button"
                onClick={() => setShowModes(!showModes)}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors",
                  modeMeta.pill.replace("border", "").trim(),
                  "border",
                  modeMeta.pill.includes("border") ? modeMeta.pill.split("border")[1] : "border-transparent"
                )}
              >
                {modeMeta.icon}
                <span className="hidden sm:block font-medium">{AGENT_MODE_LABELS[currentMode]}</span>
                <svg className={cn("w-3 h-3 transition-transform duration-200", showModes && "rotate-180")}
                     fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showModes && (
                <div className="absolute bottom-8 left-0 w-56 bg-[rgb(14_20_38)] border border-[rgb(30_41_70)] rounded-xl shadow-card-lg z-50 py-1.5 overflow-hidden animate-slide-up">
                  <p className="px-3 pt-0.5 pb-1.5 text-[10px] font-medium text-slate-600 uppercase tracking-wider">
                    Operating Mode
                  </p>
                  {ALL_MODES.map((m) => {
                    const meta = MODE_META[m];
                    const active = m === currentMode;
                    return (
                      <button
                        key={m}
                        onClick={() => { onModeChange(m); setShowModes(false); }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors duration-100",
                          active
                            ? "bg-[rgb(20_28_52)] text-slate-200"
                            : "text-slate-400 hover:text-slate-200 hover:bg-[rgb(20_28_52)]"
                        )}
                      >
                        <span className={cn("shrink-0", active ? "" : "opacity-60")}>{meta.icon}</span>
                        <span className={active ? "font-medium" : ""}>{AGENT_MODE_LABELS[m]}</span>
                        {active && (
                          <svg className="w-3 h-3 ml-auto text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Send / Stop */}
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                         bg-[rgb(20_28_52)] hover:bg-[rgb(28_38_68)]
                         text-slate-400 border border-[rgb(44_58_95)] transition-colors"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!canSend}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                canSend
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-900/40 active:scale-95"
                  : "bg-[rgb(20_28_52)] text-slate-700 cursor-not-allowed border border-[rgb(30_41_70)]"
              )}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-[10px] text-slate-800 select-none">
        All data encrypted · Tenant-isolated · E3 Confidential
      </p>
    </div>
  );
}
