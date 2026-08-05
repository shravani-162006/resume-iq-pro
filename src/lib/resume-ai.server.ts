import { streamText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider, RESUME_MODEL } from "./ai-gateway.server";
import { analysisResultSchema, parsedResumeSchema } from "./resume-schemas";
import type { AnalysisResult, ParsedResume } from "./resume-types";

function model() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this project.");
  return createLovableAiGatewayProvider(key)(RESUME_MODEL);
}

const ANALYST_SYSTEM = `You are an applicant tracking system (ATS) auditor with 15 years of technical recruiting experience.
You receive the raw text extracted from a candidate's resume file. You do two things:

1) PARSE the resume into structured sections. Never invent facts. Use empty strings or empty arrays when
   something is genuinely absent. experience_level must be one of: entry, mid, senior, lead.
   target_title is the single job title this resume is clearly aimed at.

2) SCORE it against real ATS parsing behaviour. Produce exactly these six categories, in this order,
   with keys: formatting, keywords, contact, structure, readability, impact.
   - formatting: file/layout signals that break parsers (columns, tables, graphics, headers/footers, odd characters, non-standard section headings)
   - keywords: match against the target job description when given, otherwise against benchmark keywords for the target role and level
   - contact: completeness and machine-readability of contact details
   - structure: presence and ordering of standard sections
   - readability: word count, bullet length and density, passive voice
   - impact: share of bullets containing measurable, quantified results

Each category score is 0-100. overall is a weighted whole number 0-100 that reflects the categories
(formatting and keywords weigh most). Be strict and realistic: a typical unedited resume scores 55-75.

For every meaningful problem, add an issue with: category (one of the six keys), severity (critical|important|minor),
problem (what is wrong, concrete and specific to THIS resume), why (why it hurts ATS parsing or ranking, one sentence),
fix (one actionable line the candidate can apply today). Return 4-10 issues, most severe first.

matched_keywords and missing_keywords: 5-15 each, lowercase, role-relevant.
verdict: one plain sentence summarising the resume's ATS readiness.`;

const OPTIMIZER_SYSTEM = `You are an expert resume writer producing ATS-safe content.
Rewrite the candidate's resume so it parses cleanly and ranks well, while remaining strictly truthful:
never invent employers, dates, degrees, or metrics that are not implied by the source. Where a metric is
missing, tighten the language instead of fabricating numbers.

Rules:
- Standard section names only. Single column. No tables, graphics, icons, or special characters.
- Every experience bullet: strong past-tense action verb, the work done, and the outcome. 1-2 lines each. 3-6 bullets per role.
- Summary: 2-3 sentences, targeted at the target title, no first person, no cliches ("hard-working team player").
- Skills: 8-16 concrete, searchable terms. Prefer the exact phrasing used in the target job description when provided.
- Keep all dates, employers, titles, and education exactly as supplied.`;

function templateGuidance(template: string) {
  if (template === "skills-first") {
    return "Template: SKILLS-FIRST. Lead with a rich, categorised skills list; keep the summary to two sentences; experience bullets stay concise.";
  }
  if (template === "hybrid") {
    return "Template: HYBRID. Short summary, a core-competencies skills block, then full reverse-chronological experience.";
  }
  return "Template: CHRONOLOGICAL. Summary, then experience in reverse-chronological order as the dominant section, then skills.";
}

export async function runAnalysis(
  resumeText: string,
  jobDescription?: string,
): Promise<AnalysisResult> {
  const jd = jobDescription?.trim();
  const prompt = [
    "RESUME TEXT (extracted from the uploaded file):",
    "---",
    resumeText.slice(0, 24000),
    "---",
    jd
      ? `TARGET JOB DESCRIPTION (score keywords against this specific posting):\n---\n${jd.slice(0, 8000)}\n---`
      : "No target job description was provided. Score keywords against benchmark expectations for the detected role and level.",
  ].join("\n\n");

  try {
    const result = streamText({
      model: model(),
      system: ANALYST_SYSTEM,
      prompt,
      output: Output.object({ schema: analysisResultSchema }),
    });
    const output = await result.output;
    return normalizeAnalysis(output as AnalysisResult);
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      throw new Error("The analysis could not be completed. Please try again.");
    }
    throw error;
  }
}

export async function runOptimize(
  parsed: ParsedResume,
  template: string,
  jobDescription?: string,
): Promise<{ optimized: ParsedResume; changes: string[] }> {
  const jd = jobDescription?.trim();
  const schema = z.object({
    optimized: parsedResumeSchema,
    changes: z.array(z.string()),
  });

  const prompt = [
    templateGuidance(template),
    "CURRENT RESUME (structured JSON):",
    JSON.stringify(parsed).slice(0, 24000),
    jd ? `TARGET JOB DESCRIPTION:\n${jd.slice(0, 8000)}` : "No target job description supplied.",
    "Return the rewritten resume in the same structure, plus `changes`: 4-8 short bullet strings describing what you changed and why.",
  ].join("\n\n");

  try {
    const result = streamText({
      model: model(),
      system: OPTIMIZER_SYSTEM,
      prompt,
      output: Output.object({ schema }),
    });
    const output = (await result.output) as { optimized: ParsedResume; changes: string[] };
    return output;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      throw new Error("The rewrite could not be completed. Please try again.");
    }
    throw error;
  }
}

const CATEGORY_ORDER = [
  "formatting",
  "keywords",
  "contact",
  "structure",
  "readability",
  "impact",
];

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

function normalizeAnalysis(result: AnalysisResult): AnalysisResult {
  const categories = [...result.analysis.categories]
    .map((category) => ({ ...category, score: clamp(category.score) }))
    .sort((a, b) => CATEGORY_ORDER.indexOf(a.key) - CATEGORY_ORDER.indexOf(b.key));

  return {
    parsed: result.parsed,
    analysis: {
      ...result.analysis,
      overall: clamp(result.analysis.overall),
      categories,
    },
  };
}
