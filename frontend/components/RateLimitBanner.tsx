"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, RefreshCw, Clock } from "lucide-react";

interface RateLimitBannerProps {
  show: boolean;
  message: string;
  retryAfter: number;
  onRetry: () => void;
  onCancel?: () => void;
}

export function RateLimitBanner({ show, message, retryAfter, onRetry, onCancel }: RateLimitBannerProps) {
  const [countdown, setCountdown] = useState(retryAfter);

  useEffect(() => {
    if (show && retryAfter > 0) {
      const timeout = setTimeout(() => setCountdown(retryAfter), 0);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }
  }, [show, retryAfter]);

  useEffect(() => {
    if (countdown === 0 && show) {
      // Auto-retry when countdown hits 0
      onRetry();
    }
  }, [countdown, show, onRetry]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-md"
        >
          <div className="bg-amber-900/40 border border-amber-500/50 backdrop-blur-md shadow-2xl rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 rounded-full text-amber-400 mt-1">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-200 text-sm">AI Service Temporarily Busy</h3>
                <p className="text-amber-300/80 text-xs mt-1 leading-relaxed">
                  {message || "The AI is currently processing too many requests. Please wait a moment."}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 pt-3 border-t border-amber-500/20">
              <div className="flex items-center text-amber-400/80 text-xs font-medium">
                {countdown > 0 ? (
                  <>
                    <Clock className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
                    Auto-retrying in {countdown}s...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Retrying now...
                  </>
                )}
              </div>
              
              <div className="flex gap-2">
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="px-3 py-1.5 text-xs font-medium text-amber-300/70 hover:text-amber-200 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={onRetry}
                  disabled={countdown === 0}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-semibold rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${countdown === 0 ? 'animate-spin' : ''}`} />
                  Retry Now
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
