"use client";

import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  FileText, 
  Palette, 
  Sparkles, 
  Download 
} from "lucide-react";

export type StudioTabId = "overview" | "text" | "design" | "optimize" | "export";

interface Tab {
  id: StudioTabId;
  label: string;
  icon: React.ElementType;
}

const tabs: Tab[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "text", label: "Extracted Text", icon: FileText },
  { id: "design", label: "Design", icon: Palette },
  { id: "optimize", label: "AI Optimize", icon: Sparkles },
  { id: "export", label: "Export", icon: Download },
];

interface StudioTabsProps {
  activeTab: StudioTabId;
  onTabChange: (tab: StudioTabId) => void;
}

export default function StudioTabs({ activeTab, onTabChange }: StudioTabsProps) {
  return (
    <div className="relative">
      {/* Glassmorphism tab bar */}
      <div className="flex items-center gap-1 p-1.5 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors duration-200
                ${isActive 
                  ? "text-white" 
                  : "text-zinc-500 hover:text-zinc-300"
                }
              `}
            >
              {/* Animated background pill */}
              {isActive && (
                <motion.div
                  layoutId="studio-tab-bg"
                  className="absolute inset-0 bg-gradient-to-r from-indigo-600/80 to-violet-600/80 rounded-xl shadow-lg shadow-indigo-500/20"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}

              <span className="relative z-10 flex items-center gap-2">
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-200" : ""}`} />
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Subtle glow under active tab */}
      <div className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
    </div>
  );
}
