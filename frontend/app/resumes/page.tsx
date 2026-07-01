"use client";

import { useEffect, useState } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { getResumes, ResumeResponse, uploadToVault, deleteResume, downloadResume } from "@/lib/api-client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/ui/dialog/useDialog";
import { FileText, Plus, Trash2, Eye, Download, FileCheck, Mic, MessageSquare, Loader2, Library } from "lucide-react";
import DocumentUpload from "@/components/DocumentUpload";
import { format } from "date-fns";
import Link from "next/link";

export default function ResumesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showConfirm, showSuccess, showError, showLoading, showPrompt, closeDialog } = useDialog();
  
  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchResumes();
    }
  }, [status, router]);

  const fetchResumes = async () => {
    try {
      const data = await getResumes();
      setResumes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFile = async (selectedFile: File) => {
    setError("");
    setUploading(true);
    try {
      await uploadToVault(selectedFile);
      await fetchResumes();
      setFile(null); // Reset after upload
      setText("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload resume.");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadText = () => {
    if (!text.trim()) {
      setError("Please paste some text first.");
      return;
    }
    setError("");
    
    showPrompt({
      title: "Resume Name",
      message: "Please enter a name for this resume.",
      defaultValue: "Pasted Resume",
      confirmText: "Save",
      onConfirm: async (filename) => {
        let finalName = filename || "Pasted Resume";
        if (!finalName.toLowerCase().endsWith('.txt')) {
          finalName += '.txt';
        }
        
        setUploading(true);
        try {
          const textFile = new File([text], finalName, { type: "text/plain" });
          await uploadToVault(textFile);
          await fetchResumes();
          setFile(null);
          setText("");
          showSuccess("Success", "Resume saved successfully.");
        } catch (err: unknown) {
          showError("Upload Failed", err instanceof Error ? err.message : "Failed to upload pasted text.");
        } finally {
          setUploading(false);
        }
      }
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    showConfirm({
      title: "Delete Resume?",
      message: "Are you sure you want to permanently delete this resume?\n\nThis action cannot be undone.",
      confirmText: "Delete",
      onConfirm: async () => {
        showLoading("Deleting", "Removing resume from your vault...");
        try {
          await deleteResume(id);
          setResumes(prev => prev.filter(r => r.id !== id));
          showSuccess("Deleted", "Resume deleted successfully.");
        } catch (err) {
          showError("Error", "Failed to delete resume.");
        }
      }
    });
  };

  const handleDownload = async (r: ResumeResponse, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await downloadResume(r.id, r.original_filename || "resume.txt");
    } catch (err) {
      showError("Download Failed", "There was an error downloading your resume.");
    }
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex h-screen items-center justify-center bg-black">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-black text-zinc-50 p-6 md:p-12">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Library className="w-8 h-8 text-indigo-400" />
                AI Resume Hub
              </h1>
              <p className="text-zinc-400 mt-2">Upload your PDF resumes to unlock personalized ATS checks, mock interviews, and interactive chat.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Upload Area */}
            <div className="lg:col-span-1">
              <DocumentUpload
                id="vault-upload"
                title="Upload Resume"
                description="Drag & drop a PDF/TXT file here (max 5MB)."
                file={file}
                text={text}
                onFileChange={setFile}
                onTextChange={setText}
                onDropFile={handleUploadFile}
                isLoading={uploading}
                error={error}
                onClearError={() => setError("")}
                icon={<Plus className="w-5 h-5 text-indigo-400" />}
              />
              {text && (
                <button
                  onClick={handleUploadText}
                  disabled={uploading}
                  className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Pasted Text to Vault"}
                </button>
              )}
            </div>

            {/* Resume List */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {resumes.map(r => (
                <div key={r.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
                  <div className="p-5 border-b border-zinc-800 flex items-start gap-4">
                    <div className="w-12 h-12 shrink-0 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-white truncate" title={r.original_filename || r.display_name}>
                        {r.original_filename || r.display_name}
                      </h3>
                      <div className="text-xs text-zinc-400 mt-1 space-y-0.5">
                        <p>Uploaded: {r.created_at ? format(new Date(r.created_at), 'MMM d, yyyy') : 'Unknown'}</p>
                        <p>Size: {r.file_size ? Math.round(r.file_size / 1024) : 0} KB</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-950/50 flex-1 flex flex-col gap-2">
                    <Link href={`/resumes/${r.id}`} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors">
                      <Eye className="w-4 h-4 text-zinc-400" />
                      View PDF
                    </Link>
                    
                    <Link href={`/upload?mode=ats&resumeId=${r.id}`} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-blue-400 hover:bg-blue-500/10 transition-colors">
                      <FileCheck className="w-4 h-4" />
                      ATS Check
                    </Link>


                    <Link href={`/resume-chat?resumeId=${r.id}`} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-purple-400 hover:bg-purple-500/10 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      Resume Chat
                    </Link>
                    
                    <div className="h-px bg-zinc-800 my-1" />
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => handleDownload(r, e)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                      <button 
                        onClick={(e) => handleDelete(r.id, e)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {resumes.length === 0 && !uploading && (
                <div className="md:col-span-2 bg-zinc-900/30 border border-zinc-800 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                  <FileText className="w-12 h-12 text-zinc-600 mb-4" />
                  <h3 className="text-xl font-semibold text-zinc-300 mb-2">Vault is Empty</h3>
                  <p className="text-zinc-500 max-w-sm">Upload your first resume PDF to unlock personalized mock interviews, ATS checks, and interactive resume chat.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
