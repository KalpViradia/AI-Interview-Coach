import React from "react";

export default function TranscriptSkeleton() {
  return (
    <div className="py-12 px-6 sm:px-12 flex justify-center w-full animate-in fade-in duration-500">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-zinc-800 pb-6 mb-8">
          <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-8 w-64 bg-zinc-800 rounded-lg animate-pulse"></div>
            <div className="h-4 w-80 bg-zinc-800/50 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Timeline Items */}
        <div className="space-y-12">
          {[1, 2].map((i) => (
            <div key={i} className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 animate-pulse">
              <div>
                <div className="flex gap-3 mb-4">
                  <div className="h-6 w-24 bg-zinc-800 rounded-full"></div>
                  <div className="h-6 w-20 bg-zinc-800 rounded-full"></div>
                </div>
                <div className="h-6 w-full bg-zinc-800 rounded-lg mb-2"></div>
                <div className="h-6 w-3/4 bg-zinc-800 rounded-lg"></div>
              </div>

              <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-5 space-y-3">
                <div className="h-4 w-32 bg-zinc-800 rounded-md mb-2"></div>
                <div className="h-4 w-full bg-zinc-800/80 rounded-md"></div>
                <div className="h-4 w-full bg-zinc-800/80 rounded-md"></div>
                <div className="h-4 w-2/3 bg-zinc-800/80 rounded-md"></div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-5">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                  <div className="h-5 w-40 bg-zinc-800 rounded-md"></div>
                  <div className="h-8 w-16 bg-zinc-800 rounded-lg"></div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 w-full bg-zinc-800/80 rounded-md"></div>
                  <div className="h-4 w-5/6 bg-zinc-800/80 rounded-md"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="h-5 w-24 bg-zinc-800 rounded-md"></div>
                    <div className="h-4 w-full bg-zinc-800/50 rounded-md"></div>
                    <div className="h-4 w-4/5 bg-zinc-800/50 rounded-md"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-5 w-40 bg-zinc-800 rounded-md"></div>
                    <div className="h-4 w-full bg-zinc-800/50 rounded-md"></div>
                    <div className="h-4 w-5/6 bg-zinc-800/50 rounded-md"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
