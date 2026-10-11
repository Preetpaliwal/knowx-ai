import { useEffect, useState } from "react";
import {
  getNotes,
  getQuizHistory,
  getRevisionStats,
  getRevisionTasks,
  Note,
  QuizResult,
  RevisionStats,
  RevisionTask,
} from "./api";

export type StudyStatistics = {
  notes: Note[];
  quizzes: QuizResult[];
  tasks: RevisionTask[];
  stats: RevisionStats | null;
  loading: boolean;
  error: string;
  // Computed values
  totalNotes: number;
  totalQuizzes: number;
  averageScore: number;
  completedTasks: number;
  totalTasks: number;
  progressPercent: number;
  streak: number;
  totalMinutes: number;
};

export function useStudyStats() {
  const [data, setData] = useState<StudyStatistics>({
    notes: [],
    quizzes: [],
    tasks: [],
    stats: null,
    loading: true,
    error: "",
    totalNotes: 0,
    totalQuizzes: 0,
    averageScore: 0,
    completedTasks: 0,
    totalTasks: 0,
    progressPercent: 0,
    streak: 0,
    totalMinutes: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [notesRes, quizRes, tasksRes, statsRes] = await Promise.all([
          getNotes(),
          getQuizHistory(),
          getRevisionTasks(),
          getRevisionStats(),
        ]);

        const notes = notesRes.notes || [];
        const quizzes = quizRes.history || [];
        const tasks = tasksRes.tasks || [];
        const stats = statsRes.stats;

        const completedTasks = tasks.filter((t) => t.status === "completed").length;
        const averageScore =
          quizzes.length > 0
            ? Math.round(
                quizzes.reduce((sum, q) => sum + q.percentage, 0) / quizzes.length
              )
            : 0;
        const progressPercent =
          tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

        setData({
          notes,
          quizzes,
          tasks,
          stats,
          loading: false,
          error: "",
          totalNotes: notes.length,
          totalQuizzes: quizzes.length,
          averageScore,
          completedTasks,
          totalTasks: tasks.length,
          progressPercent,
          streak: stats?.streak || 0,
          totalMinutes: stats?.totalMinutes || 0,
        });
      } catch (err) {
        setData((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to load study statistics",
        }));
      }
    };

    fetchStats();
  }, []);

  return data;
}
