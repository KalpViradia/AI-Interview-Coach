import React from 'react';
import { ParsedResume } from "@/lib/api-client";

interface TemplateProps {
  resume: ParsedResume;
}

export default function ModernTemplate({ resume }: TemplateProps) {
  return (
    <div className="w-full bg-white text-zinc-900 font-sans p-10 min-h-[1056px] shadow-2xl mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
      
      {/* Header */}
      <header className="border-b-2 border-indigo-600 pb-6 mb-6 flex flex-col sm:flex-row justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tight uppercase">{resume.name || "Your Name"}</h1>
          <p className="text-xl text-indigo-600 font-medium mt-1">{resume.headline || "Professional Title"}</p>
        </div>
        <div className="text-right text-sm text-zinc-500 mt-4 sm:mt-0 space-y-1">
          {resume.email && <p>{resume.email}</p>}
          {resume.phone && <p>{resume.phone}</p>}
          {resume.location && <p>{resume.location}</p>}
          {resume.linkedin && <p>{resume.linkedin}</p>}
        </div>
      </header>

      {/* Two Column Layout */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Left Column (Main Content) */}
        <div className="col-span-8 space-y-8">
          
          {/* Summary */}
          {resume.summary && (
            <section>
              <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-3">Professional Summary</h2>
              <p className="text-sm text-zinc-700 leading-relaxed">{resume.summary}</p>
            </section>
          )}

          {/* Experience */}
          {resume.experience && resume.experience.length > 0 && (
            <section>
              <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-4">Experience</h2>
              <div className="space-y-6">
                {resume.experience.map((exp, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="text-lg font-bold text-zinc-900">{exp.title}</h3>
                      <span className="text-sm font-medium text-indigo-600">{exp.dates}</span>
                    </div>
                    <div className="text-sm font-semibold text-zinc-600 mb-2">
                      {exp.company} {exp.location && <span className="font-normal text-zinc-400">— {exp.location}</span>}
                    </div>
                    <ul className="list-none space-y-1">
                      {exp.bullets.map((bullet, j) => (
                        <li key={j} className="text-sm text-zinc-700 leading-relaxed flex items-start">
                          <span className="text-indigo-400 mr-2 mt-0.5">•</span>
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
            <section>
              <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-4">Key Projects</h2>
              <div className="space-y-4">
                {resume.projects.map((proj, i) => (
                  <div key={i}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <h3 className="text-md font-bold text-zinc-900">{proj.name}</h3>
                      {proj.technologies && proj.technologies.length > 0 && (
                        <span className="text-xs text-indigo-600 font-medium">({proj.technologies.join(", ")})</span>
                      )}
                    </div>
                    {proj.description && <p className="text-sm text-zinc-600 mb-1">{proj.description}</p>}
                    <ul className="list-none space-y-1 mt-1">
                      {proj.bullets.map((bullet, j) => (
                        <li key={j} className="text-sm text-zinc-700 leading-relaxed flex items-start">
                          <span className="text-zinc-300 mr-2 mt-0.5">-</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* Right Column (Sidebar) */}
        <div className="col-span-4 space-y-8">
          
          {/* Skills */}
          {resume.skills && resume.skills.length > 0 && (
            <section>
              <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-4">Core Skills</h2>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 bg-zinc-100 text-zinc-700 text-xs font-semibold rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {resume.education && resume.education.length > 0 && (
            <section>
              <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-4">Education</h2>
              <div className="space-y-4">
                {resume.education.map((edu, i) => (
                  <div key={i}>
                    <h3 className="text-sm font-bold text-zinc-900">{edu.degree}</h3>
                    <p className="text-sm text-zinc-600 mt-0.5">{edu.institution}</p>
                    {(edu.dates || edu.gpa) && (
                      <p className="text-xs text-zinc-500 mt-1">
                        {edu.dates} {edu.gpa && `• GPA: ${edu.gpa}`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {resume.certifications && resume.certifications.length > 0 && (
            <section>
              <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-4">Certifications</h2>
              <div className="space-y-3">
                {resume.certifications.map((cert, i) => (
                  <div key={i}>
                    <h3 className="text-sm font-bold text-zinc-900">{cert.name}</h3>
                    <p className="text-xs text-zinc-600">{cert.issuer} {cert.date && `• ${cert.date}`}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
