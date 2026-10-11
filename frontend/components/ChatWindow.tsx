"use client";

import React, { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import {
  FileText,
  Loader2,
  Plus,
  Send,
  Sparkles,
  RefreshCw,
  BookOpen,
  HelpCircle,
  RotateCcw
} from "lucide-react";
import { ChatMessage, getChatHistory, getNotes, Note, sendChatMessage } from "@/lib/api";

type Msg = {
  id: string;
  from: "user" | "ai";
  text: string;
  time?: string;
};

const SUGGESTED_PROMPTS = [
  "Explain this topic in simple language",
  "Summarize my uploaded notes",
  "Generate a practice quiz for this chapter",
  "Explain recursion with a real-world example",
  "Compare two key concepts from my notes",
  "Create important exam questions",
  "Create a 7-day study plan"
];

function toMessage(message: ChatMessage): Msg {
  return {
    id: message.id,
    from: message.role === "user" ? "user" : "ai",
    text: message.content,
    time: message.createdAt
      ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : undefined,
  };
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState("");
  const messagesEnd = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getChatHistory(), getNotes()])
      .then(([history, noteResponse]) => {
        if (!active) return;
        setMessages(history.messages.map(toMessage));
        setNotes(noteResponse.notes || []);

        // Check URL params if a note was pre-selected (e.g. from notes page)
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const noteParam = params.get("note");
          if (noteParam) {
            setSelectedNoteIds([noteParam]);
          }
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Unable to load chat.");
      })
      .finally(() => {
        if (active) setIsLoadingHistory(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMessage: Msg = {
      id: `local-user-${Date.now()}`,
      from: "user",
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError("");
    setIsTyping(true);

    try {
      const response = await sendChatMessage({
        question: trimmed,
        note_ids: selectedNoteIds.map(Number),
      });

      const aiMessage: Msg = {
        id: `local-ai-${Date.now()}`,
        from: "ai",
        text: response.answer,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((current) => [...current, aiMessage]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to get an answer.");
    } finally {
      setIsTyping(false);
    }
  }

  const regenerateLatestResponse = async () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.from === "user");
    if (!lastUserMessage || isTyping) return;

    setError("");
    setIsTyping(true);
    try {
      const response = await sendChatMessage({
        question: lastUserMessage.text,
        note_ids: selectedNoteIds.map(Number),
      });

      const aiMessage: Msg = {
        id: `local-ai-${Date.now()}`,
        from: "ai",
        text: response.answer,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((current) => [...current, aiMessage]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to regenerate response.");
    } finally {
      setIsTyping(false);
    }
  };

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  // Populate suggestion in textarea so user can review and edit before sending
  function handleSelectSuggestion(suggestion: string) {
    setInput(suggestion);
    textareaRef.current?.focus();
  }

  const latestAiIndex = messages.map((m) => m.from).lastIndexOf("ai");

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[580px] w-full gap-5">
      {/* Context sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col gap-4 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm lg:flex">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#16a34a]" />
            <h4 className="text-sm font-bold text-slate-900">Study Session</h4>
          </div>
          <button
            type="button"
            title="Start new conversation"
            onClick={() => setMessages([])}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Selected note context */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Linked Notes</label>
          <div className="mt-2">
            <select
              value=""
              onChange={(e) => {
                if (e.target.value && !selectedNoteIds.includes(e.target.value)) {
                  setSelectedNoteIds([...selectedNoteIds, e.target.value]);
                }
              }}
              className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#16a34a]"
            >
              <option value="">+ Attach a note to context</option>
              {notes.map((note) => (
                <option key={note.id} value={note.id}>
                  {note.title}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
            {selectedNoteIds.length === 0 ? (
              <p className="text-[11px] text-slate-400">No notes attached. Chatting across all topics.</p>
            ) : (
              selectedNoteIds.map((id) => {
                const note = notes.find((n) => n.id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 border border-current bg-[#7C3AED] text-white px-2.5 py-1 text-[11px] font-bold uppercase rounded"
                  >
                    <FileText className="h-3 w-3" />
                    <span className="max-w-[130px] truncate">{note?.title || "Note"}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedNoteIds(selectedNoteIds.filter((item) => item !== id))}
                      className="ml-1 hover:text-black font-bold"
                    >
                      ×
                    </button>
                  </span>
                );
              })
            )}
          </div>
        </div>

        {/* Quick prompt ideas */}
        <div className="mt-auto border-t border-slate-100 pt-3">
          <p className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-wider">// EXAMPLE_QUESTIONS</p>
          <div className="mt-2 space-y-1.5 font-mono">
            {SUGGESTED_PROMPTS.slice(0, 3).map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSelectSuggestion(prompt)}
                className="w-full text-left rounded border border-current bg-[#F1F3F5] p-2 text-[11px] font-bold text-[#243B53] hover:bg-[#7C3AED] hover:text-white transition-colors line-clamp-1"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main chat column */}
      <div className="flex flex-1 flex-col border-2 border-current bg-background brutalist-card-static font-mono overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b-2 border-current px-6 py-3.5 bg-current/5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center bg-[#7C3AED] text-white font-bold border border-current">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase text-[#243B53]">STUDYMET AI TUTOR</h2>
              <p className="text-[11px] text-[#64748B]">
                {selectedNoteIds.length
                  ? `FOCUSING ON ${selectedNoteIds.length} ATTACHED NOTE(S)`
                  : "READY TO ANSWER QUESTIONS & EXPLAIN CONCEPTS"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMessages([])}
              title="Reset conversation"
              className="flex items-center gap-1 border border-current bg-background px-2.5 py-1.5 text-xs font-bold uppercase hover:bg-current hover:text-background transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">CLEAR</span>
            </button>
          </div>
        </div>

        {/* Message feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background space-y-4">
          {isLoadingHistory ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-2 border-2 border-current bg-background p-4 text-xs font-bold uppercase text-[#243B53]">
                <Loader2 className="h-4 w-4 animate-spin text-[#7C3AED]" />
                <span>LOADING_LEARNING_SESSION.SYS...</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-8">
              <div className="grid h-16 w-16 place-items-center bg-[#7C3AED] text-white font-bold border-2 border-current mb-4">
                <BookOpen className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-black uppercase text-[#243B53]">WHAT WOULD YOU LIKE TO LEARN TODAY?</h3>
              <p className="mt-1 max-w-md text-xs text-[#64748B] leading-5 uppercase">
                Ask about concepts from your uploaded study material, get code examples, or request interactive explanations.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-xl">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSelectSuggestion(prompt)}
                    className="border border-current bg-[#F1F3F5] px-3.5 py-1.5 text-xs font-bold uppercase text-[#243B53] hover:bg-[#7C3AED] hover:text-white transition-all"
                  >
                    {prompt} ↗
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, idx) => (
              <MessageBubble
                key={message.id}
                from={message.from}
                text={message.text}
                time={message.time}
                isLatestAi={idx === latestAiIndex}
                onRegenerate={regenerateLatestResponse}
              />
            ))
          )}

          {isTyping && (
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center bg-[#7C3AED] text-white border border-current">
                <Sparkles className="h-4 w-4 animate-pulse" />
              </div>
              <div className="border border-current bg-[#FFFFFF] px-4 py-3 text-xs font-bold uppercase text-[#7C3AED]">
                StudyMate AI is computing response...
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <div ref={messagesEnd} />
        </div>

        {/* Input area */}
        <div className="border-t border-[#e2e8f0] p-4 bg-white">
          {/* Suggestion pills above textarea */}
          <div className="mb-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-[10px] font-semibold uppercase text-slate-400 shrink-0">Prompts:</span>
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSelectSuggestion(prompt)}
                className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="relative flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-[#16a34a] focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="Ask anything about your notes, concepts, or exam prep..."
              className="max-h-36 min-h-[48px] flex-1 resize-none bg-transparent px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
            />

            <button
              type="button"
              onClick={() => void sendMessage(input)}
              disabled={!input.trim() || isTyping}
              title="Send message (Enter)"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#16a34a] text-white shadow-sm hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
            >
              {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Powered by Google Gemini</span>
            <span>Press <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] text-slate-600">Enter</kbd> to send, <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] text-slate-600">Shift + Enter</kbd> for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
}
