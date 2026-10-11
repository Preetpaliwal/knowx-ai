"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Cpu,
  Terminal,
  Check,
  Minus,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Shield,
  Search,
  BookOpen,
  Brain,
  Moon,
  Sun,
  Trophy,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
} from "lucide-react";

export default function BrutalistLandingPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [tick, setTick] = useState(42);
  const [latency, setLatency] = useState(4.2);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Interactive Live Demo Quiz State for Landing Page
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);

  // Live tick & latency generator
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
      setLatency((prev) => +(4.2 + (Math.random() * 0.6 - 0.3)).toFixed(2));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Neural dither canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    const render = () => {
      t += 0.04;
      const width = (canvas.width = 320);
      const height = (canvas.height = 200);

      ctx.fillStyle = darkMode ? "#090D16" : "#F2F1EA";
      ctx.fillRect(0, 0, width, height);

      // Draw dithered grid network
      const rows = 12;
      const cols = 20;
      const cellW = width / cols;
      const cellH = height / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val = Math.sin(c * 0.3 + t) + Math.cos(r * 0.4 + t * 0.8);
          const size = Math.max(1, Math.min(6, (val + 2) * 1.5));
          const color =
            val > 0.8
              ? "#7C3AED"
              : darkMode
              ? "rgba(248, 250, 252, 0.4)"
              : "rgba(15, 22, 41, 0.4)";

          ctx.fillStyle = color;
          ctx.fillRect(c * cellW + cellW / 2 - size / 2, r * cellH + cellH / 2 - size / 2, size, size);
        }
      }

      // Connecting lines
      ctx.strokeStyle = darkMode ? "rgba(234, 88, 12, 0.3)" : "rgba(234, 88, 12, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const x1 = (i * 60 + t * 20) % width;
        const y1 = Math.sin(i + t) * 40 + height / 2;
        const x2 = (x1 + 80) % width;
        const y2 = Math.cos(i * 1.5 + t) * 40 + height / 2;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const sampleQuestion = {
    question: "What is the primary function of Mitochondria in cellular biology?",
    options: [
      "Protein synthesis via ribosomes",
      "ATP energy generation through oxidative phosphorylation",
      "Lipid breakdown and waste storage",
      "DNA transcription and RNA splicing",
    ],
    correctIndex: 1,
    explanation: "Mitochondria act as cellular powerhouses, producing ATP energy through oxidative phosphorylation.",
  };

  const handleSelectOption = (index: number) => {
    setSelectedAnswer(index);
    setQuizAnswered(true);
  };

  const handleResetQuiz = () => {
    setSelectedAnswer(null);
    setQuizAnswered(false);
  };

  return (
    <div className={`min-h-screen dot-grid-bg transition-colors duration-200 ${darkMode ? "dark bg-[#090D16] text-[#F8FAFC]" : "bg-[#F2F1EA] text-[#0F1629]"}`}>
      
      {/* Top Navbar */}
      <div className="w-full px-4 pt-4 lg:px-6 lg:pt-6">
        <nav className="w-full border-2 border-current bg-background/90 backdrop-blur-md px-4 sm:px-6 py-3 lg:px-8">
          <div className="flex items-center justify-between">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="grid h-7 w-7 place-items-center bg-[#7C3AED] text-white font-bold border border-current">
                <Cpu className="h-4 w-4" />
              </div>
              <span className="text-xs font-mono tracking-[0.18em] uppercase font-black">
                STUDYMET.AI <span className="hidden sm:inline-block text-[#7C3AED]">// SYS.INT</span>
              </span>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#demo" className="text-xs font-mono tracking-widest uppercase opacity-70 hover:opacity-100 hover:text-[#7C3AED] transition-opacity">
                // LIVE_DEMO
              </a>
              <a href="#features" className="text-xs font-mono tracking-widest uppercase opacity-70 hover:opacity-100 hover:text-[#7C3AED] transition-opacity">
                // FEATURES
              </a>
              <a href="#raw-data" className="text-xs font-mono tracking-widest uppercase opacity-70 hover:opacity-100 hover:text-[#7C3AED] transition-opacity">
                // RAW_DATA
              </a>
              <a href="#pricing" className="text-xs font-mono tracking-widest uppercase opacity-70 hover:opacity-100 hover:text-[#7C3AED] transition-opacity">
                // TIERS
              </a>
            </div>

            {/* Controls & CTA */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleDarkMode}
                className="grid h-8 w-8 place-items-center border-2 border-current hover:bg-[#7C3AED] hover:text-white transition-colors"
                title="Toggle Dark Mode"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              <Link
                href="/login"
                className="hidden sm:block text-xs font-mono tracking-widest uppercase px-3 py-1.5 opacity-80 hover:opacity-100 hover:underline"
              >
                LOG IN
              </Link>

              <Link
                href="/signup"
                className="group flex items-center gap-0 bg-current text-background text-xs font-mono tracking-wider uppercase border-2 border-current hover:shadow-[3px_3px_0px_#7C3AED] transition-all"
              >
                <span className="flex items-center justify-center w-8 h-8 bg-[#7C3AED] text-white">
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
                <span className="px-4 py-1.5 font-bold">STUDY FREE</span>
              </Link>
            </div>
          </div>
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        
        {/* HERO SECTION */}
        <section className="relative w-full pt-6 pb-6 text-center">
          <div className="inline-flex items-center gap-2 border-2 border-current px-3 py-1 text-[11px] font-mono tracking-widest uppercase mb-6 bg-background">
            <span className="h-2 w-2 bg-[#7C3AED] animate-pulse" />
            <span>SUB-5MS INFERENCE ENGINE // GOOGLE GEMINI CONNECTED</span>
          </div>

          <h1 className="font-mono text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter uppercase mb-4 leading-none select-none">
            DEPLOY. SCALE.<br />
            <span className="text-[#7C3AED] underline decoration-4 underline-offset-8">LEARN.</span> REVISE.
          </h1>

          <p className="text-xs sm:text-sm max-w-2xl mx-auto mb-8 leading-relaxed font-mono opacity-80">
            StudyMET AI is the high-performance intelligence layer for your study materials. Instant document parsing, real-time AI tutor sessions, and live multi-player quiz competitions.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group flex items-center gap-0 bg-[#7C3AED] text-white text-xs sm:text-sm font-mono tracking-wider uppercase border-2 border-current shadow-[4px_4px_0px_var(--border)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_var(--border)] transition-all"
            >
              <span className="flex items-center justify-center w-10 h-10 bg-black text-white border-r-2 border-current">
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <span className="px-6 py-2.5 font-bold">START STUDYING NOW</span>
            </Link>

            <Link
              href="/dashboard"
              className="brutalist-btn-secondary px-6 py-2.5 text-xs sm:text-sm"
            >
              LAUNCH DASHBOARD →
            </Link>
          </div>
        </section>

        {/* INTERACTIVE LIVE DEMO QUIZ PREVIEW WIDGET */}
        <section id="demo" className="w-full">
          <div className="section-marker mb-4">
            <span>// SECTION: INTERACTIVE_DEMO</span>
            <div className="flex-1 border-t-2 border-current opacity-30" />
            <span className="text-[#7C3AED]">TRY IT NOW</span>
          </div>

          <div className="border-2 border-current bg-background brutalist-card-static overflow-hidden">
            {/* Terminal bar */}
            <div className="flex items-center justify-between border-b-2 border-current px-4 py-2 bg-current text-background text-xs font-mono tracking-widest uppercase">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#7C3AED]" />
                <span>AI_QUIZ_ENGINE.SYS // LIVE SAMPLE</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="h-2 w-2 bg-[#16a34a] rounded-full animate-ping" />
                <span>INFERENCE: 4.2MS</span>
              </div>
            </div>

            <div className="p-6 sm:p-8 font-mono space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-current/20 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#7C3AED]">// SAMPLE_EVALUATION</span>
                  <h3 className="text-base sm:text-lg font-black uppercase mt-0.5">{sampleQuestion.question}</h3>
                </div>
                <span className="border-2 border-current px-2.5 py-0.5 text-[10px] font-bold uppercase bg-current/5 shrink-0">
                  TOPIC: BIOLOGY_UNIT_2
                </span>
              </div>

              {/* Options Grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                {sampleQuestion.options.map((option, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = idx === sampleQuestion.correctIndex;
                  
                  let optionStyle = "border-2 border-current bg-background hover:border-[#7C3AED] hover:bg-[#7C3AED]/5";
                  if (quizAnswered) {
                    if (isCorrect) {
                      optionStyle = "border-2 border-[#16a34a] bg-[#16a34a]/10 text-[#16a34a] font-bold";
                    } else if (isSelected && !isCorrect) {
                      optionStyle = "border-2 border-red-600 bg-red-600/10 text-red-500 font-bold";
                    } else {
                      optionStyle = "border-2 border-current/30 opacity-50";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => !quizAnswered && handleSelectOption(idx)}
                      disabled={quizAnswered}
                      className={`p-4 text-left font-mono text-xs flex items-start gap-3 transition-all ${optionStyle}`}
                    >
                      <span className="grid h-6 w-6 place-items-center border border-current font-bold text-[10px] shrink-0 bg-current/5">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 mt-0.5">{option}</span>
                      {quizAnswered && isCorrect && <CheckCircle2 className="h-5 w-5 text-[#16a34a] shrink-0" />}
                      {quizAnswered && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Panel */}
              {quizAnswered && (
                <div className="border-2 border-current bg-current/5 p-4 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-[#7C3AED] tracking-widest">// AI_EXPLANATION</span>
                    <button
                      onClick={handleResetQuiz}
                      className="text-[10px] font-bold uppercase border border-current px-2 py-0.5 hover:bg-current hover:text-background transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>TRY AGAIN</span>
                    </button>
                  </div>
                  <p className="text-xs font-semibold">{sampleQuestion.explanation}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 003: CORE PLATFORM FEATURES */}
        <section id="features" className="w-full">
          <div className="section-marker mb-4">
            <span>// SECTION: CORE_MODULES</span>
            <div className="flex-1 border-t-2 border-current opacity-30" />
            <span className="text-[#7C3AED]">003</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="border-2 border-current bg-background p-6 brutalist-card flex flex-col justify-between font-mono">
              <div>
                <div className="flex items-center justify-between border-b-2 border-current pb-3 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#7C3AED]">MODULE_01</span>
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-black uppercase mb-2">DOCUMENT PARSING &amp; INDEXING</h3>
                <p className="text-xs opacity-80 leading-relaxed mb-4">
                  Upload lecture slides, PDF textbooks, and word documents. Instant text extraction and SQLite database indexing.
                </p>
              </div>
              <div className="border-t-2 border-current pt-3 text-[10px] font-bold uppercase opacity-70">
                FORMATS: PDF, DOCX, TXT
              </div>
            </div>

            {/* Feature 2 */}
            <div className="border-2 border-current bg-background p-6 brutalist-card flex flex-col justify-between font-mono">
              <div>
                <div className="flex items-center justify-between border-b-2 border-current pb-3 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#16a34a]">MODULE_02</span>
                  <Trophy className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-black uppercase mb-2">AI QUIZ GENERATION ENGINE</h3>
                <p className="text-xs opacity-80 leading-relaxed mb-4">
                  Generate instant multiple-choice practice quizzes from your study notes with instant accuracy rating &amp; detailed explanations.
                </p>
              </div>
              <div className="border-t-2 border-current pt-3 text-[10px] font-bold uppercase opacity-70">
                AI ENGINE: GEMINI 1.5 FLASH
              </div>
            </div>

            {/* Feature 3 */}
            <div className="border-2 border-current bg-background p-6 brutalist-card flex flex-col justify-between font-mono">
              <div>
                <div className="flex items-center justify-between border-b-2 border-current pb-3 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#0284c7]">MODULE_03</span>
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-black uppercase mb-2">LIVE MULTIPLAYER COMPETITIONS</h3>
                <p className="text-xs opacity-80 leading-relaxed mb-4">
                  Host live interactive quiz rooms with 6-digit session codes, real-time WebSocket leaderboards, and instant player rank.
                </p>
              </div>
              <div className="border-t-2 border-current pt-3 text-[10px] font-bold uppercase opacity-70">
                PROTOCOL: WEBSOCKET / REALTIME
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 004: RAW DATA BENTO GRID */}
        <section id="raw-data" className="w-full">
          <div className="section-marker mb-4">
            <span>// SECTION: RAW_DATA</span>
            <div className="flex-1 border-t-2 border-current opacity-30" />
            <span>TICK: {String(tick).padStart(4, "0")}</span>
            <span className="text-[#7C3AED]">004</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 border-2 border-current bg-background">
            
            {/* Box 1: Terminal Log Stream */}
            <div className="border-b-2 md:border-b-0 md:border-r-2 border-current p-0 flex flex-col h-[320px]">
              <div className="flex items-center justify-between border-b-2 border-current px-4 py-2 bg-current text-background text-[10px] font-mono tracking-widest uppercase">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-[#7C3AED]" />
                  <span>terminal.sys</span>
                </div>
                <span>STATUS: EXEC_OK</span>
              </div>
              <div className="flex-1 bg-[#0c0f17] text-[#34d399] p-4 overflow-y-auto font-mono text-xs space-y-2">
                <p className="text-[#7C3AED]">&gt; studymet --init --engine=gemini-1.5</p>
                <p>[OK] Connected to local SQLite DB: studymate.db</p>
                <p>[OK] Loaded Vector Embeddings (14,820 chunks)</p>
                <p>[OK] Sub-5ms context retriever initialized.</p>
                <p className="text-amber-400">&gt; querying note: &quot;Quantum Physics Unit 4.pdf&quot;</p>
                <p>[RESPONSE 200 OK] Generated 10 MCQs in 4.2ms</p>
                <p className="text-[#7C3AED] leading-relaxed inline-block">
                  _ <span className="animate-blink font-bold">Awaiting student query input...</span>
                </p>
              </div>
            </div>

            {/* Box 2: Dithered Canvas Graphic */}
            <div className="border-b-2 md:border-b-0 border-current p-0 flex flex-col h-[320px]">
              <div className="flex items-center justify-between border-b-2 border-current px-4 py-2 text-[10px] font-mono tracking-widest uppercase border-slate-700">
                <span>neural_scan.dither</span>
                <span className="text-[#7C3AED]">320x200 MATRIX</span>
              </div>
              <div className="flex-1 grid place-items-center bg-background p-4 overflow-hidden">
                <canvas ref={canvasRef} className="w-full max-w-[320px] h-[200px] border-2 border-current" />
              </div>
            </div>

            {/* Box 3: Inference Metrics */}
            <div className="border-t-2 md:border-r-2 border-current p-6 flex flex-col justify-between h-[320px]">
              <div className="flex items-center justify-between border-b-2 border-current pb-2">
                <span className="text-[10px] font-mono tracking-widest uppercase opacity-70">inference.metrics</span>
                <span className="h-2 w-2 bg-[#7C3AED]" />
              </div>
              <div className="grid grid-cols-2 gap-4 my-auto">
                <div>
                  <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-[#7C3AED]">{latency}ms</span>
                  <span className="block text-[10px] font-mono uppercase opacity-70 mt-1">Avg Retrival Latency</span>
                </div>
                <div>
                  <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight">14.8K</span>
                  <span className="block text-[10px] font-mono uppercase opacity-70 mt-1">Indexed Vector Chunks</span>
                </div>
                <div>
                  <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight">99.98%</span>
                  <span className="block text-[10px] font-mono uppercase opacity-70 mt-1">AI Accuracy Score</span>
                </div>
                <div>
                  <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight">50+</span>
                  <span className="block text-[10px] font-mono uppercase opacity-70 mt-1">Subjects Supported</span>
                </div>
              </div>
            </div>

            {/* Box 4: Edge Nodes Status */}
            <div className="border-t-2 border-current p-6 flex flex-col justify-between h-[320px]">
              <div className="flex items-center justify-between border-b-2 border-current pb-2">
                <span className="text-[10px] font-mono tracking-widest uppercase opacity-70">edge_nodes.status</span>
                <span className="text-[10px] font-mono text-[#7C3AED]">TICK: {String(tick).padStart(4, "0")}</span>
              </div>
              <div className="space-y-3 font-mono text-xs my-auto">
                <div className="flex justify-between items-center border-b border-current/20 pb-1">
                  <span>US-EAST-1 (N. Virginia)</span>
                  <span className="text-[#16a34a] font-bold">ONLINE (3.8ms)</span>
                </div>
                <div className="flex justify-between items-center border-b border-current/20 pb-1">
                  <span>EU-WEST-2 (London)</span>
                  <span className="text-[#16a34a] font-bold">ONLINE (4.1ms)</span>
                </div>
                <div className="flex justify-between items-center border-b border-current/20 pb-1">
                  <span>AP-SOUTH-1 (Mumbai)</span>
                  <span className="text-[#16a34a] font-bold">ONLINE (4.6ms)</span>
                </div>
                <div className="flex justify-between items-center border-b border-current/20 pb-1">
                  <span>US-WEST-2 (Oregon)</span>
                  <span className="text-[#16a34a] font-bold">ONLINE (4.2ms)</span>
                </div>
              </div>
              <div className="pt-3 border-t-2 border-current">
                <div className="flex justify-between text-[10px] font-mono uppercase mb-1">
                  <span>Global Throughput</span>
                  <span className="font-bold text-[#7C3AED]">98.4%</span>
                </div>
                <div className="h-2 w-full border border-current bg-current/10">
                  <div className="h-full bg-[#7C3AED] w-[98.4%]" />
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 006: COMPUTE TIERS / PRICING */}
        <section id="pricing" className="w-full">
          <div className="section-marker mb-4">
            <span>// SECTION: PRICING_TIERS</span>
            <div className="flex-1 border-t-2 border-current opacity-30" />
            <span className="text-[#7C3AED]">006</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl sm:text-4xl font-black font-mono uppercase">Select your study compute tier</h2>
            <p className="text-xs sm:text-sm font-mono opacity-80 mt-1">
              All plans include zero-config document uploading, AI chat, and live quiz practice.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-0">
            
            {/* Tier 1: Free */}
            <div className="border-2 border-current bg-background p-6 flex flex-col justify-between min-h-[420px] brutalist-card">
              <div>
                <div className="flex items-center justify-between border-b-2 border-current pb-3 mb-4">
                  <span className="text-xs font-mono tracking-widest uppercase font-bold">COMMUNITY_FREE</span>
                  <span className="text-xs font-mono opacity-50">01</span>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-black font-mono">$0</span>
                  <span className="text-xs font-mono uppercase opacity-70">/ forever</span>
                </div>
                <p className="text-xs font-mono opacity-80 mb-6">Standard AI study assistance. Ideal for individual review.</p>

                <ul className="space-y-3 text-xs font-mono">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#7C3AED] shrink-0" />
                    <span>Upload up to 10 Notes/PDFs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#7C3AED] shrink-0" />
                    <span>AI Study Chat with Gemini</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#7C3AED] shrink-0" />
                    <span>5 Practice Quizzes / day</span>
                  </li>
                  <li className="flex items-center gap-2 opacity-40 line-through">
                    <Minus className="h-4 w-4 shrink-0" />
                    <span>Live Quiz Competitions</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/signup"
                className="brutalist-btn-secondary w-full justify-center py-2.5 mt-8 text-xs"
              >
                DEPLOY FREE TIER
              </Link>
            </div>

            {/* Tier 2: Student Pro (Highlighted) */}
            <div className="border-2 border-current bg-current text-background p-6 flex flex-col justify-between min-h-[440px] brutalist-card-static relative z-10 shadow-[6px_6px_0px_#7C3AED]">
              <div>
                <div className="flex items-center justify-between border-b-2 border-background/20 pb-3 mb-4">
                  <span className="text-xs font-mono tracking-widest uppercase font-bold text-[#7C3AED]">STUDENT_PRO</span>
                  <span className="bg-[#7C3AED] text-white text-[9px] font-bold px-2 py-0.5 uppercase">RECOMMENDED</span>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-black font-mono">$9</span>
                  <span className="text-xs font-mono uppercase opacity-70">/ month</span>
                </div>
                <p className="text-xs font-mono opacity-80 mb-6">Unlimited AI horsepower for top academic scorers.</p>

                <ul className="space-y-3 text-xs font-mono">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#7C3AED] shrink-0" />
                    <span>Unlimited Notes &amp; Document Uploads</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#7C3AED] shrink-0" />
                    <span>Unlimited AI Quiz Generation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#7C3AED] shrink-0" />
                    <span>Real-Time Live Competitions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#7C3AED] shrink-0" />
                    <span>Priority Sub-5ms AI Routing</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/signup"
                className="brutalist-btn-orange w-full justify-center py-3 mt-8 text-xs"
              >
                START PRO TRIAL →
              </Link>
            </div>

            {/* Tier 3: Institution */}
            <div className="border-2 border-current bg-background p-6 flex flex-col justify-between min-h-[420px] brutalist-card">
              <div>
                <div className="flex items-center justify-between border-b-2 border-current pb-3 mb-4">
                  <span className="text-xs font-mono tracking-widest uppercase font-bold">INSTITUTION</span>
                  <span className="text-xs font-mono opacity-50">03</span>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-black font-mono">CUSTOM</span>
                </div>
                <p className="text-xs font-mono opacity-80 mb-6">Campus-wide AI deployment for universities &amp; academies.</p>

                <ul className="space-y-3 text-xs font-mono">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#ea580c] shrink-0" />
                    <span>Unlimited Student Licenses</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#ea580c] shrink-0" />
                    <span>Custom On-Prem vector database</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#ea580c] shrink-0" />
                    <span>Dedicated SLA &amp; Admin Dashboard</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/signup"
                className="brutalist-btn-secondary w-full justify-center py-2.5 mt-8 text-xs"
              >
                CONTACT SALES
              </Link>
            </div>

          </div>
        </section>

        {/* SECTION 008: MODEL ECOSYSTEM MARQUEE */}
        <section className="w-full pt-6">
          <div className="section-marker mb-4">
            <span>// PARTNERS: MODEL_ECOSYSTEM</span>
            <div className="flex-1 border-t-2 border-current opacity-30" />
            <span className="text-[#ea580c]">008</span>
          </div>

          <div className="overflow-hidden border-2 border-current bg-background py-4">
            <div className="flex animate-marquee whitespace-nowrap gap-12 font-mono text-sm font-bold tracking-widest uppercase">
              <span className="text-[#ea580c]">STUDYMET.AI</span>
              <span>GOOGLE GEMINI 1.5</span>
              <span>FASTAPI BACKEND</span>
              <span>SQLITE DB</span>
              <span>NEXT.JS TURBOPACK</span>
              <span>WEBSOCKET REALTIME</span>
              <span className="text-[#ea580c]">STUDYMET.AI</span>
              <span>GOOGLE GEMINI 1.5</span>
              <span>FASTAPI BACKEND</span>
              <span>SQLITE DB</span>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="w-full border-t-2 border-current mt-16 px-6 py-8 font-mono text-xs bg-background">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold tracking-widest uppercase block">STUDYMET.AI</span>
            <span className="opacity-60 text-[10px] mt-0.5 block">(C) 2026 SYSTEM INTELLIGENCE CORP. ALL RIGHTS RESERVED.</span>
          </div>

          <div className="flex gap-6 text-[10px] tracking-widest uppercase">
            <Link href="/privacy" className="hover:text-[#ea580c] hover:underline">PRIVACY</Link>
            <Link href="/terms" className="hover:text-[#ea580c] hover:underline">TERMS</Link>
            <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-[#ea580c] hover:underline">API_STATUS</a>
            <Link href="/dashboard" className="hover:text-[#ea580c] hover:underline">DASHBOARD</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
