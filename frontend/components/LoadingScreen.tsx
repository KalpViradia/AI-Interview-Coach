"use client";

import { BrainCircuit } from "lucide-react";
import { motion } from "framer-motion";

export default function LoadingScreen({ message = "Loading AI Interview Coach..." }: { message?: string }) {
  return (
    <div className="w-full h-full min-h-[50vh] flex-1 flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center mb-8">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-indigo-500/20 blur-[50px] rounded-full w-32 h-32" />
        
        {/* Pulsing ring */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 border border-indigo-500/50 rounded-full w-32 h-32"
        />
        
        {/* Inner container */}
        <div className="relative w-24 h-24 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.2)]">
          <BrainCircuit className="w-10 h-10 text-indigo-500 animate-pulse" />
        </div>
      </div>
      
      <motion.h2 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 tracking-wide"
      >
        {message}
      </motion.h2>
      
      {/* Loading bar */}
      <div className="w-48 h-1 bg-zinc-900 rounded-full mt-6 overflow-hidden">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-1/2 h-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
        />
      </div>
    </div>
  );
}
