import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

interface LoadingProcessProps {
  title?: string;
  description?: string;
  steps: string[];
  stepDuration?: number; // duration in ms for each step (simulated progress)
}

export default function LoadingProcess({
  title = "Processing...",
  description = "Please wait while we complete the setup.",
  steps,
  stepDuration = 2500,
}: LoadingProcessProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Advance steps over time, stopping at the last step
  useEffect(() => {
    if (currentStepIndex >= steps.length - 1) return;

    const timer = setTimeout(() => {
      setCurrentStepIndex((prev) => prev + 1);
    }, stepDuration);

    return () => clearTimeout(timer);
  }, [currentStepIndex, steps.length, stepDuration]);

  // Calculate percentage
  const totalSteps = steps.length;
  // If at the last step, wait at 90% or 95% until unmounted (which means actual completion)
  // Otherwise, calculate progress based on completed steps.
  const progressPercentage = currentStepIndex === totalSteps - 1 
    ? 90 
    : Math.round(((currentStepIndex) / totalSteps) * 100);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center py-12">
      {/* Title & Description */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4 flex items-center justify-center gap-3">
          🧠 {title}
        </h1>
        <p className="text-zinc-400">
          {description}
        </p>
      </div>

      {/* Animated Orb */}
      <div className="mb-12 relative flex justify-center items-center">
        <div className="w-32 h-32 rounded-full bg-indigo-500/5 flex items-center justify-center relative">
          {/* Subtle rotating particles / ring */}
          <motion.div 
            className="absolute inset-0 rounded-full border border-indigo-500/10 border-t-indigo-500/30 border-r-indigo-500/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
          {/* Outer glow */}
          <motion.div 
            className="absolute inset-2 rounded-full bg-indigo-500/10 blur-xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Inner core */}
          <motion.div
            className="w-16 h-16 rounded-full bg-indigo-600 shadow-[0_0_40px_rgba(99,102,241,0.5)] z-10"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="w-full max-w-md mb-10">
        <div className="flex justify-between items-center text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          <span>Preparing...</span>
          <span className="text-indigo-400">{progressPercentage}%</span>
        </div>
        <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
          <motion.div 
            className="h-full bg-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Steps List */}
      <div className="w-full max-w-md space-y-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          const isFuture = index > currentStepIndex;

          return (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-4 transition-all duration-500 ${
                isActive ? 'opacity-100 scale-105' : 
                isCompleted ? 'opacity-50' : 'opacity-20'
              }`}
            >
              <div className="shrink-0 flex items-center justify-center w-6 h-6">
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                ) : (
                  <Circle className="w-4 h-4 text-zinc-600" />
                )}
              </div>
              <span className={`text-base font-medium transition-colors duration-300 ${
                isActive ? 'text-indigo-300' : 
                isCompleted ? 'text-zinc-400' : 'text-zinc-600'
              }`}>
                {step}{isActive && "..."}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
