import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Evaluation } from "@/lib/api-client";

interface AnswerEvaluationCardProps {
  evaluation: Evaluation;
}

export function AnswerEvaluationCard({ evaluation }: AnswerEvaluationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 overflow-hidden">
      <div 
        className="flex justify-between items-center cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Answer Evaluated</h3>
            <p className="text-zinc-400 text-sm">Score: <span className="text-white font-bold">{evaluation.score}/10</span></p>
          </div>
        </div>
        <div className="text-sm font-bold text-indigo-400 flex items-center gap-2">
          {isExpanded ? "Hide Detailed Feedback ▲" : "View Detailed Feedback ▼"}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-8 mt-6 border-t border-zinc-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4">
                    <CheckCircle className="w-4 h-4" /> Strengths
                  </h4>
                  <ul className="space-y-3">
                    {evaluation.strengths.length > 0 ? evaluation.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-zinc-300 flex items-start gap-3 leading-relaxed">
                        <span className="text-emerald-500/50 mt-1 shrink-0">•</span>
                        <span className="break-words min-w-0">{s}</span>
                      </li>
                    )) : <li className="text-sm text-zinc-500 italic">No clear strengths identified.</li>}
                  </ul>
                </div>
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-bold text-amber-400 uppercase tracking-wider mb-4">
                    <AlertCircle className="w-4 h-4" /> Weaknesses
                  </h4>
                  <ul className="space-y-3">
                    {evaluation.weaknesses.length > 0 ? evaluation.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-zinc-300 flex items-start gap-3 leading-relaxed">
                        <span className="text-amber-500/50 mt-1 shrink-0">•</span>
                        <span className="break-words min-w-0">{w}</span>
                      </li>
                    )) : <li className="text-sm text-zinc-500 italic">No major weaknesses identified.</li>}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
