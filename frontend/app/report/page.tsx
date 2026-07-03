"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Trophy, Target, Map, ArrowRight, Loader2, 
  BarChart, AlertTriangle, RefreshCcw, Home, CheckCircle, Sparkles, UserPlus
} from "lucide-react";
import { SessionReport, getSessionTranscript, getSessionState, TranscriptTurn } from "@/lib/api-client";
import SidebarLayout from "@/components/SidebarLayout";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import ReportSkeleton from "@/components/skeletons/ReportSkeleton";

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { status } = useSession();
  const isGuest = status === "unauthenticated";

  const [report, setReport] = useState<SessionReport | null>(null);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      router.replace("/");
      return;
    }

    const fetchData = async () => {
      try {
        let currentReport = null;
        const storedData = sessionStorage.getItem(`report_${sessionId}`);
        if (storedData) {
          currentReport = JSON.parse(storedData);
          setReport(currentReport);
        }

        // If not in sessionStorage, fetch it from backend
        if (!currentReport) {
          const sessionState = await getSessionState(sessionId);
          if (sessionState.report) {
            setReport(sessionState.report);
            sessionStorage.setItem(`report_${sessionId}`, JSON.stringify(sessionState.report));
          } else {
            // Report doesn't exist (session might not be complete)
            if (!sessionState.is_complete) {
              router.replace(`/interview?session_id=${sessionId}`);
            } else {
              router.replace("/dashboard");
            }
            return;
          }
        }

        const data = await getSessionTranscript(sessionId);
        setTranscript(data);
      } catch (err) {
        console.error("Failed to fetch report data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sessionId, router]);

  if (isLoading || !report) {
    return (
      <SidebarLayout>
        <ReportSkeleton />
      </SidebarLayout>
    );
  }

  // Determine color based on score (0-10 scale)
  const isGoodScore = report.score >= 7;
  const scoreColor = isGoodScore ? "text-emerald-400" : "text-amber-400";
  const scoreBg = isGoodScore ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20";

  // --- Readiness Badge ---
  // Composite = 70% interview score + 30% readiness label weight
  const interviewPct = Math.round((report.score / 10) * 100);
  const readinessConfig = (() => {
    if (interviewPct >= 88) return { label: 'Exceptional', stars: 5, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'shadow-[0_0_30px_rgba(52,211,153,0.2)]' };
    if (interviewPct >= 75) return { label: 'Interview Ready', stars: 4, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', glow: 'shadow-[0_0_30px_rgba(99,102,241,0.2)]' };
    if (interviewPct >= 60) return { label: 'Almost Ready', stars: 3, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.15)]' };
    if (interviewPct >= 40) return { label: 'Needs Work', stars: 2, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', glow: '' };
    return { label: 'Not Ready', stars: 1, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', glow: '' };
  })();

  // --- Interview Statistics ---
  const avgScore = report.score;
  const totalQuestions = 10;
  
  // A question is answered if it has an answer that is not "__SKIP__" and not "[SKIPPED]" and not "__END_INTERVIEW__"
  const answeredCount = transcript.filter(t => t.answer && t.answer !== "__SKIP__" && t.answer !== "[SKIPPED]" && t.answer !== "__END_INTERVIEW__").length;
  // Skipped is explicitly skipped questions
  const skippedCount = transcript.filter(t => t.answer === "__SKIP__" || t.answer === "[SKIPPED]").length;

  return (
    <SidebarLayout>
      <div className="text-zinc-50 py-12 px-6 sm:px-12 flex justify-center">
        <div className="w-full max-w-5xl space-y-8">
          
          {/* ── READINESS BADGE ── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-3xl border p-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left ${readinessConfig.bg} ${readinessConfig.border} ${readinessConfig.glow}`}
          >
            <div className="text-6xl shrink-0">🏆</div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Interview Readiness</p>
              <h2 className={`text-3xl font-black mb-2 ${readinessConfig.color}`}>{readinessConfig.label}</h2>
              {/* Star rating */}
              <div className="flex gap-1 justify-center sm:justify-start mb-3">
                {[1, 2, 3, 4, 5].map(s => (
                  <span key={s} className={`text-2xl ${s <= readinessConfig.stars ? readinessConfig.color : 'text-zinc-700'}`}>★</span>
                ))}
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 max-w-xs">
                <motion.div
                  className={`h-2 rounded-full ${readinessConfig.stars >= 4 ? 'bg-emerald-400' : readinessConfig.stars === 3 ? 'bg-amber-400' : 'bg-red-400'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${interviewPct}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                />
              </div>
              <p className="text-sm text-zinc-500 mt-1">{interviewPct}% interview score</p>
            </div>
          </motion.div>

          {/* ── INTERVIEW STATISTICS CARD ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {[
              { label: 'Avg Score', value: `${avgScore}/10`, icon: '📊' },
              { label: 'Answered', value: `${answeredCount} / ${totalQuestions}`, icon: '💬' },
              { label: 'Skipped', value: `${skippedCount}`, icon: '⏭️' },
              { label: 'Readiness', value: readinessConfig.label, icon: '✅' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-center">
                <div className="text-2xl mb-2">{icon}</div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-sm font-bold text-white truncate" title={value}>{value}</p>
              </div>
            ))}
          </motion.div>

          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="w-20 h-20 mx-auto bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 mb-6 shadow-[0_0_30px_rgba(99,102,241,0.2)]"
            >
              <Trophy className="w-10 h-10 text-indigo-400" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-4">Interview Complete</h1>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Great job! We&apos;ve analyzed your answers across all questions. Here is your personalized feedback and learning roadmap.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Score Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`md:col-span-1 p-8 rounded-3xl border backdrop-blur-sm flex flex-col items-center text-center shadow-xl ${scoreBg}`}
            >
              <span className="text-sm font-bold uppercase tracking-wider mb-2 opacity-80 text-zinc-400">
                Overall Score
              </span>
              <div className={`text-7xl font-black mb-4 ${scoreColor} drop-shadow-md`}>
                {report.score}<span className="text-3xl opacity-50 font-bold">/10</span>
              </div>
              <div className="px-5 py-2 rounded-full bg-black/40 text-sm font-bold tracking-wide border border-white/5 mb-8 shadow-inner">
                {report.readiness_label}
              </div>

              {/* Detail Scores */}
              <div className="w-full space-y-4 pt-6 border-t border-white/5">
                <div className="flex justify-between items-center text-sm bg-black/20 px-4 py-2.5 rounded-xl">
                  <span className="text-zinc-400 font-medium">Technical Knowledge</span>
                  <span className="font-bold text-white">{report.technical_score || report.score}/10</span>
                </div>
                <div className="flex justify-between items-center text-sm bg-black/20 px-4 py-2.5 rounded-xl">
                  <span className="text-zinc-400 font-medium">Communication</span>
                  <span className="font-bold text-white">{report.communication_score || report.score}/10</span>
                </div>
                <div className="flex justify-between items-center text-sm bg-black/20 px-4 py-2.5 rounded-xl">
                  <span className="text-zinc-400 font-medium">Problem Solving</span>
                  <span className="font-bold text-white">{report.problem_solving_score || report.score}/10</span>
                </div>
              </div>
            </motion.div>

            {/* Summary & Weaknesses */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="md:col-span-2 space-y-6 flex flex-col"
            >
              <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex-1 shadow-lg">
                <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4 uppercase tracking-wider text-sm">
                  <BarChart className="w-5 h-5 text-indigo-400" /> Executive Summary
                </h3>
                <div className="text-zinc-300 leading-relaxed text-lg prose prose-invert max-w-none">
                  <ReactMarkdown>
                    {report.summary}
                  </ReactMarkdown>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 shadow-lg">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-400 mb-4 uppercase tracking-wider">
                    <CheckCircle className="w-5 h-5" /> Strong Areas
                  </h3>
                  <ul className="space-y-3">
                    {report.strong_topics && report.strong_topics.length > 0 ? report.strong_topics.map((topic, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm font-medium text-emerald-100/80 leading-relaxed">
                        <span className="text-emerald-500 mt-0.5">•</span> {topic}
                      </li>
                    )) : (
                      <li className="text-sm text-zinc-500 italic">No clear strengths identified yet.</li>
                    )}
                  </ul>
                </div>

                <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 shadow-lg">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-amber-400 mb-4 uppercase tracking-wider">
                    <AlertTriangle className="w-5 h-5" /> Needs Improvement
                  </h3>
                  <ul className="space-y-3">
                    {report.weak_topics && report.weak_topics.length > 0 ? report.weak_topics.map((topic, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm font-medium text-amber-100/80 leading-relaxed">
                        <span className="text-amber-500 mt-0.5">•</span> {topic}
                      </li>
                    )) : (
                      <li className="text-sm text-zinc-500 italic">No major weak topics identified.</li>
                    )}
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Roadmap */}
          {report.roadmap && report.roadmap.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 mt-8 shadow-lg"
            >
              <h3 className="flex items-center gap-2 text-sm font-bold text-white mb-6 uppercase tracking-wider">
                <Map className="w-5 h-5 text-indigo-400" /> Recommended Topics & Roadmap
              </h3>
              <div className="space-y-4">
                {report.roadmap.reduce((acc: string[], curr: string) => {
                  if ((curr.trim().startsWith('-') || curr.trim().startsWith('*')) && acc.length > 0) {
                    acc[acc.length - 1] += '\n' + curr;
                  } else {
                    acc.push(curr);
                  }
                  return acc;
                }, []).map((step, idx) => (
                  <div key={idx} className="flex gap-5 p-5 rounded-2xl bg-black/50 border border-zinc-800/80 hover:border-indigo-500/30 transition-colors w-full overflow-hidden">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black text-lg border border-indigo-500/20 shadow-inner">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0 text-zinc-300 pt-2 leading-relaxed font-medium prose prose-invert prose-sm max-w-none overflow-x-auto break-words">
                      <ReactMarkdown>
                        {step}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Save Progress CTA for Guests */}
          {isGuest && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-zinc-900/60 to-zinc-900/40 p-8 text-center shadow-2xl"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />
              <div className="relative z-10">
                <div className="w-14 h-14 mx-auto bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 mb-5 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                  <Sparkles className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Save Your Progress</h3>
                <p className="text-zinc-400 max-w-md mx-auto mb-6 leading-relaxed">
                  Create a free account to save this interview, track your improvement over time, and receive personalized coaching.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Link
                    href="/register"
                    className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/25"
                  >
                    <UserPlus className="w-4 h-4" />
                    Create Account
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white px-8 py-3.5 text-sm font-medium transition-all"
                  >
                    Already have one? Sign In
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-12"
          >
            {isGuest ? (
              <Link
                href="/upload"
                className="flex items-center gap-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-white px-8 py-4 text-sm font-bold transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95 shadow-lg"
              >
                <Home className="w-5 h-5" />
                Back to Home
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-white px-8 py-4 text-sm font-bold transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95 shadow-lg"
              >
                <Home className="w-5 h-5" />
                Back to Dashboard
              </Link>
            )}
            <Link
              href="/upload"
              className="group flex items-center gap-2 rounded-2xl bg-white text-black px-8 py-4 text-sm font-black transition-all hover:bg-zinc-200 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <RefreshCcw className="w-5 h-5 transition-transform group-hover:-rotate-180" />
              Start Another Session
            </Link>
          </motion.div>
        </div>
      </div>
    </SidebarLayout>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <SidebarLayout>
        <ReportSkeleton />
      </SidebarLayout>
    }>
      <ReportContent />
    </Suspense>
  );
}
