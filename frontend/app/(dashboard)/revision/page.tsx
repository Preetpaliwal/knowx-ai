"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Clock3,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import {
  createRevisionSession,
  createRevisionTask,
  deleteRevisionTask,
  getNotes,
  getRevisionStats,
  getRevisionTasks,
  Note,
  RevisionStats,
  RevisionTask,
  updateRevisionTask,
} from "@/lib/api";

const defaultTaskForm = {
  topic: "",
  noteId: "",
  date: new Date().toISOString().slice(0, 10),
  priority: "medium" as "low" | "medium" | "high",
  estimatedMinutes: 25,
  status: "pending" as "pending" | "in_progress" | "completed",
};

export default function RevisionPage() {
  const [tasks, setTasks] = useState<RevisionTask[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<RevisionStats | null>(null);
  const [form, setForm] = useState(defaultTaskForm);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingTask, setSavingTask] = useState(false);

  const loadRevisionData = async () => {
    setLoading(true);
    setError("");
    try {
      const [tRes, sRes, nRes] = await Promise.all([
        getRevisionTasks(),
        getRevisionStats(),
        getNotes(),
      ]);
      setTasks(tRes.tasks || []);
      setStats(sRes.stats);
      setNotes(nRes.notes || []);

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const noteParam = params.get("note");
        if (noteParam) {
          const linkedNote = (nRes.notes || []).find((n) => n.id === noteParam);
          if (linkedNote) {
            setForm((prev) => ({
              ...prev,
              noteId: noteParam,
              topic: `Revise: ${linkedNote.title}`,
            }));
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load revision routine.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevisionData();
  }, []);

  // Timer tick effect
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.topic.trim()) return;
    setSavingTask(true);
    try {
      await createRevisionTask({
        topic: form.topic.trim(),
        noteId: form.noteId || null,
        date: form.date,
        priority: form.priority,
        estimatedMinutes: Number(form.estimatedMinutes) || 25,
        status: form.status,
      });
      setForm(defaultTaskForm);
      await loadRevisionData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add revision task.");
    } finally {
      setSavingTask(false);
    }
  };

  const handleToggleComplete = async (task: RevisionTask) => {
    const nextStatus = task.status === "completed" ? "pending" : "completed";
    try {
      await updateRevisionTask(task.id, {
        ...task,
        status: nextStatus,
      });
      await loadRevisionData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update task status.");
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this revision task?")) return;
    try {
      await deleteRevisionTask(id);
      await loadRevisionData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete task.");
    }
  };

  const handleFinishTimer = async () => {
    setTimerRunning(false);
    const minutes = Math.max(1, Math.round(timerSeconds / 60));
    try {
      await createRevisionSession({
        task_id: activeTaskId ? Number(activeTaskId) : undefined,
        minutes,
      });
      setTimerSeconds(0);
      setActiveTaskId(null);
      await loadRevisionData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save study session.");
    }
  };

  const handleResetTimer = () => {
    setTimerRunning(false);
    setTimerSeconds(0);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const priorityBadge = (p: string) => {
    switch (p) {
      case "high":
        return <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">High</span>;
      case "low":
        return <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">Low</span>;
      default:
        return <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">Medium</span>;
    }
  };

  return (
    <div className="mx-auto max-w-[1360px] space-y-7 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-bold text-[#065f46]">
          <Calendar className="h-3.5 w-3.5" />
          <span>Study Habit & Routine</span>
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
          Revision Tracker
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Convert your notes into scheduled topics, track focused study sessions, and preserve your daily streak.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 5 Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="study-card p-4 sm:p-5">
          <p className="study-label">Today's Tasks</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{stats?.todayTasks ?? 0}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Scheduled for today</p>
        </div>

        <div className="study-card p-4 sm:p-5">
          <p className="study-label">Pending</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-600">{stats?.pendingTasks ?? 0}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">In revision queue</p>
        </div>

        <div className="study-card p-4 sm:p-5">
          <p className="study-label">Completed</p>
          <p className="mt-1 text-2xl font-extrabold text-[#16a34a]">{stats?.completedTasks ?? 0}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Topics mastered</p>
        </div>

        <div className="study-card p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="study-label">Streak</p>
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{stats?.streak ?? 1} Days</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Active consistency</p>
        </div>

        <div className="study-card p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="study-label">Total Time</p>
            <Clock className="h-4 w-4 text-purple-500" />
          </div>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{stats?.totalMinutes ?? 0}m</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Recorded study focus</p>
        </div>
      </div>

      {/* Middle Grid: Add Task Form & Revision Timer */}
      <div className="grid gap-7 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Add Task Form */}
        <form onSubmit={handleAddTask} className="study-card p-6 sm:p-7">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Plus className="h-4 w-4 text-[#16a34a]" />
            <h2 className="text-sm font-bold text-slate-900">Add Revision Task</h2>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Task Title</label>
              <input
                type="text"
                required
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                placeholder="e.g. Revise Binary Trees, Memorize Kotlin variables..."
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-[#16a34a] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Linked Note (Optional)</label>
              <select
                value={form.noteId}
                onChange={(e) => setForm({ ...form, noteId: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-[#16a34a] focus:bg-white"
              >
                <option value="">No linked note</option>
                {notes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Due Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3 py-2 text-xs sm:text-sm text-slate-900 outline-none focus:border-[#16a34a]"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Estimated Minutes</label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={form.estimatedMinutes}
                  onChange={(e) => setForm({ ...form, estimatedMinutes: Number(e.target.value) })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3 py-2 text-xs sm:text-sm text-slate-900 outline-none focus:border-[#16a34a]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Priority Level</label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {(["low", "medium", "high"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm({ ...form, priority: p })}
                    className={`rounded-xl py-2 text-xs font-bold capitalize transition-all ${
                      form.priority === p
                        ? "bg-[#16a34a] text-white shadow-xs"
                        : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={savingTask}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#16a34a] px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#15803d] active:scale-[0.99] transition-all"
            >
              {savingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span>Save Revision Task</span>
            </button>
          </div>
        </form>

        {/* Revision Timer Card (LEARNME Card styling) */}
        <section className="study-card-dark p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-emerald-800/60">
              <div className="flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-emerald-300" />
                <h2 className="text-sm font-bold text-white">Focus Revision Timer</h2>
              </div>
              <span className="rounded-full bg-emerald-900/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-700/50">
                {timerRunning ? "Recording" : "Ready"}
              </span>
            </div>

            {/* Timer Display */}
            <div className="my-8 text-center">
              <div className="inline-block rounded-3xl bg-slate-950/60 border border-emerald-500/20 px-8 py-4 shadow-inner">
                <span className="font-mono text-5xl sm:text-6xl font-black tracking-tight text-white tabular-nums">
                  {formatTimer(timerSeconds)}
                </span>
              </div>
              <p className="mt-3 text-xs text-emerald-200/80">
                {timerRunning
                  ? "Stay focused! Every completed minute adds to your streak."
                  : "Start a focus timer to automatically record your revision time."}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="pt-4 border-t border-emerald-800/60 flex items-center justify-center gap-3">
            {!timerRunning ? (
              <button
                type="button"
                onClick={() => setTimerRunning(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-emerald-500 transition-all active:scale-[0.98]"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>{timerSeconds ? "Resume" : "Start Timer"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setTimerRunning(false)}
                className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-amber-600 transition-all active:scale-[0.98]"
              >
                <Pause className="h-4 w-4 fill-current" />
                <span>Pause</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleFinishTimer}
              disabled={!timerSeconds}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-950/50 px-4 py-2.5 text-xs font-bold text-emerald-200 hover:bg-emerald-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Finish & Save</span>
            </button>

            {timerSeconds > 0 && !timerRunning && (
              <button
                type="button"
                onClick={handleResetTimer}
                title="Reset timer"
                className="rounded-full p-2.5 text-emerald-300 hover:bg-emerald-900/60 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Task List Section */}
      <section className="study-card p-6 sm:p-7">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <p className="study-label">Task Queue</p>
            <h2 className="mt-0.5 text-base font-bold text-slate-900">Scheduled Revision Topics</h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">{tasks.length} total tasks</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-[#16a34a]" />
            <span>Loading revision tasks...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <Calendar className="mx-auto mb-2 h-7 w-7 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No revision tasks created yet</p>
            <p className="mt-1">Use the form above to add a study topic to your schedule.</p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {tasks.map((task) => {
              const isCompleted = task.status === "completed";
              return (
                <div
                  key={task.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 hover:bg-slate-50/70 rounded-xl px-2.5 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(task)}
                      className={`mt-0.5 sm:mt-0 grid h-6 w-6 shrink-0 place-items-center rounded-lg border transition-colors ${
                        isCompleted
                          ? "bg-[#16a34a] border-[#16a34a] text-white"
                          : "border-slate-300 bg-white hover:border-[#16a34a]"
                      }`}
                    >
                      {isCompleted && <Check className="h-4 w-4" />}
                    </button>

                    <div className="min-w-0">
                      <p
                        className={`text-xs sm:text-sm font-bold truncate ${
                          isCompleted ? "text-slate-400 line-through" : "text-slate-900"
                        }`}
                      >
                        {task.topic}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        <span>Due {task.date}</span>
                        <span>•</span>
                        <span>{task.estimatedMinutes} mins</span>
                        <span>•</span>
                        {priorityBadge(task.priority)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTaskId(task.id);
                          setTimerRunning(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-[#065f46] hover:bg-emerald-100 transition-colors"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>Focus</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      title="Delete task"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
