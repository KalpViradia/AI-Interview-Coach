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
  Library,
  ChevronLeft,
  ChevronRight,
  Settings
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import WakeupNotification from "@/components/WakeupNotification";
import { workflowState } from "@/lib/workflow-state";
import { useDialog } from "@/components/ui/dialog/useDialog";
import { useRateLimit } from "@/components/providers/RateLimitProvider";
import { Tooltip } from "@/components/ui/Tooltip";
import { getMyProfile, UserProfileResponse, getOptimizedAvatarUrl } from "@/lib/api-client";

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
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);

  // Desktop sidebar state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const sidebarWidth = isCollapsed ? 72 : 288; // Fixed widths

  // Initialize from local storage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebarCollapsed");
    if (savedCollapsed) setIsCollapsed(savedCollapsed === "true");

    // Enable transitions after a short delay to avoid animating the initial mount state
    const timer = setTimeout(() => setIsMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isCollapsed.toString());
  }, [isCollapsed]);

  useEffect(() => {
    if (status === "authenticated") {
      getMyProfile()
        .then(setProfile)
        .catch(console.error);
    }
  }, [status, pathname]); // Re-fetch on pathname change to catch avatar updates

  const getWorkflowContext = () => {
    const isOnInterview = pathname.startsWith("/interview");
    const isOnSetup = pathname.startsWith("/upload") || pathname === "/interview/new" || pathname.startsWith("/ats");
    const isOnAnalysis = pathname.startsWith("/analysis");

    if (isOnInterview && pathname !== "/interview/new") {
      return {
        title: "Interrupt Interview?",
        message: "You currently have an interview in progress. Leaving now will end the session, and any unanswered questions will be lost. This action cannot be undone.",
        confirmText: "Leave Interview",
        cancelText: "Stay & Continue",
      };
    }
    if (isOnSetup) {
      return {
        title: "Cancel Processing?",
        message: "Your session is currently being prepared. Leaving now will cancel the ongoing analysis and you will need to start over.",
        confirmText: "Leave Anyway",
        cancelText: "Wait",
      };
    }
    if (isOnAnalysis) {
      return {
        title: "Leave Analysis?",
        message: "Your analysis results are currently loaded. If you leave, you may need to re-run the analysis.",
        confirmText: "Leave",
        cancelText: "Stay",
      };
    }
    return {
      title: "Leave Page?",
      message: "An operation is currently in progress. Leaving now may cause you to lose unsaved progress.",
      confirmText: "Leave",
      cancelText: "Stay",
    };
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.stopPropagation();
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
        const ctx = getWorkflowContext();
        showConfirm({
          title: ctx.title,
          message: ctx.message,
          confirmText: ctx.confirmText,
          cancelText: ctx.cancelText,
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


  const isAuthenticated = status === "authenticated";

  // Build nav links based on auth status
  const navLinks = isAuthenticated
    ? [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "My Resumes", href: "/resumes", icon: Library },
      { name: "New Interview", href: "/interview/new", icon: PlusCircle },
      { name: "ATS Check", href: "/ats/new", icon: Target },
      { name: "Resume Chat", href: "/resume-chat", icon: FileText },
    ]
    : [
      { name: "New Interview", href: "/interview/new", icon: PlusCircle },
      { name: "ATS Check", href: "/ats/new", icon: Target },
      { name: "Resume Chat", href: "/resume-chat", icon: FileText },
    ];

  const renderSidebarContent = (forceExpand = false) => {
    const collapsed = !forceExpand && isCollapsed;

    return (
      <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800 text-zinc-300 relative overflow-x-hidden">
        <div className={`p-6 flex items-center gap-3 border-b border-zinc-800 ${collapsed ? 'justify-center px-0' : 'justify-between'}`}>
          <Link href="/" onClick={(e) => handleNavClick(e, "/")} className="flex items-center gap-3 overflow-hidden">
            <img src="/icon.png" alt="SkillMock Logo" className="w-10 h-10 shrink-0 object-contain mix-blend-lighten" />
            {!collapsed && <span className="font-bold text-lg text-white tracking-tight whitespace-nowrap">SkillMock</span>}
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 space-y-2 px-2 w-full">
          {/* Menu Label */}
          <div className={`text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 pl-[6px] whitespace-nowrap transition-opacity duration-300 ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-150'}`}>Menu</div>
          {navLinks.map((link) => {
            let isActive = pathname.startsWith(link.href.split("?")[0]);

            if (link.href === "/interview/new") {
              const mode = searchParams.get("mode");
              isActive = pathname === "/interview/new" || (pathname === "/upload" && mode !== "ats");
            } else if (link.href === "/ats/new") {
              const mode = searchParams.get("mode");
              isActive = pathname.startsWith("/ats") || (pathname === "/upload" && mode === "ats");
            }

            const Icon = link.icon;
            const LinkContent = (
              <Link
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`relative group flex items-center w-full h-11 rounded-xl overflow-hidden transition-colors ${
                  isActive
                    ? "bg-indigo-600/10"
                    : "hover:bg-zinc-900/50"
                }`}
              >
                <div className="absolute left-[6px] w-11 h-11 flex items-center justify-center shrink-0">
                  <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                </div>
                <span className={`absolute left-14 whitespace-nowrap text-sm font-medium transition-opacity duration-300 ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-150'} ${isActive ? "text-indigo-400" : "text-zinc-400 group-hover:text-white"}`}>
                  {link.name}
                </span>
              </Link>
            );

            return collapsed ? (
              <Tooltip key={link.name} content={link.name} disabled={!collapsed}>
                {LinkContent}
              </Tooltip>
            ) : LinkContent;
          })}
        </div>

        {/* Bottom Section — Auth-dependent */}
        <div className="px-2 pb-4 pt-6 border-t border-zinc-800 flex flex-col w-full">
          {(() => {
            const AboutLinkContent = (
              <Link
                href="/about"
                onClick={(e) => handleNavClick(e, "/about")}
                className={`relative group flex items-center rounded-xl overflow-hidden transition-colors w-full h-11 mb-6 ${
                  pathname.startsWith("/about")
                    ? "bg-indigo-600/10"
                    : "hover:bg-zinc-900/50"
                }`}
              >
                <div className="absolute left-[6px] w-11 h-11 flex items-center justify-center shrink-0">
                  <Info className={`w-5 h-5 transition-colors ${pathname.startsWith("/about") ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                </div>
                <span className={`absolute left-14 whitespace-nowrap text-sm font-medium transition-opacity duration-300 ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-150'} ${pathname.startsWith("/about") ? "text-indigo-400" : "text-zinc-400 group-hover:text-white"}`}>
                  About SkillMock
                </span>
              </Link>
            );

            const AboutNode = collapsed ? (
              <Tooltip content="About SkillMock" disabled={!collapsed}>
                {AboutLinkContent}
              </Tooltip>
            ) : AboutLinkContent;

            return (
              <>
                {AboutNode}

                {isAuthenticated ? (
                  <div className="w-full rounded-2xl bg-zinc-900/40 border border-zinc-800/50 p-1.5 hover:bg-zinc-900/80 hover:border-zinc-700/50 transition-colors cursor-default overflow-hidden flex flex-col">
                    
                    {/* Avatar Row */}
                    <Tooltip content={profile?.name || session?.user?.name || "Profile"} disabled={!collapsed}>
                      <div className="relative w-full h-11 flex items-center">
                        <div className={`absolute left-0 w-11 h-11 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 shrink-0 overflow-hidden shadow-sm transition-all ${collapsed ? 'cursor-pointer hover:ring-2 hover:ring-indigo-500/50' : 'group-hover:ring-2 group-hover:ring-indigo-500/30'}`}>
                          {profile?.avatar_url ? (
                            <img src={getOptimizedAvatarUrl(profile.avatar_url)} alt="Avatar" className="w-full h-full object-cover" />
                          ) : profile?.name ? (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                              {profile.name.charAt(0).toUpperCase()}
                            </div>
                          ) : (
                            <User className="w-5 h-5 text-zinc-400" />
                          )}
                        </div>
                        
                        <div className={`absolute left-14 flex flex-col justify-center whitespace-nowrap transition-opacity duration-300 ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-150'}`}>
                          <p className="text-base font-semibold text-white leading-tight tracking-tight">{profile?.name || session?.user?.name || "User"}</p>
                          <p className="text-[13px] text-zinc-500 mt-0.5 leading-none">{profile?.email || session?.user?.email || ""}</p>
                        </div>
                      </div>
                    </Tooltip>

                    <div className="h-px w-full bg-zinc-800/50 my-1.5"></div>

                    {/* Sign Out Button */}
                    <Tooltip content="Sign Out" disabled={!collapsed}>
                      <button
                        onClick={(e) => {
                          if (workflowState.isActive) {
                            e.preventDefault();
                            const ctx = getWorkflowContext();
                            showConfirm({
                              title: ctx.title,
                              message: ctx.message,
                              confirmText: ctx.confirmText,
                              cancelText: ctx.cancelText,
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
                        className="relative w-full h-11 flex items-center rounded-xl hover:bg-red-500/10 transition-colors group text-zinc-400 hover:text-red-400 overflow-hidden"
                      >
                        <div className="absolute left-0 w-11 h-11 flex items-center justify-center shrink-0">
                          <LogOut className="w-5 h-5 transition-colors group-hover:text-red-400" />
                        </div>
                        <span className={`absolute left-11 whitespace-nowrap text-sm font-medium transition-opacity duration-300 ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-150'}`}>
                          Sign Out
                        </span>
                      </button>
                    </Tooltip>
                  </div>
                ) : (
                  <div className="w-full rounded-2xl bg-zinc-900/40 border border-zinc-800/50 p-1.5 hover:bg-zinc-900/80 hover:border-zinc-700/50 transition-colors cursor-default overflow-hidden flex flex-col">
                    
                    {/* Guest Avatar Row */}
                    <Tooltip content="Guest Mode" disabled={!collapsed}>
                      <div className="relative w-full h-11 flex items-center">
                        <div className="absolute left-0 w-11 h-11 rounded-full bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50 shrink-0 overflow-hidden shadow-sm">
                          <User className="w-5 h-5 text-zinc-500" />
                        </div>
                        
                        <div className={`absolute left-14 flex flex-col justify-center whitespace-nowrap transition-opacity duration-300 ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-150'}`}>
                          <p className="text-base font-semibold text-zinc-200 leading-tight tracking-tight">Guest Mode</p>
                          <p className="text-[13px] text-zinc-500 mt-0.5 leading-none">Sign in to save interviews</p>
                        </div>
                      </div>
                    </Tooltip>

                    <div className="h-px w-full bg-zinc-800/50 my-1.5"></div>

                    {/* Sign In Button */}
                    <Tooltip content="Sign In" disabled={!collapsed}>
                      <Link
                        href="/login"
                        onClick={(e) => handleNavClick(e, "/login")}
                        className={`relative w-full h-11 flex items-center rounded-xl transition-colors overflow-hidden group ${collapsed ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20'}`}
                      >
                        <div className="absolute left-0 w-11 h-11 flex items-center justify-center shrink-0">
                          <LogIn className="w-5 h-5 text-white" />
                        </div>
                        <span className={`absolute left-11 whitespace-nowrap text-sm font-semibold text-white transition-opacity duration-300 ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-150'}`}>
                          Sign In
                        </span>
                      </Link>
                    </Tooltip>

                    {/* Create Account Button */}
                    <Tooltip content="Create Account" disabled={!collapsed}>
                      <Link
                        href="/register"
                        onClick={(e) => handleNavClick(e, "/register")}
                        className={`relative w-full h-11 flex items-center rounded-xl transition-colors overflow-hidden group mt-1 ${collapsed ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-800/50'}`}
                      >
                        <div className="absolute left-0 w-11 h-11 flex items-center justify-center shrink-0">
                          <UserPlus className="w-5 h-5 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                        </div>
                        <span className={`absolute left-11 whitespace-nowrap text-sm font-medium text-zinc-300 group-hover:text-white transition-opacity duration-300 ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-150'}`}>
                          Create Account
                        </span>
                      </Link>
                    </Tooltip>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-black overflow-hidden selection:bg-indigo-500/30">
      {/* Desktop Sidebar */}
      <div
        className={`hidden md:block h-full shrink-0 relative ${isMounted ? 'transition-[width] duration-300 ease-in-out' : ''} will-change-[width]`}
        style={{ width: `${sidebarWidth}px` }}
      >
        {renderSidebarContent()}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-1/2 -translate-y-1/2 -right-3 z-50 flex items-center justify-center w-6 h-6 bg-zinc-800 border border-zinc-700 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors shadow-sm"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 z-50 flex items-center justify-between px-4">
        <Link href="/" onClick={(e) => handleNavClick(e, "/")} className="flex items-center gap-2">
          <img src="/icon.png" alt="SkillMock Logo" className="w-8 h-8 shrink-0 object-contain mix-blend-lighten" />
          <span className="font-bold text-white">SkillMock</span>
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
              {renderSidebarContent(true)}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div id="main-scroll-container" className="flex-1 h-full overflow-y-auto overflow-x-hidden bg-black pt-16 md:pt-0 relative">
        <main className="h-full">
          {children}
        </main>
      </div>
    </div>
  );
}
