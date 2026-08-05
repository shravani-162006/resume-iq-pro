import type { AnalysisResult } from "./resume-types";

const KEY = "resumeiq:last-analysis";
const ANON_KEY = "resumeiq:anon-checks";

export type StoredAnalysis = AnalysisResult & {
  fileName: string;
  resumeId?: string;
  jobDescription?: string;
  savedAt: string;
};

export function saveAnalysis(value: StoredAnalysis) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(value));
}

export function loadAnalysis(): StoredAnalysis | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAnalysis;
  } catch {
    return null;
  }
}

export function clearAnalysis() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}

export const ANON_LIMIT = 1;
export const FREE_LIMIT = 3;

export function anonChecksUsed() {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(ANON_KEY) ?? "0");
}

export function recordAnonCheck() {
  if (typeof window === "undefined") return;
  localStorage.setItem(ANON_KEY, String(anonChecksUsed() + 1));
}
