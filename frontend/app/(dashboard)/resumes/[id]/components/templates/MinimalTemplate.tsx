import React from 'react';
import { ParsedResume } from "@/lib/api-client";

interface TemplateProps {
  resume: ParsedResume;
}

export default function MinimalTemplate({ resume }: TemplateProps) {
  return (
    <div className="w-full bg-[#fcfcfc] text-[#222222] font-mono p-12 min-h-[1056px] shadow-2xl mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
      
      {/* Header */}
      <header className="mb-10 text-left">
        <h1 className="text-3xl font-bold tracking-tight mb-1">{resume.name || "Your Name"}</h1>
        <p className="text-md text-gray-500 mb-3">{resume.headline || "Professional Title"}</p>
        
        <div className="text-xs text-gray-500 flex flex-col gap-0.5">
          {resume.email && <span>{resume.email}</span>}
          {resume.phone && <span>{resume.phone}</span>}
          {resume.location && <span>{resume.location}</span>}
          {resume.linkedin && <span>{resume.linkedin}</span>}
          {resume.github && <span>{resume.github}</span>}
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8">
        
        {resume.summary && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">Profile</h2>
            <p className="text-sm leading-relaxed">{resume.summary}</p>
          </section>
        )}

        {resume.experience && resume.experience.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Experience</h2>
            <div className="space-y-6">
              {resume.experience.map((exp, i) => (
                <div key={i} className="relative pl-4 border-l border-gray-200">
                  <div className="absolute w-2 h-2 bg-gray-300 rounded-full -left-[4.5px] top-1.5"></div>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-sm font-bold">{exp.title}</h3>
                    <span className="text-xs text-gray-500">{exp.dates}</span>
                  </div>
                  <div className="text-xs text-gray-600 mb-2">{exp.company}{exp.location && ` — ${exp.location}`}</div>
                  <ul className="space-y-1">
                    {exp.bullets.map((bullet, j) => (
                      <li key={j} className="text-sm leading-relaxed text-gray-700 before:content-['-'] before:mr-2 before:text-gray-300 flex">
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
        {resume.projects && resume.projects.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Projects</h2>
            <div className="space-y-6">
              {resume.projects.map((proj, i) => (
                <div key={i} className="relative pl-4 border-l border-gray-200">
                  <div className="absolute w-2 h-2 bg-gray-300 rounded-full -left-[4.5px] top-1.5"></div>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-sm font-bold">{proj.name}</h3>
                  </div>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="text-xs text-gray-600 mb-1">{proj.technologies.join(", ")}</div>
                  )}
                  {proj.description && (
                    <div className="text-xs text-gray-600 mb-2">{proj.description}</div>
                  )}
                  {proj.bullets && proj.bullets.length > 0 && (
                    <ul className="space-y-1">
                      {proj.bullets.map((bullet, j) => (
                        <li key={j} className="text-sm leading-relaxed text-gray-700 before:content-['-'] before:mr-2 before:text-gray-300 flex">
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {resume.education && resume.education.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Education</h2>
            <div className="grid grid-cols-2 gap-4">
              {resume.education.map((edu, i) => (
                <div key={i}>
                  <h3 className="text-sm font-bold">{edu.degree}</h3>
                  <div className="text-xs text-gray-600">{edu.institution}</div>
                  <div className="text-xs text-gray-500 mt-1">{edu.dates}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {resume.skills && resume.skills.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">Skills</h2>
            <p className="text-sm leading-relaxed text-gray-700">
              {resume.skills.join(", ")}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
