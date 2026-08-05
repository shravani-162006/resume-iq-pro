import { supabase } from "@/integrations/supabase/client";
import type { AnalysisResult, ParsedResume, ResumeTemplate } from "./resume-types";

export async function saveAnalysisToCloud(params: {
  userId: string;
  file: File;
  rawText: string;
  result: AnalysisResult;
  jobDescription?: string;
}) {
  const path = `${params.userId}/${Date.now()}-${params.file.name.replace(/[^\w.-]/g, "_")}`;
  const upload = await supabase.storage.from("resumes").upload(path, params.file, { upsert: true });

  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .insert({
      user_id: params.userId,
      file_name: params.file.name,
      file_path: upload.error ? null : path,
      raw_text: params.rawText.slice(0, 40_000),
      parsed: params.result.parsed as unknown as never,
    })
    .select("id")
    .single();
  if (resumeError) throw resumeError;

  const { analysis } = params.result;
  const { error: scoreError } = await supabase.from("ats_scores").insert({
    user_id: params.userId,
    resume_id: resume.id,
    overall: analysis.overall,
    categories: analysis.categories as unknown as never,
    issues: analysis.issues as unknown as never,
    matched_keywords: analysis.matched_keywords as unknown as never,
    missing_keywords: analysis.missing_keywords as unknown as never,
    verdict: analysis.verdict,
    job_description: params.jobDescription || null,
  });
  if (scoreError) throw scoreError;

  const { data: profile } = await supabase
    .from("profiles")
    .select("checks_used")
    .eq("id", params.userId)
    .maybeSingle();
  if (profile) {
    await supabase
      .from("profiles")
      .update({ checks_used: (profile.checks_used ?? 0) + 1 })
      .eq("id", params.userId);
  }

  return resume.id as string;
}

export async function saveOptimizedResume(params: {
  userId: string;
  resumeId: string;
  template: ResumeTemplate;
  optimized: ParsedResume;
}) {
  await supabase.from("optimized_resumes").insert({
    user_id: params.userId,
    resume_id: params.resumeId,
    template: params.template,
    content: params.optimized as unknown as never,
  });
}
