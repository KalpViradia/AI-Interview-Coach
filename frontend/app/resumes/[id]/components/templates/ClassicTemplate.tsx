import React from 'react';
import { ParsedResume } from "@/lib/api-client";

interface TemplateProps {
  resume: ParsedResume;
}

export default function ClassicTemplate({ resume }: TemplateProps) {
  return (
    <div className="w-full bg-white text-black font-serif p-12 min-h-[1056px] shadow-2xl mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
      
      {/* Header */}
      <header className="text-center border-b-[3px] border-black pb-6 mb-6">
        <h1 className="text-3xl font-bold uppercase tracking-widest mb-2">{resume.name || "Your Name"}</h1>
        <div className="text-sm font-sans flex flex-wrap justify-center gap-3 text-gray-700">
          {resume.email && <span>{resume.email}</span>}
          {resume.email && resume.phone && <span>•</span>}
          {resume.phone && <span>{resume.phone}</span>}
          {(resume.email || resume.phone) && resume.location && <span>•</span>}
          {resume.location && <span>{resume.location}</span>}
        </div>
        <div className="text-sm font-sans flex flex-wrap justify-center gap-3 text-gray-700 mt-1">
          {resume.linkedin && <span>{resume.linkedin}</span>}
          {resume.linkedin && resume.github && <span>•</span>}
          {resume.github && <span>{resume.github}</span>}
          {(resume.linkedin || resume.github) && resume.website && <span>•</span>}
          {resume.website && <span>{resume.website}</span>}
        </div>
      </header>

      {/* Summary */}
      {resume.summary && (
        <section className="mb-6">
          <h2 className="text-lg font-bold uppercase border-b border-gray-400 mb-3 pb-1 tracking-wider">Professional Summary</h2>
          <p className="text-sm leading-relaxed text-justify">{resume.summary}</p>
        </section>
      )}

      {/* Experience */}
      {resume.experience && resume.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold uppercase border-b border-gray-400 mb-4 pb-1 tracking-wider">Experience</h2>
          <div className="space-y-5">
            {resume.experience.map((exp, i) => (
              <div key={i}>
                <div className="flex justify-between items-baseline">
                  <h3 className="text-md font-bold">{exp.title}</h3>
                  <span className="text-sm font-sans text-gray-700">{exp.dates}</span>
                </div>
                <div className="text-sm font-sans font-semibold text-gray-800 mb-2 italic">
                  {exp.company}{exp.location && `, ${exp.location}`}
                </div>
                <ul className="list-disc list-outside ml-4 space-y-1">
                  {exp.bullets.map((bullet, j) => (
                    <li key={j} className="text-sm leading-relaxed text-justify">{bullet}</li>
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
          <h2 className="text-lg font-bold uppercase border-b border-gray-400 mb-4 pb-1 tracking-wider">Projects</h2>
          <div className="space-y-5">
            {resume.projects.map((proj, i) => (
              <div key={i}>
                <div className="flex justify-between items-baseline">
                  <h3 className="text-md font-bold">{proj.name}</h3>
                </div>
                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="text-sm font-sans font-semibold text-gray-800 mb-1 italic">
                    {proj.technologies.join(", ")}
                  </div>
                )}
                {proj.description && (
                  <p className="text-sm leading-relaxed text-justify mb-2">{proj.description}</p>
                )}
                {proj.bullets && proj.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 space-y-1">
                    {proj.bullets.map((bullet, j) => (
                      <li key={j} className="text-sm leading-relaxed text-justify">{bullet}</li>
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
        <section className="mb-6">
          <h2 className="text-lg font-bold uppercase border-b border-gray-400 mb-4 pb-1 tracking-wider">Education</h2>
          <div className="space-y-4">
            {resume.education.map((edu, i) => (
              <div key={i} className="flex justify-between items-start">
                <div>
                  <h3 className="text-md font-bold">{edu.institution}</h3>
                  <p className="text-sm italic">{edu.degree}{edu.field && ` in ${edu.field}`}</p>
                  {edu.details && edu.details.length > 0 && (
                    <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5">
                      {edu.details.map((detail, j) => (
                        <li key={j} className="text-sm text-gray-800">{detail}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-sans text-gray-700">{edu.dates}</p>
                  {edu.gpa && <p className="text-sm text-gray-700 mt-0.5">GPA: {edu.gpa}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {resume.skills && resume.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold uppercase border-b border-gray-400 mb-3 pb-1 tracking-wider">Skills</h2>
          <p className="text-sm leading-relaxed font-sans">
            {resume.skills.join(" • ")}
          </p>
        </section>
      )}

    </div>
  );
}
