"use client";

import { useState } from "react";
import { X, Copy, Share2, Clock, Users, Timer, Check, ExternalLink, QrCode } from "lucide-react";
import { createQuizSession, QuizQuestion, QuizSession } from "@/lib/api";

type CreateLiveQuizModalProps = {
  isOpen: boolean;
  onClose: () => void;
  questions: QuizQuestion[];
  topic: string;
  difficulty: string;
};

export default function CreateLiveQuizModal({
  isOpen,
  onClose,
  questions,
  topic,
  difficulty,
}: CreateLiveQuizModalProps) {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<QuizSession | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Form state
  const [title, setTitle] = useState(topic || "Live Quiz Session");
  const [expiryOption, setExpiryOption] = useState<"30m" | "1h" | "24h" | "custom">("1h");
  const [customExpiry, setCustomExpiry] = useState("");
  const [maxParticipants, setMaxParticipants] = useState<number | null>(null);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(true);

  if (!isOpen) return null;

  const handleCreate = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await createQuizSession({
        title,
        topic,
        difficulty,
        questions,
        expiry_option: expiryOption,
        custom_expiry: expiryOption === "custom" ? customExpiry : null,
        max_participants: maxParticipants,
        timer_minutes: timerMinutes,
        show_leaderboard: showLeaderboard,
        created_by: "Teacher",
      });

      setSession(response.session);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create quiz session");
    } finally {
      setLoading(false);
    }
  };

  const getShareUrl = () => {
    if (!session) return "";
    return `${window.location.origin}/quiz/join/${session.joinToken}`;
  };

  const getDashboardUrl = () => {
    if (!session) return "";
    return `${window.location.origin}/quiz/dashboard/${session.joinToken}`;
  };

  const handleCopy = async () => {
    const url = getShareUrl();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = getShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join Quiz: ${title}`,
          text: `Join my quiz session with code: ${session?.joinCode}`,
          url,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  const formatExpiry = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="study-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Create Live Quiz Session</h2>
            <p className="text-xs text-slate-500 mt-1">
              Share with students via link or join code
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        {!session ? (
          /* Configuration Form */
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Quiz Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Enter a descriptive title"
              />
            </div>

            {/* Expiry */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Session Expiry
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: "30m", label: "30 min" },
                  { value: "1h", label: "1 hour" },
                  { value: "24h", label: "24 hours" },
                  { value: "custom", label: "Custom" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExpiryOption(opt.value as any)}
                    className={`rounded-xl py-2 text-xs font-bold transition-all ${
                      expiryOption === opt.value
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {expiryOption === "custom" && (
                <input
                  type="datetime-local"
                  value={customExpiry}
                  onChange={(e) => setCustomExpiry(e.target.value)}
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              )}
            </div>

            {/* Optional Settings */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Max Participants (Optional)
                </label>
                <input
                  type="number"
                  value={maxParticipants || ""}
                  onChange={(e) => setMaxParticipants(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Unlimited"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Timer (Minutes, Optional)
                </label>
                <input
                  type="number"
                  value={timerMinutes || ""}
                  onChange={(e) => setTimerMinutes(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="No timer"
                  min="1"
                />
              </div>
            </div>

            {/* Show Leaderboard */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showLeaderboard}
                onChange={(e) => setShowLeaderboard(e.target.checked)}
                className="h-4 w-4 rounded accent-emerald-600"
              />
              <span className="text-sm font-medium text-slate-700">
                Show leaderboard to students after submission
              </span>
            </label>

            {/* Quiz Info */}
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-1 text-xs">
              <p className="text-slate-600">
                <span className="font-semibold">Topic:</span> {topic}
              </p>
              <p className="text-slate-600">
                <span className="font-semibold">Difficulty:</span> {difficulty}
              </p>
              <p className="text-slate-600">
                <span className="font-semibold">Questions:</span> {questions.length}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={loading || !title.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    <span>Create Session</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Session Created - Show Share Options */
          <div className="space-y-6">
            {/* Success Message */}
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 mb-4">
                <Check className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Quiz Session Created!</h3>
              <p className="text-sm text-slate-500 mt-1">
                Share this link with your students
              </p>
            </div>

            {/* Join Code - Large Display */}
            <div className="text-center py-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
                Join Code
              </p>
              <p className="text-4xl font-black text-emerald-900 tracking-wider">
                {session.joinCode}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Students can enter this code to join
              </p>
            </div>

            {/* Share URL */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Share Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={getShareUrl()}
                  readOnly
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Session Details */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-center gap-2 text-slate-600 mb-1">
                  <Clock className="h-4 w-4" />
                  <p className="text-xs font-semibold">Expires</p>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {formatExpiry(session.expiresAt)}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-center gap-2 text-slate-600 mb-1">
                  <Users className="h-4 w-4" />
                  <p className="text-xs font-semibold">Participants</p>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {session.maxParticipants ? `Max ${session.maxParticipants}` : "Unlimited"}
                </p>
              </div>
            </div>

            {session.timerMinutes && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
                <Timer className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-xs font-bold text-amber-900">
                    Timer: {session.timerMinutes} minutes
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Students will see a countdown timer
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={handleShare}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-all"
              >
                <Share2 className="h-4 w-4" />
                <span>Share Link</span>
              </button>

              <a
                href={getDashboardUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-white border-2 border-emerald-600 px-6 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-50 transition-all"
              >
                <ExternalLink className="h-4 w-4" />
                <span>View Dashboard</span>
              </a>
            </div>

            <button
              onClick={onClose}
              className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700 py-2"
            >
              Close and continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
