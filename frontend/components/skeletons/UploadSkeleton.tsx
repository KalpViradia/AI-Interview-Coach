import React from "react";
import Shimmer from "../ui/Shimmer";

export default function UploadSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 w-full animate-in fade-in duration-500">
      <div className="max-w-4xl w-full">
        {/* Header Skeleton */}
        <div className="mb-8 text-center space-y-4 flex flex-col items-center">
          <Shimmer className="h-10 w-3/4 max-w-md" />
          <Shimmer className="h-5 w-full max-w-2xl" />
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
          <div className="space-y-8">
            
            {/* Interview Type Selection Skeleton */}
            <div className="space-y-4 mb-8">
              <Shimmer className="h-6 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-4 rounded-2xl border-2 border-zinc-800 bg-zinc-900/50 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <Shimmer className="w-9 h-9 rounded-xl shrink-0" />
                      <Shimmer className="h-5 w-24" />
                    </div>
                    <Shimmer className="h-3 w-full" />
                    <Shimmer className="h-3 w-4/5" />
                  </div>
                ))}
              </div>
            </div>

            {/* Resume Upload Column Skeleton */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <Shimmer className="h-6 w-40" />
              </div>
              <div className="flex gap-4 mb-4">
                <Shimmer className="h-9 w-32 rounded-xl" />
                <Shimmer className="h-9 w-32 rounded-xl" />
              </div>
              
              <div className="w-full h-64 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50 flex flex-col items-center justify-center p-6 gap-4">
                <Shimmer className="w-12 h-12 rounded-full" />
                <Shimmer className="h-5 w-48" />
                <Shimmer className="h-4 w-64" />
                <Shimmer className="h-10 w-32 rounded-xl mt-4" />
              </div>
            </div>
            
            {/* Info Banner Skeleton */}
            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 flex gap-3 items-start">
              <Shimmer className="w-5 h-5 rounded-md shrink-0" />
              <div className="space-y-2 w-full">
                <Shimmer className="h-5 w-40" />
                <Shimmer className="h-4 w-full max-w-xl" />
              </div>
            </div>

            {/* Action Button Skeleton */}
            <div className="flex justify-end pt-8">
              <Shimmer className="h-12 w-48 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
