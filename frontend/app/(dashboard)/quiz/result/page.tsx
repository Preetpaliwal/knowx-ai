"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, RotateCcw, XCircle } from "lucide-react";
import { getQuizHistory, QuizResult } from "@/lib/api";

export default function QuizResultPage() {
  const [result, setResult] = useState<QuizResult | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { getQuizHistory().then((response) => setResult(response.history[0] || null)).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="p-10 text-center text-sm text-[#7e8494]"><Loader2 className="mx-auto mb-2 animate-spin" />Loading result...</div>;
  if (!result) return <div className="study-card p-10 text-center"><h1 className="font-bold">No quiz result yet</h1><p className="mt-2 text-sm text-[#7e8494]">Complete a quiz to review your performance.</p><Link href="/quiz" className="mt-4 inline-flex rounded-lg bg-[#3d6df2] px-4 py-2 text-sm font-semibold text-white">Take a quiz</Link></div>;
  return <div className="mx-auto max-w-4xl space-y-5"><Link href="/quiz" className="inline-flex items-center gap-2 text-xs font-semibold text-[#3d6df2]"><ArrowLeft className="h-4 w-4" />Back to quizzes</Link><section className="study-card p-6 text-center"><p className="study-label">Latest result</p><h1 className="mt-2 text-2xl font-bold">{result.topic}</h1><div className="mx-auto mt-5 grid h-32 w-32 place-items-center rounded-full border-[12px] border-[#dfe8ff] text-3xl font-bold text-[#3d6df2]">{result.percentage}%</div><p className="mt-4 text-sm text-[#7e8494]">{result.score} correct out of {result.questionCount}</p><Link href="/quiz" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#15161c] px-4 py-2.5 text-sm font-semibold text-white"><RotateCcw className="h-4 w-4" />Generate new quiz</Link></section><section className="study-card divide-y divide-[#edf0f5]">{result.questions.map((question, index) => { const correct = result.answers[index] === question.answer; return <div key={`${question.question}-${index}`} className="p-5"><div className="flex gap-3"><div className={`mt-0.5 ${correct ? "text-[#45a573]" : "text-[#e56a5d]"}`}>{correct ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}</div><div><p className="text-sm font-semibold">{index + 1}. {question.question}</p><p className="mt-2 text-xs text-[#7e8494]">Your answer: {result.answers[index] || "Not answered"}</p><p className="mt-1 text-xs text-[#45a573]">Correct answer: {question.answer}</p><p className="mt-2 text-xs leading-5 text-[#7e8494]">{question.explanation}</p></div></div></div>; })}</section></div>;
}
