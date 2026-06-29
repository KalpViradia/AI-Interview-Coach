import React from "react";

export default function ReportSkeleton() {
  return (
    <div className="py-12 px-6 sm:px-12 flex justify-center w-full animate-in fade-in duration-500">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4 border-b border-zinc-800 pb-6 mb-8">
          <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-8 w-64 bg-zinc-800 rounded-lg animate-pulse"></div>
            <div className="h-4 w-80 bg-zinc-800/50 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Score Card Skeleton */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center animate-pulse">
          <div className="w-32 h-32 rounded-full bg-zinc-800 mb-6"></div>
          <div className="h-8 w-48 bg-zinc-800 rounded-lg mb-4"></div>
          <div className="h-4 w-3/4 max-w-md bg-zinc-800/50 rounded-lg"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Detailed Scores Skeleton */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-6 animate-pulse">
            <div className="h-6 w-40 bg-zinc-800 rounded-lg"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-32 bg-zinc-800/80 rounded-md"></div>
                  <div className="h-4 w-10 bg-zinc-800/80 rounded-md"></div>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full"></div>
              </div>
            ))}
          </div>

          {/* Feedback Skeleton */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-6 animate-pulse">
            <div className="h-6 w-32 bg-zinc-800 rounded-lg"></div>
            <div className="space-y-4">
              <div>
                <div className="h-5 w-24 bg-zinc-800 rounded-md mb-2"></div>
                <div className="flex flex-wrap gap-2">
                  <div className="h-6 w-20 bg-zinc-800/50 rounded-md"></div>
                  <div className="h-6 w-24 bg-zinc-800/50 rounded-md"></div>
                </div>
              </div>
              <div>
                <div className="h-5 w-32 bg-zinc-800 rounded-md mb-2"></div>
                <div className="flex flex-wrap gap-2">
                  <div className="h-6 w-24 bg-zinc-800/50 rounded-md"></div>
                  <div className="h-6 w-20 bg-zinc-800/50 rounded-md"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Skeleton */}
        <div className="flex justify-center gap-4 pt-8">
          <div className="h-12 w-40 bg-zinc-800 rounded-full animate-pulse"></div>
          <div className="h-12 w-48 bg-zinc-800 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
