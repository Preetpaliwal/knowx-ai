"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  FileText,
  Loader2,
  MessageCircle,
  Zap,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { getNote, Note, summarizeNote } from "@/lib/api";

const fileLabel = (type: string) =>
  type.includes("pdf") ? "PDF Document" : type.includes("word") ? "DOCX Document" : "TXT Document";

const formatSize = (size: number) => {
  if (!size) return "0 KB";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

export default function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [note, setNote] = useState<Note | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    params
      .then(({ id }) => getNote(id))
      .then((r) => setNote(r.note))
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load note."));
  }, [params]);

  const handleCopyText = async () => {
    if (!note?.content && !note?.excerpt) return;
    try {
      await navigator.clipboard.writeText(note.content || note.excerpt || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSummarize = async () => {
    if (!note) return;
    setSummarizing(true);
    try {
      const res = await summarizeNote(note.id);
      setSummary(res.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to summarize note.");
    } finally {
      setSummarizing(false);
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 pt-6">
        <Link
          href="/notes"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16a34a]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to library</span>
        </Link>
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-sm text-rose-700">
          {error}
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <Loader2 className="h-5 w-5 animate-spin text-[#16a34a]" />
          <span>Opening study document...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Breadcrumb navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/notes"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Notes</span>
        </Link>

        {/* Action quick links */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSummarize}
            disabled={summarizing}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-[#f0fdf4] px-3.5 py-1.5 text-xs font-bold text-[#065f46] hover:bg-[#dcfce7] transition-all"
          >
            {summarizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-[#16a34a]" />}
            <span>Summarize</span>
          </button>

          <Link
            href={`/chat?note=${note.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-800 hover:bg-blue-100 transition-all"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Ask AI</span>
          </Link>

          <Link
            href={`/quiz?note=${note.id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#16a34a] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#15803d] transition-all"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Practice Quiz</span>
          </Link>
        </div>
      </div>

      {/* Note Header Card */}
      <div className="study-card p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#dcfce7] text-[#16a34a] border border-emerald-100">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{note.title}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-emerald-700">{fileLabel(note.fileType)}</span>
                <span>•</span>
                <span>{note.fileName}</span>
                <span>•</span>
                <span>{formatSize(note.fileSize)}</span>
                <span>•</span>
                <span>Uploaded {note.date}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyText}
            title="Copy document text"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy Text"}</span>
          </button>
        </div>

        {/* AI Summary card if triggered */}
        {summary && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-[#f0fdf4] p-5 text-slate-800">
            <div className="flex items-center gap-2 font-bold text-[#065f46] text-xs uppercase tracking-wider mb-2">
              <Sparkles className="h-4 w-4 text-[#16a34a]" />
              <span>AI Summary</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{summary}</p>
          </div>
        )}

        {/* Document Content View */}
        <div className="mt-6 border-t border-slate-100 pt-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Extracted Content</h2>
          <div className="rounded-2xl bg-slate-50/70 p-6 font-mono text-xs sm:text-sm leading-relaxed text-slate-800 whitespace-pre-wrap border border-slate-200/60">
            {note.content || note.excerpt || "No extracted text available for this document."}
          </div>
        </div>
      </div>
    </div>
  );
}
