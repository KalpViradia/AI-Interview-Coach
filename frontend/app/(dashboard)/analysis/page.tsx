"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, BrainCircuit, Code, Briefcase, AlertTriangle, Home, Target, Sparkles, CheckCircle2, ChevronRight, Lightbulb, Download, Save } from "lucide-react";
import { SessionCreateResponse } from "@/lib/api-client";
import Link from "next/link";
import AnalysisSkeleton from "@/components/skeletons/AnalysisSkeleton";
import BackToTop from "@/components/ui/BackToTop";
import ReactMarkdown from "react-markdown";

function AnalysisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const isAtsMode = searchParams.get("mode") === "ats";
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const [sessionData, setSessionData] = useState<SessionCreateResponse | null>(null);

  useEffect(() => {
    if (!sessionId) {
      router.replace("/upload");
      return;
    }

    const loadData = async () => {
      const storedData = sessionStorage.getItem(`session_${sessionId}`);
      if (storedData) {
        const parsed = JSON.parse(storedData) as SessionCreateResponse;
        if (parsed.candidate_profile) {
          if (!parsed.candidate_profile.ats_breakdown && !isAtsMode) {
            router.replace(`/interview?session_id=${sessionId}`);
            return;
          }
          setSessionData(parsed);
        } else {
          router.replace(`/interview?session_id=${sessionId}`);
        }
      } else {
        try {
          const { getSessionState } = await import("@/lib/api-client");
          const sessionState = await getSessionState(sessionId);
          if (sessionState.candidate_profile) {
            const data: SessionCreateResponse = {
              session_id: sessionId,
              candidate_profile: sessionState.candidate_profile,
            };
            setSessionData(data);
            sessionStorage.setItem(`session_${sessionId}`, JSON.stringify(data));
          } else {
            router.replace("/dashboard");
          }
        } catch (error) {
          router.replace("/dashboard");
        }
      }
    };
    loadData();
  }, [sessionId, router, isAtsMode]);

  if (!sessionData || !sessionData.candidate_profile) {
    return (
              <AnalysisSkeleton />
          );
  }

  const profile = sessionData.candidate_profile;

  return (
          <div className="min-h-screen bg-black text-zinc-50 py-12 px-6 sm:px-12 flex justify-center">
        <div className="w-full max-w-5xl space-y-8">
          
          {/* Header */}
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Profile Analysis</h1>
            <p className="text-zinc-400 text-sm mt-1">
              AI-powered ATS Evaluation
            </p>
          </div>

          {/* Top Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* ATS Match */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.0 }} className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 opacity-50" />
              <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 relative z-10 flex items-center gap-2"><Target className="w-4 h-4 text-emerald-400"/> ATS Match</span>
              <div className="flex items-end gap-1 relative z-10">
                <span className="text-3xl font-bold text-white">{profile.ats_breakdown?.overall_score ?? "-"}</span>
                <span className="text-zinc-500 font-medium mb-1 text-sm">/ 100</span>
              </div>
            </motion.div>

            {/* Experience Level */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-col justify-between">
              <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><Briefcase className="w-4 h-4 text-indigo-400"/> Experience</span>
              <div>
                <span className="text-xl font-bold text-white truncate block" title={profile.experience_level}>
                  {profile.experience_level || "Unknown"}
                </span>
                <div className="flex items-end gap-1 mt-1">
                  <span className="text-zinc-300 font-bold">{profile.ats_breakdown?.experience_score ?? "-"}</span>
                  <span className="text-zinc-500 font-medium text-xs mb-0.5">/ 15</span>
                </div>
              </div>
            </motion.div>

            {/* Semantic Match */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-col justify-between">
              <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-400"/> Semantic</span>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold text-white">{profile.ats_breakdown?.semantic_score ?? "-"}</span>
                <span className="text-zinc-500 font-medium mb-1 text-sm">/ 40</span>
              </div>
            </motion.div>

            {/* Quality Score */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-col justify-between">
              <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400"/> Quality</span>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold text-white">{profile.ats_breakdown?.quality_score ?? "-"}</span>
                <span className="text-zinc-500 font-medium mb-1 text-sm">/ 15</span>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LEFT COLUMN: Data & Skills */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              {/* Detailed Breakdown */}
              {profile.ats_breakdown && (
                <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-6">
                    <Sparkles className="w-5 h-5 text-indigo-400" /> Score Breakdown
                  </h3>
                  <div className="space-y-4">
                    
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-sm font-medium">Semantic Match</span>
                      <div className="flex items-center gap-3 w-1/2">
                        <div className="h-2 flex-grow bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${(profile.ats_breakdown.semantic_score / 40) * 100}%` }} />
                        </div>
                        <span className="text-zinc-300 text-sm font-bold w-12 text-right">{profile.ats_breakdown.semantic_score}/40</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-sm font-medium">Skill Match</span>
                      <div className="flex items-center gap-3 w-1/2">
                        <div className="h-2 flex-grow bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${(profile.ats_breakdown.skill_score / 30) * 100}%` }} />
                        </div>
                        <span className="text-zinc-300 text-sm font-bold w-12 text-right">{profile.ats_breakdown.skill_score}/30</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-sm font-medium">Experience</span>
                      <div className="flex items-center gap-3 w-1/2">
                        <div className="h-2 flex-grow bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: `${(profile.ats_breakdown.experience_score / 15) * 100}%` }} />
                        </div>
                        <span className="text-zinc-300 text-sm font-bold w-12 text-right">{profile.ats_breakdown.experience_score}/15</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-sm font-medium">Resume Quality</span>
                      <div className="flex items-center gap-3 w-1/2">
                        <div className="h-2 flex-grow bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${(profile.ats_breakdown.quality_score / 15) * 100}%` }} />
                        </div>
                        <span className="text-zinc-300 text-sm font-bold w-12 text-right">{profile.ats_breakdown.quality_score}/15</span>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Skills Match vs Missing */}
              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-6">
                  <Code className="w-5 h-5 text-indigo-400" /> Skills Overview
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Matched</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.ats_breakdown?.matched_skills.slice(0, 8).map((skill, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-300">
                          {skill}
                        </span>
                      ))}
                      {(!profile.ats_breakdown?.matched_skills || profile.ats_breakdown.matched_skills.length === 0) && (
                        <span className="text-zinc-500 text-xs italic">No strict matches found.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-3 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Missing</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.ats_breakdown?.missing_skills.slice(0, 8).map((skill, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-300">
                          {skill}
                        </span>
                      ))}
                      {(!profile.ats_breakdown?.missing_skills || profile.ats_breakdown.missing_skills.length === 0) && (
                        <span className="text-zinc-500 text-xs italic">No critical missing skills.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* RIGHT COLUMN: AI Explanation & Recommendations */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-6"
            >
              {profile.ats_breakdown && (
                <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/20 backdrop-blur-sm">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                    <BrainCircuit className="w-5 h-5 text-indigo-400" /> AI Insights
                  </h3>
                  <div className="text-indigo-200/80 text-sm leading-relaxed mb-6 prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-indigo-100 prose-headings:font-semibold prose-hr:border-indigo-500/20 prose-hr:my-4 prose-ul:my-2 prose-li:my-0.5">
                    {(profile.experience_details || profile.experience_level) && (
                      <div className="mb-4 pb-4 border-b border-indigo-500/20">
                        <strong className="text-indigo-100 block mb-1">Experience Analysis</strong>
                        {profile.experience_details || profile.experience_level}
                      </div>
                    )}
                    <ReactMarkdown>
                      {profile.ats_breakdown.explanation}
                    </ReactMarkdown>
                  </div>
                  
                  {profile.ats_breakdown.improvement_suggestions.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-indigo-500/10">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Suggestions to Improve</h4>
                      {profile.ats_breakdown.improvement_suggestions.map((sug, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span className="text-zinc-300 text-sm">{sug}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Bottom Actions Row */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex justify-end pt-8 relative z-50 border-t border-zinc-900 mt-8"
          >
            {isAtsMode ? (
              <button
                onClick={() => router.push(isAuthenticated ? "/dashboard" : "/")}
                className="flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white px-6 py-2.5 text-sm font-semibold transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95"
              >
                <Home className="w-4 h-4" />
                {isAuthenticated ? "Back to Dashboard" : "Back to Home"}
              </button>
            ) : (
              <button
                onClick={() => router.push(`/interview?session_id=${sessionId}`)}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-6 py-2.5 text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 hover:scale-105 active:scale-95"
              >
                Start Mock Interview
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        </div>
      </div>
      );
}

export default function AnalysisPage() {
  return (
    <>
      <Suspense fallback={
                  <AnalysisSkeleton />
              }>
        <AnalysisContent />
      </Suspense>
      <BackToTop />
    </>
  );
}

