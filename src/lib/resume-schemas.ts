import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
  linkedin: z.string().nullable(),
  website: z.string().nullable(),
});

export const parsedResumeSchema = z.object({
  contact: contactSchema,
  summary: z.string(),
  skills: z.array(z.string()),
  experience: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      location: z.string(),
      start: z.string(),
      end: z.string(),
      bullets: z.array(z.string()),
    }),
  ),
  education: z.array(
    z.object({ degree: z.string(), school: z.string(), year: z.string() }),
  ),
  certifications: z.array(z.string()),
  target_title: z.string(),
  experience_level: z.string(),
});

export const analysisSchema = z.object({
  overall: z.number(),
  categories: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      score: z.number(),
      summary: z.string(),
    }),
  ),
  issues: z.array(
    z.object({
      category: z.string(),
      severity: z.string(),
      problem: z.string(),
      why: z.string(),
      fix: z.string(),
    }),
  ),
  matched_keywords: z.array(z.string()),
  missing_keywords: z.array(z.string()),
  verdict: z.string(),
});

export const analysisResultSchema = z.object({
  parsed: parsedResumeSchema,
  analysis: analysisSchema,
});
