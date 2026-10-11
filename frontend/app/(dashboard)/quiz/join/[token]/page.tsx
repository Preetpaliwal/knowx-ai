"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  Clock,
  Users,
  Timer,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Trophy,
  User,
} from "lucide-react";
import {
  validateQuizSession,
  joinQuizSession,
  submitQuizAttempt,
  getQuizLeaderboard,
  QuizSession,
  QuizAttempt,
  QuizQuestion,
} from "../../../../../lib/api";

export default function JoinQuizPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [session, setSession] = useState<QuizSession | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);

  // Join form
  const [participantName, setParticipantName] = useState("");
  const [joining, setJoining] = useState(false);

  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<(QuizAttempt & { questions: QuizQuestion[] }) | null>(null);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<QuizAttempt[]>([]);

  useEffect(() => {
    if (token) {
      validateSession();
    }
  }, [token]);

  const validateSession = async () => {
    try {
      const response = await validateQuizSession(token);

      if ("error" in response) {
        setError(response.message);
      } else {
        setSession(response.session);
        setAnswers(Array(response.session.questions.length).fill(""));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid session link");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!participantName.trim()) {
      setError("Please enter your name");
      return;
    }

    setJoining(true);
    setError("");

    try {
      const response = await joinQuizSession(token, participantName.trim());
      setAttempt(response.attempt);
      setSession(response.session);
      setStartTime(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to join session");
    } finally {
      setJoining(false);
    }
  };

  const handleSelectAnswer = (option: string) => {
    setAnswers((prev) => {
      const updated = [...prev];
      updated[currentIndex] = option;
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!attempt || !startTime) return;

    setLoading(true);

    try {
      const timeTaken = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      const response = await submitQuizAttempt(token, attempt.id, answers, timeTaken);
      setResult(response.result);
      setSubmitted(true);

      // Load leaderboard if enabled
      if (session?.showLeaderboard) {
        const leaderboardData = await getQuizLeaderboard(token);
        setLeaderboard(leaderboardData.leaderboard);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit answers");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds?: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getRankSuffix = (rank: number) => {
    if (rank === 1) return "st";
    if (rank === 2) return "nd";
    if (rank === 3) return "rd";
    return "th";
  };

  // Loading state
  if (loading && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-3 text-sm text-slate-500">Loading quiz session...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="study-card p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-50 text-red-600 mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Session Unavailable</h2>
          <p className="text-sm text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // Show result screen
  if (submitted && result) {
    return (
      <div className="min-h-screen p-4 sm:p-8 bg-slate-50">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Result Header */}
          <div className="study-card p-8 text-center">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-50 text-emerald-600 mb-4">
              <Trophy className="h-10 w-10" />
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-2">Quiz Complete!</h1>
            <p className="text-lg font-semibold text-emerald-700 mb-4">
              Score: {result.score}/{result.questions.length} ({result.percentage.toFixed(0)}%)
            </p>

            {result.rank && (
              <p className="text-sm text-slate-600">
                You ranked{" "}
                <span className="font-bold text-emerald-700">
                  {result.rank}
                  {getRankSuffix(result.rank)}
                </span>{" "}
                place
              </p>
            )}

            {result.timeTakenSeconds && (
              <p className="text-sm text-slate-500 mt-2">
                Time taken: {formatTime(result.timeTakenSeconds)}
              </p>
            )}
          </div>

          {/* Answer Review */}
          <div className="study-card p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
              Answer Review
            </h3>

            <div className="space-y-4">
              {result.questions.map((q, i) => {
                const isCorrect = result.answers[i] === q.answer;
                return (
                  <div
                    key={i}
                    className={`rounded-xl border p-4 ${
                      isCorrect ? "border-emerald-200 bg-emerald-50/50" : "border-rose-200 bg-rose-50/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 text-sm">
                        <p className="font-bold text-slate-900 mb-2">
                          {i + 1}. {q.question}
                        </p>
                        <p className="text-xs text-slate-600 mb-1">
                          <span className="font-semibold">Your answer:</span>{" "}
                          <span className={isCorrect ? "text-emerald-700 font-medium" : "text-rose-700 font-medium"}>
                            {result.answers[i] || "No answer"}
                          </span>
                        </p>
                        {!isCorrect && (
                          <p className="text-xs text-slate-600 mb-1">
                            <span className="font-semibold">Correct answer:</span>{" "}
                            <span className="text-emerald-700 font-medium">{q.answer}</span>
                          </p>
                        )}
                        <p className="text-xs text-slate-500 pt-2 border-t border-slate-200 mt-2">
                          {q.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leaderboard */}
          {session.showLeaderboard && leaderboard.length > 0 && (
            <div className="study-card p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
                Leaderboard
              </h3>

              <div className="space-y-2">
                {leaderboard.map((entry, i) => (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      entry.participantName === participantName
                        ? "bg-emerald-50 border border-emerald-200"
                        : "bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-600 text-sm w-6">#{entry.rank}</span>
                      <span className="font-medium text-slate-900 text-sm">
                        {entry.participantName}
                        {entry.participantName === participantName && (
                          <span className="text-emerald-600 ml-2">(You)</span>
                        )}
                      </span>
                    </div>
                    <span className="font-bold text-emerald-700 text-sm">
                      {entry.score} pts ({entry.percentage.toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show quiz interface
  if (attempt && !submitted) {
    const currentQuestion = session.questions[currentIndex];
    const progressPercent = Math.round(((currentIndex + 1) / session.questions.length) * 100);

    return (
      <div className="min-h-screen p-4 sm:p-8 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="study-card p-6 sm:p-8">
            {/* Progress */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-3">
              <span>
                Question {currentIndex + 1} of {session.questions.length}
              </span>
              <span className="text-emerald-600">{progressPercent}% Complete</span>
            </div>

            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden mb-8">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Question */}
            <h2 className="text-xl font-bold text-slate-900 mb-6">{currentQuestion.question}</h2>

            {/* Options */}
            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isSelected = answers[currentIndex] === option;

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectAnswer(option)}
                    className={`w-full flex items-center gap-3 rounded-xl border p-4 text-left text-sm font-medium transition-all ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600"
                        : "border-slate-200 bg-white text-slate-800 hover:border-emerald-200 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                        isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {letter}
                    </span>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>

              {currentIndex === session.questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={answers.some((a) => !a) || loading}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Quiz</span>
                      <CheckCircle2 className="h-4 w-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(session.questions.length - 1, prev + 1))}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-all"
                >
                  <span>Next</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show join form
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="study-card p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 mb-4">
            <Users className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{session.title}</h1>
          <p className="text-sm text-slate-600">
            {session.questions.length} questions · {session.difficulty}
          </p>
        </div>

        {/* Session Info */}
        <div className="space-y-2 mb-6 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Expires: {new Date(session.expiresAt).toLocaleString()}</span>
          </div>
          {session.timerMinutes && (
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              <span>Time limit: {session.timerMinutes} minutes</span>
            </div>
          )}
          {session.maxParticipants && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Max participants: {session.maxParticipants}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Join Form */}
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Your Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Enter your name"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                maxLength={100}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={joining || !participantName.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {joining ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Joining...</span>
              </>
            ) : (
              <>
                <span>Join Quiz</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
