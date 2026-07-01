"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, Send, FileText, BrainCircuit, Loader2, Bot, User, CheckCircle2 } from "lucide-react";
import SidebarLayout from "@/components/SidebarLayout";
import DocumentUpload from "@/components/DocumentUpload";
import ReactMarkdown from "react-markdown";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { getResumes, ResumeResponse, managedFetch, APIError } from "@/lib/api-client";
import { useDialog } from "@/components/ui/dialog/useDialog";
import { RateLimitBanner } from "@/components/RateLimitBanner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  cached?: boolean;
};

import { Suspense } from "react";
import BackToTop from "@/components/ui/BackToTop";

function ResumeChatContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const isAuthenticated = status === "authenticated";
  const { showPrompt } = useDialog();

  const [resumeSource, setResumeSource] = useState<"vault" | "upload">("upload");
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  const [rateLimitData, setRateLimitData] = useState<{message: string, retryAfter: number, pendingQuery: string} | null>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isAuthenticated) {
      getResumes().then(data => {
        setResumes(data);
        if (data.length > 0) {
          setResumeSource("vault");
          const targetId = searchParams.get("resumeId");
          const exists = data.find(r => r.id === targetId);
          setSelectedResumeId(exists ? exists.id : data[0].id);
        }
      }).catch(err => console.error("Failed to fetch resumes", err));
    }
  }, [isAuthenticated, searchParams]);

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (resumeSource === "upload" && !file && !text.trim()) {
      setError("Please select a file to upload or paste your resume text.");
      return;
    }
    
    if (resumeSource === "vault" && !selectedResumeId) {
      setError("Please select a resume from your vault.");
      return;
    }

    setIsUploading(true);

    try {
      let res;
      
      const token = isAuthenticated ? await fetch("/api/auth/token").then(r => r.json()).then(d => d.token).catch(()=>"") : "";
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      if (resumeSource === "upload") {
        const doUpload = async (uploadFile: File) => {
          const formData = new FormData();
          formData.append("file", uploadFile);
          res = await managedFetch(`${API_BASE_URL}/resume-chat/upload`, {
            method: "POST",
            headers,
            body: formData,
          });
          
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || "Failed to initialize chat");
          }
          
          const data = await res.json();
          setSessionId(data.session_id);
          
          setMessages([
            {
              id: Date.now().toString(),
              role: "assistant",
              content: "I've successfully analyzed your resume! Ask me anything about your experience, or ask me to generate custom interview questions for you based on this resume."
            }
          ]);
        };

        if (!file && text.trim()) {
          setIsUploading(false); // pause loading for prompt
          showPrompt({
            title: "Resume Name",
            message: "Please enter a name for this pasted resume.",
            defaultValue: "Pasted Resume",
            confirmText: "Start Chat",
            onConfirm: async (filename) => {
              let finalName = filename || "Pasted Resume";
              if (!finalName.toLowerCase().endsWith('.txt')) {
                finalName += '.txt';
              }
              setIsUploading(true);
              try {
                const uploadFile = new File([text], finalName, { type: "text/plain" });
                await doUpload(uploadFile);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to process resume. Please try again.");
              } finally {
                setIsUploading(false);
              }
            },
            onCancel: () => {
              // do nothing, uploading is already false
            }
          });
          return; // exit early, rest of flow happens in onConfirm
        } else {
          const uploadFile = file!;
          await doUpload(uploadFile);
        }
      } else {
        headers["Content-Type"] = "application/json";
        res = await managedFetch(`${API_BASE_URL}/resume-chat/select`, {
          method: "POST",
          headers,
          body: JSON.stringify({ resume_id: selectedResumeId }),
        });
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to initialize chat");
        }
        
        const data = await res.json();
        setSessionId(data.session_id);
        
        setMessages([
          {
            id: Date.now().toString(),
            role: "assistant",
            content: "I've successfully analyzed your resume! Ask me anything about your experience, or ask me to generate custom interview questions for you based on this resume."
          }
        ]);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process resume. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId || isTyping) return;

    const query = input.trim();
    setInput("");
    
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", content: query }]);
    setIsTyping(true);

    try {
      const res = await managedFetch(`${API_BASE_URL}/resume-chat/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, query }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 429) {
          throw new APIError(429, errorData.detail?.message || "Rate limit", errorData.detail);
        }
        throw new Error(errorData.detail || "Failed to get answer");
      }
      const data = await res.json();
      
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: "assistant", 
        content: data.answer,
        cached: data.cached
      }]);
    } catch (err) {
      if (err instanceof APIError && err.status === 429) {
        // Keep the user message in transcript but don't show error message
        setRateLimitData({
          message: err.data?.message || "The AI service is temporarily busy. Please try again.",
          retryAfter: err.data?.retry_after || 20,
          pendingQuery: query
        });
      } else {
        const errorMessage = err instanceof Error ? err.message : "Sorry, I encountered an error. Please try again.";
        setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: errorMessage }]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleRetryRateLimit = () => {
    if (!rateLimitData) return;
    const query = rateLimitData.pendingQuery;
    setRateLimitData(null);
    
    // Instead of resending via handleSend which pushes a new user message,
    // we manually do the API call here to avoid duplicating the user's message in the UI
    setIsTyping(true);
    managedFetch(`${API_BASE_URL}/resume-chat/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, query }),
    }).then(async res => {
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 429) throw new APIError(429, errorData.detail?.message || "Rate limit", errorData.detail);
        throw new Error(errorData.detail || "Failed to get answer");
      }
      return res.json();
    }).then(data => {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: "assistant", 
        content: data.answer,
        cached: data.cached
      }]);
    }).catch(err => {
      if (err instanceof APIError && err.status === 429) {
        setRateLimitData({
          message: err.data?.message || "The AI service is temporarily busy.",
          retryAfter: err.data?.retry_after || 20,
          pendingQuery: query
        });
      } else {
        const errorMessage = err instanceof Error ? err.message : "Sorry, I encountered an error.";
        setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: errorMessage }]);
      }
    }).finally(() => {
      setIsTyping(false);
    });
  };

  return (
    <SidebarLayout>
      <RateLimitBanner 
        show={!!rateLimitData} 
        message={rateLimitData?.message || ""} 
        retryAfter={rateLimitData?.retryAfter || 20} 
        onRetry={handleRetryRateLimit}
        onCancel={() => {
          setRateLimitData(null);
          setIsTyping(false);
        }}
      />
      <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] p-4 md:p-8 max-w-6xl mx-auto w-full relative">
        {/* Background glow */}
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black"></div>

        <div className="flex-none mb-6 text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Resume Chat</h1>
          <p className="text-zinc-400">Upload your resume and ask questions or generate mock interview scenarios instantly.</p>
        </div>

        {!sessionId ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 max-w-2xl w-full">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Start a Chat Session</h2>
              
              <form onSubmit={handleStartChat} className="space-y-6">
                
                {isAuthenticated && resumes.length > 0 && (
                  <div className="flex gap-4 mb-4 justify-center">
                    <button type="button" onClick={() => setResumeSource("vault")}
                      className={`px-6 py-2 rounded-xl text-sm font-medium transition-colors ${resumeSource === "vault" ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}>
                      Use Saved Resume
                    </button>
                    <button type="button" onClick={() => setResumeSource("upload")}
                      className={`px-6 py-2 rounded-xl text-sm font-medium transition-colors ${resumeSource === "upload" ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}>
                      Upload New Document
                    </button>
                  </div>
                )}

                {resumeSource === "vault" && isAuthenticated ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {resumes.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedResumeId(r.id)}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          selectedResumeId === r.id 
                            ? "border-indigo-500 bg-indigo-500/10" 
                            : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-zinc-200 truncate pr-2">{r.display_name}</span>
                          {selectedResumeId === r.id && <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-zinc-500">Updated: {new Date(r.last_used).toLocaleDateString()}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="w-full text-left">
                    <DocumentUpload
                      id="chat-upload"
                      title="Upload Resume"
                      description="Accepts .pdf or .txt (Max 5MB)"
                      file={file}
                      text={text}
                      onFileChange={setFile}
                      onTextChange={setText}
                      onDropFile={async (f) => { setFile(f); }}
                      isLoading={false}
                      error={error}
                      onClearError={() => setError("")}
                    />
                  </div>
                )}

                {error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={(resumeSource === "upload" && !file && !text.trim()) || (resumeSource === "vault" && !selectedResumeId) || isUploading}
                  className="w-full py-4 rounded-xl font-bold transition-all bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(79,70,229,0.3)] flex justify-center items-center gap-2"
                >
                  {isUploading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                  ) : (
                    "Begin Chat"
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative z-10">
            {/* Header */}
            <div className="px-6 py-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30">
                  <BrainCircuit className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Resume Assistant</h3>
                  <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online
                  </p>
                </div>
              </div>
              <button onClick={() => setSessionId(null)} className="text-xs text-zinc-500 hover:text-white transition-colors">
                End Session
              </button>
            </div>

            {/* Chat History */}
            <div id="chat-scroll-container" className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
                  <div className={`flex gap-3 md:gap-4 max-w-[90%] md:max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-zinc-800 text-zinc-400" : "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]"}`}>
                      {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`rounded-2xl p-4 md:p-5 ${msg.role === "user" ? "bg-zinc-800 text-white rounded-tr-none" : "bg-zinc-900/80 border border-zinc-800 text-zinc-200 rounded-tl-none prose prose-invert max-w-none"}`}>
                      {msg.role === "assistant" && msg.cached && (
                        <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-500 mb-2 flex items-center gap-1">
                          ⚡ Lightning Cache Hit
                        </div>
                      )}
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start animate-in fade-in">
                  <div className="flex gap-4 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="rounded-2xl p-5 bg-zinc-900/80 border border-zinc-800 text-zinc-400 rounded-tl-none flex items-center gap-2">
                      <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-75" />
                      <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-150" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 bg-zinc-900 border-t border-zinc-800">
              <form onSubmit={handleSend} className="relative flex items-end">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e as unknown as React.FormEvent);
                    }
                  }}
                  rows={Math.min(5, Math.max(1, input.split('\n').length))}
                  placeholder="Ask a question about your resume..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-6 pr-16 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none overflow-y-auto custom-scrollbar"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 bottom-2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:shadow-none disabled:hover:scale-100"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

export default function ResumeChatPage() {
  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
        <ResumeChatContent />
      </Suspense>
      <BackToTop containerId="chat-scroll-container" />
    </>
  );
}
