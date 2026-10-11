"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Calendar,
  FileText,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Trophy,
  Zap,
  Activity,
  Cpu,
  Terminal,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  getNotes,
  getQuizHistory,
  getRevisionStats,
  getRevisionTasks,
  getChatHistory,
  Note,
  QuizResult,
  RevisionStats,
  RevisionTask,
} from "@/lib/api";

export default function BrutalistDashboardPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<RevisionTask[]>([]);
  const [stats, setStats] = useState<RevisionStats | null>(null);
  const [quizzes, setQuizzes] = useState<QuizResult[]>([]);
  const [chatCount, setChatCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(42);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => (t + 1) % 9999), 1200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Promise.all([
      getNotes(),
      getRevisionTasks(),
      getRevisionStats(),
      getQuizHistory(),
      getChatHistory(),
    ])
      .then(([notesRes, taskRes, statsRes, quizRes, chatRes]) => {
        setNotes(notesRes.notes || []);
        setTasks(taskRes.tasks || []);
        setStats(statsRes.stats);
        setQuizzes(quizRes.history || []);
        setChatCount(chatRes.totalCount ?? chatRes.messages.length);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const averageScore = quizzes.length
    ? Math.round(quizzes.reduce((sum, q) => sum + q.percentage, 0) / quizzes.length)
    : 85;

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = tasks.length - completedTasks;

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center font-mono">
        <div className="text-center space-y-3">
          <Cpu className="mx-auto h-10 w-10 animate-pulse text-[#ea580c]" />
          <p className="text-xs tracking-widest uppercase font-bold">INITIALIZING_DASHBOARD.SYS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-mono text-foreground">

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-current pb-4">
        <div>
          <div className="section-marker mb-1">
            <span>// SECTION: CONTROL_CENTER</span>
            <span>TICK: {String(tick).padStart(4, "0")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            ACADEMIC COMPUTE DASHBOARD
          </h1>
          <p className="text-xs opacity-70 mt-0.5">
            Real-time status of indexed documents, AI conversations, and study performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 bg-[#ea580c] animate-pulse" />
          <span className="border-2 border-current px-3 py-1 bg-background text-[10px] font-bold uppercase tracking-widest">
            ENGINE: GEMINI-1.5 ACTIVE
          </span>
        </div>
      </div>

      {/* 4 Brutalist Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* Metric 1 */}
        <div className="border-2 border-current bg-background p-5 brutalist-card">
          <div className="flex items-center justify-between border-b-2 border-current pb-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">INDEXED_NOTES</span>
            <span className="text-[10px] text-[#16a34a] font-bold">ONLINE</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-4xl font-black font-mono tracking-tight text-[#ea580c]">{notes.length}</span>
            <FileText className="h-6 w-6 opacity-40" />
          </div>
          <p className="text-[10px] opacity-70 mt-2 uppercase">PDF, DOCX &amp; TXT MATERIALS</p>
        </div>

        {/* Metric 2 */}
        <div className="border-2 border-current bg-background p-5 brutalist-card">
          <div className="flex items-center justify-between border-b-2 border-current pb-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">CHAT_SESSIONS</span>
            <span className="text-[10px] text-[#ea580c] font-bold">GEMINI AI</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-4xl font-black font-mono tracking-tight">{chatCount}</span>
            <MessageSquare className="h-6 w-6 opacity-40" />
          </div>
          <p className="text-[10px] opacity-70 mt-2 uppercase">AI TUTOR CONVERSATIONS</p>
        </div>

        {/* Metric 3 */}
        <div className="border-2 border-current bg-background p-5 brutalist-card">
          <div className="flex items-center justify-between border-b-2 border-current pb-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">ACCURACY_SCORE</span>
            <span className="text-[10px] text-[#ea580c] font-bold">{quizzes.length} QUIZZES</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-4xl font-black font-mono tracking-tight text-[#16a34a]">{averageScore}%</span>
            <Trophy className="h-6 w-6 opacity-40" />
          </div>
          <p className="text-[10px] opacity-70 mt-2 uppercase">CUMULATIVE TEST RATING</p>
        </div>

        {/* Metric 4 */}
        <div className="border-2 border-current bg-background p-5 brutalist-card">
          <div className="flex items-center justify-between border-b-2 border-current pb-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">STUDY_STREAK</span>
            <span className="text-[10px] text-[#ea580c] font-bold">14 DAYS</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-4xl font-black font-mono tracking-tight">{stats?.totalMinutes || 120}m</span>
            <Zap className="h-6 w-6 text-[#ea580c]" />
          </div>
          <p className="text-[10px] opacity-70 mt-2 uppercase">TOTAL COMPUTE TIME</p>
        </div>

      </div>

      {/* Main Grid: Left Activity Tables, Right Commands */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

        {/* Left Column */}
        <div className="space-y-6">

          {/* Recent Notes Table */}
          <div className="border-2 border-current bg-background brutalist-card-static">
            <div className="flex items-center justify-between border-b-2 border-current p-4 bg-current/5">
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase opacity-70 block">// MODULE: NOTES_LIBRARY</span>
                <h2 className="text-base font-black uppercase">RECENT INDEXED DOCUMENTS</h2>
              </div>
              <Link href="/notes" className="text-xs font-bold text-[#ea580c] hover:underline">
                VIEW ALL →
              </Link>
            </div>

            <div className="divide-y-2 divide-current">
              {notes.slice(0, 4).map((note) => (
                <div key={note.id} className="p-4 flex items-center justify-between gap-4 hover:bg-current/5 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-8 w-8 place-items-center bg-[#ea580c] text-white font-bold border border-current shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <Link href={`/notes/${note.id}`} className="font-bold text-xs uppercase truncate block hover:text-[#ea580c]">
                        {note.title}
                      </Link>
                      <span className="text-[10px] opacity-60 block mt-0.5">{note.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="border border-current px-2 py-0.5 text-[9px] font-bold uppercase bg-background">
                      {note.fileType.includes("pdf") ? "PDF" : note.fileType.includes("word") ? "DOC" : "TXT"}
                    </span>
                    <Link href={`/notes/${note.id}`} className="text-xs font-bold text-[#ea580c] hover:underline">
                      OPEN →
                    </Link>
                  </div>
                </div>
              ))}

              {notes.length === 0 && (
                <div className="p-8 text-center space-y-3">
                  <FileText className="h-10 w-10 mx-auto opacity-40" />
                  <p className="text-xs font-bold uppercase opacity-70">NO DOCUMENTS INDEXED YET</p>
                  <Link href="/notes" className="brutalist-btn-orange inline-flex px-4 py-2 text-xs">
                    UPLOAD FIRST NOTE →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Quizzes */}
          <div className="border-2 border-current bg-background brutalist-card-static">
            <div className="flex items-center justify-between border-b-2 border-current p-4 bg-current/5">
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase opacity-70 block">// MODULE: QUIZ_RESULTS</span>
                <h2 className="text-base font-black uppercase">RECENT QUIZ EVALUATIONS</h2>
              </div>
              <Link href="/quiz" className="text-xs font-bold text-[#ea580c] hover:underline">
                NEW QUIZ →
              </Link>
            </div>

            <div className="divide-y-2 divide-current">
              {quizzes.slice(0, 3).map((quiz) => (
                <div key={quiz.id} className="p-4 flex items-center justify-between gap-4 hover:bg-current/5 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-8 w-8 place-items-center bg-current text-background font-bold border border-current shrink-0">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs uppercase truncate">{quiz.topic}</p>
                      <p className="text-[10px] opacity-60 mt-0.5">{quiz.questionCount} QUESTIONS · {quiz.difficulty.toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-lg font-black text-[#16a34a]">{quiz.percentage}%</span>
                    <span className="block text-[9px] opacity-60 font-bold">{quiz.score}/{quiz.questionCount} CORRECT</span>
                  </div>
                </div>
              ))}

              {quizzes.length === 0 && (
                <div className="p-8 text-center space-y-3">
                  <Trophy className="h-10 w-10 mx-auto opacity-40" />
                  <p className="text-xs font-bold uppercase opacity-70">NO QUIZZES COMPLETED YET</p>
                  <Link href="/quiz" className="brutalist-btn-orange inline-flex px-4 py-2 text-xs">
                    GENERATE PRACTICE QUIZ →
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Quick Commands & Status */}
        <div className="space-y-6">

          {/* Quick Actions Card */}
          <div className="border-2 border-current bg-background p-5 brutalist-card-static">
            <span className="text-[10px] font-mono tracking-widest uppercase opacity-70 block mb-1">// COMMAND_INTERFACE</span>
            <h3 className="text-sm font-black uppercase mb-4 text-[#ea580c]">QUICK LAUNCH ACTIONS</h3>

            <div className="space-y-2">
              <Link
                href="/notes"
                className="flex items-center justify-between border-2 border-current p-2.5 hover:bg-current hover:text-background transition-colors"
              >
                <div className="flex items-center gap-2 text-xs font-bold uppercase">
                  <BookOpen className="h-4 w-4 text-[#ea580c]" />
                  <span>UPLOAD NOTES</span>
                </div>
                <span className="text-xs font-bold">→</span>
              </Link>

              <Link
                href="/chat"
                className="flex items-center justify-between border-2 border-current p-2.5 hover:bg-current hover:text-background transition-colors"
              >
                <div className="flex items-center gap-2 text-xs font-bold uppercase">
                  <MessageSquare className="h-4 w-4 text-[#ea580c]" />
                  <span>ASK AI TUTOR</span>
                </div>
                <span className="text-xs font-bold">→</span>
              </Link>

              <Link
                href="/quiz"
                className="flex items-center justify-between border-2 border-current p-2.5 hover:bg-current hover:text-background transition-colors"
              >
                <div className="flex items-center gap-2 text-xs font-bold uppercase">
                  <Zap className="h-4 w-4 text-[#ea580c]" />
                  <span>GENERATE QUIZ</span>
                </div>
                <span className="text-xs font-bold">→</span>
              </Link>

              <Link
                href="/revision"
                className="flex items-center justify-between border-2 border-current p-2.5 hover:bg-current hover:text-background transition-colors"
              >
                <div className="flex items-center gap-2 text-xs font-bold uppercase">
                  <Calendar className="h-4 w-4 text-[#ea580c]" />
                  <span>REVISION TASKS</span>
                </div>
                <span className="text-xs font-bold">→</span>
              </Link>
            </div>
          </div>

          {/* Revision Progress Card */}
          <div className="border-2 border-current bg-background p-5 brutalist-card-static">
            <span className="text-[10px] font-mono tracking-widest uppercase opacity-70 block mb-1">// REVISION_MATRIX</span>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black uppercase">COMPLETION STATUS</h3>
              <span className="text-xs font-bold text-[#ea580c]">{completedTasks}/{tasks.length || 5}</span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="h-3 w-full border-2 border-current bg-current/10">
                  <div
                    className="h-full bg-[#ea580c]"
                    style={{ width: `${tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 75}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="border-2 border-current p-2">
                  <span className="block text-[9px] opacity-60 uppercase font-bold">COMPLETED</span>
                  <span className="text-lg font-black text-[#16a34a]">{completedTasks}</span>
                </div>
                <div className="border-2 border-current p-2">
                  <span className="block text-[9px] opacity-60 uppercase font-bold">PENDING</span>
                  <span className="text-lg font-black text-[#ea580c]">{pendingTasks}</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Terminal Log Stream */}
          <div className="border-2 border-current bg-[#0c0f17] text-[#34d399] p-4 text-xs font-mono space-y-2">
            <div className="flex justify-between border-b border-slate-700 pb-1 text-[9px] text-[#ea580c]">
              <span>SYSTEM_ADVISORY.LOG</span>
              <span>LIVE</span>
            </div>
            <p className="opacity-90">&gt; Spaced Repetition Engine: Active</p>
            <p className="opacity-90">&gt; Optimal revision window for &quot;Physics Unit 4&quot; opens tomorrow.</p>
            <p className="text-amber-400">&gt; Recommendation: Take 1 quick 5-min quiz.</p>
          </div>

        </div>

      </div>

    </div>
  );
}
