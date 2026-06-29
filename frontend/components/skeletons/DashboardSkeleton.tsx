import React from "react";

export default function DashboardSkeleton() {
  return (
    <div className="text-white p-6 sm:p-12 w-full h-full animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-8 border-b border-zinc-800">
          <div className="space-y-3">
            <div className="h-8 w-48 bg-zinc-800/80 rounded-lg animate-pulse"></div>
            <div className="h-4 w-72 bg-zinc-800/50 rounded-lg animate-pulse"></div>
          </div>
          <div className="h-12 w-48 bg-indigo-500/20 border border-indigo-500/30 rounded-xl animate-pulse"></div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-4 border-b border-zinc-800 pb-px">
          <div className="h-6 w-32 bg-indigo-500/20 rounded-md mb-2 animate-pulse"></div>
          <div className="h-6 w-24 bg-zinc-800/50 rounded-md mb-2 animate-pulse"></div>
        </div>

        {/* Top Analytics Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="h-[280px] bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-4 animate-pulse">
             <div className="h-6 w-32 bg-zinc-800 rounded-lg"></div>
             <div className="flex-1 bg-zinc-800/50 rounded-xl"></div>
          </div>
          <div className="h-[280px] bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-4 animate-pulse">
             <div className="h-6 w-32 bg-zinc-800 rounded-lg"></div>
             <div className="flex-1 bg-zinc-800/50 rounded-xl"></div>
          </div>
          <div className="h-[280px] bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-4 animate-pulse">
             <div className="h-6 w-32 bg-zinc-800 rounded-lg"></div>
             <div className="flex-1 bg-zinc-800/50 rounded-xl"></div>
          </div>
        </div>

        {/* History Section Skeleton */}
        <div className="space-y-6 mt-8">
          <div className="h-6 w-40 bg-zinc-800 rounded-lg animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[220px] bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between animate-pulse">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <div className="h-5 w-24 bg-zinc-800 rounded-full"></div>
                    <div className="h-4 w-16 bg-zinc-800 rounded-sm"></div>
                  </div>
                  <div className="h-10 w-20 bg-zinc-800 rounded-lg"></div>
                  <div className="h-6 w-3/4 bg-zinc-800 rounded-lg"></div>
                  <div className="h-4 w-full bg-zinc-800/50 rounded-lg"></div>
                </div>
                <div className="flex gap-2 mt-4">
                  <div className="h-8 w-20 bg-zinc-800 rounded-lg"></div>
                  <div className="h-8 w-20 bg-zinc-800 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
