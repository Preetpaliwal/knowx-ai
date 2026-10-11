"use client";

import { BookOpen, Trophy, Flame, Clock, MessageCircle, CalendarCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type StatCardData = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  supporting: string;
  badgeText: string;
  badgeBg: string;
  valueColor: string;
};

export function StatCard({ stat }: { stat: StatCardData }) {
  const Icon = stat.icon;
  return (
    <div className="border-2 border-current bg-background p-4 brutalist-card flex flex-col justify-between font-mono">
      <div>
        <div className="flex items-center justify-between border-b-2 border-current pb-2 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{stat.label}</span>
          <span className={`text-[9px] font-black uppercase border border-current px-1.5 py-0.5 ${stat.badgeBg}`}>
            {stat.badgeText}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className={`text-3xl sm:text-4xl font-black tracking-tight ${stat.valueColor}`}>{stat.value}</span>
          <Icon className="h-5 w-5 opacity-50 shrink-0" />
        </div>
      </div>
      <p className="text-[10px] opacity-70 mt-3 uppercase tracking-wider font-semibold border-t border-current/20 pt-2">
        {stat.supporting}
      </p>
    </div>
  );
}

export type StudyStatsCardsProps = {
  totalNotes: number;
  totalQuizzes: number;
  averageScore: number;
  completedTasks: number;
  totalTasks: number;
  progressPercent: number;
  streak: number;
  totalMinutes: number;
  chatCount?: number | string;
  variant?: "compact" | "full";
};

export function StudyStatsCards({
  totalNotes,
  totalQuizzes,
  averageScore,
  completedTasks,
  streak,
  totalMinutes,
  chatCount = "ACTIVE",
  variant = "full",
}: StudyStatsCardsProps) {
  const compactStats: StatCardData[] = [
    {
      icon: BookOpen,
      label: "TOTAL_NOTES",
      value: totalNotes,
      supporting: "Indexed & searchable",
      badgeText: "DOCS",
      badgeBg: "bg-[#16a34a] text-white",
      valueColor: "text-[#16a34a]",
    },
    {
      icon: Trophy,
      label: "QUIZ_AVERAGE",
      value: `${averageScore}%`,
      supporting: `${totalQuizzes} evaluations taken`,
      badgeText: "ACCURACY",
      badgeBg: "bg-[#ea580c] text-white",
      valueColor: "text-[#ea580c]",
    },
    {
      icon: Flame,
      label: "ACTIVE_STREAK",
      value: `${streak}d`,
      supporting: "Continuous daily study",
      badgeText: "STREAK",
      badgeBg: "bg-amber-400 text-black",
      valueColor: "text-amber-500",
    },
    {
      icon: Clock,
      label: "REVISION_TIME",
      value: `${totalMinutes}m`,
      supporting: `${completedTasks} tasks finalized`,
      badgeText: "TIME",
      badgeBg: "bg-sky-500 text-white",
      valueColor: "text-sky-500",
    },
  ];

  const fullStats: StatCardData[] = [
    {
      icon: BookOpen,
      label: "INDEXED_NOTES",
      value: totalNotes,
      supporting: "Active in library",
      badgeText: "LIBRARY",
      badgeBg: "bg-[#16a34a] text-white",
      valueColor: "text-[#16a34a]",
    },
    {
      icon: MessageCircle,
      label: "AI_SESSIONS",
      value: chatCount,
      supporting: "Tutor query history",
      badgeText: "GEMINI",
      badgeBg: "bg-[#ea580c] text-white",
      valueColor: "text-[#ea580c]",
    },
    {
      icon: Trophy,
      label: "QUIZZES_TAKEN",
      value: totalQuizzes,
      supporting: `${averageScore}% avg score`,
      badgeText: "EVAL",
      badgeBg: "bg-purple-600 text-white",
      valueColor: "text-purple-500",
    },
    {
      icon: CalendarCheck,
      label: "REVISION_TASKS",
      value: completedTasks,
      supporting: `${totalMinutes} mins logged`,
      badgeText: "TASKS",
      badgeBg: "bg-[#0284c7] text-white",
      valueColor: "text-[#0284c7]",
    },
    {
      icon: Flame,
      label: "STUDY_STREAK",
      value: `${streak} Days`,
      supporting: "On active streak",
      badgeText: "ACTIVE",
      badgeBg: "bg-amber-500 text-black",
      valueColor: "text-amber-500",
    },
  ];

  const stats = variant === "compact" ? compactStats : fullStats;
  const gridCols = variant === "compact" ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-5";

  return (
    <div className={`grid gap-4 ${gridCols}`}>
      {stats.map((stat, index) => (
        <StatCard key={index} stat={stat} />
      ))}
    </div>
  );
}
