import { ParsedResume, ExperienceEntry, EducationEntry, ProjectEntry, CertificationEntry } from "./api-client";

/**
 * A fallback client-side parser to convert raw resume text into a roughly 
 * structured ParsedResume object if the AI analysis hasn't run yet.
 * 
 * This uses regex heuristics and won't be as accurate as the Gemini backend parse,
 * but provides immediate value for the template preview.
 */
export function parseResumeClientSide(text: string): ParsedResume {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const resume: ParsedResume = {
    name: "Your Name",
    headline: "Professional Title",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    website: "",
    summary: "",
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    achievements: []
  };

  if (lines.length === 0) return resume;

  // Extremely basic heuristics
  resume.name = lines[0] || "Your Name";
  
  let currentSection = "header";
  let currentBlock: string[] = [];
  
  const flushBlock = () => {
    if (currentBlock.length === 0) return;
    
    if (currentSection === "header") {
      // Try to extract email/phone
      const headerText = currentBlock.join(" ");
      const emailMatch = headerText.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch) resume.email = emailMatch[0];
      
      const phoneMatch = headerText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      if (phoneMatch) resume.phone = phoneMatch[0];
    } else if (currentSection === "summary") {
      resume.summary = currentBlock.join(" ");
    } else if (currentSection === "skills") {
      // Split by commas, bullets, or newlines
      const skillsText = currentBlock.join("\n");
      const splitSkills = skillsText.split(/[,•\-\n|]/).map(s => s.trim()).filter(s => s.length > 1);
      resume.skills = Array.from(new Set(splitSkills)).slice(0, 15);
    } else if (currentSection === "experience") {
      const exp: ExperienceEntry = {
        company: currentBlock[0] || "Company",
        title: currentBlock[1] || "Role",
        dates: "Date Range",
        location: "",
        bullets: currentBlock.slice(2).filter(b => b.length > 5).map(b => b.replace(/^[•\-\*]\s*/, ""))
      };
      resume.experience.push(exp);
    } else if (currentSection === "education") {
      const edu: EducationEntry = {
        institution: currentBlock[0] || "University",
        degree: currentBlock[1] || "Degree",
        field: "",
        dates: "",
        gpa: "",
        details: currentBlock.slice(2)
      };
      resume.education.push(edu);
    }
    
    currentBlock = [];
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    
    // Check for section headers
    if (line.length < 30 && /^[A-Z]/.test(line)) {
      if (lower.includes("summary") || lower.includes("profile")) {
        flushBlock();
        currentSection = "summary";
        continue;
      }
      if (lower.includes("experience") || lower.includes("employment")) {
        flushBlock();
        currentSection = "experience";
        continue;
      }
      if (lower.includes("education") || lower.includes("academic")) {
        flushBlock();
        currentSection = "education";
        continue;
      }
      if (lower.includes("skills") || lower.includes("technologies")) {
        flushBlock();
        currentSection = "skills";
        continue;
      }
    }
    
    // If it looks like a new entry within experience/education
    if ((currentSection === "experience" || currentSection === "education") && 
        currentBlock.length > 2 && 
        line.length < 60 && 
        !line.startsWith("•") && 
        !line.startsWith("-")) {
      flushBlock();
    }
    
    currentBlock.push(line);
  }
  
  flushBlock();
  
  return resume;
}
