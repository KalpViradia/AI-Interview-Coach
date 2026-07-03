"use client";

import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Target, MessageSquare, UserCheck, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AboutPage() {
  const router = useRouter();
  const { status } = useSession();

  const handleStart = () => {
    if (status === "authenticated") {
      router.push("/dashboard");
    } else {
      router.push("/upload");
    }
  };

  const scrollToWorkflow = () => {
    document.getElementById("workflow")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-black text-zinc-50 selection:bg-indigo-500/30 font-sans pb-48">
      {/* Background styling */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-black to-black"></div>

      {/* Back Button */}
      <div className="absolute top-6 left-6 md:top-10 md:left-10 z-50">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-lg backdrop-blur-sm group"
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium text-sm hidden sm:inline">Back</span>
        </button>
      </div>

      {/* 1. Hero */}
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 pt-24 sm:pt-32 pb-16">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl mb-6">
            AI Interview Coach
          </h1>
          <p className="text-xl leading-8 text-indigo-200 mb-6 font-medium">
            Personalized Interview Preparation, Powered by AI Agents
          </p>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Practice interviews tailored to your resume, identify ATS issues, 
            and receive actionable feedback to improve your interview readiness.
          </p>
          <p className="text-base text-zinc-500 mt-2 mb-10 max-w-xl mx-auto italic">
            Built for students and professionals who want more than generic practice.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleStart}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 hover:scale-105 active:scale-95"
            >
              Start Interview
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={scrollToWorkflow}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900/50 border border-zinc-700 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95"
            >
              View Demo
            </button>
          </div>
        </motion.div>
      </div>

      {/* 2. The Problem */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 mb-32 pt-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
        >
          <div>
            <div className="mb-10">
              <h2 className="text-sm font-semibold text-indigo-400 mb-2 uppercase tracking-wider">The Problem</h2>
              <h3 className="text-3xl font-bold text-white max-w-2xl">Preparing for technical interviews is often inefficient.</h3>
            </div>
            
            <ul className="space-y-4 text-zinc-300 text-lg list-disc pl-5">
              <li className="pl-2">Candidates practice generic questions not relevant to their background.</li>
              <li className="pl-2">They receive little personalized feedback on their answers.</li>
              <li className="pl-2">Resume–job description gaps go unidentified before applying.</li>
              <li className="pl-2">There is no structured path to measure and improve readiness.</li>
            </ul>
          </div>
          
          <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none"></div>
            <p className="text-xl font-medium text-indigo-100 leading-relaxed relative z-10">
              AI Coach solves this by understanding your resume and generating personalized interview preparation.
            </p>
          </div>
        </motion.div>
      </div>

      {/* 3. The Solution */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 mb-32">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white">What AI Coach Does</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Target,
              title: "ATS Analysis",
              body: "Compare your resume with a job description and discover missing skills before you apply.",
              color: "text-blue-400"
            },
            {
              icon: MessageSquare,
              title: "Resume Chat",
              body: "Ask questions about your resume and receive contextual answers grounded in your actual experience.",
              color: "text-purple-400"
            },
            {
              icon: UserCheck,
              title: "Interactive Interview",
              body: "Practice adaptive interviews that adjust question difficulty based on your previous answers.",
              color: "text-emerald-400"
            }
          ].map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 hover:bg-zinc-800/80 transition-colors"
            >
              <card.icon className={`w-8 h-8 mb-6 ${card.color}`} />
              <h3 className="text-xl font-semibold text-white mb-3">{card.title}</h3>
              <p className="text-zinc-400 leading-relaxed">{card.body}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 4. How AI Coach Works */}
      <div id="workflow" className="mx-auto max-w-5xl px-6 lg:px-8 mb-32 pt-8">
        <div className="bg-indigo-950/10 border border-indigo-500/10 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">From resume upload to personalized feedback, every step is tailored to your background.</p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-3xl mx-auto"
        >
          {/* Node 1 */}
          <div className="bg-zinc-900 border border-indigo-500/50 rounded-full px-8 py-3 text-zinc-100 font-medium text-center shadow-[0_0_15px_rgba(99,102,241,0.1)]">
            Resume + Job Description
          </div>
          <ChevronDown className="w-5 h-5 text-indigo-500 my-3" />
          
          {/* Node 2 */}
          <div className="bg-zinc-900 border border-indigo-500/50 rounded-full px-8 py-3 text-zinc-100 font-medium text-center shadow-[0_0_15px_rgba(99,102,241,0.1)]">
            AI Resume Understanding
          </div>
          <ChevronDown className="w-5 h-5 text-indigo-500 my-3" />
          
          {/* Node 3 */}
          <div className="bg-zinc-900 border border-indigo-500/50 rounded-full px-8 py-3 text-zinc-100 font-medium text-center shadow-[0_0_15px_rgba(99,102,241,0.1)]">
            Knowledge Base
          </div>
          <ChevronDown className="w-5 h-5 text-indigo-500 my-3 hidden sm:block" />
          
          {/* Bracket Row */}
          <div className="w-full max-w-3xl relative my-3 sm:my-0">
            <div className="sm:border sm:border-indigo-500/30 sm:rounded-3xl sm:py-6 sm:px-6 w-full">
              {/* Middle Nodes */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 w-full relative z-10">
                <ChevronDown className="w-5 h-5 text-indigo-500 mx-auto my-1 sm:hidden" />
                <div className="bg-zinc-900 border border-indigo-500/50 rounded-full px-6 py-3 text-zinc-100 font-medium text-center w-full sm:flex-1 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                  ATS
                </div>
                <ChevronDown className="w-5 h-5 text-indigo-500 mx-auto my-1 sm:hidden" />
                <div className="bg-zinc-900 border border-indigo-500/50 rounded-full px-6 py-3 text-zinc-100 font-medium text-center w-full sm:flex-1 shadow-[0_0_15px_rgba(99,102,241,0.1)] whitespace-nowrap">
                  Resume Chat
                </div>
                <ChevronDown className="w-5 h-5 text-indigo-500 mx-auto my-1 sm:hidden" />
                <div className="bg-zinc-900 border border-indigo-500/50 rounded-full px-6 py-3 text-zinc-100 font-medium text-center w-full sm:flex-1 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                  Interview
                </div>
              </div>
            </div>
          </div>
          
          <ChevronDown className="w-5 h-5 text-indigo-500 my-3" />
          
          {/* Node 4 */}
          <div className="bg-zinc-900 border border-indigo-500/50 rounded-full px-8 py-3 text-zinc-100 font-medium text-center shadow-[0_0_15px_rgba(99,102,241,0.1)]">
            AI Evaluation
          </div>
          <ChevronDown className="w-5 h-5 text-indigo-500 my-3" />
          
          {/* Node 5 */}
          <div className="bg-zinc-900 border border-indigo-500/50 rounded-full px-8 py-3 text-zinc-100 font-medium text-center shadow-[0_0_15px_rgba(99,102,241,0.1)]">
            Interview Report
          </div>
        </motion.div>

        <div className="mt-12 space-y-0 max-w-3xl mx-auto">
          <p className="text-zinc-400 text-center mb-8 text-lg">
            The AI doesn't simply answer questions. It follows a structured workflow.
          </p>
          {[
            "Understands your resume and extracts relevant experience.",
            "Retrieves matching context from your personal knowledge base.",
            "Generates personalized interview questions for your role.",
            "Evaluates your answers against expected quality criteria.",
            "Provides targeted feedback and learning recommendations.",
            "Generates a personalized learning roadmap and final report to guide your preparation."
          ].map((step, idx, arr) => (
            <div key={idx}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 py-8">
                <span className="text-4xl font-bold text-indigo-500 shrink-0">
                  {idx + 1}
                </span>
                <p className="text-zinc-300 text-lg leading-relaxed">{step}</p>
              </div>
              {idx < arr.length - 1 && (
                <div className="h-px w-full bg-zinc-800/50"></div>
              )}
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* 5. Why AI Coach is Different */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 mb-32">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white">Why AI Coach is Different</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: "Resume-Aware",
              body: "Every question is generated from your own experience, not a generic question bank."
            },
            {
              title: "Adaptive",
              body: "Question difficulty adjusts based on your answers across the session."
            },
            {
              title: "Actionable",
              body: "You receive detailed feedback, not just correct or incorrect."
            },
            {
              title: "Continuous",
              body: "Track improvement across multiple interview sessions."
            }
          ].map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8"
            >
              <h3 className="text-xl font-semibold text-white mb-3">{card.title}</h3>
              <p className="text-zinc-400 leading-relaxed">{card.body}</p>
            </motion.div>
          ))}
        </div>
      </div>



      {/* 6. Results You'll Receive */}
      <div className="mx-auto max-w-4xl px-6 lg:px-8 mb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Results You'll Receive</h2>
            <p className="text-zinc-400 mt-4 max-w-xl mx-auto">
              Every session produces a complete, actionable report.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              "ATS Match Score",
              "Missing Skills",
              "Interview Feedback",
              "Ideal Answers",
              "Learning Roadmap",
              "Progress Tracking"
            ].map((result, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-5 hover:border-indigo-500/40 hover:bg-zinc-800/60 transition-all"
              >
                <span className="text-indigo-400 font-bold text-lg shrink-0">✓</span>
                <span className="text-zinc-200 font-medium">{result}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 7. CTA */}
      <div className="mx-auto max-w-4xl px-8 sm:px-12 lg:px-16 mb-16">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-indigo-900/20 border border-indigo-500/20 rounded-3xl p-12 text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Ready to start?</h2>
          <p className="text-xl text-indigo-200 mb-10 max-w-2xl mx-auto">
            Upload your resume and begin personalized interview preparation.
          </p>
          <button
            onClick={handleStart}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-10 py-4 text-base font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 hover:scale-105 active:scale-95"
          >
            Start Now
            <ArrowRight className="h-5 w-5" />
          </button>
        </motion.div>
      </div>

      {/* Spacer to guarantee scrollable breathing room at the bottom of the page */}
      <div className="h-32 md:h-48 w-full shrink-0"></div>

    </div>
  );
}
