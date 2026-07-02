"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface RateLimitBannerProps {
  show: boolean;
  message?: string;
  retryAfter: number;
  onRetry: () => void;
  onCancel?: () => void;
}

export function RateLimitBanner({ show, retryAfter, onRetry, onCancel }: RateLimitBannerProps) {
  const [countdown, setCountdown] = useState(retryAfter);

  useEffect(() => {
    if (show && retryAfter > 0) {
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
  }, [show, retryAfter]);

  useEffect(() => {
    if (countdown === 0 && show) {
      // Auto-retry when countdown hits 0
      onRetry();
    }
  }, [countdown, show, onRetry]);

  const progress = retryAfter > 0 ? ((retryAfter - countdown) / retryAfter) * 100 : 100;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed top-20 left-4 right-4 md:top-8 md:left-auto md:right-8 z-50 md:w-[380px] pointer-events-none"
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden pointer-events-auto flex flex-col">
            <div className="p-4 flex flex-col gap-3">
              <div>
                <h3 className="font-semibold text-zinc-100 text-sm">AI service temporarily busy</h3>
                <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                  The AI provider has reached its temporary request limit. We'll automatically retry in {countdown} seconds.
                </p>
              </div>

              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center text-zinc-400 text-xs font-medium">
                  {countdown > 0 ? (
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
                  {onCancel && (
                    <button
                      onClick={onCancel}
                      className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg hover:bg-zinc-800"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={onRetry}
                    disabled={countdown === 0}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Retry Now
                  </button>
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
