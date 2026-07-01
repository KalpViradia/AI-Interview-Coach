"use client";

import { motion } from "framer-motion";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Plus, LogOut, BrainCircuit, History, LineChart as LineChartIcon, BarChart as BarChartIcon } from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import SidebarLayout from "@/components/SidebarLayout";
import { FileText, Target, Award, Calendar, AlertTriangle, ArrowRight, Database, Users, Code, Lightbulb, ChevronRight, Infinity as InfinityIcon } from "lucide-react";
import { getSessions } from "@/lib/api-client";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";
import BackToTop from "@/components/ui/BackToTop";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"interviews" | "ats">("interviews");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const fetchInterviews = async () => {
        try {
          const data = await getSessions();
          setInterviews(data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchInterviews();
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <SidebarLayout>
        <DashboardSkeleton />
      </SidebarLayout>
    );
  }

  // --- Analytics Data Prep ---
  const mockInterviews = interviews.filter(i => ["mock_interview", "general", "resume_based", "job_specific"].includes(i.session_type));
  const atsChecks = interviews.filter(i => i.session_type === "ats_check");

  // Only include completed mock interviews with a score > 0
  const completedInterviews = [...mockInterviews]
    .filter(i => i.status === 'completed' && i.report && i.report.score > 0)
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

  const scoreData = completedInterviews.map((i, idx) => ({
    name: `Int ${idx + 1}`,
    date: new Date(i.started_at).toLocaleDateString(),
    score: i.report.score,
  }));

  const topicFreq: Record<string, number> = {};
  completedInterviews.forEach(i => {
    const weakTopics = i.report?.weak_topics || [];
    weakTopics.forEach((t: string) => {
      topicFreq[t] = (topicFreq[t] || 0) + 1;
    });
  });
  
  const topicData = Object.entries(topicFreq)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5

  const skillData = (() => {
    if (completedInterviews.length === 0) return null;
    
    let totalTech = 0;
    let totalComm = 0;
    let totalProb = 0;
    let validCount = 0;
    
    let lastTech = 0;
    let lastComm = 0;
    let lastProb = 0;
    
    completedInterviews.forEach((i, idx) => {
      const rep = i.report;
      if (rep && rep.technical_score !== undefined) {
        totalTech += rep.technical_score;
        totalComm += rep.communication_score || 0;
        totalProb += rep.problem_solving_score || 0;
        validCount++;
        
        if (idx === completedInterviews.length - 2) {
            lastTech = rep.technical_score;
            lastComm = rep.communication_score || 0;
            lastProb = rep.problem_solving_score || 0;
        } else if (completedInterviews.length === 1 && idx === 0) {
            lastTech = rep.technical_score;
            lastComm = rep.communication_score || 0;
            lastProb = rep.problem_solving_score || 0;
        }
      }
    });
    
    if (validCount === 0) return null;

    const avgTech = (totalTech / validCount) * 10;
    const avgComm = (totalComm / validCount) * 10;
    const avgProb = (totalProb / validCount) * 10;
    
    const overallScore = Math.round((avgTech + avgComm + avgProb) / 3);

    const skills = [
      { name: 'Technical', score: Math.round(avgTech), lastScore: Math.round(lastTech * 10), color: 'bg-blue-500', icon: '💻' },
      { name: 'Communication', score: Math.round(avgComm), lastScore: Math.round(lastComm * 10), color: 'bg-purple-500', icon: '💬' },
      { name: 'Problem Solving', score: Math.round(avgProb), lastScore: Math.round(lastProb * 10), color: 'bg-emerald-500', icon: '🧠' }
    ];

    const sortedSkills = [...skills].sort((a, b) => b.score - a.score);
    const strongest = sortedSkills[0];
    const weakest = sortedSkills[2];

    return { overallScore, skills, strongest, weakest };
  })();

  const getScoreConfig = (score: number) => {
    if (score >= 90) return { color: "emerald", label: "EXCELLENT MATCH", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", fill: "bg-emerald-500", glow: "hover:shadow-emerald-500/20" };
    if (score >= 75) return { color: "blue", label: "GOOD MATCH", bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", fill: "bg-blue-500", glow: "hover:shadow-blue-500/20" };
    if (score >= 60) return { color: "amber", label: "PARTIAL MATCH", bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", fill: "bg-amber-500", glow: "hover:shadow-amber-500/20" };
    return { color: "red", label: "LOW MATCH", bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", fill: "bg-red-500", glow: "hover:shadow-red-500/20" };
  };


  const validAtsScores = atsChecks.map(c => c.ats_breakdown?.overall_score || 0).filter(s => s > 0);
  const avgAtsScore = validAtsScores.length > 0 ? Math.round(validAtsScores.reduce((a, b) => a + b, 0) / validAtsScores.length) : 0;
  const bestAtsScore = validAtsScores.length > 0 ? Math.max(...validAtsScores) : 0;

// --- Custom Tooltips ---
const TrendTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-xl shadow-2xl min-w-[120px]">
        <p className="text-zinc-200 text-xs font-semibold mb-1">{label}</p>
        <p className="text-emerald-400 text-sm font-bold">Score: {payload[0].value}/10</p>
      </div>
    );
  }
  return null;
};

const TopicTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-xl shadow-2xl max-w-[200px]">
        <p className="text-zinc-200 text-xs font-semibold mb-1 leading-snug">{label}</p>
        <p className="text-red-400 text-sm font-bold">Mentions: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

// --- End Custom Tooltips ---

  return (
    <SidebarLayout>
      <div className="text-white p-6 sm:p-12">
        <div className="max-w-5xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-8 border-b border-zinc-800">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
              <p className="text-zinc-400">Track your interview progress and analyze your resumes.</p>
            </div>
            
            <button
              onClick={() => router.push(activeTab === 'ats' ? "/upload?mode=ats" : "/upload")}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20"
            >
              <Plus className="w-5 h-5" />
              {activeTab === 'ats' ? 'New ATS Check' : 'New Mock Interview'}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-zinc-800 pb-px">
            <button
              onClick={() => setActiveTab("interviews")}
              className={`pb-4 px-2 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === "interviews" 
                  ? "border-indigo-500 text-indigo-400" 
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Mock Interviews
            </button>
            <button
              onClick={() => setActiveTab("ats")}
              className={`pb-4 px-2 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === "ats" 
                  ? "border-indigo-500 text-indigo-400" 
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              ATS Checks
            </button>
          </div>

          {activeTab === "interviews" && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Analytics Section */}
              {completedInterviews.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Score Trend Chart */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl flex flex-col h-full min-h-[380px]">
              <div className="mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <LineChartIcon className="w-5 h-5 text-indigo-400" /> Score Trend
                </h2>
                <p className="text-zinc-500 text-sm mt-1 ml-7">Your performance over time</p>
              </div>
              <div className="flex-1 w-full flex flex-col" style={{ minWidth: 0, minHeight: 0 }}>
                {scoreData.length > 1 ? (
                  <>
                    <div className="flex-1 min-h-[200px]">
                      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <LineChart data={scoreData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                          <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis domain={[0, 10]} stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                          <RechartsTooltip content={<TrendTooltip />} />
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#8b5cf6" 
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#18181b', strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: '#8b5cf6' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Improvement Banner */}
                    <div className="mt-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4 hover:bg-zinc-800/80 transition-colors">
                      <div className={`px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold ${
                        scoreData[scoreData.length - 1].score >= scoreData[scoreData.length - 2].score 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        <ArrowRight className={`w-4 h-4 ${scoreData[scoreData.length - 1].score >= scoreData[scoreData.length - 2].score ? '-rotate-45' : 'rotate-45'}`} /> 
                        {Math.abs(scoreData[scoreData.length - 1].score - scoreData[scoreData.length - 2].score).toFixed(1)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Improvement</p>
                        <p className="text-xs text-zinc-500">from last interview</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                    Complete at least 2 interviews to see your trend.
                  </div>
                )}
              </div>
            </div>

            {/* Weak Topics Chart */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl flex flex-col h-full min-h-[380px]">
              <div className="mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <AlertTriangle className="w-5 h-5 text-red-500" /> Top Weaknesses
                </h2>
                <p className="text-zinc-500 text-sm mt-1 ml-7">Areas that need more focus</p>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                {topicData.length > 0 ? (
                  <div className="space-y-4 w-full mb-6 mt-2">
                    {(() => {
                      const maxCount = Math.max(...topicData.map(t => t.count), 5);
                      const styleMap = {
                        red: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30', fill: 'bg-red-500' },
                        amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30', fill: 'bg-amber-500' },
                        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30', fill: 'bg-emerald-500' }
                      };

                      return topicData.slice(0, 3).map((topic, index) => {
                        const percentage = Math.round((topic.count / Math.max(1, completedInterviews.length)) * 100) || Math.round((topic.count / maxCount) * 100);
                        
                        let severity = "Low";
                        let colorKey: "red" | "amber" | "emerald" = "emerald";
                        if (index === 0 || percentage >= 70) {
                          severity = "High";
                          colorKey = "red";
                        } else if (index === 1 || percentage >= 40) {
                          severity = "Medium";
                          colorKey = "amber";
                        }
                        const c = styleMap[colorKey];

                        const tLower = topic.topic.toLowerCase();
                        let Icon = Code;
                        let subtitle = "General technical area";
                        if (tLower.includes('sql') || tLower.includes('database')) {
                          Icon = Database;
                          subtitle = "Query optimization, joins";
                        } else if (tLower.includes('behavioral') || tLower.includes('communication') || tLower.includes('leadership')) {
                          Icon = Users;
                          subtitle = "STAR method, structuring";
                        } else if (tLower.includes('devops') || tLower.includes('deployment') || tLower.includes('cloud')) {
                          Icon = InfinityIcon;
                          subtitle = "CI/CD, monitoring";
                        }

                        return (
                          <div key={topic.topic} className="bg-black/20 border border-zinc-800 rounded-2xl p-4 relative group hover:bg-black/40 transition-colors">
                            <div className="flex gap-4 mb-4">
                              <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
                                <Icon className={`w-6 h-6 ${c.text}`} />
                              </div>
                              <div className="flex-1 flex justify-between">
                                <div>
                                  <h3 className="font-bold text-white text-base leading-tight">{topic.topic}</h3>
                                  <p className="text-zinc-500 text-xs mt-1 leading-snug pr-2">{subtitle}</p>
                                </div>
                                <div className="text-right flex flex-col items-end justify-between">
                                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${c.border} ${c.text} mb-1`}>
                                    {severity}
                                  </span>
                                  <span className={`font-bold text-lg ${c.text}`}>{percentage}%</span>
                                </div>
                              </div>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 1, delay: 0.2 * index, ease: "easeOut" }}
                                className={`h-full ${c.fill} rounded-full`}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                    <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                      <AlertTriangle className="w-8 h-8 text-zinc-500" />
                    </div>
                    <p className="text-zinc-300 font-medium mb-2">No weaknesses recorded</p>
                    <p className="text-zinc-500 text-sm">Keep up the good work!</p>
                  </div>
                )}

                {/* Bottom Banner */}
                {topicData.length > 0 && (
                  <button onClick={() => router.push('/upload')} className="mt-auto w-full text-left bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex items-center justify-between hover:bg-indigo-500/10 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-500/10 p-2 rounded-lg shrink-0">
                        <Lightbulb className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-indigo-300">Focus on {topicData[0].topic}</p>
                        <p className="text-xs text-indigo-400/70">This is your top priority area</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
                  </button>
                )}
              </div>
            </div>

            {/* Skill Averages Card Redesign */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl flex flex-col h-full min-h-[380px]">
              <div className="mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <Target className="w-5 h-5 text-indigo-400" /> Skill Averages
                </h2>
                <p className="text-zinc-500 text-sm mt-1 ml-7">Your average scores by skill</p>
              </div>
              
              {!skillData ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                    <BrainCircuit className="w-8 h-8 text-zinc-500" />
                  </div>
                  <p className="text-zinc-300 font-medium mb-2">No interview data yet.</p>
                  <p className="text-zinc-500 text-sm">Complete your first interview to see your skill profile.</p>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col flex-1"
                >
                  {/* Overall Score */}
                  <div className="text-center mb-8">
                    <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4">Overall Skill Score</p>
                    <div className="relative flex items-center justify-center w-28 h-28 mx-auto">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-800" />
                        <motion.circle
                          cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" fill="transparent"
                          strokeDasharray={2 * Math.PI * 48}
                          initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 48 - (skillData.overallScore / 100) * (2 * Math.PI * 48) }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="text-indigo-500"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-white">{skillData.overallScore}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bars */}
                  <div className="space-y-5 mb-8">
                    {skillData.skills.map((skill, index) => {
                      const diff = skill.score - skill.lastScore;
                      const diffText = diff > 0 ? `Improved +${diff}%` : diff < 0 ? `Declined ${diff}%` : `No change`;
                      const diffColor = diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-zinc-400';

                      return (
                      <div key={skill.name} className="group relative">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                            <span>{skill.icon}</span> {skill.name}
                          </span>
                          <span className="text-sm font-bold text-white">{skill.score}%</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${skill.score}%` }}
                            transition={{ duration: 0.8, delay: 0.2 + index * 0.1, ease: "easeOut" }}
                            className={`h-full ${skill.color} rounded-full group-hover:brightness-110 transition-all`}
                          />
                        </div>
                        {/* Hover Tooltip */}
                        <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 px-4 py-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-max">
                          <div className="flex gap-6">
                            <div>
                              <p className="text-xs text-zinc-400 mb-1">Current</p>
                              <p className="text-sm font-bold text-white">{skill.score}%</p>
                            </div>
                            {completedInterviews.length > 1 && (
                              <>
                                <div className="w-px bg-zinc-700"></div>
                                <div>
                                  <p className="text-xs text-zinc-400 mb-1">Last Session</p>
                                  <p className="text-sm font-bold text-white">{skill.lastScore}%</p>
                                </div>
                                <div className="w-px bg-zinc-700"></div>
                                <div className="flex items-center">
                                  <p className={`text-xs font-bold ${diffColor}`}>{diffText}</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )})}
                  </div>

                  {/* AI Insight Section */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.4 }}
                    className="mt-auto bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex gap-4 items-start"
                  >
                    <div className="bg-indigo-500/10 p-2 rounded-lg shrink-0 mt-1">
                      <Award className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-indigo-300 mb-1">Your Strongest Area</p>
                      <p className="text-xs text-indigo-200/70 leading-relaxed pr-2">
                        {skillData.strongest.name} is your strongest area. Keep it up!
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </div>
        )}

              {/* Stats & History */}
              <div>
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-400" /> Past Interviews
                </h2>
                
                {mockInterviews.length === 0 ? (
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-12 text-center">
                    <h3 className="text-xl font-semibold text-white mb-2">No interviews yet</h3>
                    <p className="text-zinc-400 max-w-md mx-auto mb-6">
                      You haven't completed any mock interviews. Click the button below to start your first session and unlock analytics!
                    </p>
                    <button
                      onClick={() => router.push("/upload")}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-full font-medium transition-colors shadow-lg"
                    >
                      Start First Session
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mockInterviews.map((interview) => (
                      <div key={interview.id} className="bg-zinc-900/40 hover:bg-zinc-900/70 transition-colors border border-zinc-800 p-6 rounded-3xl flex flex-col justify-between group">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${interview.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                              {interview.status === 'completed' ? 'COMPLETED' : 'IN PROGRESS'}
                            </span>
                            <span className="text-zinc-500 text-xs font-medium">
                              {new Date(interview.started_at).toLocaleDateString()}
                            </span>
                          </div>
                          {interview.report?.score > 0 && (
                            <div className="mb-4">
                              <span className="text-3xl font-black text-white">{interview.report.score}</span>
                              <span className="text-zinc-500 font-medium">/10</span>
                            </div>
                          )}
                          {interview.report?.readiness_label && (
                            <h3 className="text-lg font-bold mb-2 text-indigo-300">{interview.report.readiness_label}</h3>
                          )}
                          {interview.report?.summary && (
                            <p className="text-zinc-400 text-sm line-clamp-3 mb-4 leading-relaxed">
                              {interview.report.summary}
                            </p>
                          )}
                          
                          {interview.status === 'in_progress' && (
                            <div className="mt-4 flex flex-col items-start gap-4">
                              <p className="text-zinc-400 text-sm leading-relaxed">
                                This interview session is currently in progress. Resume to finish answering questions and get your evaluation.
                              </p>
                              <button
                                onClick={() => router.push(`/interview?session_id=${interview.id}`)}
                                className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/20 px-4 py-2 rounded-lg text-sm font-semibold transition-colors mt-auto"
                              >
                                Resume Interview
                              </button>
                            </div>
                          )}

                          {interview.status === 'completed' && (
                            <div className="mt-4 flex flex-col xl:flex-row gap-2">
                              <button
                                onClick={() => router.push(`/report?session_id=${interview.id}`)}
                                className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/20 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-1 text-center"
                              >
                                Report
                              </button>
                              <button
                                onClick={() => router.push(`/transcript?session_id=${interview.id}`)}
                                className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/20 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-1 text-center"
                              >
                                Transcript
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {interview.report?.weak_topics && interview.report.weak_topics.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-zinc-800/50 group-hover:border-zinc-700 transition-colors">
                            <p className="text-[10px] text-zinc-500 mb-2 font-bold uppercase tracking-widest">Focus Areas</p>
                            <div className="flex flex-wrap gap-2">
                              {interview.report.weak_topics.slice(0, 2).map((topic: string, i: number) => (
                                <span key={i} className="px-2.5 py-1 bg-red-500/5 text-red-300/80 border border-red-500/10 rounded-lg text-xs font-medium">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "ats" && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {atsChecks.length === 0 ? (
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-12 text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">No ATS Checks</h3>
                  <p className="text-zinc-400 max-w-md mx-auto mb-6">
                    You haven't performed any ATS analysis checks yet. Upload a resume to get started.
                  </p>
                  <button
                    onClick={() => router.push("/upload")}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-full font-medium transition-colors shadow-lg"
                  >
                    Analyze Resume
                  </button>
                </div>
              ) : (
                <>
                  {/* Top Analytics */}
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 mb-8">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                      <Award className="w-5 h-5 text-indigo-400" /> ATS Analytics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-black/40 rounded-2xl border border-zinc-800 gap-2">
                        <span className="text-zinc-400 font-medium">Total Analyses</span>
                        <span className="text-3xl font-bold text-white">{atsChecks.length}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-black/40 rounded-2xl border border-zinc-800 gap-2">
                        <span className="text-zinc-400 font-medium">Average Score</span>
                        <span className="text-3xl font-bold text-indigo-400">{avgAtsScore}%</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-black/40 rounded-2xl border border-zinc-800 gap-2">
                        <span className="text-zinc-400 font-medium">Best Score</span>
                        <span className="text-3xl font-bold text-emerald-400">{bestAtsScore}%</span>
                      </div>
                    </div>
                  </div>

                  {/* History List */}
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                      <History className="w-5 h-5 text-zinc-400" /> Recent Analyses
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {atsChecks.map(check => (
                        <AtsCard key={check.id} check={check} isFeatured={false} router={router} getScoreConfig={getScoreConfig} />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
      <BackToTop />
    </SidebarLayout>
  );
}

// --- ATS Card Component ---
function AtsCard({ check, isFeatured, router, getScoreConfig }: { check: any, isFeatured: boolean, router: any, getScoreConfig: any }) {
  const breakdown = check.ats_breakdown;
  const score = breakdown?.overall_score || 0;
  const config = getScoreConfig(score);
  
  // Basic mock job title extraction or fallback
  const jobTitle = "Job Description Match";

  return (
    <div 
      className={`group relative bg-zinc-900/40 border border-zinc-800 rounded-3xl flex flex-col justify-between overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:bg-zinc-900/80 hover:shadow-xl hover:border-zinc-700 ${config.glow} ${isFeatured ? 'h-full' : ''}`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-1.5 ${config.bg} ${config.text} ${config.border} border`}>
            <div className={`w-2 h-2 rounded-full ${config.fill} animate-pulse`} />
            {config.label}
          </span>
          <span className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium bg-black/30 px-3 py-1 rounded-full">
            <Calendar className="w-3 h-3" /> {new Date(check.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        </div>

        {/* Score & Title */}
        <div className="flex items-end gap-4 mb-8">
          <div className="flex items-start">
            <span className={`text-5xl font-black ${config.text}`}>{score}</span>
            <span className="text-xl font-bold text-zinc-500 mt-1">%</span>
          </div>
          <div className="pb-1">
            <h3 className="text-lg font-bold text-white leading-tight">{jobTitle}</h3>
            <p className="text-sm text-zinc-400 mt-0.5">Resume vs JD</p>
          </div>
        </div>

        {/* Detailed Breakdown Bars */}
        {breakdown && (
          <div className="space-y-4 mb-8">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-zinc-400">Skills Match</span>
                <span className="text-zinc-300">{breakdown.skill_score}/30</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full ${config.fill} transition-all duration-1000`} style={{ width: `${(breakdown.skill_score / 30) * 100}%` }} />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-zinc-400">Semantic</span>
                <span className="text-zinc-300">{breakdown.semantic_score}/40</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full ${config.fill} transition-all duration-1000`} style={{ width: `${(breakdown.semantic_score / 40) * 100}%` }} />
              </div>
            </div>

            {isFeatured && (
              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-zinc-400">Experience</span>
                  <span className="text-zinc-300">{breakdown.experience_score}/15</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full ${config.fill} transition-all duration-1000`} style={{ width: `${(breakdown.experience_score / 15) * 100}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Missing Skills */}
        {breakdown?.missing_skills && breakdown.missing_skills.length > 0 && (
          <div className="mb-6 pt-6 border-t border-zinc-800">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Missing Skills
            </p>
            <div className="flex flex-wrap gap-2">
              {breakdown.missing_skills.slice(0, isFeatured ? 5 : 3).map((skill: string, i: number) => (
                <span key={i} className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 text-xs font-medium">
                  {skill}
                </span>
              ))}
              {breakdown.missing_skills.length > (isFeatured ? 5 : 3) && (
                <span className="px-2.5 py-1 rounded-md bg-zinc-800/50 text-zinc-500 text-xs font-medium">
                  +{breakdown.missing_skills.length - (isFeatured ? 5 : 3)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="p-6 pt-0 mt-auto">
        <button
          onClick={() => router.push(`/analysis?session_id=${check.id}&mode=ats`)}
          className={`w-full bg-zinc-800/50 text-white hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 group-hover:bg-zinc-800`}
        >
          View Detailed Report <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
