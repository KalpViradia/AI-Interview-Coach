"use client";

import { useState, useEffect, useRef } from "react";
import { Download, FileText, Code2, Printer, FileJson } from "lucide-react";
import { templates, TemplateId } from "./templates";
import { ParsedResume } from "@/lib/api-client";
import { parseResumeClientSide } from "@/lib/resume-parser";

interface ExportTabProps {
  extractedText: string;
  initialParsedData?: ParsedResume;
}

export default function ExportTab({ extractedText, initialParsedData }: ExportTabProps) {
  const [activeTemplate, setActiveTemplate] = useState<TemplateId>("modern");
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialParsedData && Object.keys(initialParsedData).length > 0) {
      setParsedData(initialParsedData);
    } else {
      setParsedData(parseResumeClientSide(extractedText));
    }
  }, [extractedText, initialParsedData]);

  if (!parsedData) return null;

  const ActiveTemplateComponent = templates[activeTemplate].component;

  const handlePrintPDF = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(parsedData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${parsedData.name.replace(/\s+/g, '_')}_Resume.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleExportMarkdown = () => {
    let md = `# ${parsedData.name}\n${parsedData.headline}\n\n`;
    md += `${parsedData.email} | ${parsedData.phone} | ${parsedData.location}\n`;
    if (parsedData.linkedin) md += `LinkedIn: ${parsedData.linkedin}\n`;
    if (parsedData.github) md += `GitHub: ${parsedData.github}\n\n`;
    
    if (parsedData.summary) {
      md += `## Summary\n${parsedData.summary}\n\n`;
    }
    
    if (parsedData.skills.length > 0) {
      md += `## Skills\n${parsedData.skills.join(", ")}\n\n`;
    }
    
    if (parsedData.experience.length > 0) {
      md += `## Experience\n`;
      parsedData.experience.forEach(exp => {
        md += `### ${exp.title} at ${exp.company}\n`;
        md += `*${exp.dates}* | ${exp.location}\n`;
        exp.bullets.forEach(b => md += `- ${b}\n`);
        md += `\n`;
      });
    }

    if (parsedData.education.length > 0) {
      md += `## Education\n`;
      parsedData.education.forEach(edu => {
        md += `### ${edu.degree}, ${edu.institution}\n`;
        md += `*${edu.dates}*\n\n`;
      });
    }

    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(md);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${parsedData.name.replace(/\s+/g, '_')}_Resume.md`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      
      {/* Settings & Actions */}
      <div className="lg:w-[400px] flex flex-col gap-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Download className="w-5 h-5 text-teal-400" /> Export Options
          </h3>
          
          <div className="space-y-4 mb-8">
            <label className="block text-sm font-medium text-zinc-400 mb-2">Select Template Style</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(templates).map(template => (
                <button
                  key={template.id}
                  onClick={() => setActiveTemplate(template.id as TemplateId)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    activeTemplate === template.id 
                      ? "bg-zinc-800 border-teal-500" 
                      : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <span className={`block text-sm font-semibold mb-1 ${activeTemplate === template.id ? "text-white" : "text-zinc-300"}`}>
                    {template.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={handlePrintPDF}
              className="w-full flex items-center justify-between p-4 bg-teal-500 hover:bg-teal-400 text-teal-950 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-3 font-bold">
                <Printer className="w-5 h-5" /> Export as PDF
              </div>
              <span className="text-xs font-medium opacity-80 group-hover:opacity-100">Recommended</span>
            </button>
            
            <button 
              onClick={handleExportJSON}
              className="w-full flex items-center gap-3 p-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors font-medium border border-zinc-700"
            >
              <FileJson className="w-5 h-5 text-zinc-400" /> Export as JSON
            </button>
            
            <button 
              onClick={handleExportMarkdown}
              className="w-full flex items-center gap-3 p-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors font-medium border border-zinc-700"
            >
              <FileText className="w-5 h-5 text-zinc-400" /> Export as Markdown
            </button>
            
            <button 
              disabled
              className="w-full flex items-center justify-between p-4 bg-zinc-900 text-zinc-600 rounded-xl border border-zinc-800 cursor-not-allowed"
            >
              <div className="flex items-center gap-3 font-medium">
                <FileText className="w-5 h-5" /> Export as DOCX
              </div>
              <span className="text-xs">Coming Soon</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preview Container (Visible only on screen, hidden on print) */}
      <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm overflow-hidden flex flex-col items-center hide-on-print">
        <p className="text-sm text-zinc-500 mb-4 text-center max-w-sm">
          A low-res preview of your export. Click "Export as PDF" to generate the high-quality document.
        </p>
        <div className="border border-zinc-800 overflow-hidden rounded shadow-2xl relative" style={{ width: '210mm', height: '297mm', transform: 'scale(0.5)', transformOrigin: 'top center' }}>
          <ActiveTemplateComponent resume={parsedData} />
        </div>
      </div>

      {/* Print Container (Hidden on screen, visible on print) */}
      <div className="hidden print:block print:absolute print:inset-0 print:bg-white print:z-50 print-container">
        <ActiveTemplateComponent resume={parsedData} />
      </div>
      
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
