"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Clock3,
  Loader2,
  Users,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  X,
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
} from "lucide-react";
import {
  AdminOverview,
  AdminStudent,
  AdminStudentDetail,
  getAdminStudentDetail,
  getAdminStudents,
  getSettings,
  saveSettings,
} from "../../../../lib/api";

export default function AdminStudentsPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<AdminOverview | null>(null);
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<AdminStudentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const PAGE_SIZE = 4;

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const settingsRes = await getSettings();
      const currentRole = settingsRes.settings?.role || "student";
      const adminActive = currentRole === "admin";
      setIsAdmin(adminActive);

      if (!adminActive) {
        setLoading(false);
        return;
      }

      const res = await getAdminStudents("admin");
      setStats(res.stats);
      setStudents(res.students || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load student management portal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEnableAdmin = async () => {
    try {
      const s = await getSettings();
      await saveSettings({ ...s.settings, role: "admin" });
      window.location.reload();
    } catch {
      // ignore
    }
  };

  const handleViewDetail = async (studentId: string) => {
    setLoadingDetail(true);
    try {
      const res = await getAdminStudentDetail(studentId, "admin");
      setSelectedStudent(res.student);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load student details.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchQuery =
        !search ||
        `${s.name} ${s.email}`.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [students, search, statusFilter]);

  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Security guard for non-admin users
  if (!loading && isAdmin === false) {
    return (
      <div className="mx-auto max-w-2xl pt-12 pb-20 text-center">
        <div className="study-card p-8 sm:p-12">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-rose-50 text-rose-600 shadow-sm mb-4">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">Access Restricted</h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
            The Students management portal is protected and only accessible to administrator accounts. Normal learners cannot view cohort records.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Return to Dashboard
            </Link>

            <button
              type="button"
              onClick={handleEnableAdmin}
              className="rounded-full bg-[#16a34a] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#15803d] transition-colors"
            >
              Enable Admin Mode (Local Demo)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1360px] space-y-7 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-bold text-[#065f46]">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Administrator Management</span>
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
          Student Roster & Analytics
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Supervise enrolled students, track learning progress, notes uploaded, and quiz accuracy.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="study-card p-5">
          <div className="flex items-center justify-between">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">Live</span>
          </div>
          <p className="mt-4 study-label">Total Students</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{stats?.totalStudents || 0}</p>
          <p className="mt-0.5 text-xs text-slate-400">Registered cohort accounts</p>
        </div>

        <div className="study-card p-5">
          <div className="flex items-center justify-between">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-[#16a34a]">
              <Activity className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#16a34a]">Active</span>
          </div>
          <p className="mt-4 study-label">Active Learners</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{stats?.activeStudents || 0}</p>
          <p className="mt-0.5 text-xs text-slate-400">Engaged this week</p>
        </div>

        <div className="study-card p-5">
          <div className="flex items-center justify-between">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-50 text-purple-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">Storage</span>
          </div>
          <p className="mt-4 study-label">Total Uploaded Notes</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{stats?.totalNotes || 0}</p>
          <p className="mt-0.5 text-xs text-slate-400">PDF, DOCX & TXT files</p>
        </div>

        <div className="study-card p-5">
          <div className="flex items-center justify-between">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <Clock3 className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">Average</span>
          </div>
          <p className="mt-4 study-label">Average Quiz Score</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{stats?.averageQuizScore || 0}%</p>
          <p className="mt-0.5 text-xs text-slate-400">Across all tests</p>
        </div>
      </div>

      {/* Student Roster Table Card */}
      <section className="study-card overflow-hidden">
        {/* Table Controls (Search & Status Filter) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-900 outline-none focus:border-[#16a34a]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            {["ALL", "Active", "Inactive"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                  statusFilter === st
                    ? "bg-[#16a34a] text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-[#16a34a]" />
            <span>Loading student database...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <p className="text-sm font-bold text-slate-700">No students matched</p>
            <p className="mt-1">Adjust your search keyword or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Student Name</th>
                  <th className="px-5 py-3.5">Registration</th>
                  <th className="px-5 py-3.5">Notes</th>
                  <th className="px-5 py-3.5">Quizzes</th>
                  <th className="px-5 py-3.5">Avg Score</th>
                  <th className="px-5 py-3.5">Last Active</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-[#dcfce7] font-black text-[#065f46]">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{s.name}</p>
                          <p className="text-[11px] text-slate-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{s.registrationDate}</td>
                    <td className="px-5 py-4 font-bold text-slate-800">{s.notesCount}</td>
                    <td className="px-5 py-4 font-bold text-slate-800">{s.quizCount}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-black text-[#065f46]">
                        {s.averageScore}%
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{s.lastActive}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          s.status === "Active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            s.status === "Active" ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleViewDetail(s.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-[#f0fdf4] hover:text-[#065f46] hover:border-emerald-200 transition-colors"
                      >
                        <span>View Details</span>
                        <span>↗</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredStudents.length > PAGE_SIZE && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
              {Math.min(currentPage * PAGE_SIZE, filteredStudents.length)} of {filteredStudents.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-bold text-slate-800">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#dcfce7] font-black text-xl text-[#065f46]">
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedStudent.name}</h3>
                  <p className="text-xs text-slate-500">{selectedStudent.email} · Registered {selectedStudent.registrationDate}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5 space-y-6">
              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3.5 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Notes Count</p>
                  <p className="text-lg font-extrabold text-slate-900 mt-1">{selectedStudent.notesCount}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3.5 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Quiz Accuracy</p>
                  <p className="text-lg font-extrabold text-[#16a34a] mt-1">{selectedStudent.averageScore}%</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3.5 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Study Streak</p>
                  <p className="text-lg font-extrabold text-orange-600 mt-1">
                    {selectedStudent.revisionProgress?.streak || 1}d
                  </p>
                </div>
              </div>

              {/* Student Notes */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Uploaded Notes</h4>
                <div className="space-y-1.5">
                  {selectedStudent.notes?.length ? (
                    selectedStudent.notes.map((n) => (
                      <div key={n.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs">
                        <span className="font-bold text-slate-800 truncate">{n.title}</span>
                        <span className="text-[11px] text-slate-400">{n.date || "Recent"}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">No notes uploaded yet.</p>
                  )}
                </div>
              </div>

              {/* Quiz History */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Quiz Attempts</h4>
                <div className="space-y-1.5">
                  {selectedStudent.quizzes?.length ? (
                    selectedStudent.quizzes.map((q) => (
                      <div key={q.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs">
                        <span className="font-bold text-slate-800 truncate">{q.topic}</span>
                        <span className="font-black text-[#16a34a]">{q.percentage}%</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">No quiz attempts recorded.</p>
                  )}
                </div>
              </div>

              {/* Revision Progress */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Revision Habit</h4>
                <div className="rounded-2xl border border-slate-200 p-4 bg-[#f0fdf4] text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-600">Tasks Completed</span>
                    <span className="font-bold text-[#065f46]">
                      {selectedStudent.revisionProgress?.completed} of {selectedStudent.revisionProgress?.total}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-600">Total Focus Time</span>
                    <span className="font-bold text-[#065f46]">
                      {selectedStudent.revisionProgress?.studyMinutes || 0} minutes
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="rounded-full bg-slate-100 px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
