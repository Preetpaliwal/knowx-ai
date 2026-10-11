"use client";

import React, { useState } from "react";
import { Check, Copy, Sparkles, User } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";

type Props = {
  from: "user" | "ai";
  text: string;
  time?: string;
  onRegenerate?: () => void;
  isLatestAi?: boolean;
};

export default function MessageBubble({ from, text, time, onRegenerate, isLatestAi }: Props) {
  const isUser = from === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className={`flex w-full gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#16a34a] to-[#065f46] text-white shadow-sm">
          <Sparkles className="h-4 w-4" />
        </div>
      )}

      <div className={`group relative max-w-[85%] md:max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl p-4 shadow-sm transition-all ${
            isUser
              ? "bg-[#16a34a] text-white rounded-tr-sm"
              : "border border-[#e2e8f0] bg-white text-slate-900 rounded-tl-sm"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed font-normal">{text}</p>
          ) : (
            <MarkdownRenderer content={text} />
          )}

          {/* Bubble footer with timestamp and actions */}
          <div className="mt-2 flex items-center justify-between gap-4 border-t border-black/5 pt-1.5 text-[11px]">
            <span className={isUser ? "text-emerald-100/80" : "text-slate-400"}>{time || "Just now"}</span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                title="Copy response"
                className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity rounded px-1.5 py-0.5 ${
                  isUser ? "text-white/80 hover:bg-white/20" : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                <span className="text-[10px]">{copied ? "Copied" : "Copy"}</span>
              </button>

              {!isUser && isLatestAi && onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  title="Regenerate response"
                  className="opacity-0 group-hover:opacity-100 transition-opacity rounded px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-50"
                >
                  Regenerate
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {isUser && (
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-200 text-slate-700">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
