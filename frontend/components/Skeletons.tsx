"use client";

import SidebarLayout from "./SidebarLayout";

export function DashboardSkeleton() {
  return (
    <SidebarLayout>
      <div className="p-8 w-full max-w-7xl mx-auto animate-pulse flex flex-col h-full">
        <div className="h-10 w-64 bg-zinc-800 rounded-lg mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-zinc-900/50 rounded-2xl border border-zinc-800"></div>
          ))}
        </div>
        <div className="flex-1 min-h-[300px] bg-zinc-900/50 rounded-2xl border border-zinc-800"></div>
      </div>
    </SidebarLayout>
  );
}

export function AuthSkeleton() {
  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-6 animate-pulse">
      <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 h-[500px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-zinc-800 rounded-2xl mb-4"></div>
          <div className="h-8 w-48 bg-zinc-800 rounded mb-2"></div>
          <div className="h-4 w-32 bg-zinc-800 rounded"></div>
        </div>
        <div className="space-y-6">
          <div>
            <div className="h-4 w-16 bg-zinc-800 rounded mb-2"></div>
            <div className="h-12 bg-zinc-800/50 rounded-lg border border-zinc-800"></div>
          </div>
          <div>
            <div className="h-4 w-20 bg-zinc-800 rounded mb-2"></div>
            <div className="h-12 bg-zinc-800/50 rounded-lg border border-zinc-800"></div>
          </div>
          <div className="h-12 bg-zinc-800 rounded-lg mt-4"></div>
        </div>
      </div>
    </div>
  );
}

export function InterviewSkeleton() {
  return (
    <SidebarLayout>
      <div className="h-full min-h-screen bg-black flex flex-col xl:flex-row border-t border-zinc-900">
        <div className="hidden xl:flex w-80 shrink-0 border-r border-zinc-900 bg-zinc-950/30 p-8 flex-col overflow-y-auto">
          <div className="flex-1">
            <div className="h-3 w-32 bg-zinc-800 rounded mb-8 animate-pulse" />
            <div className="space-y-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 animate-pulse" />
                  <div className="h-4 w-24 bg-zinc-900 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          <div className="pt-8 mt-8 border-t border-zinc-900">
            <div className="h-3 w-24 bg-zinc-800 rounded mb-4 animate-pulse" />
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl mb-6 h-16 animate-pulse" />
            <div className="h-12 w-full rounded-xl bg-zinc-900 animate-pulse" />
          </div>
        </div>
        <div className="flex-1 flex flex-col p-6 lg:p-12 h-[calc(100vh-2rem)] overflow-y-auto w-full max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="h-8 w-48 bg-zinc-800 rounded mb-2 animate-pulse" />
              <div className="h-4 w-24 bg-zinc-900 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-20 bg-zinc-800 rounded-full animate-pulse" />
              <div className="h-10 w-10 bg-zinc-800 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="flex-1 flex flex-col min-h-[400px]">
            <div className="flex flex-col flex-1">
              <div className="flex-1 w-full rounded-2xl bg-zinc-900/30 border border-zinc-800/50 animate-pulse" />
              <div className="mt-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 animate-pulse h-16" />
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
