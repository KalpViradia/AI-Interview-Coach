"use client";

import { useState } from "react";
import { ParsedResume } from "@/lib/api-client";
import { Save, Plus, Trash2, CheckCircle } from "lucide-react";

interface EditorTabProps {
  parsedData: ParsedResume;
  onChange: (data: ParsedResume) => void;
  onSave: () => void;
  isSaving: boolean;
}

export default function EditorTab({ parsedData, onChange, onSave, isSaving }: EditorTabProps) {
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    onSave();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const updateField = (field: keyof ParsedResume, value: any) => {
    onChange({ ...parsedData, [field]: value });
  };

  const updateExperience = (index: number, field: string, value: any) => {
    const newExp = [...parsedData.experience];
    newExp[index] = { ...newExp[index], [field]: value };
    updateField("experience", newExp);
  };

  const addExperience = () => {
    updateField("experience", [
      ...parsedData.experience, 
      { company: "New Company", title: "Job Title", dates: "Date", location: "", bullets: [] }
    ]);
  };

  const removeExperience = (index: number) => {
    const newExp = [...parsedData.experience];
    newExp.splice(index, 1);
    updateField("experience", newExp);
  };

  const updateBullet = (expIndex: number, bulletIndex: number, value: string) => {
    const newExp = [...parsedData.experience];
    newExp[expIndex].bullets[bulletIndex] = value;
    updateField("experience", newExp);
  };

  const addBullet = (expIndex: number) => {
    const newExp = [...parsedData.experience];
    newExp[expIndex].bullets.push("New bullet point");
    updateField("experience", newExp);
  };

  const removeBullet = (expIndex: number, bulletIndex: number) => {
    const newExp = [...parsedData.experience];
    newExp[expIndex].bullets.splice(bulletIndex, 1);
    updateField("experience", newExp);
  };

  // Add more helpers for education/projects as needed for production...

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 border border-zinc-800 rounded-3xl backdrop-blur-sm">
      <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Edit Content</h3>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isSaving ? <span className="animate-pulse">Saving...</span> : saveSuccess ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saveSuccess ? "Saved" : "Save"}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        
        {/* Basic Info */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium tracking-wide text-zinc-400 uppercase">Personal Info</h4>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Full Name</label>
            <input 
              type="text" 
              value={parsedData.name || ""} 
              onChange={e => updateField("name", e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Headline</label>
            <input 
              type="text" 
              value={parsedData.headline || ""} 
              onChange={e => updateField("headline", e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Email</label>
              <input 
                type="text" 
                value={parsedData.email || ""} 
                onChange={e => updateField("email", e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Phone</label>
              <input 
                type="text" 
                value={parsedData.phone || ""} 
                onChange={e => updateField("phone", e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium tracking-wide text-zinc-400 uppercase">Summary</h4>
          <textarea 
            value={parsedData.summary || ""} 
            onChange={e => updateField("summary", e.target.value)}
            rows={4}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none"
          />
        </div>

        {/* Skills */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium tracking-wide text-zinc-400 uppercase">Skills (comma separated)</h4>
          <textarea 
            value={parsedData.skills.join(", ") || ""} 
            onChange={e => updateField("skills", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
            rows={2}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none"
          />
        </div>

        {/* Experience */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium tracking-wide text-zinc-400 uppercase">Experience</h4>
            <button onClick={addExperience} className="p-1 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {parsedData.experience.map((exp, expIdx) => (
            <div key={expIdx} className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4 space-y-3 relative group">
              <button 
                onClick={() => removeExperience(expIdx)}
                className="absolute top-3 right-3 p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              
              <div className="grid grid-cols-2 gap-3 pr-8">
                <input 
                  type="text" value={exp.title} onChange={e => updateExperience(expIdx, "title", e.target.value)}
                  placeholder="Job Title" className="bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-white"
                />
                <input 
                  type="text" value={exp.company} onChange={e => updateExperience(expIdx, "company", e.target.value)}
                  placeholder="Company" className="bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-white"
                />
                <input 
                  type="text" value={exp.dates} onChange={e => updateExperience(expIdx, "dates", e.target.value)}
                  placeholder="Dates (e.g. Jan 2020 - Present)" className="bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-white"
                />
              </div>
              
              <div className="space-y-2 pt-2">
                <p className="text-xs text-zinc-500">Bullets</p>
                {exp.bullets.map((bullet, bIdx) => (
                  <div key={bIdx} className="flex gap-2 items-start">
                    <span className="text-zinc-600 mt-2">•</span>
                    <textarea 
                      value={bullet}
                      onChange={e => updateBullet(expIdx, bIdx, e.target.value)}
                      rows={2}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-white resize-none focus:border-indigo-500"
                    />
                    <button onClick={() => removeBullet(expIdx, bIdx)} className="p-1 mt-1 text-zinc-600 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button onClick={() => addBullet(expIdx)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1">
                  <Plus className="w-3 h-3" /> Add Bullet
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
