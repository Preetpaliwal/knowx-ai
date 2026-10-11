"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  RotateCcw,
  Trophy,
  Zap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Sparkles,
  Share2,
  Users,
} from "lucide-react";
import {
  generateQuiz,
  getNotes,
  getQuizHistory,
  Note,
  QuizQuestion,
  QuizResult,
  submitQuiz,
} from "@/lib/api";
import CreateLiveQuizModal from "@/components/CreateLiveQuizModal";

export default function QuizPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [history, setHistory] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLiveQuizModal, setShowLiveQuizModal] = useState(false);
  const [generatedQuizTopic, setGeneratedQuizTopic] = useState("");

  useEffect(() => {
    Promise.all([getNotes(), getQuizHistory()])
      .then(([n, h]) => {
        setNotes(n.notes || []);
        setHistory(h.history || []);

        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const noteParam = params.get("note");
          if (noteParam) {
            setSelectedNoteIds([noteParam]);
          }
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load quiz resources."));
  }, []);

  const handleStartQuiz = async () => {
    setLoading(true);
    setError("");
    setSubmitted(false);
    setResult(null);

    try {
      const response = await generateQuiz({
        note_ids: selectedNoteIds.map(Number),
        difficulty,
        question_count: questionCount,
      });
      setQuestions(response.questions);
      setAnswers(Array(response.questions.length).fill(""));
      setCurrentIndex(0);
      setGeneratedQuizTopic(response.topic);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate quiz with Gemini. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = () => {
    // Quiz is already loaded, just reset to first question
    setCurrentIndex(0);
    setAnswers(Array(questions.length).fill(""));
    setSubmitted(false);
    setResult(null);
  };

  const handleSelectAnswer = (option: string) => {
    setAnswers((prev) => {
      const updated = [...prev];
      updated[currentIndex] = option;
      return updated;
    });
  };

  const handleSubmitQuiz = async () => {
    setSubmitted(true);
    const topicLabel = selectedNoteIds.length
      ? notes.filter((n) => selectedNoteIds.includes(n.id)).map((n) => n.title).join(", ")
      : "Comprehensive Notes";

    try {
      const res = await submitQuiz({
        topic: topicLabel,
        difficulty,
        questions,
        answers,
      });
      setResult(res.result);
      setHistory((prev) => [res.result, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit quiz score.");
    }
  };

  const handleReset = () => {
    setQuestions([]);
    setAnswers([]);
    setResult(null);
    setSubmitted(false);
    setCurrentIndex(0);
    setShowLiveQuizModal(false);
  };

  const handleCreateLiveQuiz = () => {
    setShowLiveQuizModal(true);
  };

  const progressPercent = questions.length
    ? Math.round(((currentIndex + 1) / questions.length) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-[1280px] space-y-7 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-bold text-[#065f46]">
          <Zap className="h-3.5 w-3.5" />
          <span>Interactive Practice</span>
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
          Quiz Studio
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Generate custom, intelligent multiple-choice questions grounded directly in your study documents.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700">
          {error}
        </div>
      )}

      {/* QUIZ BUILDER SCREEN (Shown when no quiz is currently running) */}
      {!questions.length && (
        <div className="grid gap-7 lg:grid-cols-[1.3fr_0.9fr]">
          {/* Builder Form Card */}
          <section className="border-2 border-current bg-background p-6 sm:p-8 brutalist-card-static font-mono">
            <div className="flex items-center gap-3 pb-4 border-b-2 border-current">
              <div className="grid h-10 w-10 place-items-center bg-[#7C3AED] text-white font-bold border border-current">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black uppercase">CONFIGURE PRACTICE QUIZ</h2>
                <p className="text-xs opacity-70">Select source documents, difficulty and question count.</p>
              </div>
            </div>

            {/* Note Selection */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#7C3AED]">
                  // SOURCE_NOTES
                </label>
                <span className="text-[10px] font-bold uppercase opacity-60">
                  {selectedNoteIds.length === 0 ? "ALL NOTES INCLUDED" : `${selectedNoteIds.length} SELECTED`}
                </span>
              </div>

              <div className="mt-2.5 max-h-56 space-y-2 overflow-y-auto border-2 border-current p-3 bg-current/5">
                {notes.length === 0 ? (
                  <p className="p-3 text-xs opacity-60 uppercase text-center">
                    No notes in library. Please upload a note first.
                  </p>
                ) : (
                  notes.map((note) => {
                    const isChecked = selectedNoteIds.includes(note.id);
                    return (
                      <label
                        key={note.id}
                        className={`flex items-center gap-3 p-3 text-xs font-bold uppercase border-2 cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-[#7C3AED] text-white border-current"
                            : "bg-background border-current hover:bg-current/10"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedNoteIds((prev) => [...prev, note.id]);
                            } else {
                              setSelectedNoteIds((prev) => prev.filter((id) => id !== note.id));
                            }
                          }}
                          className="h-4 w-4 accent-[#7C3AED]"
                        />
                        <span className="truncate flex-1">{note.title}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* Difficulty & Count */}
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#7C3AED]">// DIFFICULTY</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {["easy", "medium", "hard"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficulty(lvl)}
                      className={`py-2 text-xs font-bold uppercase border-2 transition-all ${
                        difficulty === lvl
                          ? "bg-[#7C3AED] text-white border-current"
                          : "border-current bg-background hover:bg-current/10"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#7C3AED]">// QUESTION_COUNT</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[5, 10, 15].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      className={`py-2 text-xs font-bold uppercase border-2 transition-all ${
                        questionCount === cnt
                          ? "bg-[#7C3AED] text-white border-current"
                          : "border-current bg-background hover:bg-current/10"
                      }`}
                    >
                      {cnt} Qs
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate Action Button */}
            <div className="mt-8 pt-5 border-t-2 border-current flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase opacity-60">ENGINE: GEMINI 1.5</span>
              <button
                type="button"
                onClick={handleStartQuiz}
                disabled={loading || notes.length === 0}
                className="brutalist-btn-orange px-6 py-3 text-xs font-bold uppercase flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>SYNTHESIZING...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    <span>Generate & Start Quiz</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Quiz History Card */}
          <section className="study-card p-6 sm:p-7">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-900">Quiz History</h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">{history.length} completed</span>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {history.length ? (
                history.slice(0, 5).map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between">
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.topic}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {item.score}/{item.questionCount} correct · {item.difficulty}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#dcfce7] px-2.5 py-1 text-xs font-black text-[#065f46]">
                      {item.percentage}%
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-xs text-slate-400">
                  <p>No practice attempts recorded yet.</p>
                  <p className="mt-1">Your quiz results and progress will be saved here.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ACTIVE QUIZ VIEW / RESULTS VIEW */}
      {questions.length > 0 && !submitted && answers.some((a) => a !== "") && (
        <section className="study-card p-6 sm:p-10 max-w-4xl mx-auto">
          {/* Progress Header */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-[#16a34a]">{progressPercent}% Completed</span>
          </div>

          <div className="mt-2.5 h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#16a34a] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* RESULT SUMMARY SCREEN */}
          {submitted && result ? (
            <div className="py-8 text-center space-y-6 animate-in fade-in duration-200">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-amber-50 text-amber-500 shadow-sm">
                <Trophy className="h-10 w-10" />
              </div>

              <div>
                <h2 className="text-3xl font-extrabold text-slate-900">
                  {result.score} of {result.questionCount} Correct
                </h2>
                <p className="mt-1 text-sm font-semibold text-emerald-700">
                  Score: {result.percentage}% · {result.questionCount - result.score} incorrect
                </p>
              </div>

              {/* Review of all questions */}
              <div className="mt-8 text-left space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Question Review</h3>
                {questions.map((q, i) => {
                  const isCorrect = answers[i] === q.answer;
                  return (
                    <div
                      key={i}
                      className={`rounded-2xl border p-4 sm:p-5 text-xs sm:text-sm leading-relaxed ${
                        isCorrect
                          ? "border-emerald-200 bg-[#f0fdf4]"
                          : "border-rose-200 bg-rose-50/70"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-bold text-slate-900">
                            {i + 1}. {q.question}
                          </p>

                          <div className="mt-2 text-xs space-y-1">
                            <p>
                              <span className="font-semibold text-slate-500">Your choice: </span>
                              <span className={isCorrect ? "font-bold text-emerald-800" : "font-bold text-rose-800"}>
                                {answers[i] || "No answer selected"}
                              </span>
                            </p>
                            {!isCorrect && (
                              <p>
                                <span className="font-semibold text-slate-500">Correct answer: </span>
                                <span className="font-bold text-emerald-700">{q.answer}</span>
                              </p>
                            )}
                            <p className="mt-2 text-slate-600 pt-2 border-t border-black/5 leading-normal">
                              <span className="font-semibold">Explanation: </span>
                              {q.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#15803d] transition-all"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Practice Another Quiz</span>
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE QUESTION VIEW */
            <div className="py-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                {questions[currentIndex]?.question}
              </h2>

              <div className="mt-7 grid gap-3">
                {questions[currentIndex]?.options.map((option, oIdx) => {
                  const letter = String.fromCharCode(65 + oIdx);
                  const isSelected = answers[currentIndex] === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleSelectAnswer(option)}
                      className={`flex items-center gap-3.5 rounded-2xl border p-4 text-left text-xs sm:text-sm font-medium transition-all ${
                        isSelected
                          ? "border-[#16a34a] bg-[#f0fdf4] text-[#065f46] shadow-xs ring-1 ring-[#16a34a]"
                          : "border-slate-200 bg-white text-slate-800 hover:border-emerald-200 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-xl text-xs font-bold ${
                          isSelected
                            ? "bg-[#16a34a] text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {letter}
                      </span>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="mt-10 flex items-center justify-between pt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </button>

                {currentIndex === questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleSubmitQuiz}
                    disabled={answers.some((a) => !a)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#15803d] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <span>Submit Quiz</span>
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#16a34a] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#15803d] transition-all"
                  >
                    <span>Next</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* QUIZ OPTIONS SCREEN - Show after generation */}
      {questions.length > 0 && !submitted && answers.every((a) => a === "") && (
        <section className="study-card p-6 sm:p-10 max-w-3xl mx-auto">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 mb-2">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900">Quiz Generated Successfully!</h2>
              <p className="text-sm text-slate-500 mt-2">
                {questions.length} {difficulty} questions ready · Topic: {generatedQuizTopic}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-4">
              {/* Start Practice */}
              <button
                type="button"
                onClick={handleStartPractice}
                className="flex flex-col items-center gap-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center hover:bg-emerald-100 hover:border-emerald-300 transition-all group"
              >
                <div className="h-12 w-12 rounded-full bg-emerald-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Start Practice Quiz</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Take the quiz yourself for practice
                  </p>
                </div>
              </button>

              {/* Create Live Quiz */}
              <button
                type="button"
                onClick={handleCreateLiveQuiz}
                className="flex flex-col items-center gap-3 rounded-2xl border-2 border-blue-200 bg-blue-50 p-6 text-center hover:bg-blue-100 hover:border-blue-300 transition-all group"
              >
                <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Create Live Quiz</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Share with students via link or code
                  </p>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-slate-500 hover:text-slate-700 font-medium"
            >
              ← Back to Quiz Builder
            </button>
          </div>
        </section>
      )}

      {/* CreateLiveQuizModal */}
      <CreateLiveQuizModal
        isOpen={showLiveQuizModal}
        onClose={() => setShowLiveQuizModal(false)}
        questions={questions}
        topic={generatedQuizTopic}
        difficulty={difficulty}
      />
    </div>
  );
}
