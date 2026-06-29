import SidebarLayout from "@/components/SidebarLayout";

export default function InterviewLoading() {
  return (
    <SidebarLayout>
      <div className="h-[calc(100vh-2rem)] min-h-screen bg-black grid grid-cols-1 xl:grid-cols-4 border-t border-zinc-900 animate-pulse">
        
        {/* Left Sidebar Skeleton */}
        <div className="hidden xl:flex col-span-1 border-r border-zinc-900 bg-zinc-950/30 p-8 flex-col">
          <div className="h-4 w-32 bg-zinc-800 rounded-md mb-8"></div>
          <div className="space-y-6 flex-1">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-zinc-800"></div>
                <div className="h-4 w-24 bg-zinc-800 rounded-md"></div>
              </div>
            ))}
          </div>
          <div className="pt-8 mt-8 border-t border-zinc-900">
            <div className="h-12 w-full bg-zinc-800 rounded-xl"></div>
          </div>
        </div>

        {/* Middle Canvas Skeleton */}
        <div className="col-span-1 xl:col-span-3 flex flex-col p-6 lg:p-12 max-w-5xl mx-auto w-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="h-8 w-48 bg-zinc-800 rounded-lg mb-2"></div>
              <div className="h-4 w-32 bg-zinc-800 rounded-md"></div>
            </div>
            <div className="h-8 w-24 bg-zinc-800 rounded-full"></div>
          </div>

          {/* Question Area */}
          <div className="mb-10">
            <div className="h-4 w-32 bg-zinc-800 rounded-md mb-4"></div>
            <div className="h-8 w-full bg-zinc-800 rounded-lg mb-3"></div>
            <div className="h-8 w-3/4 bg-zinc-800 rounded-lg"></div>
          </div>

          {/* Interactive Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 w-full p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 mb-6"></div>
            <div className="h-16 w-full rounded-2xl bg-zinc-900/80 border border-zinc-800"></div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
