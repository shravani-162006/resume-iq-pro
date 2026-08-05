import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { parsedResumeSchema } from "./resume-schemas";

const analyzeInput = z.object({
  resumeText: z.string().min(40, "That file did not contain enough readable text."),
  jobDescription: z.string().optional(),
});

const optimizeInput = z.object({
  parsed: parsedResumeSchema,
  template: z.string(),
  jobDescription: z.string().optional(),
});

export const analyzeResume = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => analyzeInput.parse(data))
  .handler(async ({ data }) => {
    const { runAnalysis } = await import("./resume-ai.server");
    return runAnalysis(data.resumeText, data.jobDescription);
  });

export const optimizeResume = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => optimizeInput.parse(data))
  .handler(async ({ data }) => {
    const { runOptimize } = await import("./resume-ai.server");
    return runOptimize(data.parsed, data.template, data.jobDescription);
  });
