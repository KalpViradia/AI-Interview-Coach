"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Wand2, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface OptimizeTabProps {
  resumeId: string;
}

export default function OptimizeTab({ resumeId }: OptimizeTabProps) {
  const [sectionText, setSectionText] = useState("");
  const [context, setContext] = useState("");
  const [action, setAction] = useState("improve_summary");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ improved: string, changes_summary: string } | null>(null);

  const handleOptimize = async () => {
    if (!sectionText.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await apiFetch<any>(`/resumes/${resumeId}/optimize`, {
        method: "POST",
        body: JSON.stringify({
          action,
          section_text: sectionText,
          context
        })
      });
      setResult({ improved: response.improved, changes_summary: response.changes_summary });
    } catch (err) {
      console.error(err);
      alert("Failed to optimize text.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[800px]">
      
      {/* Left Sidebar — Actions & Input */}
      <div className="lg:w-[450px] flex flex-col gap-4">
        
        {/* Actions */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Wand2 className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Optimization Type</h3>
          </div>
          
          <select 
            value={action} 
            onChange={(e) => setAction(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 focus:outline-none mb-4"
          >
            <option value="improve_summary">Improve Professional Summary</option>
            <option value="rewrite_bullets">Rewrite Experience Bullets</option>
            <option value="quantify_achievements">Add Metrics to Achievements</option>
            <option value="improve_ats_keywords">Optimize for ATS Keywords</option>
            <option value="make_concise">Make More Concise</option>
            <option value="better_action_verbs">Use Stronger Action Verbs</option>
          </select>

          {action === "improve_ats_keywords" && (
            <div className="mb-4">
              <label className="block text-xs text-zinc-500 mb-1.5">Target Job Description (Optional)</label>
              <textarea 
                value={context}
                onChange={e => setContext(e.target.value)}
                placeholder="Paste the job description here to optimize against..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 focus:outline-none resize-none h-24 custom-scrollbar"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs text-zinc-500 mb-1.5">Text to Optimize</label>
            <textarea 
              value={sectionText}
              onChange={e => setSectionText(e.target.value)}
              placeholder="Paste the paragraph or bullet points you want to improve..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 focus:outline-none resize-none h-48 custom-scrollbar"
            />
          </div>

          <button 
            onClick={handleOptimize}
            disabled={loading || !sectionText.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-900 font-bold rounded-xl transition-colors"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {loading ? "Optimizing..." : "Optimize Text"}
          </button>
        </div>
      </div>

      {/* Right Area — Results */}
      <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-sm flex flex-col relative">
        <div className="h-14 border-b border-zinc-800 bg-zinc-900/80 flex items-center px-6 shrink-0">
          <div className="text-sm font-medium text-zinc-300">
            AI Suggestions
          </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          {!result && !loading ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <Sparkles className="w-12 h-12 text-zinc-600 mb-4" />
              <p className="text-zinc-400">Select an optimization type and paste text<br/>to see AI suggestions here.</p>
            </div>
          ) : loading ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
                <Wand2 className="w-6 h-6 text-amber-500" />
              </div>
              <p className="text-amber-500/80 text-sm animate-pulse">Analyzing and rewriting text...</p>
            </div>
          ) : result ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-400 mb-1">What Changed</h4>
                  <p className="text-sm text-emerald-200/80">{result.changes_summary}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Improved Version</h4>
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 relative group">
                  <pre className="whitespace-pre-wrap text-sm text-zinc-200 font-sans leading-relaxed">
                    {result.improved}
                  </pre>
                  
                  <button 
                    onClick={() => navigator.clipboard.writeText(result.improved)}
                    className="absolute top-4 right-4 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Copy Text
                  </button>
                </div>
              </div>
              
              <div className="flex justify-center pt-2">
                <ArrowRight className="w-5 h-5 text-zinc-700 rotate-90" />
              </div>

              <div className="opacity-60 grayscale">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Original Version</h4>
                <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-5">
                  <pre className="whitespace-pre-wrap text-sm text-zinc-400 font-sans leading-relaxed">
                    {sectionText}
                  </pre>
                </div>
              </div>

            </motion.div>
          ) : null}
        </div>
      </div>

    </div>
  );
}
