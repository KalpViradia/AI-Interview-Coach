"use client";

import { useState, useCallback, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Briefcase, Loader2, ArrowRight, UploadCloud, CheckCircle2, User, Target, FileSearch } from "lucide-react";
import { uploadDocument, getResumes, ResumeResponse, managedFetch, APIError } from "@/lib/api-client";
import DocumentUpload from "@/components/DocumentUpload";
import SidebarLayout from "@/components/SidebarLayout";
import LoadingProcess from "@/components/LoadingProcess";
import UploadSkeleton from "@/components/skeletons/UploadSkeleton";
import { useSession } from "next-auth/react";
import { RateLimitBanner } from "@/components/RateLimitBanner";

type InterviewType = "general" | "resume_based" | "job_specific" | "ats_check";

function UploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const isAtsMode = searchParams.get("mode") === "ats";
  
  const [interviewType, setInterviewType] = useState<InterviewType>(isAtsMode ? "ats_check" : "general");
  const [resumeSource, setResumeSource] = useState<"vault" | "upload">("upload");
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoadingResume, setPdfLoadingResume] = useState(false);
  const [pdfLoadingJd, setPdfLoadingJd] = useState(false);
  const [error, setError] = useState("");
  const [rateLimitData, setRateLimitData] = useState<{message: string, retryAfter: number} | null>(null);

  const isAuthenticated = status === "authenticated";

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

  useEffect(() => {
    if (isAtsMode) {
      const timeout = setTimeout(() => setInterviewType("ats_check"), 0);
      return () => clearTimeout(timeout);
    }
  }, [isAtsMode]);

  const handleUploadResume = async (file: File) => {
    setPdfLoadingResume(true);
    try {
      const response = await uploadDocument(file, 'resume');
      setResumeText(response.text);
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : "Failed to parse Resume.");
    } finally {
      setPdfLoadingResume(false);
    }
  };

  const handleUploadJd = async (file: File) => {
    setPdfLoadingJd(true);
    try {
      const response = await uploadDocument(file, 'jd');
      setJdText(response.text);
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : "Failed to parse JD.");
    } finally {
      setPdfLoadingJd(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleStartInterview();
  };

  const handleStartInterview = async () => {
    const needsJd = interviewType === "job_specific" || interviewType === "ats_check";
    
    if (resumeSource === "upload" && !resumeText.trim()) {
      setError("Please provide a resume.");
      return;
    }
    if (resumeSource === "vault" && !selectedResumeId) {
      setError("Please select a resume from your vault.");
      return;
    }
    if (needsJd && !jdText.trim()) {
      setError("Please provide a job description for this interview type.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload: Record<string, string> = {
        interview_type: interviewType,
        jd_text: needsJd ? jdText : ""
      };
      
      if (resumeSource === "upload") {
        payload.resume_text = resumeText;
      } else {
        payload.resume_id = selectedResumeId;
        payload.resume_text = ""; // Will be fetched on backend
      }

      const response = await managedFetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api") + "/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(isAuthenticated ? { "Authorization": `Bearer ${await fetch("/api/auth/token").then(r => r.json()).then(d => d.token).catch(()=>"")}` } : {})
        },
        body: JSON.stringify(payload)
      }).then(async r => {
        if (!r.ok) {
           const errData = await r.json().catch(() => ({}));
           if (r.status === 429) {
             throw new APIError(429, errData.detail?.message || "Rate limit", errData.detail);
           }
           throw new Error(errData.detail || "Failed to start session");
        }
        return r.json();
      });
      
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`session_${response.session_id}`, JSON.stringify(response));
      }
      
      if (interviewType === "job_specific" || interviewType === "ats_check") {
        router.push(`/analysis?session_id=${response.session_id}${interviewType === 'ats_check' ? "&mode=ats" : ""}`);
      } else {
        router.push(`/interview?session_id=${response.session_id}`);
      }
    } catch (err: unknown) {
      if (err instanceof APIError && err.status === 429) {
        setRateLimitData({
          message: err.data?.message || "The AI service is temporarily busy. Please try again.",
          retryAfter: err.data?.retry_after || 20
        });
      } else {
        setError(err instanceof Error ? err.message : "Failed to start session. Please try again.");
      }
      setLoading(false);
    }
  };

  const handleRetryRateLimit = () => {
    setRateLimitData(null);
    handleStartInterview();
  };

  const renderInterviewTypeSelection = () => (
    <div className="space-y-4 mb-8">
      <h2 className="text-xl font-semibold text-white mb-4">1. Select Interview Type</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: "general", title: "General", icon: User, desc: "Uses your resume to ask general technical questions." },
          { id: "resume_based", title: "Resume-Based", icon: FileText, desc: "Focuses heavily on your projects and experience." },
          { id: "job_specific", title: "Job-Specific", icon: Target, desc: "Uses both your resume and a JD to tailor the interview." }
        ].map(type => (
          <button
            key={type.id}
            type="button"
            onClick={() => setInterviewType(type.id as InterviewType)}
            className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col gap-2 ${
              interviewType === type.id 
                ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)]" 
                : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${interviewType === type.id ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                <type.icon className="w-5 h-5" />
              </div>
              <span className={`font-semibold ${interviewType === type.id ? "text-indigo-400" : "text-zinc-300"}`}>
                {type.title}
              </span>
            </div>
            <p className="text-xs text-zinc-500">{type.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <SidebarLayout>
      <RateLimitBanner 
        show={!!rateLimitData} 
        message={rateLimitData?.message || ""} 
        retryAfter={rateLimitData?.retryAfter || 20} 
        onRetry={handleRetryRateLimit}
        onCancel={() => {
          setRateLimitData(null);
          setLoading(false);
        }}
      />
      <div className="min-h-screen bg-black text-zinc-50 flex flex-col items-center py-12 px-4 relative overflow-y-auto">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black"></div>
        
        <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading-process"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-10"
          >
            <LoadingProcess
              title={isAtsMode ? "Analyzing ATS Match" : "Preparing Your Interview"}
              description={
                isAtsMode 
                  ? "Comparing your resume against the job description." 
                  : "Analyzing your profile and generating personalized questions."
              }
              steps={
                interviewType === "job_specific" || interviewType === "ats_check"
                  ? [
                      "Uploading documents",
                      "Parsing resume & JD",
                      "Analyzing semantic match",
                      "Extracting skills gap",
                      "Generating final report",
                    ]
                  : [
                      "Uploading resume",
                      "Parsing resume content",
                      "Extracting technical skills",
                      "Understanding your experience",
                      "Generating personalized interview questions",
                      "Finalizing interview session",
                    ]
              }
            />
          </motion.div>
        ) : (
          <motion.div
            key="upload-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl w-full"
          >
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
                {isAtsMode ? "ATS Resume Check" : "Start New Session"}
              </h1>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                {isAtsMode 
                  ? "Select a resume and job description to get your ATS match score." 
                  : "Configure your mock interview. We'll tailor the questions to your profile."}
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {!isAtsMode && renderInterviewTypeSelection()}
                
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    {isAtsMode ? "1. Select Resume" : "2. Select Resume"}
                  </h2>
                  
                  {isAuthenticated && resumes.length > 0 && (
                    <div className="flex gap-4 mb-4">
                      <button type="button" onClick={() => setResumeSource("vault")}
                        disabled={loading}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${resumeSource === "vault" ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"} disabled:opacity-50 disabled:cursor-not-allowed`}>
                        Saved Resumes
                      </button>
                      <button type="button" onClick={() => setResumeSource("upload")}
                        disabled={loading}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${resumeSource === "upload" ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"} disabled:opacity-50 disabled:cursor-not-allowed`}>
                        Upload New
                      </button>
                    </div>
                  )}
                  
                  {resumeSource === "vault" && isAuthenticated ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {resumes.map(r => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setSelectedResumeId(r.id)}
                          disabled={loading}
                          className={`text-left p-4 rounded-xl border-2 transition-all ${
                            selectedResumeId === r.id 
                              ? "border-indigo-500 bg-indigo-500/10" 
                              : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-zinc-200 truncate">{r.display_name}</span>
                            {selectedResumeId === r.id && <CheckCircle2 className="w-5 h-5 text-indigo-500" />}
                          </div>
                          <p className="text-xs text-zinc-500">Updated: {new Date(r.last_used).toLocaleDateString()}</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <DocumentUpload
                      id="resume-upload"
                      title="Upload Resume"
                      description="Accepts .pdf or .txt (Max 5MB)"
                      file={resumeFile}
                      text={resumeText}
                      onFileChange={setResumeFile}
                      onTextChange={setResumeText}
                      onDropFile={handleUploadResume}
                      isLoading={pdfLoadingResume}
                      error={error.includes("Resume") ? error : undefined}
                      onClearError={() => setError("")}
                      icon={<Briefcase className="w-5 h-5 text-indigo-400" />}
                    />
                  )}
                </div>

                {(interviewType === "job_specific" || interviewType === "ats_check") && (
                  <div className="space-y-4 pt-8 border-t border-zinc-800">
                    <h2 className="text-xl font-semibold text-white mb-4">
                      {isAtsMode ? "2. Job Description" : "3. Job Description"}
                    </h2>
                    <DocumentUpload
                      id="jd-upload"
                      title="Job Description"
                      description="Accepts .pdf or .txt (Max 5MB)"
                      file={jdFile}
                      text={jdText}
                      onFileChange={setJdFile}
                      onTextChange={setJdText}
                      onDropFile={handleUploadJd}
                      isLoading={pdfLoadingJd}
                      error={error.includes("Job Description") || error.includes("JD") ? error : undefined}
                      onClearError={() => setError("")}
                      icon={<Target className="w-5 h-5 text-indigo-400" />}
                    />
                  </div>
                )}

                {error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                    {error}
                  </div>
                )}

                <div className="flex justify-end pt-8">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative inline-flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-indigo-600 cursor-pointer"
                  >
                    {isAtsMode ? "Run ATS Check" : "Start Mock Interview"}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </SidebarLayout>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={
      <SidebarLayout>
        <UploadSkeleton />
      </SidebarLayout>
    }>
      <UploadContent />
    </Suspense>
  );
}
