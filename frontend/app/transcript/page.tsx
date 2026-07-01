"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, CheckCircle, AlertTriangle, MessageSquare, Target, LogIn, Sparkles } from "lucide-react";
import { getSessionTranscript, TranscriptTurn } from "@/lib/api-client";
import { useSession } from "next-auth/react";
import SidebarLayout from "@/components/SidebarLayout";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import TranscriptSkeleton from "@/components/skeletons/TranscriptSkeleton";
import BackToTop from "@/components/ui/BackToTop";

function TranscriptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { status } = useSession();
  const isGuest = status === "unauthenticated";

  useEffect(() => {
    if (!sessionId) {
      router.replace(isGuest ? "/" : "/dashboard");
      return;
    }

    // Guests can't fetch saved transcripts (requires auth + DB row)
    if (isGuest) {
      setLoading(false);
      return;
    }

    const fetchTranscript = async () => {
      try {
        const data = await getSessionTranscript(sessionId);
        setTranscript(data);
      } catch (err) {
        setError("Failed to load transcript.");
      } finally {
        setLoading(false);
      }
    };

    fetchTranscript();
  }, [sessionId, router, isGuest]);

  if (loading) {
    return (
      <SidebarLayout>
        <TranscriptSkeleton />
      </SidebarLayout>
    );
  }

  // Guest mode — show sign-in prompt
  if (isGuest) {
    return (
      <SidebarLayout>
        <div className="h-full w-full flex flex-col items-center justify-center text-white p-6">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 mb-6 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
            <Sparkles className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold mb-3">View Saved Transcripts</h2>
          <p className="text-zinc-400 mb-6 text-center max-w-md">Create an account or sign in to save and review your full interview transcripts anytime.</p>
          <div className="flex gap-3">
            <Link href="/register" className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-semibold transition-colors">
              Create Account
            </Link>
            <Link href="/login" className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white font-medium transition-colors">
              <LogIn className="w-4 h-4" /> Sign In
            </Link>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error || transcript.length === 0) {
    return (
      <SidebarLayout>
        <div className="h-full w-full flex flex-col items-center justify-center text-white p-6">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Transcript Unavailable</h2>
          <p className="text-zinc-400 mb-6">{error || "No questions found for this session."}</p>
          <Link href="/dashboard" className="px-6 py-3 bg-zinc-800 rounded-full text-white font-medium hover:bg-zinc-700 transition-colors">
            Return to Dashboard
          </Link>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="text-zinc-50 py-12 px-6 sm:px-12 flex justify-center">
        <div className="w-full max-w-4xl space-y-8">
          
          {/* Header */}
        <div className="flex items-center gap-4 border-b border-zinc-800 pb-6 mb-8">
          <Link
            href="/dashboard"
            className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Interview Transcript</h1>
            <p className="text-sm text-zinc-400">Review your questions, answers, and detailed feedback.</p>
          </div>
        </div>

        {/* Transcript Timeline */}
        <div className="space-y-12">
          {transcript.map((turn, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6"
            >
              {/* Question */}
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold uppercase tracking-wider">
                    Question {turn.order_index}
                  </span>
                  <span className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full text-xs font-medium">
                    {turn.topic}
                  </span>
                  <span className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full text-xs font-medium">
                    Lvl {turn.difficulty}
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-medium text-white leading-relaxed">
                  {turn.question}
                </h3>
              </div>

              {/* Answer */}
              {turn.answer && (
                <div className="bg-black/50 border border-zinc-800 rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-zinc-400 mb-3">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm font-semibold uppercase tracking-wider">Your Answer</span>
                  </div>
                  <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {turn.answer}
                  </div>
                </div>
              )}

              {/* Evaluation */}
              {turn.evaluation && (
                <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-5 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-400">
                      <Target className="w-4 h-4" />
                      <span className="text-sm font-semibold uppercase tracking-wider">Feedback & Score</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {turn.evaluation.score} <span className="text-sm text-zinc-500 font-normal">/ 10</span>
                    </div>
                  </div>
                  
                  <div className="text-zinc-300 leading-relaxed prose prose-invert max-w-none">
                    <ReactMarkdown>{turn.evaluation.feedback}</ReactMarkdown>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-indigo-500/10">
                    <div>
                      <h4 className="text-emerald-400 text-sm font-medium mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Strengths
                      </h4>
                      <ul className="space-y-1">
                        {turn.evaluation.strengths.map((s, i) => (
                          <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                            <span className="text-emerald-500/50 mt-0.5">•</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-amber-400 text-sm font-medium mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Areas for Improvement
                      </h4>
                      <ul className="space-y-1">
                        {turn.evaluation.weaknesses.map((w, i) => (
                          <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                            <span className="text-amber-500/50 mt-0.5">•</span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

export default function TranscriptPage() {
  return (
    <>
      <Suspense fallback={
        <SidebarLayout>
          <TranscriptSkeleton />
        </SidebarLayout>
      }>
        <TranscriptContent />
      </Suspense>
      <BackToTop />
    </>
  );
}
