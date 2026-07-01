"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { LayoutTemplate, ZoomIn, ZoomOut, Edit3 } from "lucide-react";
import { templates, TemplateId } from "./templates";
import { parseResumeClientSide } from "@/lib/resume-parser";
import { ParsedResume, managedFetch } from "@/lib/api-client";
import EditorTab from "./EditorTab";

interface DesignTabProps {
  resumeId: string;
  extractedText: string;
  initialParsedData?: ParsedResume;
}

export default function DesignTab({ resumeId, extractedText, initialParsedData }: DesignTabProps) {
  const [activeTemplate, setActiveTemplate] = useState<TemplateId>("modern");
  const [zoom, setZoom] = useState(0.7);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [sidebarMode, setSidebarMode] = useState<"templates" | "editor">("templates");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialParsedData && Object.keys(initialParsedData).length > 0) {
      setParsedData(initialParsedData);
    } else {
      setParsedData(parseResumeClientSide(extractedText));
    }
  }, [extractedText, initialParsedData]);

  const handleSave = async () => {
    if (!parsedData) return;
    setIsSaving(true);
    try {
      // Need a proper token fetch if we're doing it inline, but best to use a lib function.
      // We'll write the fetch manually here using the same pattern as api-client
      const jwtRes = await managedFetch("/api/auth/token");
      let token = "";
      if (jwtRes.ok) {
        const data = await jwtRes.json();
        token = data.token;
      }
      
      const res = await managedFetch(`http://localhost:8000/api/resumes/${resumeId}/content`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(parsedData)
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch (err) {
      console.error(err);
      alert("Failed to save content.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!parsedData) return null;

  const ActiveTemplateComponent = templates[activeTemplate].component;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[800px]">
      
      {/* Left Sidebar */}
      <div className="lg:w-96 flex flex-col gap-4">
        
        {/* Mode Switcher */}
        <div className="flex bg-zinc-900/50 border border-zinc-800 rounded-xl p-1 backdrop-blur-sm">
          <button
            onClick={() => setSidebarMode("templates")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              sidebarMode === "templates" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <LayoutTemplate className="w-4 h-4" /> Templates
          </button>
          <button
            onClick={() => setSidebarMode("editor")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              sidebarMode === "editor" ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Edit3 className="w-4 h-4" /> Edit Content
          </button>
        </div>

        {sidebarMode === "templates" ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-5 backdrop-blur-sm flex-1 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4">Select Template</h3>
            
            <div className="space-y-3 custom-scrollbar overflow-y-auto pr-2 flex-1">
              {Object.values(templates).map((template) => (
                <button
                  key={template.id}
                  onClick={() => setActiveTemplate(template.id as TemplateId)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 group
                    ${activeTemplate === template.id 
                      ? "bg-zinc-800 border-indigo-500 shadow-lg shadow-indigo-500/10" 
                      : "bg-zinc-950/50 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900"
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-semibold ${activeTemplate === template.id ? "text-white" : "text-zinc-300"}`}>
                      {template.name}
                    </span>
                    <span className={`w-3 h-3 rounded-full ${template.color}`} />
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2">{template.description}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <EditorTab 
              parsedData={parsedData} 
              onChange={setParsedData} 
              onSave={handleSave}
              isSaving={isSaving}
            />
          </div>
        )}
      </div>

      {/* Right Area — Preview Canvas */}
      <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-sm flex flex-col">
        {/* Toolbar */}
        <div className="h-14 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between px-6 shrink-0">
          <div className="text-sm font-medium text-zinc-300">
            Live Preview
          </div>
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg p-1">
            <button 
              onClick={() => setZoom(Math.max(0.4, zoom - 0.1))}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-zinc-500 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button 
              onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-zinc-950 p-8 custom-scrollbar relative flex justify-center">
          {/* Scaled container for A4 preview */}
          <div 
            style={{ 
              transform: `scale(${zoom})`, 
              transformOrigin: "top center",
              transition: "transform 0.2s ease-out"
            }}
          >
            {/* Template Render */}
            <ActiveTemplateComponent resume={parsedData} />
          </div>
        </div>
      </div>

    </div>
  );
}
