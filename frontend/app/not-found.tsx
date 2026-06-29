import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-24 h-24 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl flex items-center justify-center mx-auto transform rotate-12 mb-8">
          <FileQuestion className="w-12 h-12 text-indigo-500 transform -rotate-12" />
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
        <h2 className="text-xl font-medium text-zinc-300">Page not found</h2>
        
        <p className="text-zinc-400 max-w-sm mx-auto pt-2 pb-6">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>

        <Link
          href="/upload"
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-8 py-3.5 rounded-full transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
