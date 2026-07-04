import React from "react";
import Shimmer from "../ui/Shimmer";

export default function AnalysisSkeleton() {
  return (
    <div className="py-12 px-6 sm:px-12 flex justify-center w-full animate-in fade-in duration-500">
      <div className="w-full max-w-5xl space-y-8">
        
        {/* Header Skeleton */}
        <div className="mb-10">
          <Shimmer className="h-4 w-24 mb-8" />
          <div className="border-b border-zinc-800 pb-6">
            <Shimmer className="h-8 w-64 mb-2" />
            <Shimmer className="h-5 w-96 max-w-full" />
          </div>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <Shimmer className="w-8 h-8 rounded-lg mb-4" />
              <Shimmer className="h-4 w-20 mb-1" />
              <Shimmer className="h-6 w-16" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column Skeletons */}
          <div className="space-y-6">
            <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 min-h-[300px]">
              <Shimmer className="h-6 w-40 mb-8" />
              <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between items-center gap-4">
                    <Shimmer className="h-4 w-24" />
                    <Shimmer className="flex-1 h-2 rounded-full" />
                    <Shimmer className="h-4 w-8" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column Skeletons */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 min-h-[220px]">
              <Shimmer className="h-6 w-32 mb-6" />
              <div className="space-y-3">
                <Shimmer className="h-4 w-full" />
                <Shimmer className="h-4 w-full" />
                <Shimmer className="h-4 w-5/6" />
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 min-h-[240px]">
              <Shimmer className="h-6 w-36 mb-6" />
              <div className="space-y-6">
                <div>
                  <Shimmer className="h-4 w-24 mb-3" />
                  <div className="flex flex-wrap gap-2">
                    <Shimmer className="h-8 w-20" />
                    <Shimmer className="h-8 w-24" />
                    <Shimmer className="h-8 w-16" />
                  </div>
                </div>
                <div>
                  <Shimmer className="h-4 w-24 mb-3" />
                  <div className="flex flex-wrap gap-2">
                    <Shimmer className="h-8 w-24" />
                    <Shimmer className="h-8 w-16" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button Skeleton */}
        <div className="flex justify-end pt-8 border-t border-zinc-800/50">
          <Shimmer className="h-12 w-48 rounded-full" />
        </div>
      </div>
    </div>
  );
}
