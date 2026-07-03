"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Code, 
  Award, 
  Star, 
  FileText,
  Wrench,
  ChevronRight,
  Lightbulb
} from "lucide-react";

interface ResumeSection {
  name: string;
  icon: React.ElementType;
  content: string;
  color: string;
  bg: string;
}

interface ExtractedTextTabProps {
  extractedText: string;
}

// Section detection patterns — ordered by priority
const SECTION_PATTERNS: { name: string; icon: React.ElementType; color: string; bg: string; patterns: RegExp[] }[] = [
  {
    name: "Summary",
    icon: User,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    patterns: [
      /^(?:professional\s+)?summary/im,
      /^(?:career\s+)?objective/im,
      /^about\s*(?:me)?/im,
      /^profile/im,
    ]
  },
  {
    name: "Experience",
    icon: Briefcase,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    patterns: [
      /^(?:work\s+)?experience/im,
      /^employment(?:\s+history)?/im,
      /^work\s+history/im,
      /^professional\s+experience/im,
    ]
  },
  {
    name: "Skills",
    icon: Wrench,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    patterns: [
      /^(?:technical\s+)?skills/im,
      /^technologies/im,
      /^core\s+competencies/im,
      /^proficiencies/im,
      /^tech\s+stack/im,
    ]
  },
  {
    name: "Projects",
    icon: Code,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    patterns: [
      /^(?:personal\s+|academic\s+)?projects/im,
      /^portfolio/im,
    ]
  },
  {
    name: "Education",
    icon: GraduationCap,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    patterns: [
      /^education/im,
      /^academic(?:\s+background)?/im,
      /^qualifications/im,
    ]
  },
  {
    name: "Certifications",
    icon: Award,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    patterns: [
      /^certifications?/im,
      /^licenses?\s*(?:&|and)?\s*certifications?/im,
    ]
  },
  {
    name: "Achievements",
    icon: Star,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    patterns: [
      /^achievements?/im,
      /^accomplishments?/im,
      /^awards?(?:\s*(?:&|and)\s*honors?)?/im,
      /^honors?/im,
    ]
  },
];

/**
 * Attempts to split raw extracted text into logical resume sections.
 * Falls back to returning the entire text as a single block if detection fails.
 */
function parseIntoSections(text: string): ResumeSection[] {
  const lines = text.split("\n");
  const sections: ResumeSection[] = [];
  let currentSection: ResumeSection | null = null;
  let contentLines: string[] = [];
  let matchedAny = false;

  const flushSection = () => {
    if (currentSection) {
      currentSection.content = contentLines.join("\n").trim();
      if (currentSection.content) {
        sections.push(currentSection);
      }
    }
    contentLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      contentLines.push("");
      continue;
    }

    // Check if this line matches any section header
    let matched = false;
    for (const pattern of SECTION_PATTERNS) {
      if (pattern.patterns.some(p => p.test(trimmed))) {
        flushSection();
        currentSection = {
          name: pattern.name,
          icon: pattern.icon,
          content: "",
          color: pattern.color,
          bg: pattern.bg,
        };
        matched = true;
        matchedAny = true;
        break;
      }
    }

    if (!matched) {
      contentLines.push(line);
    }
  }

  // Flush the last section
  flushSection();

  // If we had content before any section header, add it as a "Header" section
  if (!matchedAny) {
    return [];
  }

  return sections;
}

/**
 * Renders content with proper formatting for bullets, paragraphs, and inline styling.
 */
function FormattedContent({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-2" />;

        // Bullet point detection
        const bulletMatch = trimmed.match(/^[•\-\*\u2022\u2023\u25E6\u25AA\u25AB]\s*(.*)/);
        if (bulletMatch) {
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1">
              <ChevronRight className="w-3.5 h-3.5 text-indigo-400/70 mt-1 shrink-0" />
              <span className="text-zinc-300 text-sm leading-relaxed">{bulletMatch[1]}</span>
            </div>
          );
        }

        // Numbered list detection
        const numberedMatch = trimmed.match(/^(\d+)[.)]\s*(.*)/);
        if (numberedMatch) {
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1">
              <span className="text-indigo-400/70 text-xs font-bold mt-0.5 shrink-0 min-w-[16px]">{numberedMatch[1]}.</span>
              <span className="text-zinc-300 text-sm leading-relaxed">{numberedMatch[2]}</span>
            </div>
          );
        }

        // Sub-header detection (short lines that look like titles)
        if (trimmed.length < 80 && /^[A-Z]/.test(trimmed) && !trimmed.endsWith(".") && !trimmed.includes(",")) {
          // Could be a company name, job title, or date range
          const dateMatch = trimmed.match(/\b(20\d{2}|19\d{2})\b/);
          if (dateMatch) {
            return (
              <p key={idx} className="text-zinc-400 text-xs font-medium tracking-wide mt-1">{trimmed}</p>
            );
          }
          if (trimmed === trimmed.toUpperCase() || /^[A-Z][a-z]/.test(trimmed)) {
            return (
              <p key={idx} className="text-zinc-200 text-sm font-semibold mt-3 first:mt-0">{trimmed}</p>
            );
          }
        }

        // Regular paragraph
        return (
          <p key={idx} className="text-zinc-300 text-sm leading-relaxed">{trimmed}</p>
        );
      })}
    </div>
  );
}

export default function ExtractedTextTab({ extractedText }: ExtractedTextTabProps) {
  const sections = useMemo(() => parseIntoSections(extractedText), [extractedText]);
  const hasSections = sections.length > 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } }
  };

  return (
    <div className="space-y-4">
      {/* Info bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <FileText className="w-3.5 h-3.5" />
          <span>
            {hasSections 
              ? `${sections.length} sections detected` 
              : "Showing raw extracted text"
            }
          </span>
        </div>
        <span className="text-xs text-zinc-600 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
          Read-Only
        </span>
      </div>

      {hasSections ? (
        /* ─── Structured Section View ─── */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {sections.map((section, i) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={i}
                variants={itemVariants}
                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700/80 transition-colors"
              >
                {/* Section Header */}
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-zinc-800/60 bg-zinc-900/80">
                  <div className={`w-8 h-8 rounded-lg ${section.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${section.color}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-white tracking-wide">{section.name}</h3>
                </div>
                {/* Section Content */}
                <div className="px-5 py-4">
                  <FormattedContent content={section.content} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        /* ─── Fallback: Raw Text ─── */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl"
        >
          {/* Tip banner */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800/60 bg-amber-500/5">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <p className="text-xs text-amber-400/80">
              Could not auto-detect sections. Showing raw extracted text below.
            </p>
          </div>
          <div className="p-5 max-h-[600px] overflow-y-auto custom-scrollbar">
            <pre className="whitespace-pre-wrap text-sm text-zinc-300 font-mono leading-relaxed">
              {extractedText}
            </pre>
          </div>
        </motion.div>
      )}
    </div>
  );
}
