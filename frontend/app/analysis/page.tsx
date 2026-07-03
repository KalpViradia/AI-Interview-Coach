"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, BrainCircuit, Code, Briefcase, AlertTriangle, Home, Target, Sparkles, CheckCircle2, ChevronRight, Lightbulb } from "lucide-react";
import SidebarLayout from "@/components/SidebarLayout";
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
      <SidebarLayout>
        <AnalysisSkeleton />
      </SidebarLayout>
    );
  }

  const profile = sessionData.candidate_profile;

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-black text-zinc-50 py-12 px-6 sm:px-12 flex justify-center">
        <div className="w-full max-w-4xl space-y-8">
          
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="mx-auto flex justify-center mb-6"
            >
              <img src="/icon.png" alt="AI Coach Logo" className="w-20 h-20 rounded-2xl shadow-xl shadow-indigo-500/20" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-4">Profile Analysis Complete</h1>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Our AI has analyzed your resume against the target job description. Review your extracted profile before starting the mock interview.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Experience Level & ATS Overall Score */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col gap-6">
                <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 opacity-50" />
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4 relative z-10">
                    <Target className="w-5 h-5 text-emerald-400" /> ATS Match
                  </h3>
                  <div className="flex items-end gap-2 relative z-10">
                    <span className="text-4xl font-bold text-white">{profile.ats_breakdown?.overall_score ?? "-"}</span>
                    <span className="text-zinc-500 font-medium mb-1">/ 100</span>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                    <Briefcase className="w-5 h-5 text-indigo-400" /> Experience Level
                  </h3>
                  <div className="text-zinc-300 leading-relaxed text-sm">
                    {profile.experience_level || "Unknown"}
                  </div>
                </div>
              </div>

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
            </motion.div>

            {/* AI Explanation & Recommendations */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              {profile.ats_breakdown && (
                <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/20 backdrop-blur-sm">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                    <BrainCircuit className="w-5 h-5 text-indigo-400" /> AI Insights
                  </h3>
                  <div className="text-indigo-200/80 text-sm leading-relaxed mb-6 prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-indigo-100 prose-headings:font-semibold prose-hr:border-indigo-500/20 prose-hr:my-4 prose-ul:my-2 prose-li:my-0.5">
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
          </div>

          {/* Actions */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-8 relative z-50"
          >
            <button
              onClick={() => router.push(isAuthenticated ? "/dashboard" : "/upload")}
              className="flex items-center gap-2 rounded-full bg-zinc-900 border border-zinc-800 text-white px-8 py-3.5 text-sm font-semibold transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95"
            >
              <Home className="w-4 h-4" />
              {isAuthenticated ? "Back to Dashboard" : "Back to Home"}
            </button>
            {!isAtsMode && (
              <button
                onClick={() => router.push(`/interview?session_id=${sessionId}`)}
                className="group flex items-center gap-2 rounded-full bg-indigo-600 text-white px-8 py-3.5 text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 hover:scale-105 active:scale-95"
              >
                Start Mock Interview
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </SidebarLayout>
  );
}

export default function AnalysisPage() {
  return (
    <>
      <Suspense fallback={
        <SidebarLayout>
          <AnalysisSkeleton />
        </SidebarLayout>
      }>
        <AnalysisContent />
      </Suspense>
      <BackToTop />
    </>
  );
}
