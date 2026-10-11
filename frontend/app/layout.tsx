"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        <title>StudyMET AI - Your AI Study Companion</title>
        <meta
          name="description"
          content="AI-powered study assistant for notes, quizzes, and learning"
        />
      </head>
      <body className="min-h-screen bg-[#0F1419]">
        {children}
      </body>
    </html>
  );
}
