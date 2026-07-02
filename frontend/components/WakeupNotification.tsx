"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hourglass, Loader2 } from "lucide-react";

export default function WakeupNotification() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let timer: NodeJS.Timeout;

    const checkHealth = async () => {
      // Start a timer. If health check doesn't respond in 1500ms, Render is probably sleeping
      timer = setTimeout(() => {
        if (isMounted) setIsVisible(true);
      }, 1500);

      try {
        const url = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api") + "/health";
        // Force no-cache so we actually hit the backend
        await fetch(url, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
      } catch (e) {
        // ignore
      } finally {
        clearTimeout(timer);
        if (isMounted) setIsVisible(false);
      }
    };

    checkHealth();

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 44, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          onUpdate={(latest) => {
            if (typeof window !== "undefined") {
              const h = typeof latest.height === "number" ? latest.height : parseFloat(latest.height as string) || 0;
              document.documentElement.style.setProperty("--banner-height", `${h}px`);
            }
          }}
          className="fixed top-0 left-0 right-0 w-full bg-[#1b1a35] border-b border-purple-500/30 overflow-hidden z-50"
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
