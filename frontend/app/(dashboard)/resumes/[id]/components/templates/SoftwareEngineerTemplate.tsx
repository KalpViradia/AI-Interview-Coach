import React from 'react';
import { ParsedResume } from "@/lib/api-client";

interface TemplateProps {
  resume: ParsedResume;
}

export default function SoftwareEngineerTemplate({ resume }: TemplateProps) {
  return (
    <div className="w-full bg-slate-50 text-slate-900 font-sans p-10 min-h-[1056px] shadow-2xl mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
      
      {/* Header */}
      <header className="mb-6 flex flex-col items-start border-b-4 border-emerald-500 pb-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">{resume.name || "Your Name"}</h1>
        <p className="text-lg font-medium text-emerald-600 mt-1">{resume.headline || "Software Engineer"}</p>
        
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs font-semibold text-slate-600">
          {resume.email && <span className="flex items-center gap-1">✉ {resume.email}</span>}
          {resume.phone && <span className="flex items-center gap-1">☏ {resume.phone}</span>}
          {resume.location && <span className="flex items-center gap-1">⌂ {resume.location}</span>}
          {resume.github && <span className="flex items-center gap-1">⌘ {resume.github.replace("https://", "")}</span>}
          {resume.linkedin && <span className="flex items-center gap-1">in {resume.linkedin.replace("https://www.linkedin.com/in/", "")}</span>}
        </div>
      </header>

      {/* Skills (Top for SWEs) */}
      {resume.skills && resume.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
            <span className="text-emerald-500 mr-2">/</span> Technical Skills
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {resume.skills.map((skill, i) => (
              <span key={i} className="px-2 py-0.5 bg-slate-200/70 border border-slate-300 text-slate-700 text-xs font-mono rounded-md">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {resume.experience && resume.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <span className="text-emerald-500 mr-2">/</span> Experience
          </h2>
          <div className="space-y-5">
            {resume.experience.map((exp, i) => (
              <div key={i}>
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="text-md font-bold text-slate-800">{exp.title}</h3>
                  <span className="text-xs font-mono font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded">{exp.dates}</span>
                </div>
                <div className="text-sm font-semibold text-emerald-700 mb-2">
                  {exp.company}
                </div>
                <ul className="space-y-1">
                  {exp.bullets.map((bullet, j) => (
                    <li key={j} className="text-sm leading-relaxed text-slate-700 flex items-start">
                      <span className="text-emerald-500 mr-2 mt-0.5 text-xs">▸</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {resume.projects && resume.projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <span className="text-emerald-500 mr-2">/</span> Open Source & Projects
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {resume.projects.map((proj, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-1">{proj.name}</h3>
                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="text-[10px] font-mono text-emerald-600 mb-2">
                    {proj.technologies.join(" • ")}
                  </div>
                )}
                <p className="text-xs text-slate-600 mb-2 leading-relaxed">{proj.description}</p>
                {proj.bullets && proj.bullets.length > 0 && (
                  <ul className="space-y-1">
                    {proj.bullets.slice(0, 2).map((bullet, j) => (
                      <li key={j} className="text-xs text-slate-500 flex items-start">
                        <span className="text-emerald-300 mr-1.5 mt-0.5">•</span>
                        <span className="line-clamp-2">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {resume.education && resume.education.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center">
            <span className="text-emerald-500 mr-2">/</span> Education
          </h2>
          <div className="space-y-3">
            {resume.education.map((edu, i) => (
              <div key={i} className="flex justify-between items-baseline">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{edu.degree}</h3>
                  <div className="text-xs text-slate-600">{edu.institution}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-slate-500">{edu.dates}</div>
                  {edu.gpa && <div className="text-xs font-semibold text-emerald-700 mt-0.5">GPA: {edu.gpa}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
