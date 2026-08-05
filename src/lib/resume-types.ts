export type ContactInfo = {
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin: string | null;
  website: string | null;
};

export type ExperienceItem = {
  title: string;
  company: string;
  location: string;
  start: string;
  end: string;
  bullets: string[];
};

export type EducationItem = {
  degree: string;
  school: string;
  year: string;
};

export type ParsedResume = {
  contact: ContactInfo;
  summary: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: string[];
  target_title: string;
  experience_level: string;
};

export type ScoreCategory = {
  key: string;
  label: string;
  score: number;
  summary: string;
};

export type ScoreIssue = {
  category: string;
  severity: string;
  problem: string;
  why: string;
  fix: string;
};

export type AtsAnalysis = {
  overall: number;
  categories: ScoreCategory[];
  issues: ScoreIssue[];
  matched_keywords: string[];
  missing_keywords: string[];
  verdict: string;
};

export type AnalysisResult = {
  parsed: ParsedResume;
  analysis: AtsAnalysis;
};

export type ResumeTemplate = "chronological" | "skills-first" | "hybrid";

export const TEMPLATES: { id: ResumeTemplate; label: string; description: string }[] = [
  {
    id: "chronological",
    label: "Chronological",
    description: "Experience first, newest to oldest. The safest default for most ATS.",
  },
  {
    id: "skills-first",
    label: "Skills-first",
    description: "Leads with a skills matrix. Good for career changers and technical roles.",
  },
  {
    id: "hybrid",
    label: "Hybrid",
    description: "Short summary, core skills, then experience. Balanced for senior roles.",
  },
];

export type JobPosting = {
  id: string;
  title: string;
  company: string;
  location: string;
  workplace: string;
  category: string;
  posted_at: string;
  url: string;
  description: string;
  match: number;
  matched_skills: string[];
};

export function scoreTone(score: number): "success" | "warning" | "destructive" {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "destructive";
}
