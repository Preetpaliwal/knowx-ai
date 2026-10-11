"use client";

import { MessageSquare } from "lucide-react";
import Link from "next/link";

export default function ChatPreview({ onStart }: { onStart?: () => void }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-primary-50 to-blue-50 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-white p-3 text-primary-600 shadow-sm">
          <MessageSquare className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-gray-900">AI Study Assistant</h3>
          <p className="mt-1 text-sm text-gray-600">
            Ask questions, summarize notes, or generate quizzes instantly.
          </p>
          <Link
            href="/chat"
            onClick={onStart}
            className="mt-4 inline-flex items-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
          >
            Start Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
