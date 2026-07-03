"use client";

import React, { createContext, useState, useEffect } from "react";
import { subscribeToRateLimit, RateLimitEventPayload } from "@/lib/rate-limit-event";
import { RateLimitBanner } from "@/components/RateLimitBanner";

export type RateLimitStatus = "idle" | "retrying" | "paused";

interface RateLimitContextType {
  status: RateLimitStatus;
  isRateLimited: boolean;
  isPaused: boolean;
  resumeAutoRetry: () => void;
}

export const RateLimitContext = createContext<RateLimitContextType>({
  status: "idle",
  isRateLimited: false,
  isPaused: false,
  resumeAutoRetry: () => {}
});

export const useRateLimit = () => React.useContext(RateLimitContext);

export function RateLimitProvider({ children }: { children: React.ReactNode }) {
  const [rateLimitData, setRateLimitData] = useState<RateLimitEventPayload | null>(null);
  const [status, setStatus] = useState<RateLimitStatus>("idle");
  
  // Keep track of all pending callbacks so a single banner action applies to all hung requests
  const pendingRequests = React.useRef<RateLimitEventPayload[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToRateLimit((payload) => {
      pendingRequests.current.push(payload);
      if (!rateLimitData) {
        setRateLimitData(payload);
        setStatus("retrying");
      }
    });

    return () => unsubscribe();
  }, [rateLimitData]);

  const handleRetry = () => {
    const requests = [...pendingRequests.current];
    pendingRequests.current = [];
    setRateLimitData(null);
    setStatus("idle");
    requests.forEach(req => req.onRetry());
  };

  const handleCancel = () => {
    const requests = [...pendingRequests.current];
    pendingRequests.current = [];
    setRateLimitData(null);
    setStatus("idle");
    requests.forEach(req => req.onCancel());
  };

  const resumeAutoRetry = () => {
    if (status === "paused" && rateLimitData) {
      setStatus("retrying");
    }
  };

  return (
    <RateLimitContext.Provider value={{
      status,
      isRateLimited: status !== "idle",
      isPaused: status === "paused",
      resumeAutoRetry
    }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50">
        <RateLimitBanner
          show={!!rateLimitData && status !== "paused"}
          status={status}
          message={rateLimitData?.message || ""}
          retryAfter={rateLimitData?.retryAfter || 20}
          onRetry={handleRetry}
          onCancel={handleCancel}
        />
      </div>
    </RateLimitContext.Provider>
  );
}
