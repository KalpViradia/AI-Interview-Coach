"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { getResumes, ResumeResponse, uploadToVault, deleteResume, downloadResume, renameResume } from "@/lib/api-client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/ui/dialog/useDialog";
import { 
  FileText, Plus, Trash2, Eye, Download, FileCheck, Mic, MessageSquare, 
  Loader2, Library, Pencil, Search, SortDesc, SortAsc, LayoutGrid, List as ListIcon,
  MoreVertical, Copy, Star, Play, CheckCircle2, AlertTriangle, ChevronDown, Target
} from "lucide-react";
import DocumentUpload from "@/components/DocumentUpload";
import { format } from "date-fns";
import Link from "next/link";
import { Tooltip } from "@/components/ui/Tooltip";
import { motion, AnimatePresence } from "framer-motion";

type SortOption = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc';
type ViewMode = 'grid' | 'list';

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

  // Phase 5 controls
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchResumes();
    } else if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const handleWindowClick = () => setOpenDropdownId(null);
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

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

  const handleRename = (resume: ResumeResponse, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    showPrompt({
      title: "Rename Resume",
      message: "Enter a new name for this resume.",
      defaultValue: resume.display_name || resume.original_filename || "My Resume",
      confirmText: "Rename",
      onConfirm: async (newName) => {
        if (!newName || !newName.trim()) return;
        try {
          await renameResume(resume.id, newName.trim());
          await fetchResumes();
          showSuccess("Success", "Resume renamed successfully.");
        } catch (err: unknown) {
          showError("Error", err instanceof Error ? err.message : "Failed to rename resume.");
        }
      }
    });
  };

  const handleDownload = async (r: ResumeResponse, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (r.cloudinary_url) {
      // Append fl_attachment to Cloudinary URL to force download if possible, or just open in new tab
      // For simplicity, opening in new tab is safe for PDFs.
      window.open(r.cloudinary_url, '_blank');
      return;
    }
    try {
      await downloadResume(r.id, r.original_filename || "resume.txt");
    } catch (err) {
      showError("Download Failed", "There was an error downloading your resume.");
    }
  };

  const filteredAndSortedResumes = useMemo(() => {
    let result = [...resumes];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        (r.display_name?.toLowerCase() || "").includes(q) || 
        (r.original_filename?.toLowerCase() || "").includes(q)
      );
    }
    result.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'date_asc') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'name_asc') {
        const nameA = a.display_name || a.original_filename || "";
        const nameB = b.display_name || b.original_filename || "";
        return nameA.localeCompare(nameB);
      } else {
        const nameA = a.display_name || a.original_filename || "";
        const nameB = b.display_name || b.original_filename || "";
        return nameB.localeCompare(nameA);
      }
    });
    return result;
  }, [resumes, searchQuery, sortBy]);

  if (loading) {
    return (
              <div className="flex h-screen items-center justify-center bg-black">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
          );
  }

  return (
          <div className="min-h-screen bg-black text-zinc-50 p-6 md:p-12">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                <Library className="w-8 h-8 text-indigo-400" />
                Resume Vault
              </h1>
              <p className="text-zinc-400 mt-2">Manage all your resumes.</p>
            </div>
          </div>

          <div className="flex flex-col gap-12">
            
            {/* Upload Area */}
            <div className="w-full max-w-2xl bg-zinc-900/30 p-6 rounded-3xl border border-zinc-800 backdrop-blur-sm">
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

            {/* Controls Area */}
            <div className="space-y-6 border-t border-zinc-800 pt-8">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-96">
                  <Search className="w-5 h-5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search resumes by name..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative">
                    <select 
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as SortOption)}
                      className="appearance-none bg-zinc-900 border border-zinc-800 rounded-xl pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                    >
                      <option value="date_desc">Newest First</option>
                      <option value="date_asc">Oldest First</option>
                      <option value="name_asc">Name (A-Z)</option>
                      <option value="name_desc">Name (Z-A)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      <ListIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Resume List */}
              <div className={`w-full ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'} items-start`}>
                {filteredAndSortedResumes.length > 0 ? (
                  filteredAndSortedResumes.map(r => (
                    <motion.div 
                      key={r.id} 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 transition-colors rounded-xl flex ${viewMode === 'grid' ? 'flex-col p-4 gap-4' : 'flex-row items-center p-3 gap-4'}`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 shrink-0 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700/50 text-zinc-400 group-hover:text-zinc-300 transition-colors">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-medium text-zinc-200 truncate flex items-center gap-2" title={r.display_name || r.original_filename}>
                            {r.display_name || r.original_filename}
                            {(r.display_name && r.original_filename && r.display_name !== r.original_filename) && (
                              <span className="text-xs text-zinc-500 font-normal truncate max-w-[150px]">({r.original_filename})</span>
                            )}
                          </h3>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Added {r.created_at ? format(new Date(r.created_at), 'MMM d, yyyy') : 'Unknown'}
                          </p>
                        </div>
                      </div>

                      <div className={`flex items-center gap-2 ${viewMode === 'grid' ? 'justify-between border-t border-zinc-800/50 pt-4' : 'shrink-0'}`}>
                        <div className="flex items-center gap-1">
                          <Tooltip content="View Resume">
                            <button onClick={() => router.push(`/resumes/${r.id}`)} className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Tooltip>
                          <Tooltip content="Start Interview">
                            <button onClick={() => router.push(`/upload?mode=interview&resumeId=${r.id}`)} className="p-1.5 rounded-md text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                              <Play className="w-4 h-4" />
                            </button>
                          </Tooltip>
                          <Tooltip content="ATS Check">
                            <button onClick={() => router.push(`/upload?mode=ats&resumeId=${r.id}`)} className="p-1.5 rounded-md text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                              <Target className="w-4 h-4" />
                            </button>
                          </Tooltip>
                          <Tooltip content="Resume Chat">
                            <Link href={`/resume-chat?resumeId=${r.id}`} className="p-1.5 rounded-md flex text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                              <MessageSquare className="w-4 h-4" />
                            </Link>
                          </Tooltip>
                        </div>

                        {/* Kebab Menu */}
                        <div className="relative">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === r.id ? null : r.id); }}
                            className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-700 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          <AnimatePresence>
                            {openDropdownId === r.id && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ duration: 0.15 }}
                                className={`absolute ${viewMode === 'list' ? 'right-0 top-10' : 'right-0 bottom-10'} w-40 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50`}
                              >
                                <div className="p-1 space-y-0.5">
                                  <button onClick={(e) => handleRename(r, e)} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md">
                                    <Pencil className="w-3.5 h-3.5" /> Rename
                                  </button>
                                  <button onClick={(e) => handleDownload(r, e)} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md">
                                    <Download className="w-3.5 h-3.5" /> Download PDF
                                  </button>
                                  
                                  <div className="h-px bg-zinc-700 my-1 mx-1" />
                                  
                                  <button onClick={(e) => handleDelete(r.id, e)} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md">
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  !uploading && (
                    <div className="col-span-full bg-zinc-900/30 border border-zinc-800 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                      <FileText className="w-12 h-12 text-zinc-600 mb-4" />
                      <h3 className="text-xl font-semibold text-zinc-300 mb-2">{searchQuery ? "No matching resumes" : "Vault is Empty"}</h3>
                      <p className="text-zinc-500 max-w-sm">{searchQuery ? "Try a different search term." : "Upload your first resume PDF to unlock personalized mock interviews, ATS checks, and interactive resume chat."}</p>
                    </div>
                  )
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
      );
}

