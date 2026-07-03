"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delay?: number;
  disabled?: boolean;
  className?: string;
}

export function Tooltip({ children, content, side = "right", delay = 300, disabled = false, className = "" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      });
    }
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    updateCoords();
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const getPortalStyles = (): React.CSSProperties => {
    switch (side) {
      case "right":
        return { top: coords.top + coords.height / 2, left: coords.right + 12, transform: 'translateY(-50%)' };
      case "left":
        return { top: coords.top + coords.height / 2, left: coords.left - 12, transform: 'translate(-100%, -50%)' };
      case "top":
        return { top: coords.top - 12, left: coords.left + coords.width / 2, transform: 'translate(-50%, -100%)' };
      case "bottom":
        return { top: coords.bottom + 12, left: coords.left + coords.width / 2, transform: 'translateX(-50%)' };
      default:
        return { top: coords.top + coords.height / 2, left: coords.right + 12, transform: 'translateY(-50%)' };
    }
  };

  const getInitialAnimation = () => {
    switch (side) {
      case "right":
        return { opacity: 0, x: -5 };
      case "left":
        return { opacity: 0, x: 5 };
      case "top":
        return { opacity: 0, y: 5 };
      case "bottom":
        return { opacity: 0, y: -5 };
      default:
        return { opacity: 0, x: -5 };
    }
  };

  return (
    <>
      <div 
        ref={containerRef}
        className={`flex items-center w-full justify-center ${className}`} 
        onMouseEnter={handleMouseEnter} 
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
      >
        {children}
      </div>
      {mounted && createPortal(
        <AnimatePresence>
          {isVisible && (
            <div style={{ ...getPortalStyles(), position: 'fixed', zIndex: 9999 }}>
              <motion.div
                initial={getInitialAnimation()}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={getInitialAnimation()}
                transition={{ duration: 0.15 }}
                className="px-2.5 py-1.5 text-xs font-medium text-white bg-zinc-800 rounded-md shadow-md whitespace-nowrap pointer-events-none border border-zinc-700"
              >
                {content}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
