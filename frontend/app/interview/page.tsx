"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, CheckCircle, AlertCircle, ArrowRight, BrainCircuit, Mic, MicOff, Volume2, VolumeX, FastForward, Activity, LogOut, X, SkipForward } from "lucide-react";
import { submitAnswer, getSessionState, getSessionTranscript, Question, Evaluation, SessionReport, TranscriptTurn } from "@/lib/api-client";
import ReactMarkdown from "react-markdown";
import SidebarLayout from "@/components/SidebarLayout";
import { InterviewSkeleton } from "@/components/Skeletons";
import { useDialog } from "@/components/ui/dialog/useDialog";

// Sequential loading stages (never loops)
const THINKING_STAGES = [
  "Analyzing your answer...",
  "Comparing with ideal answer...",
  "Evaluating technical accuracy...",
  "Generating personalized feedback...",
];

const ENDING_STAGES = [
  "Ending interview...",
  "Saving completed responses...",
  "Calculating overall performance...",
  "Generating interview report...",
];

const SKIPPING_STAGES = [
  "Skipping question...",
  "Updating interview progress...",
  "Preparing next question...",
  "Generating next personalized question...",
];

function InterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [report, setReport] = useState<SessionReport | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [nextQuestion, setNextQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isTtsEnabled, setIsTtsEnabled] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [thinkingMessage, setThinkingMessage] = useState(THINKING_STAGES[0]);

  const { showConfirm } = useDialog();
  // Track whether current question's answer has been submitted
  const [hasSubmittedCurrent, setHasSubmittedCurrent] = useState(false);

  // Sequential thinking messages (no looping)
  useEffect(() => {
    if (!isAIThinking) return;

    const stages = isEnding ? ENDING_STAGES : (isSkipping ? SKIPPING_STAGES : THINKING_STAGES);
    let idx = 0;
    setThinkingMessage(stages[0]);

    const interval = setInterval(() => {
      idx += 1;
      if (idx < stages.length) {
        setThinkingMessage(stages[idx]);
      } else {
        clearInterval(interval);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isAIThinking, isEnding]);

  // Text-to-Speech Effect
  useEffect(() => {
    if (question && isTtsEnabled && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(question.text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, [question, isTtsEnabled]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!sessionId) {
      router.replace("/upload");
      return;
    }

    const fetchData = async () => {
      try {
        const [state, transcriptData] = await Promise.all([
          getSessionState(sessionId),
          getSessionTranscript(sessionId).catch(() => [] as TranscriptTurn[])
        ]);

        setTranscript(transcriptData);

        if (state.is_complete) {
          router.replace(`/report?session_id=${sessionId}`);
        } else if (state.next_question) {
          setQuestion(state.next_question);
          setQuestionNumber(state.turn_count);
        } else {
          router.replace("/upload");
        }
      } catch (err) {
        console.error("Failed to fetch session state from backend:", err);
        router.replace("/upload");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId, router]);

  // Derived state for Live Score Panel
  const completedEvaluations = transcript.filter(t => t.evaluation).map(t => t.evaluation!);
  const currentScore = completedEvaluations.length > 0
    ? (completedEvaluations.reduce((acc, curr) => acc + curr.score, 0) / completedEvaluations.length).toFixed(1)
    : "-";

  const handleSubmit = async (isSkip = false) => {
    if (!isSkip && !answer.trim()) return;
    if (!sessionId) return;

    setIsAIThinking(true);
    setIsEnding(false);
    setIsSkipping(isSkip);
    setThinkingMessage(isSkip ? SKIPPING_STAGES[0] : THINKING_STAGES[0]);
    setError("");

    try {
      const response = await submitAnswer(sessionId, isSkip ? "__SKIP__" : answer);
      setEvaluation(response.evaluation || null);
      setNextQuestion(response.next_question || null);
      setIsComplete(response.is_complete);
      setHasSubmittedCurrent(true);
      if (response.report) setReport(response.report);

      // Update transcript locally so live score updates
      if (question && response.evaluation) {
        setTranscript(prev => [...prev, {
          question: question.text,
          topic: question.topic,
          difficulty: question.difficulty,
          order_index: questionNumber,
          answer: isSkip ? "[SKIPPED]" : answer,
          evaluation: {
            score: response.evaluation!.score || 0,
            strengths: response.evaluation!.strengths,
            weaknesses: response.evaluation!.weaknesses,
            feedback: response.evaluation!.suggestion
          }
        }]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit answer.");
    } finally {
      setIsAIThinking(false);
    }
  };

  // --- End Interview: 3 scenarios ---
  const handleEndInterviewClick = () => {
    if (!sessionId) return;

    // Scenario 2: Currently evaluating (AI is thinking after submit)
    // Don't show dialog, let it finish. The "End Interview" button is already disabled.
    if (isAIThinking) return;

    // Scenario 3: Interview already finished
    if (isComplete && report) {
      sessionStorage.setItem(`report_${sessionId}`, JSON.stringify(report));
      router.push(`/report?session_id=${sessionId}`);
      return;
    }

    // Scenario 1: Current question not yet submitted → show confirmation
    showConfirm({
      title: "End Interview?",
      message: `You have completed ${questionsAnswered} of ${totalQuestions} questions.\n\nEnding now will:\n• Save your interview progress\n• Generate your interview report\n• Mark ${questionsRemaining} remaining question(s) as skipped\n\n${!hasSubmittedCurrent ? 'The current question has not been submitted.' : ''}`,
      confirmText: "End Interview",
      cancelText: "Continue Interview",
      onConfirm: handleConfirmEnd
    });
  };

  const handleConfirmEnd = async () => {
    if (!sessionId) return;
    setIsAIThinking(true);
    setIsEnding(true);
    setIsSkipping(false);
    setError("");

    try {
      const response = await submitAnswer(sessionId, "__END_INTERVIEW__");
      if (response.report) {
        sessionStorage.setItem(`report_${sessionId}`, JSON.stringify(response.report));
        router.push(`/report?session_id=${sessionId}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to end interview.");
      setIsAIThinking(false);
      setIsEnding(false);
    }
  };

  const handleNext = () => {
    if (isComplete && report && sessionId) {
      sessionStorage.setItem(`report_${sessionId}`, JSON.stringify(report));
      router.push(`/report?session_id=${sessionId}`);
    } else if (nextQuestion) {
      setQuestion(nextQuestion);
      setAnswer("");
      setEvaluation(null);
      setNextQuestion(null);
      setHasSubmittedCurrent(false);
      setQuestionNumber((prev) => prev + 1);
    }
  };

  const questionsAnswered = questionNumber - 1;
  const totalQuestions = 10;
  const questionsRemaining = totalQuestions - questionsAnswered;

  if (loading || !question) {
    return (
      <SidebarLayout>
        <div className="h-full min-h-screen bg-black flex flex-col xl:flex-row border-t border-zinc-900">
          {/* Skeleton LEFT SIDEBAR */}
          <div className="hidden xl:flex w-80 shrink-0 border-r border-zinc-900 bg-zinc-950/30 p-8 flex-col overflow-y-auto">
            <div className="flex-1">
              <div className="h-3 w-32 bg-zinc-800 rounded mb-8 animate-pulse" />
              <div className="space-y-6">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 opacity-50">
                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 animate-pulse" />
                    <div className="h-4 w-24 bg-zinc-900 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-8 mt-8 border-t border-zinc-900">
              <div className="h-3 w-24 bg-zinc-800 rounded mb-4 animate-pulse" />
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl mb-6 h-16 animate-pulse" />
              <div className="h-12 w-full rounded-xl bg-zinc-900 animate-pulse" />
            </div>
          </div>

          {/* Skeleton MIDDLE CANVAS */}
          <div className="flex-1 flex flex-col p-6 lg:p-12 h-[calc(100vh-2rem)] overflow-y-auto w-full max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <div className="h-8 w-48 bg-zinc-800 rounded mb-2 animate-pulse" />
                <div className="h-4 w-24 bg-zinc-900 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-20 bg-zinc-800 rounded-full animate-pulse" />
                <div className="h-10 w-10 bg-zinc-800 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="flex-1 flex flex-col min-h-[400px]">
              <div className="flex flex-col flex-1">
                <div className="flex-1 w-full rounded-2xl bg-zinc-900/30 border border-zinc-800/50 animate-pulse" />
                <div className="mt-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 animate-pulse h-16" />
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const difficultyConfig = {
    1: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "🟢 Easy" },
    2: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "🟢 Easy" },
    3: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "🟡 Medium" },
    4: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "🔴 Hard" },
    5: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "🔴 Hard" }
  }[question.difficulty] || { color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/20", label: "Medium" };

  return (
    <SidebarLayout>
      <div className="h-full min-h-screen bg-black flex flex-col xl:flex-row border-t border-zinc-900">

        {/* LEFT SIDEBAR: Progress */}
        <div className="hidden xl:flex w-80 shrink-0 border-r border-zinc-900 bg-zinc-950/30 p-8 flex-col overflow-y-auto">
          <div className="flex-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-8">Interview Progress</h3>
            <div className="space-y-6">
              {[...Array(10)].map((_, i) => {
                const stepNum = i + 1;
                const isPast = stepNum < questionNumber;
                const isCurrent = stepNum === questionNumber;
                return (
                  <div key={i} className={`flex items-center gap-4 transition-colors duration-300 ${isCurrent ? 'opacity-100' : isPast ? 'opacity-60' : 'opacity-30'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border
                      ${isPast ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                        isCurrent ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' :
                        'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>
                      {isPast ? <CheckCircle className="w-4 h-4" /> : stepNum}
                    </div>
                    <span className={`text-sm font-medium ${isCurrent ? 'text-white' : 'text-zinc-400'}`}>
                      Question {stepNum}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-zinc-900">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Live Score
            </h3>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-center mb-6">
              <div className="flex items-end justify-center gap-1">
                <span className="text-4xl font-black text-white">{currentScore}</span>
                <span className="text-lg font-bold text-zinc-600 mb-1">/10</span>
              </div>
            </div>

            <button
              onClick={handleEndInterviewClick}
              disabled={isAIThinking || loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-400 py-3 text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" /> End Interview
            </button>
          </div>
        </div>

        {/* MIDDLE CANVAS: Main Interview */}
        <div className="flex-1 flex flex-col p-6 lg:p-12 h-[calc(100vh-2rem)] overflow-y-auto w-full max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">AI Interview Coach</h1>
              <p className="text-sm text-zinc-400 mt-1">Practice Mode</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${difficultyConfig.bg} ${difficultyConfig.color} ${difficultyConfig.border} border`}>
                {difficultyConfig.label}
              </span>

              <button
                onClick={handleEndInterviewClick}
                disabled={isAIThinking || loading}
                className="p-2 rounded-full border bg-zinc-900 border-zinc-800 text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-colors xl:hidden"
                title="End Interview"
              >
                <LogOut className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (isTtsEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
                  setIsTtsEnabled(!isTtsEnabled);
                }}
                className={`p-2 rounded-full border transition-colors ${isTtsEnabled ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                title={isTtsEnabled ? "Mute AI Voice" : "Enable AI Voice"}
              >
                {isTtsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mobile Progress Bar (Visible only below xl) */}
          <div className="xl:hidden mb-8 space-y-4">
            <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 shadow-md">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                <span className="text-sm font-bold text-white tracking-wide">Live Score: <span className="text-lg text-indigo-300 ml-1">{currentScore}</span><span className="text-zinc-500 font-medium">/10</span></span>
              </div>
              <div className="text-sm font-bold text-zinc-400 bg-black/40 px-3 py-1 rounded-full border border-zinc-800">
                Q {questionNumber} / {totalQuestions}
              </div>
            </div>
            
            <div className="flex items-center gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {[...Array(10)].map((_, i) => {
                const stepNum = i + 1;
                const isPast = stepNum < questionNumber;
                const isCurrent = stepNum === questionNumber;
                return (
                  <div key={i} className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold border transition-all duration-300
                    ${isPast ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                      isCurrent ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' :
                      'bg-zinc-900 border-zinc-800 text-zinc-500 opacity-40'}`}>
                    {isPast ? <CheckCircle className="w-5 h-5" /> : stepNum}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question Area */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-3 h-3 rounded-full ${isTtsEnabled || isAIThinking ? 'bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.6)]' : 'bg-zinc-700'}`} />
              <span className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">{question.topic}</span>
            </div>
            <h2 className="text-2xl font-medium leading-relaxed text-zinc-100">
              {question.text}
            </h2>
          </div>

          {/* Interactive Area */}
          <div className="flex-1 flex flex-col min-h-[400px]">
            <AnimatePresence mode="wait">
              {isAIThinking ? (
                <motion.div
                  key="thinking"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center space-y-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8"
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(99,102,241,0.3)] ${isEnding ? 'bg-amber-500/20' : 'bg-indigo-500/20'}`}>
                    <motion.div
                      className={`w-10 h-10 rounded-full ${isEnding ? 'bg-amber-600' : 'bg-indigo-600'}`}
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={thinkingMessage}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className={`font-medium tracking-wide text-center ${isEnding ? 'text-amber-400' : 'text-indigo-400'}`}
                    >
                      {thinkingMessage}
                    </motion.p>
                  </AnimatePresence>
                </motion.div>
              ) : !evaluation ? (
                /* ── TEXT MODE UI ── */
                <motion.div
                  key="answer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col flex-1"
                >
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && e.ctrlKey && answer.trim()) {
                        e.preventDefault();
                        handleSubmit(false);
                      }
                    }}
                    placeholder="Type your answer here... (Ctrl+Enter to submit)"
                    className="flex-1 w-full p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-zinc-200 focus:border-indigo-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500/50 transition-all outline-none resize-none placeholder:text-zinc-600 text-lg leading-relaxed shadow-inner"
                  />
                  {error && <p className="text-red-400 text-sm mt-3 px-2">{error}</p>}

                  {/* Action Bar */}
                  <div className="flex justify-between items-center mt-6 p-2 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                    <button
                      onClick={() => handleSubmit(true)}
                      className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                    >
                      <FastForward className="w-4 h-4" /> Skip
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          handleSubmit(false);
                        }}
                        disabled={!answer.trim()}
                        className="flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-black transition-all hover:bg-zinc-200 active:scale-95 disabled:opacity-50 disabled:hover:bg-white cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                      >
                        Submit <Send className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* ── EVALUATION RESULT ── */
                <motion.div
                  key="evaluation"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col flex-1 space-y-6"
                >
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 shadow-xl">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">Evaluation</h3>
                        <p className="text-zinc-400 text-sm">Feedback on your response</p>
                      </div>
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <span className="text-2xl font-black text-indigo-400">{evaluation.score}</span>
                      </div>
                    </div>

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

                    {evaluation.ideal_answer && (
                      <div className="pt-8 border-t border-zinc-800">
                        <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4">Ideal Answer Approach</h4>
                        <div className="text-sm text-zinc-300 leading-relaxed bg-black/30 p-6 rounded-2xl border border-zinc-800/50 prose prose-invert prose-sm max-w-none break-words">
                          <ReactMarkdown>{evaluation.ideal_answer}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end mt-6 mb-8 pb-4">
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 rounded-xl bg-white text-black px-8 py-4 text-sm font-bold transition-all hover:bg-zinc-200 hover:scale-105 active:scale-95 shadow-lg"
                    >
                      {isComplete ? "View Final Report" : "Next Question"}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<InterviewSkeleton />}>
      <InterviewContent />
    </Suspense>
  );
}
