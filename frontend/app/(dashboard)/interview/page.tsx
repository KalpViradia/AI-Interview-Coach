"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, CheckCircle, AlertCircle, ArrowRight, BrainCircuit, Mic, MicOff, Volume2, VolumeX, FastForward, Activity, LogOut, X, SkipForward } from "lucide-react";
import { submitAnswer, getSessionState, getSessionTranscript, Question, Evaluation, SessionReport, TranscriptTurn, APIError } from "@/lib/api-client";
import ReactMarkdown from "react-markdown";
import { InterviewSkeleton } from "@/components/Skeletons";
import { useDialog } from "@/components/ui/dialog/useDialog";
import { PostAnswerReview } from "@/components/interview/PostAnswerReview";
import { AnswerEvaluationCard } from "@/components/interview/AnswerEvaluationCard";
import { IdealAnswerCard } from "@/components/interview/IdealAnswerCard";
import { workflowState } from "@/lib/workflow-state";
import { useRateLimit } from "@/components/providers/RateLimitProvider";

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
  const { status, isPaused, resumeAutoRetry } = useRateLimit();
  // Track whether current question's answer has been submitted
  const [hasSubmittedCurrent, setHasSubmittedCurrent] = useState(false);
  const [showPausedModal, setShowPausedModal] = useState(false);

  useEffect(() => {
    if (showPausedModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showPausedModal]);

  useEffect(() => {
    if (!isPaused) {
      setShowPausedModal(false);
    }
  }, [isPaused]);

  const handleAction = (actionFn: () => void) => {
    if (status === "retrying") return; // Do nothing if auto-retrying
    if (isPaused) {
      setShowPausedModal(true);
      return;
    }
    actionFn();
  };

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

        if (state.is_complete || state.status === "COMPLETED") {
          workflowState.isActive = false;
          router.replace(`/report?session_id=${sessionId}`);
        } else if (state.next_question) {
          setQuestion(state.next_question);
          setQuestionNumber(Math.max(1, state.turn_count));
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

  // Handle workflow state, beforeunload & SPA back button
  useEffect(() => {
    if (!loading && !isComplete && sessionId) {
      workflowState.isActive = true;
      workflowState.isPaused = isPaused;
      
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = "";
        return "";
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      
      // SPA Back Button Trap
      // Next.js App Router doesn't have route change events we can block,
      // so we use history API directly.
      window.history.pushState(null, "", window.location.href);
      
      const handlePopState = () => {
        // We've popped the dummy state, so push it back immediately to stay on page
        window.history.pushState(null, "", window.location.href);
        
        showConfirm({
          title: "Interrupt Interview?",
          message: "You currently have an interview in progress. Leaving now will end the session, and any unanswered questions will be lost. This action cannot be undone.",
          confirmText: "Leave Interview",
          cancelText: "Stay & Continue",
          cancelVariant: "primary",
          onConfirm: () => {
            workflowState.isActive = false;
            workflowState.isPaused = false;
            window.removeEventListener("popstate", handlePopState);
            router.back();
          }
        });
      };
      
      window.addEventListener("popstate", handlePopState);
      
      return () => {
        workflowState.isActive = false;
        workflowState.isPaused = false;
        window.removeEventListener("beforeunload", handleBeforeUnload);
        window.removeEventListener("popstate", handlePopState);
      };
    } else {
      workflowState.isActive = false;
      workflowState.isPaused = false;
    }
  }, [loading, isComplete, sessionId, isPaused, showConfirm, router]);

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

  const questionsAnswered = questionNumber - 1 + (hasSubmittedCurrent ? 1 : 0);
  const totalQuestions = 10;
  const questionsRemaining = totalQuestions - questionsAnswered;

  if (loading || !question) {
    return (
      <div className="min-h-full bg-black flex flex-col w-full">
        {/* Skeleton MIDDLE CANVAS */}
        <div className="flex-1 flex flex-col w-full max-w-[1200px] mx-auto px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="h-8 w-48 bg-zinc-800 rounded mb-2 animate-pulse" />
              <div className="h-4 w-24 bg-zinc-900 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-20 bg-zinc-800 rounded-full animate-pulse" />
              <div className="h-10 w-10 bg-zinc-800 rounded-full animate-pulse" />
            </div>
          </div>
          
          {/* Progress Card Skeleton */}
          <div className="mb-7 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 animate-pulse h-16" />
          
          {/* Question Skeleton */}
          <div className="mb-8">
            <div className="h-4 w-32 bg-zinc-800 rounded mb-4 animate-pulse" />
            <div className="h-6 w-full max-w-3xl bg-zinc-800 rounded mb-2 animate-pulse" />
            <div className="h-6 w-full max-w-2xl bg-zinc-800 rounded animate-pulse" />
          </div>

          <div className="flex-1 flex flex-col min-h-[400px]">
            <div className="flex flex-col flex-1">
              <div className="flex-1 w-full rounded-2xl bg-zinc-900/30 border border-zinc-800/50 animate-pulse" />
              <div className="mt-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 animate-pulse h-16" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const difficultyConfig = {
    1: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Easy" },
    2: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Easy" },
    3: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Medium" },
    4: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "Hard" },
    5: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "Hard" }
  }[question.difficulty] || { color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/20", label: "Medium" };

  return (
    <>
      <div className="min-h-full bg-black flex flex-col w-full">

        {/* MIDDLE CANVAS: Main Interview */}
        <div className="flex-1 flex flex-col w-full max-w-[1200px] mx-auto px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-end mb-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">SkillMock</h1>
              <p className="text-sm text-zinc-400">Practice Mode</p>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${difficultyConfig.bg} ${difficultyConfig.color} ${difficultyConfig.border} border`}>
                Difficulty: {difficultyConfig.label}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleAction(() => {
                  if (isTtsEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
                  setIsTtsEnabled(!isTtsEnabled);
                })}
                className={`p-2 rounded-full border transition-colors flex items-center justify-center ${status !== "idle" ? "opacity-50 cursor-not-allowed" : ""} ${isTtsEnabled ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                title={isTtsEnabled ? "Mute AI Voice" : "Enable AI Voice"}
              >
                {isTtsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              
              <button
                onClick={() => handleAction(handleEndInterviewClick)}
                disabled={isAIThinking || loading}
                className={`flex items-center gap-2 p-2 px-4 rounded-full border bg-zinc-900 border-zinc-800 text-red-400 transition-colors disabled:opacity-50 ${status !== "idle" ? "opacity-50 cursor-not-allowed" : "hover:bg-red-500/10 hover:border-red-500/20"}`}
                title="End Interview"
              >
                <LogOut className="w-4 h-4" /> <span className="text-sm font-bold hidden sm:inline">Exit</span>
              </button>
            </div>
          </div>

          {/* Progress Bar (Visible on all screens) */}
          <div className="mb-7 space-y-4">
            <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 shadow-md">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                <span className="text-sm font-bold text-white tracking-wide">Live Score: <span className="text-lg text-indigo-300 ml-1">{currentScore}</span><span className="text-zinc-500 font-medium">/10</span></span>
              </div>
              <div className="text-sm font-bold text-zinc-400 bg-black/40 px-3 py-1 rounded-full border border-zinc-800">
                Q {questionNumber} / {totalQuestions}
              </div>
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 -mx-1 w-[calc(100%+8px)]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {[...Array(10)].map((_, i) => {
                const stepNum = i + 1;
                const isPast = stepNum < questionNumber;
                const isCurrent = stepNum === questionNumber;
                
                const turnData = transcript.find(t => t.order_index === stepNum);
                let scoreText = "- / 10";
                let statusClasses = "bg-zinc-900 border-zinc-800 text-zinc-500 opacity-40";
                
                if (isPast) {
                  if (turnData?.answer === "[SKIPPED]" || turnData?.answer === "__SKIP__") {
                    scoreText = "Skipped";
                    statusClasses = "bg-zinc-800/50 border-zinc-700 text-zinc-400";
                  } else if (turnData?.evaluation) {
                    const score = turnData.evaluation.score;
                    scoreText = `${score} / 10`;
                    if (score >= 8) {
                      statusClasses = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
                    } else if (score >= 5) {
                      statusClasses = "bg-amber-500/10 border-amber-500/30 text-amber-400";
                    } else {
                      statusClasses = "bg-red-500/10 border-red-500/30 text-red-400";
                    }
                  } else {
                     statusClasses = "bg-zinc-800 border-zinc-700 text-zinc-400";
                  }
                } else if (isCurrent) {
                  scoreText = "- / 10";
                  statusClasses = "bg-indigo-500/10 border-indigo-500/40 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/50";
                }

                return (
                  <div key={i} className={`flex-1 min-w-[70px] flex flex-col items-center justify-center py-2 rounded-xl border transition-all duration-300 ${statusClasses}`}>
                    <span className="text-[10px] font-semibold uppercase tracking-widest opacity-70 mb-0.5">Q{stepNum}</span>
                    <span className="text-sm font-bold tracking-tight">{scoreText}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question Area */}
          <div className="mb-8">
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
                  <div
                    className={`flex-1 flex flex-col w-full relative ${status !== "idle" ? "opacity-50" : ""}`}
                    onClick={() => {
                      if (status === "paused") setShowPausedModal(true);
                    }}
                  >
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      disabled={status !== "idle"}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && e.ctrlKey && answer.trim()) {
                          e.preventDefault();
                          handleAction(() => handleSubmit(false));
                        }
                      }}
                      placeholder="Type your answer here... (Ctrl+Enter to submit)"
                      className="flex-1 w-full p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-zinc-200 focus:border-indigo-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500/50 transition-all outline-none resize-none placeholder:text-zinc-600 text-lg leading-relaxed shadow-inner disabled:cursor-not-allowed"
                    />
                  </div>
                  {error && <p className="text-red-400 text-sm mt-3 px-2">{error}</p>}

                  {/* Action Bar */}
                  <div className="flex justify-between items-center mt-6 p-2 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                    <button
                      onClick={() => handleAction(() => handleSubmit(true))}
                      className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-400 transition-all ${status !== "idle" ? "opacity-50 cursor-not-allowed" : "hover:text-white hover:bg-zinc-800"}`}
                    >
                      <FastForward className="w-4 h-4" /> Skip
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleAction(() => handleSubmit(false))}
                        disabled={!answer.trim() && status === "idle"}
                        className={`flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-black transition-all disabled:opacity-50 disabled:hover:bg-white shadow-[0_0_20px_rgba(255,255,255,0.1)] ${status !== "idle" ? "opacity-50 cursor-not-allowed" : "hover:bg-zinc-200 active:scale-95 cursor-pointer"}`}
                      >
                        Submit <Send className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* ── EVALUATION RESULT ── */
                <PostAnswerReview>
                  <AnswerEvaluationCard evaluation={evaluation} />
                  
                  {evaluation.ideal_answer && (
                    <IdealAnswerCard idealAnswer={evaluation.ideal_answer} />
                  )}

                  <div className="flex justify-end mt-2 mb-8 pb-4">
                    <button
                      onClick={() => handleAction(handleNext)}
                      className={`flex items-center gap-2 rounded-xl bg-white text-black px-8 py-4 text-sm font-bold transition-all shadow-lg ${status !== "idle" ? "opacity-50 cursor-not-allowed" : "hover:bg-zinc-200 hover:scale-105 active:scale-95"}`}
                    >
                      {isComplete ? "View Final Report" : "Next Question"}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </PostAnswerReview>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Root Level Fixed Paused Modal Overlay */}
      <AnimatePresence>
        {showPausedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl relative">
              <button 
                onClick={() => setShowPausedModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mx-auto w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mb-4 mt-2">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Interview Paused</h3>
              <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                The AI service is temporarily unavailable. Your interview progress is safely preserved. You can wait here, or leave and resume later.
              </p>
              <button
                onClick={() => {
                  resumeAutoRetry();
                  setShowPausedModal(false);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                Resume Auto-Retry
              </button>
              <button
                onClick={() => setShowPausedModal(false)}
                className="w-full bg-transparent hover:bg-zinc-800 text-zinc-300 py-3 mt-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Keep Paused
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<InterviewSkeleton />}>
      <InterviewContent />
    </Suspense>
  );
}

