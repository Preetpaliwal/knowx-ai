"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Trophy,
  XCircle,
  Copy,
  Share2,
  ExternalLink,
} from "lucide-react";
import {
  getQuizSessionDashboard,
  closeQuizSession,
  QuizSessionDashboard,
} from "../../../../../lib/api";

export default function QuizDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<QuizSessionDashboard | null>(null);
  const [copied, setCopied] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (token) {
      loadDashboard();
    }
  }, [token]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!dashboard) return;

    const interval = setInterval(() => {
      loadDashboard(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [dashboard]);

  const loadDashboard = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");

    try {
      const data = await getQuizSessionDashboard(token);
      setDashboard(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCloseSession = async () => {
    if (!confirm("Are you sure you want to close this session? Students will no longer be able to join.")) {
      return;
    }

    setClosing(true);
    try {
      await closeQuizSession(token);
      await loadDashboard();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to close session");
    } finally {
      setClosing(false);
    }
  };

  const getShareUrl = () => {
    return `${window.location.origin}/quiz/join/${token}`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = getShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join Quiz: ${dashboard?.session.title}`,
          text: `Join my quiz session with code: ${dashboard?.session.joinCode}`,
          url,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  if (loading && !dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-3 text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="study-card p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-50 text-red-600 mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Dashboard Unavailable</h2>
          <p className="text-sm text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/quiz")}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Return to Quiz Studio
          </button>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const { session, participants, attempts, statistics } = dashboard;
  const submittedAttempts = attempts.filter((a) => a.submittedAt);
  const inProgressAttempts = attempts.filter((a) => !a.submittedAt);

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="study-card p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-900">{session.title}</h1>
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full ${
                    session.status === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : session.status === "expired"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {session.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-slate-600">
                {session.topic} · {session.difficulty} · {session.questions.length} questions
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadDashboard()}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>

              {session.status === "active" && (
                <button
                  onClick={handleCloseSession}
                  disabled={closing}
                  className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-all"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Close Session</span>
                </button>
              )}
            </div>
          </div>

          {/* Share Info */}
          <div className="mt-6 pt-6 border-t border-slate-100 grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Join Code</p>
              <p className="text-2xl font-black text-emerald-700">{session.joinCode}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Share Link</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={getShareUrl()}
                  readOnly
                  className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-600" />
                  )}
                </button>
                <button
                  onClick={handleShare}
                  className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <Share2 className="h-4 w-4 text-slate-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="study-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Total Participants</p>
                <p className="text-2xl font-bold text-slate-900">{participants.total}</p>
              </div>
            </div>
          </div>

          <div className="study-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Submitted</p>
                <p className="text-2xl font-bold text-slate-900">{participants.submitted}</p>
              </div>
            </div>
          </div>

          <div className="study-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">In Progress</p>
                <p className="text-2xl font-bold text-slate-900">{participants.inProgress}</p>
              </div>
            </div>
          </div>

          <div className="study-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Average Score</p>
                <p className="text-2xl font-bold text-slate-900">
                  {statistics.averagePercentage.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard / Results */}
        {submittedAttempts.length > 0 && (
          <div className="study-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900">Leaderboard</h2>
            </div>

            <div className="space-y-2">
              {submittedAttempts
                .sort((a, b) => {
                  if (a.rank !== b.rank) return (a.rank || 999) - (b.rank || 999);
                  return new Date(a.submittedAt!).getTime() - new Date(b.submittedAt!).getTime();
                })
                .map((attempt, idx) => (
                  <div
                    key={attempt.id}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      idx < 3 ? "bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200" : "bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-lg font-black ${
                          attempt.rank === 1
                            ? "text-amber-500"
                            : attempt.rank === 2
                            ? "text-slate-400"
                            : attempt.rank === 3
                            ? "text-amber-700"
                            : "text-slate-500"
                        }`}
                      >
                        #{attempt.rank}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{attempt.participantName}</p>
                        <p className="text-xs text-slate-500">
                          Submitted {new Date(attempt.submittedAt!).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-emerald-700 text-lg">
                        {attempt.score}/{session.questions.length}
                      </p>
                      <p className="text-xs text-slate-500">{attempt.percentage.toFixed(0)}%</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* In Progress Participants */}
        {inProgressAttempts.length > 0 && (
          <div className="study-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900">In Progress</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {inProgressAttempts.map((attempt) => (
                <div key={attempt.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="font-bold text-slate-900 text-sm mb-1">{attempt.participantName}</p>
                  <p className="text-xs text-slate-500">
                    Started {new Date(attempt.startedAt).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Participants Yet */}
        {attempts.length === 0 && (
          <div className="study-card p-12 text-center">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Participants Yet</h3>
            <p className="text-sm text-slate-500 mb-6">
              Share the join link or code with your students to get started
            </p>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-all"
            >
              <Share2 className="h-4 w-4" />
              <span>Share Session</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
