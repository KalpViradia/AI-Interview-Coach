import React from "react";

export default function AnalysisSkeleton() {
  return (
    <div className="py-12 px-6 sm:px-12 flex justify-center w-full animate-in fade-in duration-500">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header Skeleton */}
        <div className="text-center mb-12 flex flex-col items-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-zinc-800 animate-pulse mb-2"></div>
          <div className="h-8 w-64 bg-zinc-800 rounded-xl animate-pulse"></div>
          <div className="h-4 w-full max-w-lg bg-zinc-800/50 rounded-lg animate-pulse"></div>
          <div className="h-4 w-3/4 max-w-md bg-zinc-800/50 rounded-lg animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column Skeletons */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 h-32 animate-pulse"></div>
              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 h-32 animate-pulse"></div>
            </div>
            
            <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 min-h-[300px] animate-pulse">
              <div className="h-6 w-40 bg-zinc-800 rounded-lg mb-8"></div>
              <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between items-center gap-4">
                    <div className="h-4 w-24 bg-zinc-800 rounded-md"></div>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full"></div>
                    <div className="h-4 w-8 bg-zinc-800 rounded-md"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column Skeletons */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 min-h-[220px] animate-pulse">
              <div className="h-6 w-32 bg-zinc-800 rounded-lg mb-6"></div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-zinc-800/80 rounded-md"></div>
                <div className="h-4 w-full bg-zinc-800/80 rounded-md"></div>
                <div className="h-4 w-5/6 bg-zinc-800/80 rounded-md"></div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 min-h-[240px] animate-pulse">
              <div className="h-6 w-36 bg-zinc-800 rounded-lg mb-6"></div>
              <div className="space-y-6">
                <div>
                  <div className="h-4 w-24 bg-zinc-800 rounded-md mb-3"></div>
                  <div className="flex flex-wrap gap-2">
                    <div className="h-6 w-20 bg-zinc-800 rounded-md"></div>
                    <div className="h-6 w-24 bg-zinc-800 rounded-md"></div>
                    <div className="h-6 w-16 bg-zinc-800 rounded-md"></div>
                  </div>
                </div>
                <div>
                  <div className="h-4 w-24 bg-zinc-800 rounded-md mb-3"></div>
                  <div className="flex flex-wrap gap-2">
                    <div className="h-6 w-24 bg-zinc-800 rounded-md"></div>
                    <div className="h-6 w-16 bg-zinc-800 rounded-md"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Skeleton */}
        <div className="flex justify-center gap-4 pt-8 border-t border-zinc-800/50">
          <div className="h-12 w-48 bg-zinc-800 rounded-full animate-pulse"></div>
          <div className="h-12 w-48 bg-indigo-500/20 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
