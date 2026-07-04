import React from "react";
import Shimmer from "../ui/Shimmer";

export default function DashboardSkeleton() {
  return (
    <div className="text-white p-6 sm:p-12 w-full h-full animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-8 border-b border-zinc-800">
          <div className="space-y-3">
            <Shimmer className="h-8 w-48 rounded-lg" />
            <Shimmer className="h-4 w-72 rounded-lg" />
          </div>
          <Shimmer className="h-12 w-48 rounded-xl" />
        </div>

        {/* Quick Actions & Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-8 border-b border-zinc-800">
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-3xl flex items-center gap-4">
                <Shimmer className="w-12 h-12 rounded-2xl shrink-0" />
                <div className="space-y-2 w-full">
                  <Shimmer className="h-4 w-24" />
                  <Shimmer className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
          <div className="md:col-span-1 bg-zinc-900/50 border border-zinc-800 p-4 rounded-3xl flex flex-col justify-center items-center">
            <Shimmer className="h-5 w-24 mb-2" />
            <Shimmer className="h-8 w-12" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-zinc-800 pb-px">
          <Shimmer className="h-6 w-32 mb-2" />
          <Shimmer className="h-6 w-24 mb-2" />
        </div>

        {/* List Content */}
        <div className="space-y-12">
          <Shimmer className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between min-h-[380px]">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Shimmer className="h-5 w-24 rounded-full" />
                    <Shimmer className="h-4 w-16" />
                  </div>
                  <Shimmer className="h-10 w-20" />
                  <Shimmer className="h-6 w-3/4" />
                  <Shimmer className="h-4 w-full" />
                  <Shimmer className="h-4 w-5/6" />
                </div>
                <div className="flex gap-2 mt-4">
                  <Shimmer className="h-10 flex-1 rounded-xl" />
                  <Shimmer className="h-10 flex-1 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
