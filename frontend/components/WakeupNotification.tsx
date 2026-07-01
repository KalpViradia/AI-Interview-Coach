"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hourglass, Loader2 } from "lucide-react";
import { wakeupManager } from "@/lib/api-client";

export default function WakeupNotification() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Silent warm-up
    const warmup = async () => {
      try {
        const url = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/health";
        fetch(url).catch(() => {});
      } catch (e) {
        // ignore
      }
    };
    warmup();

    const unsubscribe = wakeupManager.subscribe((visible) => {
      setIsVisible(visible);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "44px", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed top-0 right-0 z-[9999] bg-[#1b1a35] border-b border-purple-500/30 overflow-hidden left-0 [.has-sidebar_&]:md:left-72"
        >
          <div className="h-[44px] flex items-center justify-between px-4 md:px-6 mx-auto max-w-7xl">
            <div className="flex items-center gap-3">
              <Hourglass className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm">Starting AI services...</span>
                <span className="text-zinc-400 text-xs hidden md:inline">
                  Hosted on Render&apos;s free tier. The first request after inactivity may take up to 60 seconds.
                </span>
              </div>
            </div>
            
            <Loader2 className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
