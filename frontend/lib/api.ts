export const API_BASE = "http://localhost:8000/api";

export type Note = {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  excerpt: string;
  content?: string | null;
  date: string;
  createdAt?: string | null;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

export type QuizResult = {
  id: string;
  topic: string;
  difficulty: string;
  questionCount: number;
  questions: QuizQuestion[];
  answers: string[];
  score: number;
  percentage: number;
  createdAt: string;
};

export type RevisionTask = {
  id: string;
  topic: string;
  noteId?: string | null;
  date: string;
  priority: "low" | "medium" | "high";
  estimatedMinutes: number;
  status: "pending" | "in_progress" | "completed";
  createdAt?: string;
};

export type RevisionStats = {
  todayTasks: number;
  completedTasks: number;
  pendingTasks: number;
  streak: number;
  totalMinutes: number;
};

export type Settings = {
  displayName: string;
  email: string;
  role?: "student" | "admin";
  quizDifficulty: string;
  questionCount: number;
  dailyRevisionGoal: number;
  preferredStudyTime: string;
  autoGenerateRevision: boolean;
  theme: string;
  compactSidebar: boolean;
  revisionReminders: boolean;
  quizNotifications: boolean;
  dailyReminder: boolean;
  aiProvider: string;
  model: string;
  answerStyle: string;
  strictNotesOnly: boolean;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  noteIds: number[];
  createdAt: string | null;
};

export type AdminStudent = {
  id: string;
  name: string;
  email: string;
  role: string;
  registrationDate: string;
  notesCount: number;
  quizCount: number;
  averageScore: number;
  lastActive: string;
  status: "Active" | "Inactive";
};

export type AdminStudentDetail = AdminStudent & {
  notes: Array<{ id: string; title: string; date?: string; fileType?: string }>;
  quizzes: Array<{ id: string; topic: string; score: number; percentage: number; date?: string; createdAt?: string }>;
  revisionProgress: {
    completed: number;
    total: number;
    streak: number;
    studyMinutes: number;
  };
};

export type AdminOverview = {
  totalStudents: number;
  activeStudents: number;
  totalNotes: number;
  averageQuizScore: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      ...init,
    });
  } catch {
    throw new Error("Unable to connect to the StudyMate backend.");
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || payload.message || `Request failed (${response.status})`);
  }
  return payload as T;
}

export const getNotes = () => request<{ notes: Note[] }>("/notes");
export const getNote = (id: string) => request<{ note: Note }>(`/notes/${id}`);
export const deleteNote = (id: string) => request(`/notes/${id}`, { method: "DELETE" });
export const deleteAllNotes = () => request("/notes", { method: "DELETE" });
export const summarizeNote = (id: string) =>
  request<{ summary: string }>(`/notes/${id}/summarize`, { method: "POST", body: JSON.stringify({}) });

export const generateQuiz = (body: { note_ids: number[]; difficulty: string; question_count: number }) =>
  request<{ topic: string; difficulty: string; questions: QuizQuestion[] }>("/quiz/generate", {
    method: "POST",
    body: JSON.stringify(body),
  });
export const submitQuiz = (body: { topic: string; difficulty: string; questions: QuizQuestion[]; answers: string[] }) =>
  request<{ result: QuizResult }>("/quiz/submit", { method: "POST", body: JSON.stringify(body) });
export const getQuizHistory = () => request<{ history: QuizResult[] }>("/quiz/history");

export const getRevisionTasks = () => request<{ tasks: RevisionTask[] }>("/revision/tasks");
export const createRevisionTask = (body: Omit<RevisionTask, "id" | "createdAt">) =>
  request<{ task: RevisionTask }>("/revision/tasks", { method: "POST", body: JSON.stringify(body) });
export const updateRevisionTask = (id: string, body: Omit<RevisionTask, "id" | "createdAt">) =>
  request<{ task: RevisionTask }>(`/revision/tasks/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const deleteRevisionTask = (id: string) => request(`/revision/tasks/${id}`, { method: "DELETE" });
export const createRevisionSession = (body: { task_id?: number; minutes: number }) =>
  request("/revision/sessions", { method: "POST", body: JSON.stringify(body) });
export const getRevisionStats = () => request<{ stats: RevisionStats }>("/revision/stats");

export const getSettings = () => request<{ settings: Settings }>("/settings");
export const saveSettings = (settings: Settings) =>
  request<{ settings: Settings }>("/settings", { method: "PUT", body: JSON.stringify(settings) });
export const exportData = () => request<{ data: unknown }>("/settings/export", { method: "POST" });

export const getChatHistory = (conversationId = "default") =>
  request<{ messages: ChatMessage[]; totalCount?: number }>(
    `/chat/history?conversation_id=${encodeURIComponent(conversationId)}`
  );
export const sendChatMessage = (body: { question: string; note_ids: number[]; conversation_id?: string }) =>
  request<{ answer: string; source_notes: string[] }>("/chat", { method: "POST", body: JSON.stringify(body) });

export const getAdminStudents = (role = "admin") =>
  request<{ stats: AdminOverview; students: AdminStudent[] }>("/admin/students", {
    headers: { "X-User-Role": role },
  });

export const getAdminStudentDetail = (studentId: string, role = "admin") =>
  request<{ student: AdminStudentDetail }>(`/admin/students/${encodeURIComponent(studentId)}`, {
    headers: { "X-User-Role": role },
  });

// Competition API
export type CompetitionQuestion = {
  question: string;
  options: string[];
  answer?: string;
  explanation?: string;
  questionIndex?: number;
  totalQuestions?: number;
};

export type Competition = {
  id: string;
  hostName: string;
  quizTopic: string;
  quizDifficulty: string;
  questions: CompetitionQuestion[];
  joinCode: string;
  status: "waiting" | "active" | "completed";
  maxParticipants: number;
  currentQuestion: number;
  createdAt: string;
  startedAt?: string | null;
  endedAt?: string | null;
};

export type CompetitionParticipant = {
  id: string;
  competitionId: string;
  sessionId: string;
  displayName: string;
  avatar?: string | null;
  finalScore: number;
  finalRank?: number | null;
  correctAnswers: number;
  joinedAt: string;
  isConnected: boolean;
};

export type LeaderboardEntry = {
  rank: number;
  participantId: string;
  displayName: string;
  avatar?: string | null;
  score: number;
  correctAnswers: number;
};

export type CompetitionAnalytics = {
  totalParticipants: number;
  averageScore: number;
  highestScore: number;
  averageAccuracy: number;
  averageResponseTime: number;
  questionStats: Array<{
    questionIndex: number;
    question: string;
    totalAnswers: number;
    correctAnswers: number;
    correctPercentage: number;
  }>;
  participants: Array<CompetitionParticipant & { accuracy: number }>;
};

export const createCompetition = (body: {
  host_name: string;
  quiz_topic: string;
  quiz_difficulty: string;
  questions: QuizQuestion[];
}) =>
  request<{ competition: Competition; joinUrl: string; qrCode?: string | null }>("/competition/create", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const getCompetition = (joinCode: string) =>
  request<{ competition: Competition; participantCount: number; participants: CompetitionParticipant[] }>(
    `/competition/${joinCode}`
  );

export const joinCompetition = (body: { join_code: string; display_name: string; avatar?: string }) =>
  request<{ participant: CompetitionParticipant; competition: Competition }>("/competition/join", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const startCompetition = (competitionId: string) =>
  request<{ competition: Competition }>("/competition/start", {
    method: "POST",
    body: JSON.stringify({ competition_id: parseInt(competitionId) }),
  });

export const submitAnswer = (body: {
  competition_id: number;
  participant_id: number;
  question_index: number;
  selected_answer: string;
  response_time_ms: number;
}) =>
  request<{ isCorrect: boolean; points: number; correctAnswer: string; explanation: string }>("/competition/answer", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const nextQuestion = (competitionId: string) =>
  request<{ currentQuestion: number }>("/competition/next-question", {
    method: "POST",
    body: JSON.stringify({ competition_id: parseInt(competitionId) }),
  });

export const endCompetition = (competitionId: string) =>
  request<{ competition: Competition; leaderboard: LeaderboardEntry[] }>("/competition/end", {
    method: "POST",
    body: JSON.stringify({ competition_id: parseInt(competitionId) }),
  });

export const getLeaderboard = (competitionId: string) =>
  request<{ leaderboard: LeaderboardEntry[] }>(`/competition/${competitionId}/leaderboard`);

export const getCompetitionAnalytics = (competitionId: string) =>
  request<{ analytics: CompetitionAnalytics }>(`/competition/${competitionId}/analytics`);

// Quiz Sessions API
export type QuizSession = {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  questions: QuizQuestion[];
  joinToken: string;
  joinCode: string;
  expiresAt: string;
  maxParticipants?: number | null;
  timerMinutes?: number | null;
  status: "active" | "closed" | "expired";
  showLeaderboard: boolean;
  createdBy: string;
  createdAt: string;
  closedAt?: string | null;
};

export type QuizAttempt = {
  id: string;
  sessionId: string;
  participantName: string;
  answers: string[];
  score: number;
  percentage: number;
  timeTakenSeconds?: number | null;
  rank?: number | null;
  startedAt: string;
  submittedAt?: string | null;
};

export type QuizSessionDashboard = {
  session: QuizSession;
  participants: {
    total: number;
    submitted: number;
    inProgress: number;
  };
  attempts: QuizAttempt[];
  statistics: {
    averageScore: number;
    averagePercentage: number;
    highestScore: number;
    lowestScore: number;
  };
};

export const createQuizSession = (body: {
  title: string;
  topic: string;
  difficulty: string;
  questions: QuizQuestion[];
  expiry_option: "30m" | "1h" | "24h" | "custom";
  custom_expiry?: string | null;
  max_participants?: number | null;
  timer_minutes?: number | null;
  show_leaderboard?: boolean;
  created_by?: string;
}) =>
  request<{ session: QuizSession }>("/quiz-sessions/create", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const validateQuizSession = (token: string) =>
  request<{ session: QuizSession } | { error: string; message: string }>(`/quiz-sessions/${token}/validate`);

export const joinQuizSession = (token: string, participantName: string) =>
  request<{ attempt: QuizAttempt; session: QuizSession }>(`/quiz-sessions/${token}/join`, {
    method: "POST",
    body: JSON.stringify({ participant_name: participantName }),
  });

export const submitQuizAttempt = (
  token: string,
  attemptId: string,
  answers: string[],
  timeTakenSeconds?: number
) =>
  request<{ result: QuizAttempt & { questions: QuizQuestion[] } }>(
    `/quiz-sessions/${token}/attempts/${attemptId}/submit`,
    {
      method: "POST",
      body: JSON.stringify({ answers, time_taken_seconds: timeTakenSeconds }),
    }
  );

export const getQuizLeaderboard = (token: string) =>
  request<{
    session: QuizSession;
    leaderboard: QuizAttempt[];
    totalParticipants: number;
    submittedCount: number;
  }>(`/quiz-sessions/${token}/leaderboard`);

export const getSessionByCode = (code: string) =>
  request<{ token: string; session: QuizSession }>(`/quiz-sessions/code/${code}/info`);

export const closeQuizSession = (token: string) =>
  request<{ message: string }>(`/quiz-sessions/${token}/close`, { method: "POST" });

export const getQuizSessionDashboard = (token: string) =>
  request<QuizSessionDashboard>(`/quiz-sessions/${token}/dashboard`);

