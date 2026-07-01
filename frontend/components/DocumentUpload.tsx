"use client";

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, X, File, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DocumentUploadProps {
  id: string;
  title: string;
  description?: string;
  file: File | null;
  text: string;
  onFileChange: (file: File | null) => void;
  onTextChange: (text: string) => void;
  onDropFile: (file: File) => Promise<void>;
  isLoading: boolean;
  error?: string;
  onClearError?: () => void;
  accept?: { [key: string]: string[] };
  maxSize?: number;
  icon?: React.ReactNode;
}

export default function DocumentUpload({
  id,
  title,
  description = "Accepts .pdf or .txt (Max 5MB)",
  file,
  text,
  onFileChange,
  onTextChange,
  onDropFile,
  isLoading,
  error,
  onClearError,
  accept = { "application/pdf": [".pdf"], "text/plain": [".txt"] },
  maxSize = 5 * 1024 * 1024,
  icon,
}: DocumentUploadProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "paste">("upload");
  const [internalError, setInternalError] = useState("");

  const displayError = internalError || error;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxSize,
    maxFiles: 1,
    onDropRejected: (fileRejections) => {
      if (onClearError) onClearError();
      const rejection = fileRejections[0];
      if (rejection.errors[0]?.code === "file-too-large") {
        onFileChange(null);
        setInternalError(`File size exceeds the ${maxSize / (1024 * 1024)} MB limit.`);
      } else if (rejection.errors[0]?.code === "file-invalid-type") {
        onFileChange(null);
        setInternalError("Only PDF (.pdf) and Text (.txt) files are supported.");
      } else {
        onFileChange(null);
        setInternalError(rejection.errors[0]?.message || "Invalid file.");
      }
    },
    onDrop: async (acceptedFiles) => {
      setInternalError("");
      if (onClearError) onClearError();
      const selected = acceptedFiles[0];
      if (selected) {
        onFileChange(selected);
        try {
          await onDropFile(selected);
        } catch (e) {
          // Error handled by parent
        }
      }
    },
  });

  const handleRemoveFile = () => {
    onFileChange(null);
    onTextChange("");
    setInternalError("");
    if (onClearError) onClearError();
  };

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          {icon} {title}
        </h3>
        <div className="flex bg-black/40 p-1 rounded-xl border border-zinc-800/50">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "upload" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("paste")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "paste" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Paste Text
          </button>
        </div>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === "upload" ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {!file ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-2xl p-8 min-h-[160px] flex items-center justify-center transition-colors cursor-pointer text-center
                    ${isDragActive ? "border-indigo-500 bg-indigo-500/10" : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50"}
                  `}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className={`p-4 rounded-full ${isDragActive ? "bg-indigo-500/20 text-indigo-400" : "bg-zinc-800 text-zinc-400"}`}>
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-zinc-300 font-medium text-lg">
                        {isDragActive ? "Drop file here..." : "Drag & Drop or Click to browse"}
                      </p>
                      <p className="text-zinc-500 text-sm mt-1">{description}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-zinc-700 bg-zinc-800/30 rounded-2xl p-6 min-h-[160px] flex items-center">
                  <div className="flex w-full flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div className="min-w-0 flex-1 pr-4">
                        <p className="text-zinc-200 font-medium truncate" title={file.name}>{file.name}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
                          <span className="uppercase">{file.name.split('.').pop()}</span>
                          <span>•</span>
                          <span>{(file.size / 1024).toFixed(1)} KB</span>
                          {isLoading ? (
                            <span className="flex items-center gap-1.5 text-indigo-400"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Parsing...</span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Ready</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg text-sm font-medium transition-colors"
                      >
                        Remove
                      </button>
                      <div {...getRootProps()}>
                         <input {...getInputProps()} />
                         <button
                           type="button"
                           className="px-3 py-2 bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white rounded-lg text-sm font-medium transition-colors"
                         >
                           Replace
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="paste"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <textarea
                value={text}
                onChange={(e) => {
                  onTextChange(e.target.value);
                  setInternalError("");
                  if (onClearError) onClearError();
                }}
                placeholder={`Paste your ${title.toLowerCase()} content here...`}
                className="w-full h-48 bg-black/50 border border-zinc-700 rounded-xl p-4 text-zinc-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 custom-scrollbar resize-none"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {displayError && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <X className="w-4 h-4 flex-shrink-0" />
            <p>{displayError}</p>
          </div>
        )}
      </div>
    </div>
  );
}
