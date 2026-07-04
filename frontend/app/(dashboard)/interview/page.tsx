"use client";

import { useState, useEffect, Suspense, useReducer } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, AlertCircle, ArrowRight, Volume2, VolumeX, FastForward, Activity, LogOut, X } from "lucide-react";
import { submitAnswer, getSessionState, getSessionTranscript, Question, Evaluation, SessionReport, TranscriptTurn, AnswerSubmitResponse, SessionStateResponse } from "@/lib/api-client";
import { InterviewSkeleton } from "@/components/Skeletons";
import Shimmer from "@/components/ui/Shimmer";
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

type InterviewTurnStatus = "current" | "answered" | "skipped" | "queued";

interface InterviewTurnState {
  question: Question;
  answer: string | null;
  evaluation: Evaluation | null;
  status: InterviewTurnStatus;
}

interface InterviewSessionState {
  turns: InterviewTurnState[];
  currentIndex: number;
  isComplete: boolean;
  report: SessionReport | null;
}

type InterviewSessionAction =
  | { type: "initialize"; payload: InterviewSessionState }
  | {
      type: "submit-success";
      answer: string;
      isSkip: boolean;
      response: AnswerSubmitResponse;
    }
  | { type: "advance-to-next" };

function transcriptTurnToInterviewTurn(turn: TranscriptTurn): InterviewTurnState {
  const isSkipped = turn.answer === "[SKIPPED]" || turn.answer === "__SKIP__";
  const evaluation: Evaluation | null = turn.evaluation
    ? {
        question: turn.question,
        answer: turn.answer || "",
        score: turn.evaluation.score,
        strengths: turn.evaluation.strengths,
        weaknesses: turn.evaluation.weaknesses,
        suggestion: turn.evaluation.feedback,
      }
    : null;

  return {
    question: {
      text: turn.question,
      topic: turn.topic,
      difficulty: turn.difficulty,
    },
    answer: turn.answer,
    evaluation,
    status: isSkipped ? "skipped" : evaluation ? "answered" : "queued",
  };
}

function buildInterviewSessionState(
  state: SessionStateResponse,
  transcript: TranscriptTurn[]
): InterviewSessionState {
  const currentIndex = Math.max(0, state.turn_count - 1);
  const turns = transcript.map(transcriptTurnToInterviewTurn);

  if (state.next_question) {
    const existingTurn = turns[currentIndex];
    turns[currentIndex] = {
      question: state.next_question,
      answer: existingTurn?.answer ?? null,
      evaluation: existingTurn?.evaluation ?? null,
      status: existingTurn?.evaluation
        ? "answered"
        : existingTurn?.answer === "[SKIPPED]" || existingTurn?.answer === "__SKIP__"
          ? "skipped"
          : "current",
    };
  }

  return {
    turns,
    currentIndex,
    isComplete: state.is_complete || state.status === "COMPLETED",
    report: state.report || null,
  };
}

function createSkippedEvaluation(question: Question): Evaluation {
  return {
    question: question.text,
    answer: "[SKIPPED]",
    score: 0,
    strengths: [],
    weaknesses: ["Question was skipped."],
    suggestion: "Try to answer this question next time to maximize your score.",
  };
}

function interviewSessionReducer(
  state: InterviewSessionState | null,
  action: InterviewSessionAction
): InterviewSessionState | null {
  if (action.type === "initialize") return action.payload;
  if (!state) return state;

  if (action.type === "advance-to-next") {
    const nextIndex = state.currentIndex + 1;
    const nextTurn = state.turns[nextIndex];
    if (!nextTurn || nextTurn.status !== "queued") return state;

    const turns = state.turns.map((turn, index) =>
      index === nextIndex ? { ...turn, status: "current" as const } : turn
    );

    return {
      ...state,
      turns,
      currentIndex: nextIndex,
    };
  }

  const currentTurn = state.turns[state.currentIndex];
  if (!currentTurn) return state;

  const turns = state.turns.slice(0, state.currentIndex + 1);
  const evaluation = action.response.evaluation || (action.isSkip ? createSkippedEvaluation(currentTurn.question) : null);
  turns[state.currentIndex] = {
    ...currentTurn,
    answer: action.isSkip ? "[SKIPPED]" : action.answer,
    evaluation,
    status: action.isSkip ? "skipped" : "answered",
  };

  const nextIndex = state.currentIndex + 1;
  if (action.response.next_question) {
    turns[nextIndex] = {
      question: action.response.next_question,
      answer: null,
      evaluation: null,
      status: action.isSkip ? "current" : "queued",
    };
  }

  return {
    turns,
    currentIndex: action.isSkip && action.response.next_question ? nextIndex : state.currentIndex,
    isComplete: action.response.is_complete,
    report: action.response.report || state.report,
  };
}

function InterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [interviewSession, dispatchInterviewSession] = useReducer(interviewSessionReducer, null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isTtsEnabled, setIsTtsEnabled] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState(THINKING_STAGES[0]);

  const { showConfirm } = useDialog();
  const { status, isPaused, resumeAutoRetry } = useRateLimit();
  const [showPausedModal, setShowPausedModal] = useState(false);

  const currentTurn = interviewSession?.turns[interviewSession.currentIndex] || null;
  const question = currentTurn?.question || null;
  const activeEvaluation = currentTurn?.status === "answered" ? currentTurn.evaluation : null;
  const report = interviewSession?.report || null;
  const isComplete = interviewSession?.isComplete || false;
  const questionNumber = interviewSession ? interviewSession.currentIndex + 1 : 1;
  const hasSubmittedCurrent = currentTurn?.status === "answered" || currentTurn?.status === "skipped";

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
  }, [isAIThinking, isEnding, isSkipping]);

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

        if (state.is_complete || state.status === "COMPLETED") {
          workflowState.isActive = false;
          router.replace(`/report?session_id=${sessionId}`);
        } else if (state.next_question) {
          dispatchInterviewSession({
            type: "initialize",
            payload: buildInterviewSessionState(state, transcriptData),
          });
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
  const completedTurns = interviewSession?.turns.filter(
    (turn) => turn.status === "answered" || turn.status === "skipped"
  ) || [];
  const currentScore = completedTurns.length > 0
    ? (
        completedTurns.reduce((acc, turn) => {
          if (turn.status === "skipped") return acc;
          return acc + (turn.evaluation?.score || 0);
        }, 0) / completedTurns.length
      ).toFixed(1)
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
      dispatchInterviewSession({
        type: "submit-success",
        answer,
        isSkip,
        response,
      });
      if (isSkip) setAnswer("");
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
    } else {
      dispatchInterviewSession({ type: "advance-to-next" });
      setAnswer("");
    }
  };

  const questionsAnswered = completedTurns.length;
  const totalQuestions = 10;
  const questionsRemaining = totalQuestions - questionsAnswered;

  if (loading || !question) {
    return (
      <div className="min-h-full bg-black flex flex-col w-full animate-in fade-in duration-500">
        <div className="flex-1 flex flex-col w-full max-w-[1200px] mx-auto px-6 lg:px-8 py-8">
          <div className="flex justify-between items-end mb-6">
            <div className="space-y-2">
              <Shimmer className="h-8 w-32" />
              <Shimmer className="h-4 w-24" />
              <Shimmer className="h-6 w-24 rounded-full" />
            </div>
            <div className="flex items-center gap-3">
              <Shimmer className="h-10 w-10 rounded-full" />
              <Shimmer className="h-10 w-20 rounded-full" />
            </div>
          </div>
          
          {/* Progress Tracker */}
          <div className="mb-7 space-y-4">
            <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-2">
                <Shimmer className="w-5 h-5 rounded-md" />
                <Shimmer className="h-6 w-32" />
              </div>
              <Shimmer className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 -mx-1 w-[calc(100%+8px)]">
              {[...Array(10)].map((_, i) => (
                <Shimmer key={i} className="flex-1 min-w-[70px] h-14 rounded-xl" />
              ))}
            </div>
          </div>
          
          {/* Question Skeleton */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Shimmer className="w-3 h-3 rounded-full" />
              <Shimmer className="h-4 w-24" />
            </div>
            <Shimmer className="h-8 w-full max-w-3xl mb-3" />
            <Shimmer className="h-8 w-full max-w-2xl" />
          </div>

          {/* Main Canvas */}
          <div className="flex-1 flex flex-col min-h-[400px]">
            <div className="flex flex-col flex-1">
              <Shimmer className="flex-1 w-full rounded-2xl" />
              <div className="flex justify-between items-center mt-6 p-2 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <Shimmer className="h-12 w-24 rounded-xl" />
                <Shimmer className="h-12 w-32 rounded-xl" />
              </div>
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
                const isCurrent = i === interviewSession!.currentIndex;
                const turnData = interviewSession!.turns[i];
                let scoreText = "- / 10";
                let statusClasses = "bg-zinc-900 border-zinc-800 text-zinc-500 opacity-40";
                
                if (turnData?.status === "skipped") {
                  scoreText = "Skipped";
                  statusClasses = "bg-zinc-800/50 border-zinc-700 text-zinc-400";
                } else if (turnData?.evaluation) {
                  const score = turnData.evaluation.score || 0;
                  scoreText = `${score} / 10`;
                  if (score >= 8) {
                    statusClasses = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
                  } else if (score >= 5) {
                    statusClasses = "bg-amber-500/10 border-amber-500/30 text-amber-400";
                  } else {
                    statusClasses = "bg-red-500/10 border-red-500/30 text-red-400";
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
              ) : !activeEvaluation ? (
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
                  <AnswerEvaluationCard evaluation={activeEvaluation} />
                  
                  {activeEvaluation.ideal_answer && (
                    <IdealAnswerCard idealAnswer={activeEvaluation.ideal_answer} />
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

