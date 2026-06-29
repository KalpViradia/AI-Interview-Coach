"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // We could log to Sentry or another error reporting service here
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-6">
      <div className="max-w-md w-full bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-2">Something went wrong!</h2>
          <p className="text-zinc-400 text-sm">
            We encountered an unexpected error. Please try again or return to the dashboard.
          </p>
        </div>

        <div className="pt-6 flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-full transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
          
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-full transition-colors"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
