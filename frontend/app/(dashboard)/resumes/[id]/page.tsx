"use client";

import { useEffect, useState } from "react";
import { getResumeDetails, ResumeDetailResponse, deleteResume } from "@/lib/api-client";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useDialog } from "@/components/ui/dialog/useDialog";
import { ArrowLeft, Calendar, File, CheckCircle2, Loader2, Download, Trash2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function ResumeViewerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const resumeId = params.id as string;
  const { showConfirm, showSuccess, showError, showLoading } = useDialog();
  
  const [resume, setResume] = useState<ResumeDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status === "authenticated" && resumeId) {
      getResumeDetails(resumeId)
        .then(data => {
          setResume(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          router.push("/resumes");
        });
    }
  }, [status, router, resumeId]);

  const handleDelete = () => {
    showConfirm({
      title: "Delete Resume?",
      message: "Are you sure you want to permanently delete this resume?\n\nThis action cannot be undone.",
      confirmText: "Delete",
      onConfirm: async () => {
        showLoading("Deleting", "Removing resume from your vault...");
        try {
          await deleteResume(resumeId);
          showSuccess("Deleted", "Resume deleted successfully.");
          router.push("/resumes");
        } catch (err) {
          showError("Error", "Failed to delete resume.");
        }
      }
    });
  };

  const handleDownloadText = () => {
    if (!resume) return;
    const blob = new Blob([resume.extracted_text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resume.original_filename || 'resume'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading || !resume) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-sm text-zinc-500 animate-pulse">Loading Resume Viewer...</p>
          </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-50 relative overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 md:px-12 py-6 md:py-10">
          
          {/* ─── Header ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-zinc-800 pb-6">
            <div className="flex items-center gap-4">
              <Link 
                href="/resumes" 
                className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all border border-zinc-800 hover:border-zinc-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">
                  {resume.display_name}
                </h1>
                <div className="flex items-center gap-4 text-sm text-zinc-500 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <File className="w-3.5 h-3.5" /> {resume.original_filename}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> {format(new Date(resume.created_at), "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {(resume.file_size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadText}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download Text
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          {/* ─── Resume Text Viewer ─── */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 md:p-12 shadow-2xl">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-6 pb-2 border-b border-zinc-800">
              Extracted Text Content
            </h2>
            <div className="prose prose-invert prose-zinc max-w-none">
              <pre className="whitespace-pre-wrap font-mono text-sm text-zinc-300 leading-relaxed bg-transparent p-0 border-0 m-0">
                {resume.extracted_text || "No text could be extracted from this resume."}
              </pre>
            </div>
          </div>

        </div>
      </div>
    );
}
