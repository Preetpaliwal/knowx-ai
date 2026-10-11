"use client";

import ChatWindow from "@/components/ChatWindow";

export default function ChatPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">AI Chat</h1>
        <p className="text-sm text-gray-500">Ask StudyMate AI for help with topics, quizzes, and summaries.</p>
      </div>

      <ChatWindow />
    </div>
  );
}
