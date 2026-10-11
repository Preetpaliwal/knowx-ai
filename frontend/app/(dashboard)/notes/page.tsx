"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Eye,
  FileText,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  MessageCircle,
  Zap,
  Calendar,
  X,
  Copy,
  Check,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { deleteNote, getNotes, Note, summarizeNote } from "@/lib/api";
import UploadNotesModal from "@/components/UploadNotesModal";

const fileLabel = (type: string) =>
  type.includes("pdf") ? "PDF" : type.includes("word") ? "DOCX" : "TXT";

const formatSize = (size: number) => {
  if (!size) return "0 KB";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<{ noteId: string; text: string } | null>(null);
  const [previewNote, setPreviewNote] = useState<Note | null>(null);
  const [busyId, setBusyId] = useState("");
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const loadNotes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getNotes();
      setNotes(res.notes || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load notes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q) setQuery(q);
    }
  }, []);

  const visibleNotes = useMemo(() => {
    return notes
      .filter((n) => {
        const matchesQuery =
          !query ||
          `${n.title} ${n.fileName} ${n.excerpt || ""}`
            .toLowerCase()
            .includes(query.toLowerCase());
        const matchesFilter = filter === "ALL" || fileLabel(n.fileType) === filter;
        return matchesQuery && matchesFilter;
      })
      .sort((a, b) => {
        if (sort === "alpha") return a.title.localeCompare(b.title);
        if (sort === "size") return (b.fileSize || 0) - (a.fileSize || 0);
        if (sort === "oldest") return (a.createdAt || "").localeCompare(b.createdAt || "");
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      });
  }, [notes, query, filter, sort]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this study note permanently?")) return;
    setBusyId(id);
    try {
      await deleteNote(id);
      if (summary?.noteId === id) setSummary(null);
      if (previewNote?.id === id) setPreviewNote(null);
      await loadNotes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete note.");
    } finally {
      setBusyId("");
    }
  };

  const handleSummarize = async (note: Note) => {
    setBusyId(note.id);
    setError("");
    try {
      const res = await summarizeNote(note.id);
      setSummary({ noteId: note.id, text: res.summary });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to summarize note.");
    } finally {
      setBusyId("");
    }
  };

  const handleCopySummary = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary.text);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-12 font-mono text-foreground">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b-2 border-current pb-4">
        <div>
          <div className="section-marker mb-1">
            <span>// MODULE: NOTES_LIBRARY</span>
            <span>INDEXED_DOCUMENTS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            MY STUDY NOTES
          </h1>
          <p className="text-xs opacity-70 mt-0.5">
            Review uploaded materials, generate AI summaries, or practice custom quizzes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="brutalist-btn-orange px-5 py-2.5 text-xs font-bold uppercase flex items-center gap-2"
          >
            <UploadCloud className="h-4 w-4" />
            <span>UPLOAD NEW NOTES</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 border-2 border-current bg-background p-4 brutalist-card-static md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes by title or content..."
            className="brutalist-input pl-10 text-xs font-mono"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <Filter className="h-4 w-4 opacity-50 shrink-0 ml-1 mr-1" />
          {["ALL", "PDF", "DOCX", "TXT"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilter(type)}
              className={`px-3 py-1 text-xs font-bold uppercase border-2 transition-all ${
                filter === type
                  ? "bg-[#7C3AED] text-white border-current"
                  : "border-current bg-background hover:bg-current/5"
              }`}
            >
              {type === "ALL" ? "ALL" : type}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="h-4 w-4 opacity-50" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border-2 border-current bg-background px-3 py-1.5 text-xs font-bold uppercase outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="alpha">Alphabetical</option>
            <option value="size">Largest Size</option>
          </select>
        </div>
      </div>

      {/* AI Summary Banner if triggered */}
      {summary && (
        <div className="relative border-2 border-[#7C3AED] bg-background p-5 text-xs font-mono space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b-2 border-current">
            <div className="flex items-center gap-2 font-bold text-[#7C3AED] uppercase">
              <Sparkles className="h-4 w-4" />
              <span>AI EXECUTIVE SUMMARY</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySummary}
                className="flex items-center gap-1 border border-current px-2.5 py-1 text-[10px] font-bold uppercase hover:bg-current hover:text-background"
              >
                {copiedSummary ? <Check className="h-3 w-3 text-[#16a34a]" /> : <Copy className="h-3 w-3" />}
                <span>{copiedSummary ? "COPIED" : "COPY"}</span>
              </button>
              <button
                type="button"
                onClick={() => setSummary(null)}
                className="p-1 text-current hover:bg-current/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="whitespace-pre-wrap leading-relaxed opacity-90 text-xs sm:text-sm">
            {summary.text}
          </div>
        </div>
      )}

      {/* Quick Preview Modal */}
      {previewNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col border-2 border-current bg-background p-6 brutalist-card-static overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b-2 border-current">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center bg-[#7C3AED] text-white font-bold border border-current">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase">{previewNote.title}</h3>
                  <p className="text-[10px] opacity-70 uppercase">
                    {fileLabel(previewNote.fileType)} · {formatSize(previewNote.fileSize)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewNote(null)}
                className="p-1 border border-current hover:bg-current hover:text-background"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="my-4 overflow-y-auto max-h-[50vh] p-4 border border-current/20 bg-current/5 text-xs font-mono leading-relaxed whitespace-pre-wrap">
              {previewNote.excerpt || "No text preview available for this document."}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t-2 border-current">
              <button
                onClick={() => setPreviewNote(null)}
                className="brutalist-btn-secondary px-4 py-2 text-xs"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && visibleNotes.length === 0 && (
        <div className="border-2 border-current bg-background p-12 text-center brutalist-card-static space-y-3">
          <BookOpen className="h-12 w-12 mx-auto text-[#7C3AED] opacity-50" />
          <h2 className="text-lg font-black uppercase">NO NOTES FOUND</h2>
          <p className="text-xs opacity-70 max-w-md mx-auto">
            {notes.length === 0
              ? "Upload your lecture notes, PDFs, or TXT documents to get started."
              : "No notes match your current search query or format filter."}
          </p>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="brutalist-btn-orange inline-flex px-5 py-2.5 text-xs font-bold uppercase mt-4"
          >
            <UploadCloud className="h-4 w-4" />
            <span>UPLOAD NOTES NOW</span>
          </button>
        </div>
      )}

      {/* Notes Grid */}
      {!loading && !error && visibleNotes.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleNotes.map((note) => {
            const isBusy = busyId === note.id;
            return (
              <article
                key={note.id}
                className="border-2 border-current bg-background p-5 brutalist-card flex flex-col justify-between"
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-10 w-10 shrink-0 place-items-center bg-[#7C3AED] text-white font-bold border border-current">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-xs sm:text-sm font-black uppercase hover:text-[#7C3AED] transition-colors">
                          {note.title}
                        </h2>
                        <span className="text-[10px] font-bold text-[#7C3AED] uppercase">
                          {fileLabel(note.fileType)} · {formatSize(note.fileSize)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(note.id)}
                      disabled={isBusy}
                      title="Delete note"
                      className="p-1 border border-transparent hover:border-red-600 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Excerpt preview */}
                  <p className="mt-4 line-clamp-3 min-h-[54px] text-xs leading-relaxed opacity-80 border-t border-current/20 pt-3">
                    {note.excerpt || "Text processed and indexed for AI questions."}
                  </p>
                </div>

                {/* Footer and action suite */}
                <div className="mt-5 pt-3 border-t-2 border-current">
                  <div className="flex items-center justify-between text-[10px] opacity-60 uppercase mb-3">
                    <span>{note.date || "Recent"}</span>
                    <span className="truncate max-w-[150px]">{note.fileName}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewNote(note)}
                      className="border border-current px-2.5 py-1 text-[10px] font-bold uppercase hover:bg-current hover:text-background transition-colors"
                    >
                      <Eye className="h-3 w-3 inline mr-1" />
                      <span>PREVIEW</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSummarize(note)}
                      disabled={isBusy}
                      className="border border-current bg-[#7C3AED] text-white px-2.5 py-1 text-[10px] font-bold uppercase hover:bg-[#6D28D9] transition-colors"
                    >
                      {isBusy ? <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> : <Sparkles className="h-3 w-3 inline mr-1" />}
                      <span>SUMMARY</span>
                    </button>

                    <Link
                      href={`/chat?note=${note.id}`}
                      className="border border-current px-2.5 py-1 text-[10px] font-bold uppercase hover:bg-current hover:text-background transition-colors"
                    >
                      <MessageCircle className="h-3 w-3 inline mr-1" />
                      <span>CHAT</span>
                    </Link>

                    <Link
                      href={`/quiz?note=${note.id}`}
                      className="border border-current px-2.5 py-1 text-[10px] font-bold uppercase hover:bg-current hover:text-background transition-colors"
                    >
                      <Zap className="h-3 w-3 inline mr-1 text-[#7C3AED]" />
                      <span>QUIZ</span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Upload Modal component */}
      <UploadNotesModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={loadNotes}
      />
    </div>
  );
}
