"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

export default function BackToTop({ containerId }: { containerId?: string }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = (e: Event) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const target = e.target as HTMLElement | Document | Window;
          
          let isTarget = false;
          let scrollTop = 0;
          
          if (target instanceof Document || target === window) {
            isTarget = (!containerId); // If no specific container, window scrolling counts
            scrollTop = window.scrollY;
          } else if (target instanceof HTMLElement) {
            if (containerId && target.id === containerId) {
              isTarget = true;
              scrollTop = target.scrollTop;
            } else if (!containerId && target.id === "main-scroll-container") {
              isTarget = true;
              scrollTop = target.scrollTop;
            }
          }

          if (isTarget) {
            setIsVisible(scrollTop > 400);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    // Try to do an initial check if elements exist
    const initialContainer = containerId ? document.getElementById(containerId) : document.getElementById("main-scroll-container");
    if (initialContainer) {
      setIsVisible(initialContainer.scrollTop > 400);
    } else {
      setIsVisible(window.scrollY > 400);
    }

    // Use capture phase to catch scroll events from any inner containers
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    return () => window.removeEventListener("scroll", handleScroll, { capture: true });
  }, [containerId]);

  const scrollToTop = () => {
    const scrollContainer = containerId ? document.getElementById(containerId) : document.getElementById("main-scroll-container");
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed bottom-[20px] right-[20px] md:bottom-[24px] md:right-[24px] z-[9999] flex items-center justify-center w-[52px] h-[52px] md:w-[56px] md:h-[56px] rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:scale-105 hover:shadow-indigo-500/50 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          <ArrowUp className="w-6 h-6" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
