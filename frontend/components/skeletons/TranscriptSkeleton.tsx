import React from "react";
import Shimmer from "../ui/Shimmer";

export default function TranscriptSkeleton() {
  return (
    <div className="py-12 px-6 sm:px-12 flex justify-center w-full animate-in fade-in duration-500">
      <div className="w-full max-w-[1100px] space-y-8">
        
        {/* PageHeader Skeleton */}
        <div className="mb-10">
          <Shimmer className="h-4 w-24 mb-8" />
          <div className="border-b border-zinc-800 pb-6">
            <Shimmer className="h-8 w-64 mb-2" />
            <Shimmer className="h-5 w-96 max-w-full" />
          </div>
        </div>

        {/* Timeline Items */}
        <div className="space-y-12">
          {[1, 2].map((i) => (
            <div key={i} className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6">
              <div>
                <div className="flex gap-3 mb-4">
                  <Shimmer className="h-6 w-24 rounded-full" />
                  <Shimmer className="h-6 w-20 rounded-full" />
                </div>
                <Shimmer className="h-6 w-full mb-2" />
                <Shimmer className="h-6 w-3/4" />
              </div>

              <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-5 space-y-3">
                <Shimmer className="h-4 w-32 mb-2" />
                <Shimmer className="h-4 w-full" />
                <Shimmer className="h-4 w-full" />
                <Shimmer className="h-4 w-2/3" />
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-5">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                  <Shimmer className="h-5 w-40" />
                  <Shimmer className="h-8 w-16" />
                </div>
                <div className="space-y-2 mb-4">
                  <Shimmer className="h-4 w-full" />
                  <Shimmer className="h-4 w-5/6" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Shimmer className="h-5 w-24" />
                    <Shimmer className="h-4 w-full" />
                    <Shimmer className="h-4 w-4/5" />
                  </div>
                  <div className="space-y-3">
                    <Shimmer className="h-5 w-40" />
                    <Shimmer className="h-4 w-full" />
                    <Shimmer className="h-4 w-5/6" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Actions */}
        <div className="flex justify-center pt-12 border-t border-zinc-800 mt-12">
          <Shimmer className="h-14 w-48 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
