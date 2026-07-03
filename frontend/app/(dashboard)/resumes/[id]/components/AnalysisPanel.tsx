"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  BrainCircuit, 
  Code, 
  Briefcase, 
  ShieldCheck, 
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { analyzeResume, ResumeAnalysis } from "@/lib/api-client";

interface AnalysisPanelProps {
  resumeId: string;
}

export default function AnalysisPanel({ resumeId }: AnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeResume(resumeId);
      setAnalysis(data);
    } catch (err: any) {
      setError(err.message || "Failed to analyze resume.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch if not already loaded (could also be triggered by a button)
  useEffect(() => {
    if (!analysis && !loading && !error) {
      fetchAnalysis();
    }
  }, [resumeId]);

  if (loading && !analysis) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-16 h-16 relative mb-4">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" />
          <div className="relative bg-zinc-900 border border-indigo-500/30 rounded-full w-full h-full flex items-center justify-center">
            <BrainCircuit className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Analyzing Resume</h3>
        <p className="text-sm text-zinc-500 max-w-[250px]">
          Our AI is extracting skills, analyzing experience, and generating insights...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-zinc-900/50 border border-red-900/30 rounded-3xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <h3 className="text-lg font-semibold text-white">Analysis Failed</h3>
        </div>
        <p className="text-sm text-zinc-400 mb-4">{error}</p>
        <button 
          onClick={fetchAnalysis}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  if (!analysis) return null;

  // Determine color for quality score
  const getScoreColor = (score: number) => {
    if (score >= 12) return "text-emerald-400";
    if (score >= 9) return "text-amber-400";
    return "text-red-400";
  };
  
  const scoreColor = getScoreColor(analysis.quality_score);

  return (
    <div className="bg-zinc-900/50 border border-indigo-500/20 rounded-3xl overflow-hidden backdrop-blur-sm shadow-xl shadow-indigo-500/5 flex flex-col h-full">
      {/* Header */}
      <div 
        className="px-6 py-4 flex items-center justify-between bg-zinc-900/80 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="font-semibold text-white">AI Analysis</h3>
        </div>
        <button className="p-1 text-zinc-500 hover:text-white">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-6 space-y-6">
              
              {/* Top Row: Experience & Score */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4 text-violet-400" />
                    <span className="text-xs text-zinc-500 uppercase font-semibold">Experience</span>
                  </div>
                  <div className="text-sm font-medium text-white">{analysis.experience_level}</div>
                </div>
                
                <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-zinc-500 uppercase font-semibold">Structure</span>
                  </div>
                  <div className={`text-xl font-bold ${scoreColor}`}>
                    {analysis.quality_score} <span className="text-sm font-medium text-zinc-500">/ 15</span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              {analysis.skills.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-white mb-3">
                    <Code className="w-4 h-4 text-indigo-400" />
                    Detected Core Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.skills.map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs rounded-lg font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {analysis.strengths.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-white mb-3">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Strengths
                  </h4>
                  <ul className="space-y-2">
                    {analysis.strengths.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-300 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {analysis.suggestions.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-white mb-3">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    Improvement Areas
                  </h4>
                  <ul className="space-y-2">
                    {analysis.suggestions.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-300 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
