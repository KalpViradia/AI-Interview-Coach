"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";

import { RateLimitStatus } from "./providers/RateLimitProvider";

interface RateLimitBannerProps {
  show: boolean;
  status: RateLimitStatus;
  message?: string;
  retryAfter: number;
  onRetry: () => void;
  onCancel?: () => void;
  className?: string;
}

export function RateLimitBanner({ show, status, retryAfter, onRetry, onCancel, className = "" }: RateLimitBannerProps) {
  const [countdown, setCountdown] = useState(retryAfter);

  useEffect(() => {
    if (show && status === "retrying" && retryAfter > 0) {
      setCountdown(retryAfter);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [show, status, retryAfter]);

  useEffect(() => {
    if (countdown === 0 && show && status === "retrying") {
      // Auto-retry when countdown hits 0
      onRetry();
    }
  }, [countdown, show, status, onRetry]);

  const progress = retryAfter > 0 ? ((retryAfter - countdown) / retryAfter) * 100 : 100;
  const isPaused = status === "paused";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -10 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`z-50 w-full md:w-[380px] overflow-hidden ${className}`}
        >
          <div className="bg-zinc-900 border border-amber-500/30 rounded-xl shadow-lg overflow-hidden flex flex-col mb-4">
            <div className="p-4 flex flex-col gap-3">
              <div>
                <h3 className="font-semibold text-amber-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> AI service temporarily busy
                </h3>
                <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
                  {isPaused 
                    ? "Automatic retry paused."
                    : `The AI provider has reached its temporary request limit. We'll automatically retry in ${countdown} seconds.`
                  }
                </p>
              </div>

              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center text-zinc-400 text-xs font-medium">
                  {isPaused ? null : countdown > 0 ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-indigo-400" />
                      Retrying in {countdown}s...
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-indigo-400" />
                      Retrying now...
                    </>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {!isPaused && onCancel && (
                    <button
                      onClick={onCancel}
                      className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg hover:bg-zinc-800"
                    >
                      Cancel
                    </button>
                  )}
                  {!isPaused && (
                    <button
                      onClick={onRetry}
                      disabled={countdown === 0}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Retry Now
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="h-0.5 w-full bg-zinc-800">
              <motion.div 
                className="h-full bg-indigo-500"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
