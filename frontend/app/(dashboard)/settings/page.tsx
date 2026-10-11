"use client";

import { useEffect, useState } from "react";
import {
  Download,
  Loader2,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  User,
  Sliders,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { exportData, getSettings, saveSettings, Settings } from "@/lib/api";

type ToggleKey =
  | "compactSidebar"
  | "revisionReminders"
  | "quizNotifications"
  | "dailyReminder"
  | "strictNotesOnly";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const update = (patch: Partial<Settings>) =>
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev));

  useEffect(() => {
    getSettings()
      .then((response) => setSettings(response.settings))
      .catch((error) =>
        setMessage({
          text: error instanceof Error ? error.message : "Unable to load settings.",
          type: "error",
        })
      )
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    try {
      await saveSettings(settings);
      setMessage({ text: "Settings saved successfully!", type: "success" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Unable to save settings.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await exportData();
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `studymate-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setMessage({ text: "Failed to export data.", type: "error" });
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-[#16a34a]" />
          <span>Loading workspace settings...</span>
        </div>
      </div>
    );
  }

  const notificationToggles: Array<[ToggleKey, string, string]> = [
    ["dailyReminder", "Daily Study Reminder", "Receive notification when your preferred study time arrives"],
    ["revisionReminders", "Revision Habit Alerts", "Get prompts for pending spaced repetition tasks"],
    ["quizNotifications", "Quiz Score Reports", "Summary of completed quiz attempts and accuracy"],
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-7 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-bold text-[#065f46]">
          <SettingsIcon className="h-3.5 w-3.5" />
          <span>Preferences</span>
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
          Workspace Settings
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Customize your study preferences, switch workspace roles, and control AI behaviors.
        </p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-2xl p-4 text-xs sm:text-sm font-semibold animate-in fade-in duration-200 ${
            message.type === "success"
              ? "bg-[#f0fdf4] border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          {message.type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Account & Role Section */}
      <section className="study-card p-6 sm:p-7">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-[#16a34a]" />
            <h2 className="text-sm font-bold text-slate-900">Student Profile & Workspace Role</h2>
          </div>
          <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-[10px] font-bold text-[#065f46] uppercase">
            {settings.role === "admin" ? "Admin Mode" : "Student Mode"}
          </span>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Display Name</label>
            <input
              type="text"
              value={settings.displayName}
              onChange={(e) => update({ displayName: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-[#16a34a] focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => update({ email: e.target.value })}
              placeholder="e.g. learner@university.edu"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-[#16a34a] focus:bg-white"
            />
          </div>
        </div>

        {/* Role Switcher */}
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-bold text-slate-900">Workspace Access Role</p>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Switch to Admin to unlock the <strong>Students</strong> management portal in the navigation sidebar.
              </p>
            </div>

            <div className="inline-flex rounded-xl bg-slate-200/80 p-1">
              <button
                type="button"
                onClick={() => update({ role: "student" })}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  settings.role !== "admin"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => update({ role: "admin" })}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  settings.role === "admin"
                    ? "bg-[#16a34a] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Study & Quiz Preferences */}
      <section className="study-card p-6 sm:p-7">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Sliders className="h-4 w-4 text-[#16a34a]" />
          <h2 className="text-sm font-bold text-slate-900">Study & Quiz Defaults</h2>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Default Quiz Difficulty</label>
            <select
              value={settings.quizDifficulty}
              onChange={(e) => update({ quizDifficulty: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-[#16a34a] focus:bg-white capitalize"
            >
              <option value="easy">Easy (Conceptual foundations)</option>
              <option value="medium">Medium (Standard exam level)</option>
              <option value="hard">Hard (Advanced critical thinking)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Default Question Count</label>
            <select
              value={settings.questionCount}
              onChange={(e) => update({ questionCount: Number(e.target.value) })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-[#16a34a] focus:bg-white"
            >
              <option value="5">5 Questions (Quick review)</option>
              <option value="10">10 Questions (Standard practice)</option>
              <option value="15">15 Questions (Comprehensive test)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Daily Study Goal (Minutes)</label>
            <input
              type="number"
              min="5"
              max="480"
              value={settings.dailyRevisionGoal}
              onChange={(e) => update({ dailyRevisionGoal: Number(e.target.value) })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-[#16a34a] focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Preferred Study Time</label>
            <input
              type="time"
              value={settings.preferredStudyTime}
              onChange={(e) => update({ preferredStudyTime: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-[#16a34a] focus:bg-white"
            />
          </div>
        </div>
      </section>

      {/* Notifications & Habits */}
      <section className="study-card p-6 sm:p-7">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Bell className="h-4 w-4 text-[#16a34a]" />
          <h2 className="text-sm font-bold text-slate-900">Notifications & Routine</h2>
        </div>

        <div className="mt-4 space-y-3">
          {notificationToggles.map(([key, label, desc]) => (
            <label
              key={key}
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-[#f8fafc] p-4 cursor-pointer hover:bg-[#f0fdf4] transition-colors"
            >
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900">{label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
              </div>
              <input
                type="checkbox"
                checked={settings[key] as boolean}
                onChange={(e) => update({ [key]: e.target.checked })}
                className="h-4 w-4 rounded accent-[#16a34a]"
              />
            </label>
          ))}
        </div>
      </section>

      {/* AI Model & Data Export */}
      <section className="study-card p-6 sm:p-7">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Sparkles className="h-4 w-4 text-[#16a34a]" />
          <h2 className="text-sm font-bold text-slate-900">AI Engine & Local Data Backup</h2>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 p-4">
          <div>
            <p className="text-xs font-bold text-slate-900">Active AI Model: {settings.model}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Provider: {settings.aiProvider} · Dynamic Markdown & Code Blocks enabled
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-white px-4 py-2 text-xs font-bold text-[#065f46] hover:bg-[#dcfce7] transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export SQLite Data</span>
          </button>
        </div>

        {/* Action button */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#15803d] disabled:opacity-50 transition-all"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{saving ? "Saving Changes..." : "Save Preferences"}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
