"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, Code2, LineChart, LogIn } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleStart = () => {
    if (status === "authenticated") {
      router.push("/upload");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-50 selection:bg-indigo-500/30">
      
      {/* Navbar */}
      <nav className="absolute top-0 w-full flex justify-between items-center p-6 z-10">
        <div className="flex items-center gap-2">
          <img src="/icon.png" alt="AI Coach Logo" className="w-8 h-8 rounded-lg shadow-md shadow-indigo-500/20" />
          <span className="font-bold text-lg">AI Coach</span>
        </div>
        <div className="flex items-center gap-6">
          {status === "authenticated" ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:scale-105 active:scale-95 shadow-sm"
            >
              Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 border border-zinc-700 px-5 py-2 text-sm font-semibold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white hover:scale-105 active:scale-95 shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
          )}
        </div>
      </nav>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
        
        {/* Background glow */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-black to-black"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-3xl text-center mt-12"
        >
          <div className="mb-8 flex justify-center">
            <span className="relative rounded-full px-4 py-1.5 text-sm leading-6 text-indigo-300 ring-1 ring-indigo-500/30 hover:ring-indigo-500/50 transition-all bg-indigo-500/10 cursor-default">
              Resume-Aware AI Interview Preparation
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
            Master your next tech interview.
          </h1>
          <p className="text-base text-zinc-500 mb-4 italic">
            Built for students and professionals who want more than generic practice.
          </p>
          <p className="text-lg leading-8 text-zinc-400 mb-10">
            Upload your resume, evaluate it against a job description, practice
            personalized interviews, and receive AI-powered feedback to improve
            your interview readiness.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {status === "authenticated" ? (
              <button
                onClick={() => router.push("/upload")}
                className="group relative inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black shadow-sm transition-all hover:bg-zinc-200 hover:scale-105 active:scale-95"
              >
                Start Interview
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push("/login")}
                  className="group relative inline-flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 hover:scale-105 active:scale-95"
                >
                  Sign in to Save Progress
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => router.push("/upload")}
                  className="group relative inline-flex items-center gap-2 rounded-full bg-zinc-800 border border-zinc-700 px-8 py-3.5 text-sm font-semibold text-zinc-300 shadow-sm transition-all hover:bg-zinc-700 hover:scale-105 active:scale-95"
                >
                  Continue as Guest
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mx-auto mt-24 max-w-2xl lg:mt-32 lg:max-w-none"
        >
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {[
              {
                icon: Code2,
                title: "Personalized Questions",
                description: "We analyze your resume and target job description to generate questions tailored specifically to your profile.",
              },
              {
                icon: BrainCircuit,
                title: "Adaptive Difficulty",
                description: "The interview adjusts to your skill level in real-time. Answer well, and the questions get harder.",
              },
              {
                icon: LineChart,
                title: "Actionable Feedback",
                description: "Get detailed evaluations of your answers, track your progress over time, and follow a custom learning roadmap.",
              },
            ].map((feature, idx) => (
              <div key={idx} className="flex flex-col items-start p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm transition-all hover:bg-zinc-900">
                <div className="p-3 rounded-2xl bg-indigo-500/10 mb-6">
                  <feature.icon className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-zinc-100">{feature.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Why AI Coach Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mx-auto mt-24 max-w-4xl lg:mt-32"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-4">
              Why AI Coach?
            </h2>
            <p className="text-zinc-400">
              Not all interview prep is equal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Traditional column */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-6">
                Traditional Practice
              </h3>
              <ul className="space-y-4">
                {[
                  "Generic questions unrelated to your background",
                  "No feedback on why an answer was weak",
                  "No resume or job description awareness",
                  "Same difficulty regardless of performance",
                  "No progress tracking across sessions"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-zinc-500">
                    <span className="text-zinc-700 font-bold mt-0.5 shrink-0">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* AI Coach column */}
            <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-24 bg-indigo-500/10 blur-3xl rounded-full
                              -mr-12 -mt-12 pointer-events-none"></div>
              <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-6 relative z-10">
                AI Coach
              </h3>
              <ul className="space-y-4 relative z-10">
                {[
                  "Questions generated directly from your resume",
                  "Detailed feedback with ideal answer comparisons",
                  "ATS analysis against real job descriptions",
                  "Adaptive difficulty based on your answers",
                  "Progress tracked across every session"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-zinc-200">
                    <span className="text-indigo-400 font-bold mt-0.5 shrink-0">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
