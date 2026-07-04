import React from "react";
import Shimmer from "../ui/Shimmer";

export default function ResumeChatSkeleton() {
  return (
    <div className="flex flex-col p-6 md:p-12 max-w-6xl mx-auto w-full animate-in fade-in duration-500">
      
      {/* Header Skeleton */}
      <div className="mb-12 text-center flex flex-col items-center">
        <Shimmer className="w-16 h-16 rounded-2xl mb-6" />
        <Shimmer className="h-10 w-64 mb-4" />
        <Shimmer className="h-5 w-full max-w-xl" />
      </div>

      {/* Main Content Area (Upload Form matching resume-chat initial state) */}
      <div className="max-w-2xl mx-auto w-full bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
        <div className="space-y-6">
          <div className="flex gap-4">
            <Shimmer className="h-9 w-32 rounded-xl" />
            <Shimmer className="h-9 w-32 rounded-xl" />
          </div>
          
          <div className="w-full h-64 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50 flex flex-col items-center justify-center p-6 gap-4">
            <Shimmer className="w-12 h-12 rounded-full" />
            <Shimmer className="h-5 w-48" />
            <Shimmer className="h-4 w-64" />
            <Shimmer className="h-10 w-32 rounded-xl mt-4" />
          </div>
          
          <div className="flex justify-end pt-4 border-t border-zinc-800/50">
            <Shimmer className="h-12 w-48 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
