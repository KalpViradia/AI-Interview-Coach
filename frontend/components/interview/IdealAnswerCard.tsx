import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface IdealAnswerCardProps {
  idealAnswer: string;
}

export function IdealAnswerCard({ idealAnswer }: IdealAnswerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative bg-zinc-900/30 border border-zinc-800/80 rounded-3xl p-6 overflow-hidden">
      <div 
        className="flex justify-between items-center cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <span className="font-bold text-sm">AI</span>
          </div>
          <div>
            <h3 className="text-md font-bold text-white">Ideal Answer</h3>
            <p className="text-zinc-400 text-xs">Reference solution</p>
          </div>
        </div>
        <div className="text-sm font-bold text-indigo-400 flex items-center gap-2">
          {isExpanded ? "Hide Ideal Answer ▲" : "View Ideal Answer ▼"}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-6 mt-6 border-t border-zinc-800">
              <div className="text-sm text-zinc-300 leading-relaxed prose prose-invert prose-sm max-w-none break-words">
                <ReactMarkdown>{idealAnswer}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
