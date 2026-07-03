"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  PlusCircle, 
  LogOut, 
  Menu, 
  X,
  User,
  FileText,
  LogIn,
  UserPlus,
  Info,
  Target,
  Mic,
  Library
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import WakeupNotification from "@/components/WakeupNotification";
import { workflowState } from "@/lib/workflow-state";
import { useDialog } from "@/components/ui/dialog/useDialog";
import { useRateLimit } from "@/components/providers/RateLimitProvider";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

import { Suspense } from "react";

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  return (
    <Suspense fallback={<div className="h-full bg-black text-white flex items-center justify-center">Loading layout...</div>}>
      <SidebarLayoutInner>{children}</SidebarLayoutInner>
    </Suspense>
  );
}

function SidebarLayoutInner({ children }: SidebarLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { showConfirm } = useDialog();
  const { status: rateLimitStatus } = useRateLimit();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (workflowState.isActive) {
      e.preventDefault();
      
      if (rateLimitStatus === "paused" || workflowState.isPaused) {
        showConfirm({
          title: "Leave Interview?",
          message: "The AI service is temporarily unavailable and your interview is currently paused.\n\nYour interview progress has already been saved. You can resume this interview later.",
          confirmText: "Continue",
          cancelText: "Stay",
          cancelVariant: "primary",
          onConfirm: () => {
            workflowState.isActive = false;
            workflowState.isPaused = false;
            router.push(href);
          }
        });
      } else {
        showConfirm({
          title: "Interrupt Interview?",
          message: "You currently have an interview in progress. Leaving now will end the session, and any unanswered questions will be lost. This action cannot be undone.",
          confirmText: "Leave Interview",
          cancelText: "Stay & Continue",
          cancelVariant: "primary",
          onConfirm: () => {
            workflowState.isActive = false;
            router.push(href);
          }
        });
      }
    }
  };

  useEffect(() => {
    document.body.classList.add("has-sidebar");
    return () => {
      document.body.classList.remove("has-sidebar");
    };
  }, []);

  // If loading, return null to prevent any content flash
  if (status === "loading") {
    return null;
  }

  const isAuthenticated = status === "authenticated";

  // Build nav links based on auth status
  const navLinks = isAuthenticated
    ? [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "My Resumes", href: "/resumes", icon: Library },
        { name: "New Session", href: "/upload", icon: PlusCircle },
        { name: "ATS Check", href: "/upload?mode=ats", icon: Target },
        { name: "Resume Chat", href: "/resume-chat", icon: FileText },
      ]
    : [
        { name: "New Session", href: "/upload", icon: PlusCircle },
        { name: "ATS Check", href: "/upload?mode=ats", icon: Target },
        { name: "Resume Chat", href: "/resume-chat", icon: FileText },
      ];

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800 text-zinc-300">
      <div className="p-6 flex items-center gap-3 border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-3">
          <img src="/icon.png" alt="AI Coach Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-indigo-500/20" />
          <span className="font-bold text-lg text-white tracking-tight">AI Coach</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 px-2">Menu</div>
        {navLinks.map((link) => {
          let isActive = pathname.startsWith(link.href.split("?")[0]);
          
          if (pathname === "/upload") {
            const mode = searchParams.get("mode");
            if (mode === "ats") {
              isActive = link.href === "/upload?mode=ats";
            } else {
              isActive = link.href === "/upload";
            }
          }
          
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? "bg-indigo-600/10 text-indigo-400 font-medium" 
                  : "hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-indigo-400" : "text-zinc-500"}`} />
              {link.name}
            </Link>
          );
        })}
      </div>

      {/* Bottom Section — Auth-dependent */}
      <div className="p-4 border-t border-zinc-800">
        <Link
          href="/about"
          onClick={(e) => handleNavClick(e, "/about")}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-4 ${
            pathname.startsWith("/about")
              ? "bg-indigo-600/10 text-indigo-400 font-medium" 
              : "hover:bg-zinc-900 hover:text-white text-zinc-400"
          }`}
        >
          <Info className={`w-5 h-5 ${pathname.startsWith("/about") ? "text-indigo-400" : "text-zinc-500"}`} />
          <span className="font-medium text-sm">About Project</span>
        </Link>
        
        <div className="border-t border-zinc-800 mb-4 -mx-4"></div>

        {isAuthenticated ? (
          <>
            <div className="flex items-center gap-3 px-2 py-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 shrink-0">
                <User className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{session?.user?.name || "User"}</p>
                <p className="text-xs text-zinc-500 truncate">{session?.user?.email || ""}</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                if (workflowState.isActive) {
                  e.preventDefault();
                  showConfirm({
                    title: "Interrupt Interview?",
                    message: "You currently have an interview in progress. Leaving now will end the session, and any unanswered questions will be lost. This action cannot be undone.",
                    confirmText: "Leave Interview",
                    cancelText: "Stay & Continue",
                    cancelVariant: "primary",
                    onConfirm: () => {
                      workflowState.isActive = false;
                      signOut({ callbackUrl: "/login" });
                    }
                  });
                } else {
                  signOut({ callbackUrl: "/login" });
                }
              }}
              className="mt-2 w-full flex items-center justify-start gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-2 py-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50 shrink-0">
                <User className="w-5 h-5 text-zinc-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-300">Guest Mode</p>
                <p className="text-xs text-zinc-500">Sign in to save progress</p>
              </div>
            </div>
            <Link
              href="/login"
              onClick={(e) => handleNavClick(e, "/login")}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={(e) => handleNavClick(e, "/register")}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Create Account
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col md:flex-row bg-black overflow-hidden selection:bg-indigo-500/30">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-72 h-full shrink-0">
        {renderSidebarContent()}
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 z-50 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <img src="/icon.png" alt="AI Coach Logo" className="w-8 h-8 rounded-lg shadow-md shadow-indigo-500/20" />
          <span className="font-bold text-white">AI Coach</span>
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 text-zinc-400 hover:text-white"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-zinc-950 z-50 md:hidden shadow-2xl border-r border-zinc-800"
            >
              <div className="absolute top-4 right-4 z-50">
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderSidebarContent()}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div id="main-scroll-container" className="flex-1 h-full overflow-y-auto bg-black pt-16 md:pt-0 relative">
        <main className="h-full">
          {children}
        </main>
      </div>
    </div>
  );
}
