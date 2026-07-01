"use client";

import React, { createContext, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

export type DialogType = "info" | "success" | "error" | "confirm" | "loading" | "prompt";

interface DialogOptions {
  title: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  defaultValue?: string;
  onConfirm?: (value?: string) => void;
  onCancel?: () => void;
}

interface DialogContextType {
  showAlert: (title: string, message: string) => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showConfirm: (options: DialogOptions) => void;
  showPrompt: (options: DialogOptions) => void;
  showLoading: (title: string, message: string) => void;
  closeDialog: () => void;
}

export const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DialogOptions | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");
  
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const closeDialog = useCallback(() => {
    if (options?.type === "loading") return; // Cannot close loading
    setIsOpen(false);
    setTimeout(() => {
      if (options?.onCancel) options.onCancel();
      setOptions(null);
      setInputValue("");
      setInputError("");
    }, 200); // Allow animation to finish
  }, [options]);

  const showAlert = useCallback((title: string, message: string) => {
    setOptions({ title, message, type: "info" });
    setIsOpen(true);
  }, []);

  const showSuccess = useCallback((title: string, message: string) => {
    setOptions({ title, message, type: "success" });
    setIsOpen(true);
  }, []);

  const showError = useCallback((title: string, message: string) => {
    setOptions({ title, message, type: "error" });
    setIsOpen(true);
  }, []);

  const showConfirm = useCallback((opts: DialogOptions) => {
    setOptions({ ...opts, type: "confirm" });
    setIsOpen(true);
  }, []);

  const showPrompt = useCallback((opts: DialogOptions) => {
    setOptions({ ...opts, type: "prompt" });
    setInputValue(opts.defaultValue || "");
    setInputError("");
    setIsOpen(true);
  }, []);

  const showLoading = useCallback((title: string, message: string) => {
    setOptions({ title, message, type: "loading" });
    setIsOpen(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && options?.type !== "loading") {
        closeDialog();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeDialog, options]);

  useEffect(() => {
    if (isOpen) {
      // Small timeout to ensure DOM is ready before focusing
      setTimeout(() => {
        if (options?.type === "prompt") {
          inputRef.current?.focus();
        } else {
          confirmBtnRef.current?.focus();
        }
      }, 50);
    }
  }, [isOpen, options?.type]);

  const handleConfirm = () => {
    if (options?.type === "prompt") {
      const trimmed = inputValue.trim();
      if (!trimmed) {
        setInputError("This field is required.");
        return;
      }
      if (trimmed.length > 100) {
        setInputError("Maximum length is 100 characters.");
        return;
      }
      setIsOpen(false);
      if (options?.onConfirm) options.onConfirm(trimmed);
      setTimeout(() => { setOptions(null); setInputValue(""); setInputError(""); }, 200);
    } else {
      setIsOpen(false);
      if (options?.onConfirm) options.onConfirm();
      setTimeout(() => setOptions(null), 200);
    }
  };

  const getIcon = (type: DialogType) => {
    switch (type) {
      case "info": return <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0"><Info className="w-6 h-6" /></div>;
      case "success": return <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0"><CheckCircle className="w-6 h-6" /></div>;
      case "error": return <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0"><AlertTriangle className="w-6 h-6" /></div>;
      case "confirm": return <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0"><AlertTriangle className="w-6 h-6" /></div>;
      case "prompt": return <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0"><Info className="w-6 h-6" /></div>;
      case "loading": return <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0"><Loader2 className="w-6 h-6 animate-spin" /></div>;
    }
  };

  return (
    <DialogContext.Provider value={{ showAlert, showSuccess, showError, showConfirm, showPrompt, showLoading, closeDialog }}>
      {children}
      <AnimatePresence>
        {isOpen && options && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget && options.type !== "loading") closeDialog();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
              role="dialog"
              aria-modal="true"
            >
              <div className="p-6">
                <div className="flex gap-4 items-start">
                  {getIcon(options.type || "info")}
                  <div className="flex-1 pt-1">
                    <h3 className="text-lg font-bold text-white mb-2 leading-tight">{options.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">{options.message}</p>
                    
                    {options.type === "prompt" && (
                      <div className="mt-4">
                        <input
                          ref={inputRef}
                          type="text"
                          value={inputValue}
                          onChange={(e) => {
                            setInputValue(e.target.value);
                            if (inputError) setInputError("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleConfirm();
                            }
                          }}
                          className={`w-full px-4 py-3 bg-zinc-950 border ${inputError ? 'border-red-500' : 'border-zinc-800 focus:border-indigo-500'} rounded-xl text-white text-sm focus:outline-none transition-colors`}
                        />
                        {inputError && <p className="text-red-400 text-xs mt-1.5">{inputError}</p>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {options.type !== "loading" && (
                <div className="bg-zinc-950/50 p-4 border-t border-zinc-800 flex justify-end gap-3">
                  {(options.type === "confirm" || options.type === "prompt") && (
                    <button
                      onClick={closeDialog}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                    >
                      {options.cancelText || "Cancel"}
                    </button>
                  )}
                  <button
                    ref={confirmBtnRef}
                    onClick={(options.type === "confirm" || options.type === "prompt") ? handleConfirm : closeDialog}
                    className={`px-6 py-2 rounded-xl text-sm font-semibold text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 ${
                      options.type === "confirm" 
                        ? "bg-red-600 hover:bg-red-500 focus-visible:ring-red-500" 
                        : options.type === "success"
                          ? "bg-emerald-600 hover:bg-emerald-500 focus-visible:ring-emerald-500"
                          : "bg-indigo-600 hover:bg-indigo-500 focus-visible:ring-indigo-500"
                    }`}
                  >
                    {options.confirmText || ((options.type === "confirm" || options.type === "prompt") ? "Confirm" : "OK")}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
}
