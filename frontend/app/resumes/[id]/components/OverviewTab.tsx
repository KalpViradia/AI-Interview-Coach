"use client";

import { ResumeDetailResponse } from "@/lib/api-client";
import { format } from "date-fns";
import Link from "next/link";
import { 
  PlayCircle, 
  Target, 
  MessageSquare, 
  BarChart, 
  TrendingUp,
  Clock,
  Zap,
  Shield
} from "lucide-react";
import { motion } from "framer-motion";

import AnalysisPanel from "./AnalysisPanel";

interface OverviewTabProps {
  resume: ResumeDetailResponse;
}

export default function OverviewTab({ resume }: OverviewTabProps) {
  const stats = [
    { 
      label: "Mock Interviews", 
      value: resume.mock_interviews, 
      icon: PlayCircle, 
      color: "text-blue-400", 
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      glow: "shadow-blue-500/5"
    },
    { 
      label: "ATS Checks", 
      value: resume.ats_checks, 
      icon: Target, 
      color: "text-emerald-400", 
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      glow: "shadow-emerald-500/5"
    },
    { 
      label: "Chat Sessions", 
      value: resume.resume_chats || 0, 
      icon: MessageSquare, 
      color: "text-purple-400", 
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      glow: "shadow-purple-500/5"
    },
    { 
      label: "Avg Score", 
      value: resume.average_score ? `${Math.round(resume.average_score)}%` : "—", 
      icon: BarChart, 
      color: "text-amber-400", 
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      glow: "shadow-amber-500/5"
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      {/* Left Column — Quick Actions */}
      <motion.div variants={itemVariants} className="space-y-6">
        {/* Quick Actions Card */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <Link 
              href="/upload" 
              className="group flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
            >
              <PlayCircle className="w-5 h-5 transition-transform group-hover:scale-110" />
              Start Mock Interview
            </Link>
            <Link 
              href="/upload?mode=ats" 
              className="group flex items-center gap-3 p-3.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/50 transition-all duration-300 text-white font-medium"
            >
              <Target className="w-5 h-5 text-emerald-400 transition-transform group-hover:scale-110" />
              Run ATS Check
            </Link>
            <Link 
              href="/resume-chat" 
              className="group flex items-center gap-3 p-3.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/50 transition-all duration-300 text-white font-medium"
            >
              <MessageSquare className="w-5 h-5 text-purple-400 transition-transform group-hover:scale-110" />
              Chat with Resume
            </Link>
          </div>
        </div>

        {/* Resume Health Card */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Resume Health</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-zinc-400">Content Quality</span>
                <span className="text-emerald-400 font-medium">Good</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "72%" }}
                  transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-zinc-400">Completeness</span>
                <span className="text-amber-400 font-medium">Moderate</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "58%" }}
                  transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full"
                />
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Run AI Analysis for detailed insights →
            </p>
          </div>
        </div>
      </motion.div>

      {/* Right Column — Stats Grid */}
      <motion.div variants={itemVariants} className="lg:col-span-2">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -2 }}
              className={`bg-zinc-900/50 border ${s.border} rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-shadow hover:shadow-xl ${s.glow}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${s.bg}`}>
                <s.icon className={`w-6 h-6 ${s.color}`} />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Activity Timeline Placeholder */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          </div>
          <div className="space-y-4">
            {resume.mock_interviews > 0 || resume.ats_checks > 0 ? (
              <>
                {resume.mock_interviews > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <PlayCircle className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-300">{resume.mock_interviews} mock interview{resume.mock_interviews > 1 ? "s" : ""} completed</p>
                      <p className="text-xs text-zinc-500">Using this resume</p>
                    </div>
                  </div>
                )}
                {resume.ats_checks > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-300">{resume.ats_checks} ATS check{resume.ats_checks > 1 ? "s" : ""} performed</p>
                      <p className="text-xs text-zinc-500">Against job descriptions</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Clock className="w-8 h-8 text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-500">No activity yet</p>
                <p className="text-xs text-zinc-600 mt-1">Start an interview or ATS check to see activity here</p>
              </div>
            )}
          </div>

          {/* Version History (Mocked for UI Sprint) */}
          <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-6 mt-6">
            <h3 className="font-semibold text-white mb-4">Version History</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm border-l-2 border-indigo-500 pl-4 py-1">
                <div>
                  <p className="text-zinc-200 font-medium">Version 2 (Current)</p>
                  <p className="text-zinc-500 text-xs mt-0.5">Updated just now</p>
                </div>
                <button className="text-indigo-400 hover:text-indigo-300 font-medium text-xs">Restore</button>
              </div>
              <div className="flex justify-between items-center text-sm border-l-2 border-zinc-700 pl-4 py-1 opacity-75">
                <div>
                  <p className="text-zinc-400 font-medium">Version 1</p>
                  <p className="text-zinc-500 text-xs mt-0.5">Original Upload • {format(new Date(resume.created_at), "MMM d, yyyy")}</p>
                </div>
                <button className="text-zinc-500 hover:text-zinc-300 font-medium text-xs">Restore</button>
              </div>
            </div>
            <p className="text-xs text-zinc-600 mt-4 text-center">Version history is currently stored locally during this sprint.</p>
          </div>

        </div>

        {/* AI Analysis Panel */}
        <div className="mt-6">
          <AnalysisPanel resumeId={resume.id} />
        </div>
      </motion.div>
    </motion.div>
  );
}
