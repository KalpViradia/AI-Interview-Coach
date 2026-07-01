/**
 * API Client — centralized HTTP client for the FastAPI backend.
 *
 * All API calls go through this module to keep endpoint URLs,
 * error handling, and auth headers in one place.
 */

import { getSession } from "next-auth/react";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// -----------------------------------------------------------------------------
// Wakeup Manager
// -----------------------------------------------------------------------------
class WakeupManager {
  private pendingCount = 0;
  private timeoutId: NodeJS.Timeout | null = null;
  private isVisible = false;
  private listeners = new Set<(visible: boolean) => void>();

  subscribe = (listener: (visible: boolean) => void) => {
    this.listeners.add(listener);
    listener(this.isVisible);
    return () => this.listeners.delete(listener);
  };

  private notify = () => {
    this.listeners.forEach((l) => l(this.isVisible));
  };

  onRequestStart = () => {
    this.pendingCount++;
    if (this.pendingCount === 1) {
      this.timeoutId = setTimeout(() => {
        this.isVisible = true;
        this.notify();
      }, 3000);
    }
  };

  onRequestEnd = () => {
    this.pendingCount = Math.max(0, this.pendingCount - 1);
    if (this.pendingCount === 0) {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      if (this.isVisible) {
        this.isVisible = false;
        this.notify();
      }
    }
  };
}

export const wakeupManager = new WakeupManager();

/**
 * A wrapper around global fetch that tracks backend requests for WakeupManager.
 */
export async function managedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : (input instanceof Request ? input.url : input.toString());
  
  const isBackendRequest = 
    url.includes(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") || 
    url.includes(API_BASE_URL);

  if (!isBackendRequest) {
    return fetch(input, init);
  }

  wakeupManager.onRequestStart();
  try {
    return await fetch(input, init);
  } finally {
    wakeupManager.onRequestEnd();
  }
}

/**
 * Generic fetch wrapper with error handling and automatic auth token attachment.
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit & { skipAuth?: boolean }
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) || {}),
  };

  // Attach auth token if available (and not explicitly skipped)
  if (!options?.skipAuth) {
    try {
      // Use NextAuth's client-side session to get the JWT
      // We get the raw JWT by calling our own API route
      const jwtRes = await fetch("/api/auth/token");
      if (jwtRes.ok) {
        const { token } = await jwtRes.json();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }
    } catch {
      // No token available — proceed as guest
    }
  }

  const { skipAuth: _skipAuth, ...fetchOptions } = options || {};

  const response = await managedFetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.detail || `API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Health check — verify backend is reachable.
 */
export async function healthCheck() {
  const url = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/health";
  const response = await managedFetch(url);
  if (!response.ok) throw new Error("Health check failed");
  return response.json();
}

// Types based on backend schemas
export interface Question {
  text: string;
  topic: string;
  difficulty: number;
}

export interface Evaluation {
  question: string;
  answer: string;
  score?: number;
  strengths: string[];
  weaknesses: string[];
  suggestion: string;
  ideal_answer?: string;
}

export interface SessionReport {
  score: number;
  technical_score?: number;
  communication_score?: number;
  problem_solving_score?: number;
  readiness_label: string;
  summary: string;
  strong_topics?: string[];
  weak_topics: string[];
  roadmap: string[];
}

export interface ATSBreakdown {
  overall_score: number;
  skill_score: number;
  semantic_score: number;
  experience_score: number;
  quality_score: number;
  explanation: string;
  matched_skills: string[];
  missing_skills: string[];
  improvement_suggestions: string[];
}

export interface CandidateProfile {
  skills: string[];
  projects: string[];
  experience_level: string;
  gaps_vs_jd: string[];
  ats_breakdown?: ATSBreakdown;
}

export interface SessionCreateResponse {
  session_id: string;
  candidate_profile?: CandidateProfile;
  next_question?: Question;
}

export interface AnswerSubmitResponse {
  evaluation?: Evaluation;
  next_question?: Question;
  report?: SessionReport;
  is_complete: boolean;
}

export const createSession = async (resumeText: string, jdText: string): Promise<SessionCreateResponse> => {
  return apiFetch<SessionCreateResponse>("/sessions", {
    method: "POST",
    body: JSON.stringify({
      resume_text: resumeText,
      jd_text: jdText,
    }),
  });
};

export async function submitAnswer(sessionId: string, answer: string): Promise<AnswerSubmitResponse> {
  return apiFetch<AnswerSubmitResponse>(`/sessions/${sessionId}/answer`, {
    method: "POST",
    body: JSON.stringify({ answer }),
  });
}

export interface SessionStateResponse {
  session_id: string;
  next_question?: Question;
  turn_count: number;
  is_complete: boolean;
  session_type: "ats_check" | "mock_interview" | "general" | "resume_based" | "job_specific";
  report?: SessionReport;
  candidate_profile?: CandidateProfile;
}

export async function getSessionState(sessionId: string): Promise<SessionStateResponse> {
  return apiFetch<SessionStateResponse>(`/sessions/${sessionId}`);
}

export interface TranscriptTurn {
  question: string;
  topic: string;
  difficulty: number;
  order_index: number;
  answer: string | null;
  evaluation: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    feedback: string;
  } | null;
}

export async function getSessionTranscript(sessionId: string): Promise<TranscriptTurn[]> {
  return apiFetch<TranscriptTurn[]>(`/sessions/${sessionId}/transcript`);
}

export async function getSessions(): Promise<SessionStateResponse[]> {
  return apiFetch<SessionStateResponse[]>("/sessions");
}

export async function uploadDocument(file: File, docType: 'resume' | 'jd' = 'resume'): Promise<{ text: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("doc_type", docType);
  
  const url = `${API_BASE_URL}/parse-document`;

  // Get auth token for upload too
  const headers: Record<string, string> = {};
  try {
    const jwtRes = await fetch("/api/auth/token");
    if (jwtRes.ok) {
      const { token } = await jwtRes.json();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
  } catch {
    // Proceed without auth
  }

  const response = await managedFetch(url, {
    method: "POST",
    body: formData,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to upload document");
  }

  return response.json();
}

/**
 * Register a new user via the backend API.
 */
export async function registerUser(name: string, email: string, password: string) {
  return apiFetch<{ id: string; email: string; name: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
    skipAuth: true, // Registration doesn't need auth
  });
}

// -----------------------------------------------------------------------------
// Resume Vault APIs
// -----------------------------------------------------------------------------

export interface ResumeResponse {
  id: string;
  display_name: string;
  original_filename: string;
  created_at: string;
  last_used: string;
  file_size: number;
  interview_count: number;
}

export interface ResumeDetailResponse extends ResumeResponse {
  extracted_text: string;
  parsed_json?: ParsedResume;
  ats_checks: number;
  mock_interviews: number;
  voice_interviews: number;
  resume_chats: number;
  average_score?: number;
}

export async function getResumes(): Promise<ResumeResponse[]> {
  return apiFetch<ResumeResponse[]>("/resumes");
}

export async function uploadToVault(file: File, displayName?: string): Promise<ResumeResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (displayName) {
    formData.append("display_name", displayName);
  }

  const url = `${API_BASE_URL}/resumes`;
  const headers: Record<string, string> = {};
  try {
    const jwtRes = await fetch("/api/auth/token");
    if (jwtRes.ok) {
      const { token } = await jwtRes.json();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
  } catch {}

  const response = await managedFetch(url, {
    method: "POST",
    body: formData,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to upload resume to vault");
  }

  return response.json();
}

export async function getResumeDetails(resumeId: string): Promise<ResumeDetailResponse> {
  return apiFetch<ResumeDetailResponse>(`/resumes/${resumeId}`);
}



export async function deleteResume(resumeId: string): Promise<void> {
  await apiFetch(`/resumes/${resumeId}`, { method: "DELETE" });
}

// -----------------------------------------------------------------------------
// Resume Studio APIs
// -----------------------------------------------------------------------------

export interface ResumeSection {
  name: string;
  content: string;
  order: number;
}

export interface ExperienceEntry {
  company: string;
  title: string;
  dates: string;
  location: string;
  bullets: string[];
}

export interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  dates: string;
  gpa: string;
  details: string[];
}

export interface ProjectEntry {
  name: string;
  description: string;
  technologies: string[];
  bullets: string[];
  url: string;
}

export interface CertificationEntry {
  name: string;
  issuer: string;
  date: string;
  url: string;
}

export interface ParsedResume {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
  summary: string;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  achievements: string[];
}

export interface ResumeAnalysis {
  skills: string[];
  technologies: string[];
  projects: string[];
  experience_level: string;
  quality_score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  parsed_resume?: ParsedResume;
}

export async function analyzeResume(resumeId: string): Promise<ResumeAnalysis> {
  return apiFetch<ResumeAnalysis>(`/resumes/${resumeId}/analyze`);
}

export async function runATSCheck(resumeId: string, jdText: string): Promise<ATSBreakdown> {
  return apiFetch<ATSBreakdown>(`/resumes/${resumeId}/ats-check`, {
    method: "POST",
    body: JSON.stringify({ jd_text: jdText }),
  });
}

// ─── Config API ────────────────────────────────────────────────────────────

export interface AppConfig {
  speech_provider: string;
  whisper_available: boolean;
  supported_providers: string[];
}

export async function getConfig(): Promise<AppConfig> {
  return apiFetch<AppConfig>("/config");
}

