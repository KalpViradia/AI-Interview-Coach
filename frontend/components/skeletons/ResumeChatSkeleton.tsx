import React from "react";

export default function ResumeChatSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen p-6 md:p-12 max-w-6xl mx-auto w-full animate-in fade-in duration-500">
      <div className="flex-none mb-6 space-y-2">
        <div className="h-8 w-48 bg-zinc-800 rounded-lg animate-pulse"></div>
        <div className="h-4 w-96 bg-zinc-800/50 rounded-lg animate-pulse"></div>
      </div>

      <div className="flex-1 flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-pulse">
        {/* Chat Header Skeleton */}
        <div className="px-6 py-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-800 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-zinc-800 rounded-md"></div>
              <div className="h-3 w-16 bg-zinc-800/50 rounded-md"></div>
            </div>
          </div>
          <div className="h-4 w-20 bg-zinc-800 rounded-md"></div>
        </div>

        {/* Chat Area Skeleton */}
        <div className="flex-1 p-6 space-y-6 overflow-hidden">
          {/* Assistant Msg */}
          <div className="flex justify-start">
            <div className="flex gap-4 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0"></div>
              <div className="rounded-2xl p-5 bg-zinc-800/50 rounded-tl-none w-64 h-24"></div>
            </div>
          </div>
          {/* User Msg */}
          <div className="flex justify-end">
            <div className="flex gap-4 max-w-[80%] flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0"></div>
              <div className="rounded-2xl p-5 bg-zinc-800 rounded-tr-none w-48 h-16"></div>
            </div>
          </div>
          {/* Assistant Msg */}
          <div className="flex justify-start">
            <div className="flex gap-4 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0"></div>
              <div className="rounded-2xl p-5 bg-zinc-800/50 rounded-tl-none w-80 h-32"></div>
            </div>
          </div>
        </div>

        {/* Input Area Skeleton */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800">
          <div className="w-full h-[58px] bg-zinc-950 border border-zinc-800 rounded-xl relative">
            <div className="absolute right-2 top-2 bottom-2 w-10 bg-zinc-800 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
