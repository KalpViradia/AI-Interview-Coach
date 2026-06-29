import React from "react";

export default function UploadSkeleton() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 w-full animate-in fade-in duration-500">
      <div className="max-w-4xl w-full">
        {/* Header Skeleton */}
        <div className="mb-10 text-center space-y-4 flex flex-col items-center">
          <div className="h-10 w-3/4 max-w-md bg-zinc-800 rounded-xl animate-pulse"></div>
          <div className="h-5 w-full max-w-2xl bg-zinc-800/50 rounded-lg animate-pulse"></div>
          <div className="h-5 w-2/3 max-w-lg bg-zinc-800/50 rounded-lg animate-pulse"></div>
        </div>

        {/* Upload Container Skeleton */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Resume Column Skeleton */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-32 bg-zinc-800 rounded-lg animate-pulse"></div>
                  <div className="h-8 w-28 bg-zinc-800 rounded-full animate-pulse"></div>
                </div>
                <div className="w-full h-64 rounded-xl bg-zinc-950/50 border border-zinc-800/50 animate-pulse"></div>
              </div>

              {/* JD Column Skeleton */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-36 bg-zinc-800 rounded-lg animate-pulse"></div>
                  <div className="h-8 w-28 bg-zinc-800 rounded-full animate-pulse"></div>
                </div>
                <div className="w-full h-64 rounded-xl bg-zinc-950/50 border border-zinc-800/50 animate-pulse"></div>
              </div>
            </div>

            {/* Action Button Skeleton */}
            <div className="flex justify-end pt-4 border-t border-zinc-800/50">
              <div className="h-12 w-48 bg-indigo-500/20 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
