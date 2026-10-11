"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Loader2,
  Mail,
  Save,
  Settings as SettingsIcon,
  Sparkles,
  Trophy,
  User,
  Clock,
  CheckCircle2,
  Edit2,
  X,
  GraduationCap,
  Building2,
  Cpu,
  Terminal,
  Activity,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  getSettings,
  saveSettings,
  Settings,
} from "@/lib/api";
import { useStudyStats } from "@/lib/useStudyStats";
import { StudyStatsCards } from "@/components/StudyStatsCards";

export default function ProfilePage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: "",
    email: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const stats = useStudyStats();

  useEffect(() => {
    getSettings()
      .then((res) => {
        setSettings(res.settings);
        setEditForm({
          displayName: res.settings.displayName,
          email: res.settings.email,
        });
      })
      .catch(() => { });
  }, []);

  const handleSaveProfile = async () => {
    if (!settings) return;

    setSaving(true);
    setMessage(null);

    try {
      const updated = { ...settings, ...editForm };
      await saveSettings(updated);
      setSettings(updated);
      setEditMode(false);
      setMessage({ text: "Profile updated successfully!", type: "success" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Failed to update profile",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (settings) {
      setEditForm({
        displayName: settings.displayName,
        email: settings.email,
      });
    }
    setEditMode(false);
    setMessage(null);
  };

  if (stats.loading || !settings) {
    return (
      <div className="flex h-[60vh] items-center justify-center font-mono">
        <div className="text-center space-y-3">
          <Cpu className="mx-auto h-10 w-10 animate-pulse text-[#ea580c]" />
          <p className="text-xs tracking-widest uppercase font-bold text-foreground">
            FETCHING_USER_PROFILE.SYS...
          </p>
        </div>
      </div>
    );
  }

  const displayName = settings?.displayName || "Student";
  const email = settings?.email || "student@studymet.ai";
  const initial = displayName.charAt(0).toUpperCase();
  const isAdmin = settings?.role === "admin";

  return (
    <div className="mx-auto max-w-[1200px] space-y-8 font-mono text-foreground pb-12">

      {/* Header Banner - Neo-Brutalist Layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-current pb-4">
        <div>
          <div className="section-marker mb-1">
            <span>// MODULE: USER_IDENTITY</span>
            <span>SYSTEM://USER/PROFILE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight flex items-center gap-3">
            <span>ACADEMIC IDENTITY</span>
            <span className="highlight-orange text-xs sm:text-sm">#PROFILE_V1</span>
          </h1>
          <p className="text-xs opacity-70 mt-0.5">
            Personal academic record, compute activity, study streak &amp; account settings.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="h-2.5 w-2.5 bg-[#16a34a] animate-pulse" />
          <span className="border-2 border-current px-3 py-1 bg-background text-[10px] font-bold uppercase tracking-widest">
            {isAdmin ? "ROLE: ADMINISTRATOR" : "ROLE: ACTIVE_STUDENT"}
          </span>
        </div>
      </div>

      {/* System Error / Success Alerts */}
      {stats.error && (
        <div className="border-2 border-red-600 bg-red-950/40 text-red-400 p-4 text-xs font-bold font-mono">
          [ERROR]: {stats.error}
        </div>
      )}

      {message && (
        <div
          className={`flex items-center gap-2 border-2 p-4 text-xs font-bold font-mono animate-in fade-in duration-200 ${message.type === "success"
              ? "border-[#16a34a] bg-[#16a34a]/10 text-[#16a34a]"
              : "border-red-600 bg-red-950/40 text-red-400"
            }`}
        >
          {message.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16a34a]" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Hero Profile Card - Cyber Brutalist Frame */}
      <section className="border-2 border-current bg-background brutalist-card-static overflow-hidden">
        {/* Top Terminal Strip */}
        <div className="flex items-center justify-between border-b-2 border-current bg-current text-background px-4 py-2 text-xs font-bold tracking-widest uppercase">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>LEARNER_IDENTITY_CARD.SYS</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="h-2 w-2 bg-[#ea580c] rounded-full animate-ping" />
            <span>STATUS: ONLINE</span>
          </div>
        </div>

        {/* Profile Content Body */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

            {/* Left Avatar & Primary Details */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Bold Hard Square Avatar */}
              <div className="relative group">
                <div className="grid h-20 w-20 sm:h-24 sm:w-24 place-items-center border-4 border-current bg-[#ea580c] text-white font-black text-3xl sm:text-4xl shadow-[4px_4px_0px_var(--border)] transition-transform group-hover:scale-105">
                  {initial}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-background border-2 border-current p-1">
                  <Sparkles className="h-4 w-4 text-[#ea580c]" />
                </div>
              </div>

              {/* Identity Metadata */}
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">{displayName}</h2>
                  <span className="border-2 border-current bg-[#ea580c] text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest">
                    {isAdmin ? "ADMINISTRATOR" : "STUDENT"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs opacity-80">
                  <Mail className="h-3.5 w-3.5 text-[#ea580c]" />
                  <span className="truncate">{email}</span>
                </div>

                <div className="pt-2 flex items-center gap-2 text-[10px] opacity-70">
                  <span className="border border-current px-2 py-0.5 font-bold uppercase bg-current/5">
                    INSTITUTION: STUDYMET_AI
                  </span>
                  <span className="border border-current px-2 py-0.5 font-bold uppercase bg-current/5">
                    ENGINE: GEMINI_1.5
                  </span>
                </div>
              </div>
            </div>

            {/* Right Action Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="brutalist-btn-orange px-5 py-2.5 text-xs font-bold uppercase flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>EDIT_PROFILE</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="brutalist-btn-secondary px-4 py-2.5 text-xs font-bold uppercase flex items-center gap-1.5"
                  >
                    <X className="h-4 w-4" />
                    <span>CANCEL</span>
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="brutalist-btn-orange px-5 py-2.5 text-xs font-bold uppercase flex items-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>{saving ? "SAVING..." : "SAVE_CHANGES"}</span>
                  </button>
                </div>
              )}

              <Link
                href="/settings"
                className="brutalist-btn-secondary px-4 py-2.5 text-xs font-bold uppercase flex items-center gap-2"
              >
                <SettingsIcon className="h-4 w-4" />
                <span>SETTINGS</span>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Edit Profile Form (Expanded view) */}
      {editMode && (
        <section className="border-2 border-[#ea580c] bg-background brutalist-card p-6 sm:p-7 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b-2 border-current pb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#ea580c]">
              <Edit2 className="h-4 w-4" />
              <span>EDIT_USER_INFORMATION</span>
            </div>
            <span className="text-[10px] opacity-60 uppercase font-bold">// UPDATE DATABASE FIELDS</span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1.5 block">
                DISPLAY_NAME
              </label>
              <input
                type="text"
                value={editForm.displayName}
                onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                className="brutalist-input text-xs font-bold"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1.5 block">
                EMAIL_ADDRESS
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="brutalist-input text-xs font-bold"
                placeholder="your.email@example.com"
              />
            </div>
          </div>

          <div className="border-2 border-current bg-current/5 p-3 text-[10px] font-bold uppercase opacity-80 flex items-center justify-between">
            <span>&gt; Note: Changes will update your active user session across StudyMET AI.</span>
            <span className="text-[#16a34a]">AUTOSAVE_READY</span>
          </div>
        </section>
      )}

      {/* Study Statistics Section */}
      <div className="space-y-3">
        <div className="section-marker">
          <span>// METRICS: COMPUTE_STATS</span>
        </div>
        <StudyStatsCards
          totalNotes={stats.totalNotes}
          totalQuizzes={stats.totalQuizzes}
          averageScore={stats.averageScore}
          completedTasks={stats.completedTasks}
          totalTasks={stats.totalTasks}
          progressPercent={stats.progressPercent}
          streak={stats.streak}
          totalMinutes={stats.totalMinutes}
          variant="compact"
        />
      </div>

      {/* Detailed Info Grid & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* System Configuration Overview */}
        <section className="border-2 border-current bg-background brutalist-card-static p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-current pb-3">
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase opacity-70 block">// SYSTEM_INFO</span>
              <h2 className="text-base font-black uppercase">ACADEMIC CONFIGURATION</h2>
            </div>
            <GraduationCap className="h-5 w-5 text-[#ea580c]" />
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-current/20 pb-2">
              <span className="opacity-70 font-bold uppercase">INSTITUTION:</span>
              <span className="font-bold">STUDYMET AI ACADEMY</span>
            </div>
            <div className="flex justify-between border-b border-current/20 pb-2">
              <span className="opacity-70 font-bold uppercase">AI AGENT MODEL:</span>
              <span className="font-bold text-[#ea580c]">GEMINI 1.5 FLASH</span>
            </div>
            <div className="flex justify-between border-b border-current/20 pb-2">
              <span className="opacity-70 font-bold uppercase">STORAGE ENGINE:</span>
              <span className="font-bold text-[#16a34a]">SQLITE3 (LOCAL DB)</span>
            </div>
            <div className="flex justify-between border-b border-current/20 pb-2">
              <span className="opacity-70 font-bold uppercase">REVISION MODE:</span>
              <span className="font-bold">SPACED REPETITION ACTIVE</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70 font-bold uppercase">ACCOUNT STATUS:</span>
              <span className="font-bold text-[#16a34a]">VERIFIED / ACTIVE</span>
            </div>
          </div>
        </section>

        {/* Timeline & Recent Activity Feed */}
        <section className="border-2 border-current bg-background brutalist-card-static p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-current pb-3">
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase opacity-70 block">// ACTIVITY_LOG</span>
              <h2 className="text-base font-black uppercase">RECENT COMPUTE EVENTS</h2>
            </div>
            <Link href="/quiz" className="text-xs font-bold text-[#ea580c] hover:underline">
              PRACTICE STUDIO →
            </Link>
          </div>

          <div className="space-y-3">
            {stats.quizzes.length > 0 && (
              <div className="border-2 border-current p-3 flex items-center justify-between hover:bg-current/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center bg-[#ea580c] text-white font-bold border border-current">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase truncate max-w-[200px]">
                      {stats.quizzes[0].topic}
                    </p>
                    <p className="text-[10px] opacity-60">
                      {stats.quizzes[0].score}/{stats.quizzes[0].questionCount} CORRECT · {stats.quizzes[0].difficulty.toUpperCase()}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-black text-[#16a34a] border border-current px-2 py-0.5 bg-background">
                  {stats.quizzes[0].percentage}%
                </span>
              </div>
            )}

            {stats.notes.length > 0 && (
              <div className="border-2 border-current p-3 flex items-center justify-between hover:bg-current/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center bg-[#16a34a] text-white font-bold border border-current">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase truncate max-w-[200px]">
                      {stats.notes[0].title}
                    </p>
                    <p className="text-[10px] opacity-60">
                      DOCUMENT INDEXED ({stats.notes[0].date})
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase border border-current px-2 py-0.5">
                  INDEXED
                </span>
              </div>
            )}

            <div className="border-2 border-current bg-current/5 p-3 flex items-center gap-3 text-xs">
              <CheckCircle2 className="h-4 w-4 text-[#16a34a] shrink-0" />
              <div>
                <p className="font-bold uppercase">STUDY ENGINE INITIALIZED</p>
                <p className="text-[10px] opacity-70">SYSTEM STATUS NOMINAL · ALL MODULES READY</p>
              </div>
            </div>
          </div>
        </section>

      </div>

    </div>
  );
}
