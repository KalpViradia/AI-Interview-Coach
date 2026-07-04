import React from "react";
import Shimmer from "../ui/Shimmer";

export default function ReportSkeleton() {
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
        
        {/* Readiness Badge */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 flex flex-col sm:flex-row items-center gap-6">
          <Shimmer className="w-[60px] h-[60px] rounded-full shrink-0" />
          <div className="flex-1 w-full space-y-3">
            <Shimmer className="h-4 w-40" />
            <Shimmer className="h-8 w-64" />
            <Shimmer className="h-6 w-32" />
            <Shimmer className="h-2 w-full max-w-xs rounded-full" />
            <Shimmer className="h-4 w-32" />
          </div>
        </div>

        {/* Statistics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center gap-2">
              <Shimmer className="w-8 h-8 rounded-md" />
              <Shimmer className="h-3 w-20" />
              <Shimmer className="h-5 w-16" />
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Overall Score */}
          <div className="md:col-span-1 p-8 rounded-3xl border border-zinc-800 bg-zinc-900/50 flex flex-col items-center text-center">
            <Shimmer className="h-4 w-28 mb-2" />
            <Shimmer className="h-16 w-32 mb-4" />
            <Shimmer className="h-8 w-40 rounded-full mb-8" />
            
            <div className="w-full space-y-4 pt-6 border-t border-zinc-800">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between items-center px-4 py-2.5 bg-zinc-900 rounded-xl">
                  <Shimmer className="h-4 w-32" />
                  <Shimmer className="h-4 w-10" />
                </div>
              ))}
            </div>
          </div>

          {/* Executive Summary & Strengths/Weaknesses */}
          <div className="md:col-span-2 space-y-6 flex flex-col">
            <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex-1">
              <Shimmer className="h-6 w-48 mb-6" />
              <div className="space-y-3">
                <Shimmer className="h-4 w-full" />
                <Shimmer className="h-4 w-full" />
                <Shimmer className="h-4 w-5/6" />
                <Shimmer className="h-4 w-full" />
                <Shimmer className="h-4 w-4/5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/50">
                <Shimmer className="h-5 w-32 mb-6" />
                <div className="space-y-4">
                  <Shimmer className="h-4 w-full" />
                  <Shimmer className="h-4 w-5/6" />
                  <Shimmer className="h-4 w-4/5" />
                </div>
              </div>
              <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/50">
                <Shimmer className="h-5 w-40 mb-6" />
                <div className="space-y-4">
                  <Shimmer className="h-4 w-full" />
                  <Shimmer className="h-4 w-5/6" />
                  <Shimmer className="h-4 w-4/5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Roadmap */}
        <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 mt-8">
          <Shimmer className="h-5 w-64 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-5 p-5 rounded-2xl bg-zinc-950/50 border border-zinc-800/80">
                <Shimmer className="w-10 h-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2 mt-1">
                  <Shimmer className="h-4 w-full" />
                  <Shimmer className="h-4 w-5/6" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-12 border-t border-zinc-800 mt-12">
          <Shimmer className="h-14 w-48 rounded-2xl" />
          <Shimmer className="h-14 w-56 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
